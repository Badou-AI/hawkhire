"""
Batch job processing implementation with optimized performance.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
import asyncio
import tempfile
import time
from pathlib import Path
import aiofiles
import zipfile
from fastapi import UploadFile
from pydantic import BaseModel
from ..services.semantic import semantic_service  # Updated import

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
        retry_delay: float = 1.0
    ):
        self.pdf_semaphore = asyncio.Semaphore(pdf_concurrency)
        self.llm_semaphore = asyncio.Semaphore(llm_concurrency)
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._progress: Dict[str, Any] = {}

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
                # Save and extract ZIP
                zip_path = temp_path / "upload.zip"
                async with aiofiles.open(zip_path, 'wb') as f:
                    content = await file.read()
                    await f.write(content)

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

                # Process files in batches
                processed_count = 0
                failed_count = 0
                total_batches = (total_files + self.batch_size - 1) // self.batch_size

                for batch_idx in range(total_batches):
                    start_idx = batch_idx * self.batch_size
                    end_idx = min(start_idx + self.batch_size, total_files)
                    batch_files = pdf_files[start_idx:end_idx]

                    try:
                        # Process batch
                        results = await self._process_batch(
                            files=batch_files,
                            batch_number=batch_idx + 1,
                            total_batches=total_batches,
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
                                    batch_number=batch_idx + 1,
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
                                    batch_number=batch_idx + 1,
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
                            batch_number=batch_idx + 1,
                            batch_total=total_batches
                        )

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

    async def _process_batch(
        self,
        files: List[Path],
        batch_number: int,
        total_batches: int,
        organization_id: str,
        is_mock: bool,
        status: str
    ) -> List[ProcessedJobData]:
        """Process a batch of files concurrently"""
        tasks = [
            self._process_file(
                file,
                organization_id=organization_id,
                is_mock=is_mock,
                status=status
            ) for file in files
        ]
        return await asyncio.gather(*tasks)

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

        for attempt in range(self.max_retries):
            try:
                async with self.pdf_semaphore:
                    # Extract text from PDF
                    text_result = await semantic_service.convert_pdf_to_text(file)
                    text_content = "\n".join(text_result.get('pages', []))

                    if not text_content or len(text_content.strip()) < 50:
                        raise ValueError("Extracted text is too short or empty")

                async with self.llm_semaphore:
                    # Extract job data using LLM
                    job_data = await semantic_service.extract_knowledge(
                        text_content,
                        schema={
                            "type": "object",
                            "required": ["title", "description", "job_type", "location"],
                            "properties": {
                                "title": {
                                    "type": "object",
                                    "properties": {
                                        "en": {"type": "string"},
                                        "fr": {"type": "string"}
                                    }
                                },
                                "description": {
                                    "type": "object",
                                    "properties": {
                                        "en": {"type": "string"},
                                        "fr": {"type": "string"}
                                    }
                                },
                                "job_type": {"type": "string"},
                                "location": {
                                    "type": "object",
                                    "properties": {
                                        "city": {"type": "object"},
                                        "state": {"type": "object"},
                                        "country": {"type": "object"},
                                        "postal_code": {"type": "object"}
                                    }
                                }
                            }
                        }
                    )

                    # Add additional fields
                    job_data.update({
                        "organization_id": organization_id,
                        "is_mock": is_mock,
                        "status": status
                    })

                    return ProcessedJobData(
                        original_file=file.name,
                        extracted_data=job_data,
                        processing_time=time.time() - start_time
                    )

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