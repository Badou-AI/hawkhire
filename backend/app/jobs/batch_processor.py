"""
Batch processor for job files.

This module coordinates the processing of job files in a batch,
handling file extraction, text processing, data validation, and job creation.
"""

import logging
import asyncio
import os
import time
import json
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
# Set logging level to DEBUG to see debug logs
logger.setLevel(logging.DEBUG)

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
        """Process a ZIP file containing job descriptions
        
        Args:
            file: ZIP file to process
            organization_id: Organization ID
            is_mock: Whether to mark jobs as mock data
            status: Initial status for created jobs
            
        Yields:
            Job processing events
        """
        start_time = time.time()
        total_files = 0
        processed_count = 0
        failed_count = 0
        unsupported_count = 0
        
        # Create metrics event
        yield JobProcessingEvent(
            type="PROCESSING_STARTED",
            message="Starting batch processing",
            total_files=0,
            processed_count=0,
            failed_count=0,
            processing_time=0,
            unsupported_count=0
        )
        
        try:
            # Extract files from ZIP
            extracted_files_generator = self.file_processor.process_zip(file, organization_id)
            extracted_files = []
            
            # Collect all extracted files
            async for temp_file, storage_file in extracted_files_generator:
                extracted_files.append((temp_file, storage_file))
                total_files += 1
                
                # Update progress
                yield JobProcessingEvent(
                    type="FILE_EXTRACTED",
                    message=f"Extracted file: {temp_file.name}",
                    total_files=total_files,
                    processed_count=processed_count,
                    failed_count=failed_count,
                    processing_time=time.time() - start_time,
                    unsupported_count=unsupported_count,
                    current_file=temp_file.name
                )
            
            logger.info(f"Extracted {total_files} files from ZIP")
            
            # Process each file
            for temp_file, storage_file in extracted_files:
                try:
                    # Set current file being processed
                    yield JobProcessingEvent(
                        type="FILE_PROCESSING",
                        message=f"Processing file: {temp_file.name}",
                        total_files=total_files,
                        processed_count=processed_count,
                        failed_count=failed_count,
                        processing_time=time.time() - start_time,
                        unsupported_count=unsupported_count,
                        current_file=temp_file.name
                    )
                    
                    # Check if the file exists before attempting to extract text
                    file_to_process = None
                    if temp_file.exists():
                        file_to_process = temp_file
                    elif storage_file.exists():
                        file_to_process = storage_file
                    else:
                        logger.error(f"Neither temporary file nor storage file exists: {temp_file}, {storage_file}")
                        raise FileNotFoundError(f"File not found: {temp_file.name}")
                    
                    # Check if file type is supported
                    if not self.file_processor._is_supported_file_type(file_to_process):
                        logger.warning(f"Unsupported file type: {file_to_process}")
                        unsupported_count += 1
                        yield JobProcessingEvent(
                            type="FILE_UNSUPPORTED",
                            message=f"Unsupported file type: {file_to_process.name}",
                            total_files=total_files,
                            processed_count=processed_count,
                            failed_count=failed_count,
                            processing_time=time.time() - start_time,
                            unsupported_count=unsupported_count,
                            current_file=file_to_process.name,
                            error="Unsupported file type",
                            error_type="UnsupportedFileType"
                        )
                        continue
                    
                    # Extract text from file with timeout
                    logger.info(f"Extracting text from file: {file_to_process}")
                    try:
                        # Set a timeout for text extraction (30 seconds)
                        text_extraction_task = asyncio.create_task(
                            self.file_processor.extract_text(file_to_process)
                        )
                        text_content = await asyncio.wait_for(text_extraction_task, timeout=30)
                        logger.info(f"Extracted {len(text_content)} characters from {file_to_process.name}")
                    except asyncio.TimeoutError:
                        logger.error(f"Text extraction timed out for {file_to_process.name}")
                        raise TimeoutError(f"Text extraction timed out for {file_to_process.name}")
                    except FileNotFoundError as e:
                        logger.error(f"File not found: {str(e)}")
                        raise
                    except ValueError as e:
                        logger.error(f"Value error during text extraction: {str(e)}")
                        raise
                    except Exception as e:
                        logger.error(f"Unexpected error during text extraction: {str(e)}")
                        raise
                    
                    # Extract job data using LLM with timeout
                    logger.info(f"Extracting job data from {file_to_process.name}")
                    try:
                        # Set a timeout for LLM processing (60 seconds)
                        llm_task = asyncio.create_task(
                            self.llm_client.extract_job_data(
                                text=text_content,
                                file_name=file_to_process.name,
                                organization_id=organization_id
                            )
                        )
                        job_data = await asyncio.wait_for(llm_task, timeout=60)
                        logger.info(f"Successfully extracted job data from {file_to_process.name}")
                        # Debug log the job data
                        logger.debug(f"Extracted job data: {json.dumps(job_data, indent=2)}")
                        data = job_data
                        # Ensure all required fields are present and properly formatted
                        required_fields = ["title", "description", "location", "job_type", "language", "remote", "requirements", "skills"]
                        for field in required_fields:
                            if field not in data:
                                if field == "location":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = {
                                        "city": "Unknown City",
                                        "state": "",
                                        "country": "Unknown Country",
                                        "postal_code": ""
                                    }
                                elif field == "job_type":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = "TO_BE_DETERMINED"
                                elif field == "title":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = f"Job from {file_to_process.name}"
                                elif field == "description":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = "No description provided"
                                elif field == "language":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = "en"
                                elif field == "remote":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = False
                                elif field == "requirements":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = []
                                elif field == "skills":
                                    logger.warning(f"Missing required field: {field}. Adding default value.")
                                    data[field] = []
                            else:
                                # Ensure fields are properly formatted
                                if field == "title" and isinstance(data[field], dict):
                                    logger.warning(f"Field {field} is a dictionary. Converting to string.")
                                    if "en" in data[field]:
                                        data[field] = data[field]["en"]
                                    else:
                                        data[field] = str(data[field])
                                elif field == "description" and isinstance(data[field], dict):
                                    logger.warning(f"Field {field} is a dictionary. Converting to string.")
                                    if "en" in data[field]:
                                        data[field] = data[field]["en"]
                                    else:
                                        data[field] = str(data[field])
                                elif field == "requirements" and isinstance(data[field], dict):
                                    logger.warning(f"Field {field} is a dictionary. Converting to list.")
                                    if "en" in data[field]:
                                        data[field] = data[field]["en"]
                                    else:
                                        data[field] = []
                        
                        # Ensure location has all required fields and they are properly formatted
                        if "location" in data and isinstance(data["location"], dict):
                            location_fields = ["city", "state", "country", "postal_code"]
                            for field in location_fields:
                                if field not in data["location"]:
                                    logger.warning(f"Missing location field: {field}. Adding default value.")
                                    if field == "city":
                                        data["location"][field] = "Unknown City"
                                    elif field == "country":
                                        data["location"][field] = "Unknown Country"
                                    else:
                                        data["location"][field] = ""
                                elif isinstance(data["location"][field], dict):
                                    logger.warning(f"Location field {field} is a dictionary. Converting to string.")
                                    if "en" in data["location"][field]:
                                        data["location"][field] = data["location"][field]["en"]
                                    else:
                                        data["location"][field] = str(data["location"][field])
                    
                    except asyncio.TimeoutError:
                        logger.error(f"LLM processing timed out for {file_to_process.name}")
                        raise TimeoutError(f"LLM processing timed out for {file_to_process.name}")
                    except ValueError as e:
                        logger.error(f"Value error during job data extraction: {str(e)}")
                        raise
                    except Exception as e:
                        logger.error(f"Unexpected error during job data extraction: {str(e)}")
                        raise
                    
                    # Add status and is_mock flags
                    job_data["status"] = status
                    job_data["is_mock"] = is_mock
                    
                    # Skip normalization and use job_data directly
                    normalized_data = job_data
                    
                    # Validate job data
                    is_valid, validation_errors = await self.job_validator.validate_job_data(normalized_data)
                    
                    # Log validation errors
                    if not is_valid:
                        logger.warning(f"Validation errors for {file_to_process.name}:")
                        for error in validation_errors:
                            logger.warning(f"  - {error}")
                        
                        # Mark file as failed
                        failed_file_path = await self.file_processor.mark_file_processed(
                            storage_file, 
                            organization_id, 
                            success=False
                        )
                        
                        # Update counters
                        failed_count += 1
                        
                        # Yield error event
                        yield JobProcessingEvent(
                            type="FILE_FAILED",
                            message=f"Failed to process file: {file_to_process.name} - Validation failed",
                            total_files=total_files,
                            processed_count=processed_count,
                            failed_count=failed_count,
                            processing_time=time.time() - start_time,
                            unsupported_count=unsupported_count,
                            current_file=file_to_process.name,
                            error=f"Validation failed: {', '.join(validation_errors)}",
                            error_type="ValidationError"
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
                    
                    # Create job in database
                    job_id = await self.bulk_creator.create_job(processed_job)
                    logger.info(f"Created job {job_id} from {file_to_process.name}")
                    
                    # Mark file as processed
                    processed_file_path = await self.file_processor.mark_file_processed(
                        storage_file, 
                        organization_id, 
                        success=True
                    )
                    logger.info(f"Marked file as processed: {processed_file_path}")
                    
                    # Track metrics
                    try:
                        self.metrics_service.update_metrics("processing", {
                            "processing_time": processing_time,
                            "success": True
                        })
                    except Exception as metrics_error:
                        logger.error(f"Error updating metrics: {str(metrics_error)}")
                    
                    # Update counters
                    processed_count += 1
                    
                    # Yield success event
                    yield JobProcessingEvent(
                        type="FILE_PROCESSED",
                        message=f"Processed file: {file_to_process.name}",
                        total_files=total_files,
                        processed_count=processed_count,
                        failed_count=failed_count,
                        processing_time=processing_time,
                        unsupported_count=unsupported_count,
                        current_file=file_to_process.name,
                        job_id=job_id
                    )
                
                except Exception as e:
                    # Log the error
                    logger.error(f"Error processing file {temp_file.name}: {str(e)}", exc_info=True)
                    
                    # Mark file as failed
                    if storage_file.exists():
                        await self.file_processor.mark_file_processed(storage_file, organization_id, success=False)
                    
                    # Update counters
                    failed_count += 1
                    
                    # Determine error type
                    error_type = e.__class__.__name__
                    
                    # Yield failure event
                    yield JobProcessingEvent(
                        type="FILE_FAILED",
                        message=f"Failed to process file: {temp_file.name} - {str(e)}",
                        total_files=total_files,
                        processed_count=processed_count,
                        failed_count=failed_count,
                        processing_time=time.time() - start_time,
                        unsupported_count=unsupported_count,
                        current_file=temp_file.name,
                        error=str(e),
                        error_type=error_type
                    )
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Update metrics
            try:
                self.metrics_service.record_batch_processing(
                    organization_id=organization_id,
                    total_files=total_files,
                    processed_files=processed_count,
                    failed_files=failed_count,
                    processing_time=processing_time,
                    unsupported_files=unsupported_count
                )
            except Exception as metrics_error:
                logger.error(f"Error recording batch processing metrics: {str(metrics_error)}")
            
            # Yield completion event
            yield JobProcessingEvent(
                type="PROCESSING_COMPLETED",
                message="Batch processing completed",
                total_files=total_files,
                processed_count=processed_count,
                failed_count=failed_count,
                processing_time=processing_time,
                unsupported_count=unsupported_count
            )
            
        except Exception as e:
            # Log the error
            logger.error(f"Error in batch processing: {str(e)}", exc_info=True)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Determine error type
            error_type = e.__class__.__name__
            
            # Try to update metrics
            try:
                self.metrics_service.update_metrics("processing", {
                    "processing_time": processing_time,
                    "success": False,
                    "error": str(e)
                })
            except Exception as metrics_error:
                logger.error(f"Error updating metrics: {str(metrics_error)}")
            
            # Yield error event
            yield JobProcessingEvent(
                type="PROCESSING_ERROR",
                message=f"Batch processing error: {str(e)}",
                total_files=total_files,
                processed_count=processed_count,
                failed_count=failed_count,
                processing_time=processing_time,
                unsupported_count=unsupported_count,
                error=str(e),
                error_type=error_type
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