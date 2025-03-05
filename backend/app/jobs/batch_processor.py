"""
Batch processor for job files.

This module coordinates the processing of job files in a batch,
handling file extraction, text processing, data validation, and job creation.
"""

import logging
import asyncio
import os
import time
from pathlib import Path
from typing import Dict, Any, List, AsyncGenerator, Optional
from uuid import UUID
from fastapi import UploadFile

from .processors.file_processor import FileProcessor
from .processors.llm_integration import LLMClient
from .processors.job_validator import JobValidator
from .services.api_client import APIClient
from .services.bulk_creator import BulkJobCreator
from .services.metrics import MetricsService
from .schemas.events import JobProcessingEvent
from .schemas.job_models import ProcessedJobData

logger = logging.getLogger(__name__)

class BatchProcessor:
    """Orchestrates batch processing of job files"""
    
    def __init__(
        self,
        local_api_url: str = os.getenv("LOCAL_API_URL"),
        max_concurrency: int = 5,
        metrics_file: Optional[str] = None
    ):
        """Initialize the batch processor
        
        Args:
            local_api_url: URL for the local API
            max_concurrency: Maximum number of concurrent operations
            metrics_file: Optional path to metrics file
        """
        # Initialize services
        self.api_client = APIClient(base_url=local_api_url)
        self.metrics_service = MetricsService(metrics_file=metrics_file)
        
        # Initialize processors
        self.file_processor = FileProcessor(max_concurrency=max_concurrency)
        self.llm_client = LLMClient(
            api_client=self.api_client,
            metrics_service=self.metrics_service,
            local_api_url=local_api_url
        )
        self.job_validator = JobValidator()
        self.bulk_creator = BulkJobCreator(
            api_client=self.api_client,
            metrics_service=self.metrics_service,
            local_api_url=local_api_url
        )
        
        # Set up concurrency control
        self.semaphore = asyncio.Semaphore(max_concurrency)
        
        logger.info(f"BatchProcessor initialized with max_concurrency={max_concurrency}")
    
    async def process_zip(
        self,
        file: UploadFile,
        organization_id: str,
        is_mock: bool = False,
        status: str = "DRAFT"
    ) -> AsyncGenerator[JobProcessingEvent, None]:
        """Process a ZIP file containing job files
        
        Args:
            file: The uploaded ZIP file
            organization_id: Organization ID
            is_mock: Whether to create mock jobs
            status: Job status
            
        Yields:
            JobProcessingEvent objects with progress updates
        """
        try:
            logger.info(f"Starting process_zip with file: {file.filename}, organization_id: {organization_id}, status: {status}, is_mock: {is_mock}")
            
            # Validate organization_id
            try:
                logger.info(f"Validating organization_id: {organization_id}")
                UUID(organization_id)
                logger.info("Organization ID validation successful")
            except ValueError as e:
                logger.error(f"Invalid organization_id format: {str(e)}")
                yield JobProcessingEvent(
                    event="error",
                    error="Invalid organization_id format",
                    total_files=0,
                    processed_count=0,
                    failed_count=0
                )
                return
            
            # Test API connection
            logger.info("Testing API connection...")
            connection_test = self.api_client.test_connection()
            logger.info(f"API connection test result: {connection_test}")
            
            if not connection_test.get("success", False):
                logger.error(f"API connection test failed: {connection_test.get('error', 'Unknown error')}")
                yield JobProcessingEvent(
                    event="error",
                    error=f"API connection test failed: {connection_test.get('error', 'Unknown error')}",
                    total_files=0,
                    processed_count=0,
                    failed_count=0
                )
                return
            
            # Extract files from ZIP
            extracted_files = []
            # The process_zip method now returns a tuple of (temp_file_path, storage_file_path)
            async for temp_file, storage_file in self.file_processor.process_zip(file, organization_id):
                extracted_files.append((temp_file, storage_file))
            
            if not extracted_files:
                yield JobProcessingEvent(
                    event="error",
                    error="No valid files found in ZIP",
                    total_files=0,
                    processed_count=0,
                    failed_count=0
                )
                return
            
            # Process files
            total_files = len(extracted_files)
            processed_count = 0
            failed_count = 0
            processed_jobs = []
            
            yield JobProcessingEvent(
                event="processing_started",
                total_files=total_files,
                processed_count=0,
                failed_count=0
            )
            
            # Process each file
            for temp_file, storage_file in extracted_files:
                try:
                    # Check if the file exists before attempting to extract text
                    if not temp_file.exists():
                        logger.error(f"Temporary file not found: {temp_file}")
                        # Try using the storage file instead
                        logger.info(f"Attempting to use storage file instead: {storage_file}")
                        if storage_file.exists():
                            # Extract text from file
                            start_time = time.time()
                            text_content = await self.file_processor.extract_text(storage_file)
                        else:
                            raise FileNotFoundError(f"Neither temporary file nor storage file exists: {temp_file}, {storage_file}")
                    else:
                        # Extract text from file
                        start_time = time.time()
                        text_content = await self.file_processor.extract_text(temp_file)
                    
                    # Extract job data using LLM
                    job_data = await self.llm_client.extract_job_data(
                        text=text_content,
                        file_name=temp_file.name,
                        organization_id=organization_id
                    )
                    
                    # Add status and is_mock flags
                    job_data["status"] = status
                    job_data["is_mock"] = is_mock
                    
                    # Normalize job data
                    normalized_data = self.llm_client.normalize_job_data(job_data)
                    
                    # Validate job data
                    is_valid, validation_errors = await self.job_validator.validate_job_data(normalized_data)
                    
                    # Log validation errors
                    if not is_valid:
                        logger.warning(f"Validation errors for {temp_file.name}:")
                        for error in validation_errors:
                            logger.warning(f"  - {error}")
                        
                        # If job data is not valid, don't proceed with job creation
                        failed_count += 1
                        
                        # Mark file as failed
                        failed_file_path = await self.file_processor.mark_file_processed(
                            storage_file, 
                            organization_id, 
                            success=False
                        )
                        logger.info(f"Marked file as failed due to validation errors: {failed_file_path}")
                        
                        # Track metrics
                        self.metrics_service.update_metrics("processing", {
                            "processing_time": time.time() - start_time,
                            "success": False
                        })
                        
                        # Yield error event
                        yield JobProcessingEvent(
                            event="file_processing_failed",
                            total_files=total_files,
                            processed_count=processed_count,
                            failed_count=failed_count,
                            file_name=temp_file.name,
                            error=f"Validation failed: {', '.join(validation_errors)}",
                            processing_details={
                                "processing_time": time.time() - start_time,
                                "validation_errors": validation_errors,
                                "storage_path": str(failed_file_path),
                                "retry_possible": True
                            }
                        )
                        continue
                    
                    # Create processed job data
                    processing_time = time.time() - start_time
                    processed_job = self.job_validator.create_processed_job_data(
                        original_file=str(storage_file),
                        extracted_data=normalized_data,
                        processing_time=processing_time,
                        validation_errors=[]
                    )
                    
                    processed_jobs.append(processed_job)
                    processed_count += 1
                    
                    # Mark file as processed
                    processed_file_path = await self.file_processor.mark_file_processed(
                        storage_file, 
                        organization_id, 
                        success=True
                    )
                    logger.info(f"Marked file as processed: {processed_file_path}")
                    
                    # Track metrics
                    self.metrics_service.update_metrics("processing", {
                        "processing_time": processing_time,
                        "success": True
                    })
                    
                    # Yield progress event
                    yield JobProcessingEvent(
                        event="file_processed",
                        total_files=total_files,
                        processed_count=processed_count,
                        failed_count=failed_count,
                        file_name=temp_file.name,
                        processing_details={
                            "processing_time": processing_time,
                            "is_valid": True,
                            "validation_errors": [],
                            "storage_path": str(processed_file_path)
                        }
                    )
                
                except Exception as e:
                    logger.error(f"Error processing file {temp_file.name}: {str(e)}", exc_info=True)
                    failed_count += 1
                    
                    # Mark file as failed
                    try:
                        failed_file_path = await self.file_processor.mark_file_processed(
                            storage_file, 
                            organization_id, 
                            success=False
                        )
                        logger.info(f"Marked file as failed: {failed_file_path}")
                    except Exception as mark_error:
                        logger.error(f"Error marking file as failed: {str(mark_error)}", exc_info=True)
                    
                    # Determine if retry is possible based on error type
                    retry_possible = not isinstance(e, (ValueError, FileNotFoundError))
                    error_message = str(e)
                    
                    # Yield error event
                    yield JobProcessingEvent(
                        event="file_processing_failed",
                        total_files=total_files,
                        processed_count=processed_count,
                        failed_count=failed_count,
                        file_name=temp_file.name,
                        error=error_message,
                        processing_details={
                            "retry_possible": retry_possible,
                            "error_type": e.__class__.__name__
                        }
                    )
            
            # Create jobs in bulk only if we have successfully processed jobs
            if processed_jobs:
                async for event in self.bulk_creator.create_jobs_bulk(processed_jobs):
                    yield event
            else:
                # If no jobs were successfully processed, report completion with error
                yield JobProcessingEvent(
                    event="batch_completed",
                    total_files=total_files,
                    processed_count=processed_count,
                    failed_count=failed_count,
                    processing_details={
                        "stage": "job_creation",
                        "total_time": 0,
                        "successful_jobs": 0,
                        "failed_jobs": failed_count,
                        "error": "No valid jobs to create"
                    }
                )
                
        except Exception as e:
            logger.error(f"Error processing ZIP file: {str(e)}", exc_info=True)
            yield JobProcessingEvent(
                event="error",
                error=str(e),
                total_files=0,
                processed_count=0,
                failed_count=0
            )
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.api_client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.api_client.__aexit__(exc_type, exc_val, exc_tb)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get summary of processing performance
        
        Returns:
            Dictionary with performance summary
        """
        return self.metrics_service.get_performance_summary()
    
    def get_historical_metrics(self, days: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get historical metrics for specified period
        
        Args:
            days: Number of days to retrieve (None for all)
            
        Returns:
            List of historical metrics
        """
        return self.metrics_service.get_historical_metrics(days=days) 