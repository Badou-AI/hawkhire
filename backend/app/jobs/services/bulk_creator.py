import logging
import json
import asyncio
import time
import os
from typing import List, Dict, Any, AsyncGenerator, Optional
import requests

from ..schemas.job_models import ProcessedJobData
from ..schemas.events import JobProcessingEvent
from .api_client import APIClient
from .metrics import MetricsService

logger = logging.getLogger(__name__)

class BulkJobCreator:
    """Handles bulk creation of jobs"""
    
    def __init__(
        self, 
        api_client: APIClient,
        metrics_service: Optional[MetricsService] = None,
        local_api_url: str = os.getenv("LOCAL_API_URL")
    ):
        """Initialize the bulk job creator
        
        Args:
            api_client: API client for making requests
            metrics_service: Optional metrics service for tracking performance
            local_api_url: URL for the local API
        """
        self.api_client = api_client
        self.metrics_service = metrics_service
        self.local_api_url = local_api_url
    
    async def create_jobs_bulk(self, processed_jobs: List[ProcessedJobData]) -> AsyncGenerator[JobProcessingEvent, None]:
        """Create jobs in bulk from processed data
        
        Args:
            processed_jobs: List of processed job data
            
        Yields:
            JobProcessingEvent objects with progress updates
        """
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
            
            # Run the synchronous request in a thread pool to avoid blocking
            def make_bulk_request():
                session = requests.Session()
                session.verify = False  # Disable SSL verification for development
                
                # Create the payload
                payload = valid_jobs
                
                # Log the payload size
                logger.debug(f"Sending bulk creation request with {len(payload)} jobs")
                
                return session.post(
                    f"{self.local_api_url}/v1/jobs/bulk",
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
                
                # Track metrics if available
                if self.metrics_service:
                    self.metrics_service.update_metrics("bulk_creation", {
                        "total_jobs": len(processed_jobs),
                        "successful_jobs": len(successful_jobs),
                        "failed_jobs": len(failed_jobs) + len(invalid_jobs),
                        "total_time": result.get("total_time", 0)
                    })
                
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
                
                # Track metrics if available
                if self.metrics_service:
                    self.metrics_service.update_metrics("bulk_creation_error", {
                        "error_type": e.__class__.__name__,
                        "error_message": str(e),
                        "status_code": response.status_code
                    })
                
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
                    
                    # Run the synchronous request in a thread pool to avoid blocking
                    def make_job_request():
                        session = requests.Session()
                        session.verify = False  # Disable SSL verification for development
                        return session.post(
                            f"{self.local_api_url}/v1/jobs",
                            json=job_data,
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
            
            # Track metrics if available
            if self.metrics_service:
                self.metrics_service.update_metrics("individual_creation", {
                    "total_jobs": len(valid_jobs),
                    "successful_jobs": successful_count,
                    "failed_jobs": failed_count,
                    "error": str(e)
                }) 