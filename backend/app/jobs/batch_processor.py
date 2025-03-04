"""
Batch job processing implementation with optimized performance.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator, Tuple
import asyncio
import tempfile
import time
import os
import sys
import uuid
import io
print("Python executable path:")
print(sys.executable)
print("\nPython path:")
print(sys.path)
print("\nEnvironment:")
import os
print(os.environ.get('VIRTUAL_ENV'))

import psutil
from pathlib import Path
import aiofiles
import zipfile
from fastapi import UploadFile, HTTPException, status
from pydantic import BaseModel, ValidationError
import requests
from uuid import UUID
from functools import lru_cache
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging
from ..services.metrics import metrics_service
from ..services.semantic import semantic_service
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import httpx
import socket
import shutil
import json
import concurrent.futures
import hashlib


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Constants
LOCAL_API_URL = os.environ.get("LOCAL_API_URL", "https://api.hawkhire.ai")
REMOTE_API_URL = os.environ.get("REMOTE_API_URL", "http://147.93.44.131:8000")

@dataclass
class CacheEntry:
    """Cache entry with expiration"""
    data: Any
    expires_at: datetime

class JobValidationError(Exception):
    """Custom exception for job validation errors"""
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"Job validation failed: {', '.join(errors)}")

class BatchCreationResult(BaseModel):
    """Result model for batch job creation"""
    successful_jobs: List[Dict[str, Any]]
    failed_jobs: List[Dict[str, Any]]
    total_time: float
    stats: Dict[str, int]

@dataclass
class ProcessedJobData:
    """Data structure for processed job data"""
    original_file: str
    extracted_data: Dict[str, Any]
    validation_errors: List[str] = field(default_factory=list)
    processing_time: float = 0.0

class JobProcessingEvent(BaseModel):
    """Event emitted during job processing"""
    event: str
    total_files: int
    processed_count: int
    failed_count: int
    file_name: Optional[str] = None
    error: Optional[str] = None
    unsupported_files: Optional[List[Dict[str, Any]]] = None
    processing_details: Optional[Dict[str, Any]] = None

class RateLimiter:
    def __init__(self, requests_per_minute=30):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        
    def is_rate_limited(self, client_id: str) -> Tuple[bool, int]:
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] 
                                  if req_time > minute_ago]
        
        # Check if rate limited
        if len(self.requests[client_id]) >= self.requests_per_minute:
            retry_after = 60 - (now - self.requests[client_id][0])
            return True, int(retry_after)
            
        # Add new request
        self.requests[client_id].append(now)
        return False, 0

rate_limiter = RateLimiter()

class BatchProcessor:
    """Process batch uploads of job files"""
    
    def __init__(self):
        """Initialize the batch processor"""
        # Configure clients
        self.remote_client = httpx.AsyncClient(
            base_url=REMOTE_API_URL,
            timeout=60.0,
            verify=False  # Disable SSL verification for demo purposes
        )
        self.remote_url = REMOTE_API_URL
        
        # Local client for job creation and data extraction
        self.local_client = httpx.AsyncClient(
            base_url=LOCAL_API_URL,
            timeout=30.0,
            verify=False
        )
        
        # Initialize the cache dictionary
        self._cache = {}
        
        # Log the base URL for debugging
        logger.debug(f"Using semantic service with base URL: {REMOTE_API_URL}")
        
        # Cache for processed jobs
        self._job_cache = {}
        
        # Batch size for database operations
        self.db_batch_size = 10
        
        # Batch size for processing files
        self.batch_size = 5
        
        # Chunk size for file streaming
        self.chunk_size = 8192
        
        # Test connection to remote API
        self._test_remote_connection()

    def _test_remote_connection(self):
        """Test connection to remote API and log diagnostics"""
        try:
            # Use requests for synchronous testing
            session = requests.Session()
            session.verify = False  # Disable SSL verification
            
            # Test base URL connection
            logger.info(f"Testing connection to base URL: {self.remote_url}")
            base_response = session.get(self.remote_url, timeout=10)
            logger.info(f"Base URL connection successful: {base_response.status_code}")
            
            # Test specific endpoint
            endpoint = f"{self.remote_url}/v1/tools/convert_pdf2text"
            logger.info(f"Testing connection to endpoint: {endpoint}")
            endpoint_response = session.head(endpoint, timeout=10)
            logger.info(f"Endpoint connection successful: {endpoint_response.status_code}")
            
            # Network diagnostics
            logger.info("Network diagnostics: ")
            hostname = socket.gethostname()
            ip_address = socket.gethostbyname(hostname)
            logger.info(f"Hostname: {hostname}, IP: {ip_address}")
            
            # Test direct socket connection
            logger.info(f"Testing direct socket connection to {self.remote_url.split('//')[1]}")
            host, port = self.remote_url.split('//')[1].split(':')
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, int(port)))
            if result == 0:
                logger.info(f"Socket connection successful to {host}:{port}")
            else:
                logger.error(f"Socket connection failed to {host}:{port} with error code {result}")
            sock.close()
            
        except Exception as e:
            logger.error(f"Error testing remote connection: {str(e)}", exc_info=True)

    def _get_system_metrics(self) -> Dict[str, float]:
        """Get current system metrics"""
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return {
            'memory_percent': process.memory_percent(),
            'memory_rss': memory_info.rss / 1024 / 1024,  # MB
            'cpu_percent': process.cpu_percent()
        }

    def _update_metrics(self, metric_type: str, value: Any):
        """Update performance metrics"""
        metrics_service.update_metrics(metric_type, value)

    def _adjust_batch_size(self, file_size: int) -> int:
        """Dynamically adjust batch size based on file size and system resources"""
        metrics = self._get_system_metrics()
        
        # Reduce batch size if memory usage is high
        if metrics['memory_percent'] > self.max_memory_percent:
            return max(1, self.batch_size // 2)
        
        # Adjust based on file size
        if file_size > 10 * 1024 * 1024:  # 10MB
            return max(1, self.batch_size // 2)
        elif file_size < 1 * 1024 * 1024:  # 1MB
            return min(20, self.batch_size * 2)
        
        return self.batch_size

    async def _stream_file(self, file: Path) -> AsyncGenerator[bytes, None]:
        """Stream file content in chunks"""
        async with aiofiles.open(file, 'rb') as f:
            while chunk := await f.read(self.chunk_size):
                yield chunk

    async def process_zip(
        self,
        file: UploadFile,
        organization_id: str,
        is_mock: bool = False,
        status: str = "DRAFT"
    ) -> AsyncGenerator[JobProcessingEvent, None]:
        """Process a ZIP file containing job files"""
        logger.debug(f"Processing ZIP file: {file.filename}")
        logger.info(f"Organization ID: {organization_id}, Is Mock: {is_mock}, Status: {status}")
        
        # Create a temporary directory to extract the ZIP file
        temp_dir = tempfile.mkdtemp()
        logger.info(f"Saving ZIP file to temporary directory: {temp_dir}")
        
        try:
            # Save the ZIP file to the temporary directory
            zip_path = Path(temp_dir) / "upload.zip"
            with open(zip_path, "wb") as f:
                while chunk := await file.read(self.chunk_size):
                    f.write(chunk)
            
            # Extract the ZIP file
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Find all files in the extracted directory
            all_files = list(Path(temp_dir).glob("**/*"))
            files = [f for f in all_files if f.is_file() and f.name != "upload.zip"]
            logger.info(f"Found {len(files)} total files in ZIP")
            
            # Filter for supported file types
            supported_files = []
            unsupported_files = []
            
            for file_path in files:
                file_type = file_path.suffix.lower()
                logger.debug(f"Checking file: {file_path.name}, type: {file_type}")
                
                if file_type in ['.pdf', '.txt']:
                    logger.debug(f"Added supported file: {file_path.name}")
                    supported_files.append(file_path)
                else:
                    logger.debug(f"Added unsupported file: {file_path.name}")
                    unsupported_files.append(file_path)
            
            logger.info(f"Found {len(supported_files)} supported files and {len(unsupported_files)} unsupported files")
            
            if not supported_files:
                yield JobProcessingEvent(
                    event="no_supported_files",
                    total_files=len(files),
                    processed_count=0,
                    failed_count=len(files),
                    error="No supported files found in the ZIP archive"
                )
                return
            
            # Process files in batches
            processed_jobs = []
            
            # Yield initial event
            yield JobProcessingEvent(
                event="processing_started",
                total_files=len(supported_files),
                processed_count=0,
                failed_count=0
            )
            
            # Process files in batches
            for batch_start in range(0, len(supported_files), self.batch_size):
                batch_end = min(batch_start + self.batch_size, len(supported_files))
                batch = supported_files[batch_start:batch_end]
                
                # Process each file in the batch
                for file_path in batch:
                    try:
                        start_time = time.time()
                        file_type = file_path.suffix.lower()
                        
                        # Extract text based on file type
                        if file_type == '.pdf':
                            text_content = await self._extract_text_from_pdf(file_path)
                        elif file_type == '.txt':
                            text_content = await self._extract_text_from_txt(file_path)
                        else:
                            # This shouldn't happen due to our filtering above
                            logger.warning(f"Unsupported file type: {file_type} for file: {file_path.name}")
                            continue
                        
                        # Create processed job data
                        job_data = await self._create_processed_job_data(
                            file_path, text_content, organization_id, is_mock, status, start_time
                        )
                        processed_jobs.append(job_data)
                        
                        # Yield progress event
                        yield JobProcessingEvent(
                            event="file_processed",
                            total_files=len(supported_files),
                            processed_count=len(processed_jobs),
                            failed_count=0,
                            file_name=file_path.name,
                            processing_details={
                                "processing_time": job_data.processing_time,
                                "validation_errors": job_data.validation_errors
                            }
                        )
                        
                    except Exception as e:
                        logger.error(f"Error processing file {file_path.name}: {str(e)}", exc_info=True)
                        yield JobProcessingEvent(
                            event="file_processing_failed",
                            total_files=len(supported_files),
                            processed_count=len(processed_jobs),
                            failed_count=1,
                            file_name=file_path.name,
                            error=str(e)
                        )
            
            # Create jobs in bulk
            async for event in self.create_jobs_bulk(processed_jobs):
                yield event
                
        except Exception as e:
            logger.error(f"Error in process_zip: {str(e)}", exc_info=True)
            yield JobProcessingEvent(
                event="processing_failed",
                total_files=0,
                processed_count=0,
                failed_count=0,
                error=str(e)
            )
        finally:
            # Clean up temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)

    async def _process_file(
        self,
        file: Path,
        organization_id: str,
        is_mock: bool,
        status: str
    ) -> ProcessedJobData:
        """Process a single file with proper error handling and retries"""
        start_time = time.time()
        errors = []
        last_error = None
        
        # Log file details
        logger.info(f"Processing file: {file.name}, type: {file.suffix.lower()}")
        logger.debug(f"File path: {file}, exists: {file.exists()}, size: {file.stat().st_size if file.exists() else 'N/A'}")
        
        # Check cache
        cache_key = f"file:{file.name}:{organization_id}"
        cached_result = self._get_cache(cache_key)
        if cached_result:
            logger.info(f"Using cached result for {file.name}")
            return cached_result

        try:
            text_content = ""  # Initialize outside the loop
            for attempt in range(self.max_retries):
                try:
                    # Check for auth errors before proceeding
                    if any("InvalidJWTToken" in err for err in errors):
                        raise Exception("Authentication failed - token expired")

                    # Add exponential backoff for retries
                    if attempt > 0:
                        retry_delay = self.retry_delay * (2 ** (attempt - 1))
                        logger.info(f"Retry attempt {attempt} for {file.name}, waiting {retry_delay}s")
                        await asyncio.sleep(retry_delay)

                    async with self.pdf_semaphore:
                        # Extract text based on file type
                        file_extension = file.suffix.lower()
                        logger.info(f"Processing file with extension: {file_extension}")
                        
                        if file_extension == '.pdf':
                            # Convert PDF to text
                            logger.info(f"Processing PDF file: {file.name}")
                            try:
                                # Read the file into memory first
                                file_content = await self._stream_to_bytes(file)
                                logger.info(f"Read PDF file into memory: {file.name}, size: {len(file_content)} bytes")
                                
                                # Use synchronous requests library which might be more reliable
                                endpoint = f"{self.remote_url}/v1/tools/convert_pdf2text"
                                logger.info(f"Sending request to {endpoint}")
                                
                                # Run the synchronous request in a thread pool to avoid blocking
                                def make_request():
                                    # Create a requests session with SSL verification disabled
                                    session = requests.Session()
                                    session.verify = False
                                    
                                    # Make the request
                                    files = {'file': (file.name, file_content, 'application/pdf')}
                                    return session.post(
                                        endpoint,
                                        files=files,
                                        timeout=60.0
                                    )
                                
                                # Run the synchronous request in a thread pool
                                loop = asyncio.get_event_loop()
                                response = await loop.run_in_executor(None, make_request)
                                
                                # Check for specific error types
                                if response.status_code == 429:
                                    raise Exception("Rate limit exceeded")
                                elif response.status_code == 401:
                                    raise Exception("InvalidJWTToken")
                                
                                # Log response status
                                logger.info(f"Response status: {response.status_code}")
                                
                                response.raise_for_status()
                                text_result = response.json()
                                text_content = "\n".join(text_result.get('pages', []))
                                logger.info(f"Successfully extracted text from PDF: {file.name}, content length: {len(text_content)}")
                            except requests.exceptions.ConnectionError as conn_error:
                                logger.error(f"Connection error to remote service: {str(conn_error)}", exc_info=True)
                                raise ValueError(f"Cannot connect to PDF processing service at {self.remote_url}: {str(conn_error)}")
                            except requests.exceptions.Timeout as timeout_error:
                                logger.error(f"Timeout error processing PDF file {file.name}: {str(timeout_error)}", exc_info=True)
                                raise ValueError(f"Timeout while processing PDF file: {str(timeout_error)}")
                            except Exception as pdf_error:
                                logger.error(f"Error processing PDF file {file.name}: {str(pdf_error)}", exc_info=True)
                                raise ValueError(f"Failed to process PDF file: {str(pdf_error)}")
                        
                        elif file_extension == '.txt':
                            # Read text file directly with better error handling
                            try:
                                logger.info(f"Processing TXT file: {file.name}")
                                if not file.exists():
                                    raise FileNotFoundError(f"TXT file not found: {file}")
                                    
                                async with aiofiles.open(file, 'r', encoding='utf-8', errors='replace') as f:
                                    text_content = await f.read()
                                logger.info(f"Successfully read TXT file: {file.name}, content length: {len(text_content)}")
                                
                                # Ensure we have meaningful content
                                if not text_content or len(text_content.strip()) < 50:
                                    logger.warning(f"TXT file content too short: {file.name}")
                                    raise ValueError("Extracted text is too short or empty")
                            except Exception as txt_error:
                                logger.error(f"Error processing TXT file {file.name}: {str(txt_error)}", exc_info=True)
                                raise ValueError(f"Failed to process TXT file: {str(txt_error)}")
                        
                        else:
                            # This should not happen as we filter files earlier
                            logger.error(f"Unsupported file format: {file_extension}")
                            raise ValueError(f"Unsupported file format: {file_extension}")

                    if not text_content or len(text_content.strip()) < 50:
                        logger.warning(f"Extracted text is too short or empty for {file.name}")
                        raise ValueError("Extracted text is too short or empty")

                    # Break early if we hit auth errors
                    logger.info(f"Successfully processed file: {file.name}")
                    break

                except Exception as e:
                    last_error = str(e)
                    errors.append(last_error)
                    logger.error(f"Error processing file {file.name} (attempt {attempt+1}/{self.max_retries}): {last_error}")
                    
                    # Don't retry on auth errors or rate limits
                    if "InvalidJWTToken" in last_error or "Rate limit exceeded" in last_error:
                        raise
                        
                    if attempt < self.max_retries - 1:
                        continue
                    
                    logger.error(f"All retries failed for {file.name}. Last error: {last_error}")
                    raise Exception(f"All retries failed. Last error: {last_error}")

            # Process successful result
            return await self._create_processed_job_data(
                file=file,
                text_content=text_content,
                organization_id=organization_id,
                is_mock=is_mock,
                status=status,
                start_time=start_time
            )

        except Exception as e:
            logger.error(f"Failed to process file {file.name}: {str(e)}", exc_info=True)
            return ProcessedJobData(
                original_file=file.name,
                extracted_data={},
                validation_errors=errors or [str(e)],
                processing_time=time.time() - start_time
            )

    async def _stream_to_bytes(self, file: Path) -> bytes:
        """Convert file stream to bytes with memory monitoring"""
        chunks = []
        async for chunk in self._stream_file(file):
            chunks.append(chunk)
            self._update_metrics('memory_usage', None)
        return b''.join(chunks)

    @property
    def metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return metrics_service.current_metrics or {}

    def get_historical_metrics(self, days: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get historical metrics for specified period"""
        return metrics_service.get_historical_metrics(days=days)

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get summary of processing performance"""
        return metrics_service.get_performance_summary()

    def _get_cache(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if not hasattr(self, '_cache'):
            self._cache = {}
            return None
            
        if key in self._cache:
            entry = self._cache[key]
            if entry.expires_at > datetime.now():
                return entry.data
            del self._cache[key]
        return None

    def _set_cache(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with expiration"""
        if not hasattr(self, '_cache'):
            self._cache = {}
        
        self._cache[key] = CacheEntry(
            data=value,
            expires_at=datetime.now() + timedelta(seconds=ttl)
        )

    @lru_cache(maxsize=100)
    def _get_file_type(self, filename: str) -> str:
        """Get file type from filename with caching"""
        return filename.split('.')[-1].lower()

    async def _process_files_in_parallel(
        self,
        files: List[Path],
        organization_id: str,
        is_mock: bool,
        status: str
    ) -> AsyncGenerator[JobProcessingEvent, None]:
        """Process multiple files in parallel"""
        tasks = []

        for file in files:
            task = asyncio.create_task(self._process_file(
                file=file,
                organization_id=organization_id,
                is_mock=is_mock,
                status=status
            ))
            tasks.append((file, task))

        for file, task in tasks:
            try:
                result = await task
                
                yield JobProcessingEvent(
                    event="file_processing_complete",
                    total_files=len(files),
                    processed_count=1,
                    failed_count=0,
                    file_name=file.name,
                    processing_details={
                        "stage": "completed",
                        "current_file": file.name,
                        "job_data": result.extracted_data
                    }
                )

            except Exception as e:
                logger.error(f"Error processing file {file.name}: {str(e)}", exc_info=True)
                yield JobProcessingEvent(
                    event="file_processing_failed",
                    total_files=len(files),
                    processed_count=0,
                    failed_count=1,
                    file_name=file.name,
                    error=str(e)
                )

    async def _validate_job_data(self, job_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate job data against schema"""
        errors = []
        
        # Validate job type
        valid_job_types = [
            "FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", 
            "INTERNSHIP", "VOLUNTEER", "TO_BE_DETERMINED"
        ]
        
        if "job_type" not in job_data:
            errors.append("Missing job_type")
        elif job_data["job_type"] not in valid_job_types:
            errors.append(f"Invalid job type: {job_data['job_type']}")

        # Validate required fields
        required_fields = ["title", "description", "location"]
        for field in required_fields:
            if field not in job_data:
                errors.append(f"Missing {field}")
                continue

        # Validate translations
        langs = ["en", "fr"]
        for field in ["title", "description"]:
            if field in job_data:
                for lang in langs:
                    if lang not in job_data[field] or not job_data[field][lang]:
                        errors.append(f"Missing {lang} translation for {field}")

        # Validate location fields
        if "location" in job_data:
            required_loc_fields = ["city", "country"]  # State is not always required
            
            # Check if state is required (only for US)
            is_us = False
            if "country" in job_data["location"]:
                country_en = job_data["location"]["country"].get("en", "").lower()
                country_fr = job_data["location"]["country"].get("fr", "").lower()
                is_us = "usa" in country_en or "united states" in country_en or "états-unis" in country_fr

            if is_us:
                required_loc_fields.append("state")

            for loc_field in required_loc_fields:
                if loc_field not in job_data["location"]:
                    errors.append(f"Missing location.{loc_field}")
                    continue

                for lang in langs:
                    if lang not in job_data["location"][loc_field] or not job_data["location"][loc_field][lang]:
                        errors.append(f"Missing {lang} translation for location.{loc_field}")

        # Validate requirements
        if "requirements" in job_data:
            if isinstance(job_data["requirements"], dict):
                # Check if requirements has language keys
                for lang in langs:
                    if lang not in job_data["requirements"]:
                        errors.append(f"Missing {lang} translation for requirements")
                    elif not isinstance(job_data["requirements"][lang], list):
                        errors.append(f"Requirements.{lang} must be a list")
            elif isinstance(job_data["requirements"], list):
                # If requirements is a list, it's probably the old format
                # We'll convert it later, so no error here
                pass
            else:
                errors.append("Requirements must be a dictionary with language keys or a list")
        else:
            errors.append("Missing requirements")

        # Validate organization_id
        try:
            if "organization_id" not in job_data:
                errors.append("Missing organization_id")
            else:
                UUID(job_data["organization_id"])
        except ValueError:
            errors.append("Invalid organization_id format")

        return len(errors) == 0, errors

    async def create_jobs_bulk(self, processed_jobs: List[ProcessedJobData]) -> AsyncGenerator[JobProcessingEvent, None]:
        """Create jobs in bulk from processed data"""
        valid_jobs = []
        invalid_jobs = []
        
        # Filter out jobs with validation errors
        for job_data in processed_jobs:
            if not job_data.validation_errors:
                valid_jobs.append(job_data.extracted_data)
            else:
                invalid_jobs.append(job_data)
        
        if not valid_jobs:
            yield JobProcessingEvent(
                event="batch_completed",
                total_files=len(processed_jobs),
                processed_count=0,
                failed_count=len(processed_jobs),
                processing_details={
                    "stage": "job_creation",
                    "total_time": 0,
                    "successful_jobs": 0,
                    "failed_jobs": len(processed_jobs),
                    "error": "No valid jobs to create"
                }
            )
            return
        
        try:
            logger.info(f"Sending {len(valid_jobs)} valid jobs to bulk creation endpoint")
            
            # Log the first job data for debugging
            if valid_jobs:
                logger.info(f"Sample job data (first job): {json.dumps(valid_jobs[0], indent=2, default=str)}")
                
                # Validate required fields in each job
                for i, job in enumerate(valid_jobs):
                    missing_fields = []
                    for field in ["title", "description", "location", "job_type", "organization_id"]:
                        if field not in job:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        logger.error(f"Job {i} is missing required fields: {', '.join(missing_fields)}")
                    
                    # Check nested fields
                    if "location" in job:
                        location = job["location"]
                        missing_location_fields = []
                        for field in ["city", "country"]:  # State is not always required
                            if field not in location:
                                missing_location_fields.append(field)
                        
                        if missing_location_fields:
                            logger.error(f"Job {i} location is missing required fields: {', '.join(missing_location_fields)}")
                    
                    # Normalize the job data
                    valid_jobs[i] = self._normalize_job_data(job)
            
            # Run the synchronous request in a thread pool to avoid blocking
            def make_bulk_request():
                session = requests.Session()
                session.verify = False  # Disable SSL verification for development
                
                # Create the payload
                payload = valid_jobs
                
                # Log the payload size
                logger.debug(f"Sending bulk creation request with {len(payload)} jobs")
                
                return session.post(
                    f"{LOCAL_API_URL}/v1/jobs/bulk",
                    json=payload,
                    timeout=60
                )
            
            # Run the synchronous request in a thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, make_bulk_request)
            
            try:
                response.raise_for_status()
                result = response.json()
                
                # Log the result
                logger.info(f"Bulk creation result: {json.dumps(result, indent=2, default=str)}")
                
                # Extract successful and failed jobs from the result
                successful_jobs = result.get("successful_jobs", [])
                failed_jobs = result.get("failed_jobs", [])
                
                yield JobProcessingEvent(
                    event="batch_completed",
                    total_files=len(processed_jobs),
                    processed_count=len(successful_jobs),
                    failed_count=len(failed_jobs) + len(invalid_jobs),
                    processing_details={
                        "stage": "job_creation",
                        "total_time": result.get("total_time", 0),
                        "successful_jobs": len(successful_jobs),
                        "failed_jobs": len(failed_jobs) + len(invalid_jobs),
                        "stats": result.get("stats", {})
                    }
                )
            except requests.exceptions.HTTPError as e:
                # Log the error response content
                error_detail = "No error details"
                try:
                    if response.content:
                        error_detail = response.json()
                        logger.error(f"Error response from bulk creation endpoint: {json.dumps(error_detail, indent=2)}")
                except Exception as json_error:
                    logger.error(f"Error parsing error response: {str(json_error)}")
                    error_detail = response.text if response.text else "No error details"
                
                logger.error(f"Error creating jobs in bulk: {e.__class__.__name__}: {str(e)}, Details: {error_detail}")
                raise
        except Exception as e:
            logger.error(f"Error creating jobs in bulk: {str(e)}", exc_info=True)
            
            # Fallback to individual job creation
            successful_count = 0
            failed_count = 0
            
            logger.info(f"Falling back to individual job creation for {len(valid_jobs)} jobs")
            
            for i, job_data in enumerate(valid_jobs):
                try:
                    # Log the job data being sent
                    logger.info(f"Attempting to create individual job {i+1}/{len(valid_jobs)}")
                    
                    # Ensure the job data is normalized
                    normalized_job = self._normalize_job_data(job_data)
                    
                    # Run the synchronous request in a thread pool to avoid blocking
                    def make_job_request():
                        session = requests.Session()
                        session.verify = False  # Disable SSL verification for development
                        return session.post(
                            f"{LOCAL_API_URL}/v1/jobs",
                            json=normalized_job,
                            timeout=30
                        )
                    
                    # Run the synchronous request in a thread pool
                    loop = asyncio.get_event_loop()
                    response = await loop.run_in_executor(None, make_job_request)
                    
                    try:
                        response.raise_for_status()
                        job_result = response.json()
                        logger.info(f"Successfully created job {i+1}: {job_result.get('id', 'No ID')}")
                        successful_count += 1
                    except requests.exceptions.HTTPError as e:
                        failed_count += 1
                        # Log the error response content
                        error_detail = "No error details"
                        try:
                            if response.content:
                                error_detail = response.json()
                                logger.error(f"Error response from job creation endpoint: {json.dumps(error_detail, indent=2)}")
                        except Exception as json_error:
                            logger.error(f"Error parsing error response: {str(json_error)}")
                            error_detail = response.text if response.text else "No error details"
                        
                        logger.error(f"Error creating individual job {i+1}: {e.__class__.__name__}: {str(e)}, Details: {error_detail}")
                except Exception as job_error:
                    failed_count += 1
                    logger.error(f"Error creating individual job {i+1}: {str(job_error)}")
            
            yield JobProcessingEvent(
                event="batch_completed",
                total_files=len(processed_jobs),
                processed_count=successful_count,
                failed_count=failed_count + len(invalid_jobs),
                processing_details={
                    "stage": "job_creation",
                    "total_time": sum(job.processing_time for job in processed_jobs),
                    "successful_jobs": successful_count,
                    "failed_jobs": failed_count + len(invalid_jobs),
                    "error": str(e)
                }
            )

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.remote_client.aclose()
        await self.local_client.aclose()

    async def _create_processed_job_data(
        self,
        file: Path,
        text_content: str,
        organization_id: str,
        is_mock: bool,
        status: str,
        start_time: float
    ) -> ProcessedJobData:
        """Create processed job data from text content"""
        # Log the length of the text content for debugging
        logger.info(f"Creating processed job data for {file.name}, text content length: {len(text_content)}")
        
        # Check if text content is too short
        if not text_content or len(text_content) < 50:
            logger.warning(f"Text content for {file.name} is too short: {len(text_content)} chars")
            
            # If mock data is requested, generate a placeholder
            if is_mock:
                logger.info(f"Generating mock data for {file.name}")
                mock_data = {
                    "title": {"en": f"Mock Job from {file.name}", "fr": f"Emploi simulé de {file.name}"},
                    "description": {
                        "en": f"This is a mock job description generated from {file.name}.",
                        "fr": f"Ceci est une description d'emploi simulée générée à partir de {file.name}."
                    },
                    "location": {
                        "city": {"en": "Sample City", "fr": "Ville Exemple"},
                        "state": {"en": "Sample State", "fr": "État Exemple"},
                        "country": {"en": "Sample Country", "fr": "Pays Exemple"},
                        "postal_code": {"en": "12345", "fr": "12345"}
                    },
                    "requirements": {
                        "en": ["Sample requirement 1", "Sample requirement 2"],
                        "fr": ["Exigence exemple 1", "Exigence exemple 2"]
                    },
                    "job_type": "FULL_TIME",
                    "organization_id": organization_id,
                    "status": status,
                    "remote": False,
                    "skills": ["SKILL_1", "SKILL_2"],
                    "is_mock": True
                }
                return ProcessedJobData(
                    original_file=str(file),
                    extracted_data=mock_data,
                    processing_time=time.time() - start_time
                )
        
        # Cache key based on content hash and organization
        cache_key = f"{hashlib.md5(text_content.encode()).hexdigest()}_{organization_id}"
        cached_result = self._get_cache(cache_key)
        
        if cached_result:
            logger.info(f"Using cached result for {file.name}")
            return ProcessedJobData(
                original_file=str(file),
                extracted_data=cached_result,
                processing_time=time.time() - start_time
            )
        
        try:
            # Define the function to make the extract request
            def make_extract_request():
                # Create a payload with the required fields
                payload = {
                    "text": text_content,
                    "organization_id": organization_id,
                    "is_mock": is_mock,
                    "status": status,
                    "source_file": file.name
                }
                
                logger.debug(f"Sending payload to extract endpoint, length: {len(text_content)}")
                
                # Create a session with SSL verification disabled for development
                session = requests.Session()
                session.verify = False
                
                # Make the request to the local API endpoint
                return session.post(
                    f"{LOCAL_API_URL}/v1/jobs/extract-data",
                    json=payload,
                    timeout=30
                )
            
            # Run the synchronous request in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, make_extract_request)
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Parse the response JSON
            result = response.json()
            
            # Extract the job data from the response
            if "data" in result:
                job_data = result["data"]
            else:
                job_data = result
                
            # Add organization_id and status if not present
            if "organization_id" not in job_data:
                job_data["organization_id"] = organization_id
            if "status" not in job_data:
                job_data["status"] = status
            if "is_mock" not in job_data:
                job_data["is_mock"] = is_mock
                
            # Normalize the job data to ensure it matches the expected format
            job_data = self._normalize_job_data(job_data)
                
            # Cache the result
            try:
                self._set_cache(cache_key, job_data)
            except Exception as cache_error:
                logger.warning(f"Failed to cache result: {str(cache_error)}")
            
            return ProcessedJobData(
                original_file=str(file),
                extracted_data=job_data,
                processing_time=time.time() - start_time
            )
            
        except requests.exceptions.HTTPError as e:
            error_detail = "No error details"
            validation_errors = []
            
            # Handle 422 Unprocessable Entity errors (validation errors)
            if e.response.status_code == 422:
                try:
                    error_response = e.response.json()
                    logger.error(f"Validation error for {file.name}: {json.dumps(error_response, indent=2)}")
                    
                    # Extract validation error details
                    if "detail" in error_response:
                        if isinstance(error_response["detail"], list):
                            for error in error_response["detail"]:
                                if "msg" in error:
                                    validation_errors.append(error["msg"])
                        elif isinstance(error_response["detail"], str):
                            validation_errors.append(error_response["detail"])
                    
                    error_detail = error_response
                except Exception as json_error:
                    logger.error(f"Error parsing validation error response: {str(json_error)}")
                    error_detail = e.response.text if e.response.text else "No error details"
                    validation_errors.append(f"Validation error: {str(e)}")
            else:
                validation_errors.append(f"HTTP error: {e.response.status_code} - {str(e)}")
                
            logger.error(f"Error extracting job data from {file.name}: {e.__class__.__name__}: {str(e)}, Details: {error_detail}")
            
            return ProcessedJobData(
                original_file=str(file),
                extracted_data={},
                validation_errors=validation_errors,
                processing_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error(f"Error extracting job data from {file.name}: {str(e)}", exc_info=True)
            
            return ProcessedJobData(
                original_file=str(file),
                extracted_data={},
                validation_errors=[f"Processing error: {str(e)}"],
                processing_time=time.time() - start_time
            )

    async def _extract_text_from_txt(self, file_path: Path) -> str:
        """Extract text from a TXT file"""
        try:
            logger.info(f"Processing TXT file: {file_path.name}")
            if not file_path.exists():
                raise FileNotFoundError(f"TXT file not found: {file_path}")
            
            # Read the text file
            async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                text_content = await f.read()
            
            logger.info(f"Successfully extracted text from TXT: {file_path.name}, content length: {len(text_content)}")
            return text_content
        except Exception as e:
            logger.error(f"Error extracting text from TXT file {file_path.name}: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract text from TXT file: {str(e)}")
    
    # DOCX support removed as it's not needed 

    async def _extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from a PDF file using the semantic service"""
        try:
            logger.info(f"Processing PDF file: {file_path.name}")
            
            # Use the semantic service to convert PDF to text
            result = await semantic_service.convert_pdf_to_text(file_path)
            
            # Extract text from the result - handle different response formats
            if isinstance(result, dict):
                # Try different possible keys where text might be stored
                if "text" in result:
                    text = result["text"]
                elif "pages" in result:
                    # Join pages with newlines
                    text = "\n".join(result["pages"])
                else:
                    # Log all keys to help debug
                    logger.warning(f"Unexpected response format from PDF conversion: {list(result.keys())}")
                    # Try to extract any string values from the dictionary
                    text_values = [v for v in result.values() if isinstance(v, str) and len(v) > 10]
                    if text_values:
                        text = "\n".join(text_values)
                    else:
                        text = str(result)
            elif isinstance(result, str):
                text = result
            else:
                logger.warning(f"Unexpected response type from PDF conversion: {type(result)}")
                text = str(result)
            
            # Validate text content
            if not text or len(text.strip()) < 10:
                logger.warning(f"Extracted text is too short or empty for {file_path.name}: '{text}'")
                if hasattr(result, 'content') and isinstance(result.content, bytes):
                    # Try to decode the content directly
                    try:
                        text = result.content.decode('utf-8')
                        logger.info(f"Extracted text from content: {len(text)} characters")
                    except Exception as decode_error:
                        logger.error(f"Error decoding content: {str(decode_error)}")
            
            logger.info(f"Successfully extracted text from PDF: {file_path.name}, content length: {len(text)}")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path.name}: {str(e)}", exc_info=True)
            return f"Error processing PDF: {str(e)}" 

    def _normalize_job_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize job data to ensure it matches the expected format"""
        normalized_data = job_data.copy()
        
        # Ensure requirements is in the correct format
        if "requirements" in normalized_data:
            if isinstance(normalized_data["requirements"], list):
                # Convert list to dictionary with language keys
                normalized_data["requirements"] = {
                    "en": normalized_data["requirements"],
                    "fr": normalized_data["requirements"]
                }
        
        # Ensure all required fields exist
        if "remote" not in normalized_data:
            normalized_data["remote"] = False
            
        # Ensure location has all required fields
        if "location" in normalized_data:
            if "postal_code" not in normalized_data["location"]:
                normalized_data["location"]["postal_code"] = {"en": "", "fr": ""}
                
            # Ensure state exists even if not in US
            if "state" not in normalized_data["location"]:
                normalized_data["location"]["state"] = {"en": "", "fr": ""}
        
        # Add skills if missing
        if "skills" not in normalized_data:
            normalized_data["skills"] = []
            
        return normalized_data 