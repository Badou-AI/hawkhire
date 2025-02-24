"""
Batch job processing implementation with optimized performance.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator, Tuple
import asyncio
import tempfile
import time
import os
import sys
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
from fastapi import UploadFile
from pydantic import BaseModel, ValidationError
import httpx
from uuid import UUID
from functools import lru_cache
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from ..services.metrics import metrics_service
from ..services.semantic import semantic_service


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

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

class JobProcessingEvent(BaseModel):
    """Enhanced event model for job processing status updates"""
    event: str
    total_files: int
    processed_count: int
    failed_count: int
    file_name: Optional[str] = None
    error: Optional[str] = None
    batch_number: Optional[int] = None
    batch_total: Optional[int] = None
    unsupported_files: Optional[List[Dict[str, str]]] = None
    processing_details: Optional[Dict[str, Any]] = None

class ProcessedJobData(BaseModel):
    """Model for processed job data"""
    original_file: str
    extracted_data: Dict[str, Any]
    validation_errors: Optional[List[str]] = None
    processing_time: float

class BatchProcessor:
    """Handles batch processing of job files with optimized performance"""
    
    def __init__(
        self,
        pdf_concurrency: int = 10,
        llm_concurrency: int = 5,
        batch_size: int = 10,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        db_batch_size: int = 50,
        cache_ttl: int = 3600,  # Cache TTL in seconds
        max_memory_percent: float = 80.0,  # Maximum memory usage percentage
        chunk_size: int = 8192  # Chunk size for file streaming
    ):
        self.pdf_semaphore = asyncio.Semaphore(pdf_concurrency)
        self.llm_semaphore = asyncio.Semaphore(llm_concurrency)
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.db_batch_size = db_batch_size
        self.cache_ttl = cache_ttl
        self.max_memory_percent = max_memory_percent
        self.chunk_size = chunk_size
        self._progress: Dict[str, Any] = {}
        self._cache: Dict[str, CacheEntry] = {}
        
        # Use the existing semantic service
        self.semantic_service = semantic_service
        logger.debug(f"Using semantic service with base URL: {self.semantic_service.base_url}")
        
        # Configure HTTP clients
        remote_url = os.getenv("REMOTE_API_URL")
        if not remote_url:
            raise ValueError("REMOTE_API_URL environment variable is not set")
        
        # Client for remote services (PDF conversion, data extraction)
        logger.debug(f"Initializing remote client with API URL: {remote_url}")
        self.remote_client = httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=30.0,  # Connection timeout
                read=30.0,     # Read timeout
                write=30.0,    # Write timeout
                pool=30.0      # Pool timeout
            ),
            base_url=remote_url,
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=100,
                keepalive_expiry=30.0
            ),
            http2=True  # Enable HTTP/2 for better performance
        )
        
        # Client for local endpoints (job creation)
        local_url = f"http://{os.getenv('HOST', '127.0.0.1')}:{os.getenv('PORT', '8080')}"
        logger.debug(f"Initializing local client with API URL: {local_url}")
        self.local_client = httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=30.0,
                read=30.0,
                write=30.0,
                pool=30.0
            ),
            base_url=local_url,
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=100,
                keepalive_expiry=30.0
            ),
            http2=True
        )

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
        """Process a ZIP file containing job descriptions"""
        start_time = time.time()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            extract_path = temp_path / "extracted"
            extract_path.mkdir()
            
            try:
                # Save and extract ZIP
                zip_path = temp_path / "upload.zip"
                async with aiofiles.open(zip_path, 'wb') as f:
                    while chunk := await file.read(self.chunk_size):
                        await f.write(chunk)
                
                with zipfile.ZipFile(zip_path) as zip_ref:
                    zip_ref.extractall(extract_path)
                
                # Get list of all files and categorize them
                all_files = list(extract_path.rglob("*"))
                pdf_files = []
                unsupported_files = []
                
                for file_path in all_files:
                    if file_path.is_file():
                        if file_path.suffix.lower() == '.pdf':
                            pdf_files.append(file_path)
                        else:
                            unsupported_files.append({
                                "name": file_path.name,
                                "type": file_path.suffix,
                                "reason": "Unsupported file format - only PDF files are accepted"
                            })
                
                total_files = len(pdf_files)
                logger.info(f"Found {total_files} PDF files and {len(unsupported_files)} unsupported files")
                
                # Send initial event with file counts
                yield JobProcessingEvent(
                    event="processing_started",
                    total_files=total_files,
                    processed_count=0,
                    failed_count=0,
                    unsupported_files=unsupported_files,
                    processing_details={
                        "total_pdf_files": total_files,
                        "unsupported_count": len(unsupported_files)
                    }
                )
                
                processed_count = 0
                failed_count = 0
                
                # Process files in batches
                for batch_start in range(0, len(pdf_files), self.batch_size):
                    batch = pdf_files[batch_start:batch_start + self.batch_size]
                    current_batch = batch_start // self.batch_size + 1
                    total_batches = (len(pdf_files) + self.batch_size - 1) // self.batch_size
                    
                    try:
                        # Process batch
                        results = await self._process_files_in_parallel(
                            batch,
                            organization_id=organization_id,
                            is_mock=is_mock,
                            status=status
                        )
                        
                        # Process creation results and emit events
                        async for event in self.create_jobs_bulk(results):
                            if event.event == "job_created":
                                processed_count += 1
                            elif event.event == "job_creation_failed":
                                failed_count += 1
                            
                            # Update counts in the event
                            event.processed_count = processed_count
                            event.failed_count = failed_count
                            event.total_files = total_files
                            event.batch_number = current_batch
                            event.batch_total = total_batches
                            
                            yield event
                        
                    except Exception as e:
                        logger.error(f"Error processing batch: {str(e)}", exc_info=True)
                        yield JobProcessingEvent(
                            event="error",
                            total_files=total_files,
                            processed_count=processed_count,
                            failed_count=failed_count,
                            error=str(e),
                            batch_number=current_batch,
                            batch_total=total_batches
                        )
                
                # Send final completion event
                processing_time = time.time() - start_time
                yield JobProcessingEvent(
                    event="batch_completed",
                    total_files=total_files,
                    processed_count=processed_count,
                    failed_count=failed_count,
                    unsupported_files=unsupported_files,
                    processing_details={
                        "total_time": processing_time,
                        "total_pdf_files": total_files,
                        "unsupported_count": len(unsupported_files),
                        "stats": {
                            "total": total_files,
                            "successful": processed_count,
                            "failed": failed_count,
                            "unsupported": len(unsupported_files)
                        }
                    }
                )
                
            except Exception as e:
                logger.error(f"Error processing ZIP file: {str(e)}", exc_info=True)
                yield JobProcessingEvent(
                    event="error",
                    total_files=0,
                    processed_count=0,
                    failed_count=0,
                    error=str(e)
                )

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

        # Check cache
        cache_key = f"file:{file.name}:{organization_id}"
        cached_result = self._get_cache(cache_key)
        if cached_result:
            return cached_result

        try:
            for attempt in range(self.max_retries):
                try:
                    async with self.pdf_semaphore:
                        # First convert PDF to text
                        async with aiofiles.open(file, 'rb') as f:
                            content = await f.read()
                            files = {'file': (file.name, content, 'application/pdf')}
                            
                            # Add timeout to prevent hanging
                            async with asyncio.timeout(30):  # 30 second timeout
                                response = await self.remote_client.post(
                                    "/v1/tools/convert_pdf2text", 
                                    files=files
                                )
                                response.raise_for_status()
                                text_result = response.json()
                                text_content = "\n".join(text_result.get('pages', []))

                        if not text_content or len(text_content.strip()) < 50:
                            raise ValueError("Extracted text is too short or empty")

                    # If we get here, text extraction succeeded - proceed with data extraction
                    async with self.llm_semaphore:
                        response = await self.local_client.post(
                            "/v1/jobs/extract-data",
                            json={
                                'text': text_content,
                                'filename': file.name
                            }
                        )
                        response.raise_for_status()
                        extracted_data = response.json()

                    # If we get here, both steps succeeded - break the retry loop
                    break

                except Exception as e:
                    last_error = str(e)
                    errors.append(f"Attempt {attempt + 1}: {last_error}")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay * (attempt + 1))
                    continue

            else:  # No break occurred - all retries failed
                raise Exception(f"All retries failed. Last error: {last_error}")

            # Process successful result
            if isinstance(extracted_data, dict) and 'data' in extracted_data:
                extracted_data = extracted_data['data']

            extracted_data.update({
                "organization_id": organization_id,
                "is_mock": is_mock,
                "status": status
            })

            result = ProcessedJobData(
                original_file=file.name,
                extracted_data=extracted_data,
                processing_time=time.time() - start_time
            )

            self._set_cache(cache_key, result)
            return result

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
        if key in self._cache:
            entry = self._cache[key]
            if entry.expires_at > datetime.now():
                return entry.data
            del self._cache[key]
        return None

    def _set_cache(self, key: str, value: Any):
        """Set value in cache with expiration"""
        self._cache[key] = CacheEntry(
            data=value,
            expires_at=datetime.now() + timedelta(seconds=self.cache_ttl)
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
    ) -> List[ProcessedJobData]:
        """Process multiple files in parallel with optimized concurrency"""
        # Group files by type for batch processing
        files_by_type = {}
        for file in files:
            file_type = self._get_file_type(file.name)
            if file_type not in files_by_type:
                files_by_type[file_type] = []
            files_by_type[file_type].append(file)

        all_results = []
        for file_type, type_files in files_by_type.items():
            # Process each file type with appropriate concurrency
            tasks = [
                self._process_file(
                    file,
                    organization_id=organization_id,
                    is_mock=is_mock,
                    status=status
                )
                for file in type_files
            ]
            
            # Use gather with return_exceptions=True for better error handling
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle any exceptions
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    all_results.append(ProcessedJobData(
                        original_file=type_files[i].name,
                        extracted_data={},
                        validation_errors=[str(result)],
                        processing_time=0.0
                    ))
                else:
                    all_results.append(result)

        return all_results

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
        required_fields = ["title", "description", "location", "requirements"]
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
            required_loc_fields = ["city", "country"]  # Remove state from default required fields
            
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
        """Create jobs in bulk with validation and error handling"""
        start_time = time.time()
        successful_jobs = []
        failed_jobs = []

        # Group jobs into batches for database transactions
        job_batches = [
            processed_jobs[i:i + self.db_batch_size]
            for i in range(0, len(processed_jobs), self.db_batch_size)
        ]

        for batch in job_batches:
            valid_jobs = []
            
            # Validate all jobs in batch
            for job in batch:
                is_valid, validation_errors = await self._validate_job_data(job.extracted_data)
                
                if is_valid:
                    valid_jobs.append(job.extracted_data)
                else:
                    failed_jobs.append({
                        "file": job.original_file,
                        "errors": validation_errors,
                        "data": job.extracted_data
                    })
                    yield JobProcessingEvent(
                        event="job_creation_failed",
                        total_files=len(processed_jobs),
                        processed_count=len(successful_jobs),
                        failed_count=len(failed_jobs),
                        file_name=job.original_file,
                        error=str(validation_errors)
                    )

            if valid_jobs:
                try:
                    # Create jobs in bulk using the existing endpoint
                    response = await self.local_client.post(
                        "/v1/jobs/bulk",
                        json=valid_jobs
                    )
                    response.raise_for_status()
                    created_jobs = response.json()
                    successful_jobs.extend(created_jobs)
                    
                    # Yield success events for each created job
                    for job in created_jobs:
                        yield JobProcessingEvent(
                            event="job_created",
                            total_files=len(processed_jobs),
                            processed_count=len(successful_jobs),
                            failed_count=len(failed_jobs),
                            file_name=job.get("original_file", "unknown"),
                            processing_details={
                                "job_id": job.get("id"),
                                "status": "success"
                            }
                        )
                except Exception as e:
                    logger.error(f"Error during bulk job creation: {str(e)}", exc_info=True)
                    # If bulk creation fails, try individual creation
                    for job_data in valid_jobs:
                        try:
                            response = await self.local_client.post(
                                "/v1/jobs",
                                json=job_data
                            )
                            response.raise_for_status()
                            created_job = response.json()
                            successful_jobs.append(created_job)
                            yield JobProcessingEvent(
                                event="job_created",
                                total_files=len(processed_jobs),
                                processed_count=len(successful_jobs),
                                failed_count=len(failed_jobs),
                                file_name=job_data.get("original_file", "unknown"),
                                processing_details={
                                    "job_id": created_job.get("id"),
                                    "status": "success"
                                }
                            )
                        except Exception as job_error:
                            failed_jobs.append({
                                "file": job_data.get("original_file", "unknown"),
                                "errors": [str(job_error)],
                                "data": job_data
                            })
                            yield JobProcessingEvent(
                                event="job_creation_failed",
                                total_files=len(processed_jobs),
                                processed_count=len(successful_jobs),
                                failed_count=len(failed_jobs),
                                file_name=job_data.get("original_file", "unknown"),
                                error=str(job_error)
                            )

        # Yield final completion event
        total_time = time.time() - start_time
        yield JobProcessingEvent(
            event="batch_completed",
            total_files=len(processed_jobs),
            processed_count=len(successful_jobs),
            failed_count=len(failed_jobs),
            processing_details={
                "total_time": total_time,
                "stats": {
                    "total": len(processed_jobs),
                    "successful": len(successful_jobs),
                    "failed": len(failed_jobs)
                }
            }
        )

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.remote_client.aclose()
        await self.local_client.aclose() 