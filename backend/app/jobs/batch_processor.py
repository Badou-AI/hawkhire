"""
Batch job processing implementation with optimized performance.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator, Tuple
import asyncio
import tempfile
import time
import os
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
    """Event model for job processing status updates"""
    event: str  # 'processing_started' | 'file_processed' | 'file_failed' | 'completed'
    total_files: int
    processed_count: int
    failed_count: int
    file_name: Optional[str] = None
    error: Optional[str] = None
    batch_number: Optional[int] = None
    batch_total: Optional[int] = None

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
        self._metrics: Dict[str, Any] = {
            'memory_usage': [],
            'processing_times': [],
            'batch_sizes': [],
            'concurrent_tasks': 0
        }
        self.client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=100
            )
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
        if metric_type == 'memory_usage':
            self._metrics['memory_usage'].append(self._get_system_metrics())
        elif metric_type in self._metrics:
            self._metrics[metric_type].append(value)

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
        """
        Process a ZIP file containing job descriptions with optimized parallel execution.
        """
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            try:
                # Save and extract ZIP using streaming
                zip_path = temp_path / "upload.zip"
                async with aiofiles.open(zip_path, 'wb') as f:
                    async for chunk in file.stream():
                        await f.write(chunk)
                        self._update_metrics('memory_usage', None)

                # Extract files
                with zipfile.ZipFile(zip_path) as zip_ref:
                    zip_ref.extractall(temp_path / "extracted")
                
                # Get list of PDF files
                pdf_files = list(Path(temp_path / "extracted").rglob("*.pdf"))
                total_files = len(pdf_files)

                # Send initial event
                yield JobProcessingEvent(
                    event="processing_started",
                    total_files=total_files,
                    processed_count=0,
                    failed_count=0
                )

                if total_files == 0:
                    yield JobProcessingEvent(
                        event="completed",
                        total_files=0,
                        processed_count=0,
                        failed_count=0,
                        error="No PDF files found in ZIP"
                    )
                    return

                # Process files in optimized batches
                processed_count = 0
                failed_count = 0
                
                # Group files by size for better batch processing
                files_by_size = {}
                for pdf_file in pdf_files:
                    size = os.path.getsize(pdf_file)
                    size_group = size // (1024 * 1024)  # Group by MB
                    if size_group not in files_by_size:
                        files_by_size[size_group] = []
                    files_by_size[size_group].append(pdf_file)

                # Process each size group with appropriate batch size
                total_batches = 0
                current_batch = 0
                
                for size_group, group_files in files_by_size.items():
                    batch_size = self._adjust_batch_size(size_group * 1024 * 1024)
                    self._update_metrics('batch_sizes', batch_size)
                    
                    group_batches = (len(group_files) + batch_size - 1) // batch_size
                    total_batches += group_batches
                    
                    for batch_idx in range(group_batches):
                        start_idx = batch_idx * batch_size
                        end_idx = min(start_idx + batch_size, len(group_files))
                        batch_files = group_files[start_idx:end_idx]
                        current_batch += 1

                        try:
                            # Process batch with parallel execution
                            results = await self._process_files_in_parallel(
                                files=batch_files,
                                organization_id=organization_id,
                                is_mock=is_mock,
                                status=status
                            )

                            # Update counts and yield events
                            for result in results:
                                if result.validation_errors:
                                    failed_count += 1
                                    yield JobProcessingEvent(
                                        event="file_failed",
                                        total_files=total_files,
                                        processed_count=processed_count,
                                        failed_count=failed_count,
                                        file_name=result.original_file,
                                        error=str(result.validation_errors),
                                        batch_number=current_batch,
                                        batch_total=total_batches
                                    )
                                else:
                                    processed_count += 1
                                    yield JobProcessingEvent(
                                        event="file_processed",
                                        total_files=total_files,
                                        processed_count=processed_count,
                                        failed_count=failed_count,
                                        file_name=result.original_file,
                                        batch_number=current_batch,
                                        batch_total=total_batches
                                    )

                        except Exception as e:
                            # Handle batch processing error
                            failed_count += len(batch_files)
                            yield JobProcessingEvent(
                                event="file_failed",
                                total_files=total_files,
                                processed_count=processed_count,
                                failed_count=failed_count,
                                error=f"Batch processing error: {str(e)}",
                                batch_number=current_batch,
                                batch_total=total_batches
                            )

                        # Update memory metrics after each batch
                        self._update_metrics('memory_usage', None)

                # Send completion event
                yield JobProcessingEvent(
                    event="completed",
                    total_files=total_files,
                    processed_count=processed_count,
                    failed_count=failed_count
                )

            except Exception as e:
                # Handle overall processing error
                yield JobProcessingEvent(
                    event="completed",
                    total_files=total_files if 'total_files' in locals() else 0,
                    processed_count=processed_count if 'processed_count' in locals() else 0,
                    failed_count=failed_count if 'failed_count' in locals() else 0,
                    error=f"Processing error: {str(e)}"
                )
            finally:
                # Cleanup and final metrics
                await self.client.aclose()
                self._update_metrics('memory_usage', None)

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

        # Check cache for previously processed file
        cache_key = f"file:{file.name}:{organization_id}"
        cached_result = self._get_cache(cache_key)
        if cached_result:
            return cached_result

        # Track concurrent tasks
        self._metrics['concurrent_tasks'] += 1
        try:
            for attempt in range(self.max_retries):
                try:
                    async with self.pdf_semaphore:
                        # Convert PDF to text using existing endpoint and streaming
                        files = {'file': (file.name, await self._stream_to_bytes(file), 'application/pdf')}
                        response = await self.client.post("/v1/jobs/convert-pdf", files=files)
                        response.raise_for_status()
                        text_result = response.json()
                        text_content = text_result.get('text', '')

                        if not text_content or len(text_content.strip()) < 50:
                            raise ValueError("Extracted text is too short or empty")

                    async with self.llm_semaphore:
                        # Extract job data using existing endpoint
                        response = await self.client.post(
                            "/v1/jobs/extract-data",
                            json={
                                'text': text_content,
                                'filename': file.name
                            }
                        )
                        response.raise_for_status()
                        job_data = response.json()

                        # Add additional fields
                        job_data.update({
                            "organization_id": organization_id,
                            "is_mock": is_mock,
                            "status": status
                        })

                        result = ProcessedJobData(
                            original_file=file.name,
                            extracted_data=job_data,
                            processing_time=time.time() - start_time
                        )

                        # Cache successful result
                        self._set_cache(cache_key, result)
                        return result

                except Exception as e:
                    errors.append(f"Attempt {attempt + 1}: {str(e)}")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay * (attempt + 1))
                    continue

            return ProcessedJobData(
                original_file=file.name,
                extracted_data={},
                validation_errors=errors,
                processing_time=time.time() - start_time
            )
        finally:
            # Update metrics
            self._metrics['concurrent_tasks'] -= 1
            self._metrics['processing_times'].append(time.time() - start_time)
            self._update_metrics('memory_usage', None)

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
        return {
            'memory_usage': {
                'current': self._get_system_metrics(),
                'history': self._metrics['memory_usage'][-10:]  # Last 10 measurements
            },
            'processing_times': {
                'average': sum(self._metrics['processing_times']) / len(self._metrics['processing_times']) if self._metrics['processing_times'] else 0,
                'min': min(self._metrics['processing_times']) if self._metrics['processing_times'] else 0,
                'max': max(self._metrics['processing_times']) if self._metrics['processing_times'] else 0
            },
            'batch_sizes': {
                'average': sum(self._metrics['batch_sizes']) / len(self._metrics['batch_sizes']) if self._metrics['batch_sizes'] else 0,
                'current': self.batch_size
            },
            'concurrent_tasks': self._metrics['concurrent_tasks']
        }

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
        required_fields = {
            "title": {"en", "fr"},
            "description": {"en", "fr"},
            "job_type": {"FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "VOLUNTEER"},
            "location": {
                "city": {"en", "fr"},
                "state": {"en", "fr"},
                "country": {"en", "fr"},
                "postal_code": {"en", "fr"}
            }
        }

        # Check required fields
        for field, subfields in required_fields.items():
            if field not in job_data:
                errors.append(f"Missing required field: {field}")
                continue

            if field in ["title", "description"]:
                for lang in subfields:
                    if lang not in job_data[field] or not job_data[field][lang]:
                        errors.append(f"Missing {lang} translation for {field}")

            elif field == "job_type":
                if job_data[field] not in subfields:
                    errors.append(f"Invalid job type: {job_data[field]}")

            elif field == "location":
                for loc_field, langs in subfields.items():
                    if loc_field not in job_data[field]:
                        errors.append(f"Missing location field: {loc_field}")
                        continue
                    for lang in langs:
                        if lang not in job_data[field][loc_field] or not job_data[field][loc_field][lang]:
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

    async def create_jobs_bulk(self, processed_jobs: List[ProcessedJobData]) -> BatchCreationResult:
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

            if valid_jobs:
                try:
                    # Create jobs in a single transaction
                    response = await self.client.post(
                        "/v1/jobs/bulk",
                        json=valid_jobs
                    )
                    response.raise_for_status()
                    
                    # Add successful jobs
                    created_jobs = response.json()
                    successful_jobs.extend(created_jobs)
                    
                except Exception as e:
                    # If bulk creation fails, try individual creation
                    for job_data in valid_jobs:
                        try:
                            response = await self.client.post(
                                "/v1/jobs",
                                json=job_data
                            )
                            response.raise_for_status()
                            successful_jobs.append(response.json())
                        except Exception as job_error:
                            failed_jobs.append({
                                "file": job_data.get("original_file", "unknown"),
                                "errors": [str(job_error)],
                                "data": job_data
                            })

        total_time = time.time() - start_time
        
        return BatchCreationResult(
            successful_jobs=successful_jobs,
            failed_jobs=failed_jobs,
            total_time=total_time,
            stats={
                "total": len(processed_jobs),
                "successful": len(successful_jobs),
                "failed": len(failed_jobs)
            }
        ) 