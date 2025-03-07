import asyncio
import logging
import time
import json
import os
from typing import Dict, Any, List, Optional
import backoff
import aiohttp
from pathlib import Path
from ..schemas.job_models import BaseJobData
from ..services.api_client import APIClient
from ..services.metrics import MetricsService

import re
import sys
import tempfile
from .file_processor import FileProcessor
import copy
from uuid import UUID

logger = logging.getLogger(__name__)

class LLMClient:
    """Handles LLM integration for job data extraction"""
    
    def __init__(
        self, 
        api_client: APIClient,
        metrics_service: Optional[MetricsService] = None,
        local_api_url: str = os.getenv("LOCAL_API_URL")
    ):
        """Initialize the LLM client
        
        Args:
            api_client: API client for making requests
            metrics_service: Optional metrics service for tracking performance
            local_api_url: URL for the local API
        """
        self.api_client = api_client
        self.metrics_service = metrics_service
        self.local_api_url = local_api_url
    
    async def extract_job_data(self, text: str, file_name: str, organization_id: str) -> Dict[str, Any]:
        """Extract job data from text using LLM and spaCy
        
        Args:
            text: Text to extract job data from
            file_name: Name of the file being processed
            organization_id: Organization ID
            
        Returns:
            Extracted job data
            
        Raises:
            ValueError: If validation fails
            Exception: For other errors
        """
        try:
            # Log a preview of the text
            text_length = len(text)
            preview = text[:100] + "..." if text_length > 100 else text
            logger.info(f"Extracting job data from text ({text_length} chars): {preview}")
            
            # Check if text is long enough for reliable extraction
            if text_length < 50:
                logger.warning(f"Text is too short for reliable extraction: {text_length} chars")
                raise ValueError("Text is too short for reliable extraction")
            
            # Check if the text contains error messages from PDF extraction
            error_indicators = [
                '[Error extracting text from PDF',
                'EOF marker not found',
                '[PDF file not found:',
                '[No readable text content found in'
            ]
            
            has_extraction_error = any(indicator in text for indicator in error_indicators)
            
           
            # Prepare payload for local API
            payload = {
                "text": text,
                "filename": file_name,
                "organization_id": organization_id,
                "status": "DRAFT"
            }
            
            # Check if LOCAL_API_URL is set
            local_api_url = os.environ.get("LOCAL_API_URL")
            if not local_api_url:
                logger.warning("LOCAL_API_URL environment variable not set, using default http://localhost:8080")
                local_api_url = "http://localhost:8080"
            
            # Send request to local API
            logger.info(f"Sending request to {local_api_url}/v1/jobs/extract-data")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{local_api_url}/v1/jobs/extract-data", 
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        # Process response
                        logger.debug(f"Response: {response}")
                        if response.status == 200:
                            response_text = await response.text()
                            logger.debug(f"API response: {response_text[:500]}...")
                            extracted_data = json.loads(response_text)
                            logger.debug(f"Extracted data: {extracted_data}")
                            # Add organization_id if not present
                            if "organization_id" not in extracted_data:
                                logger.info(f"Adding missing organization_id to extracted data")
                                extracted_data["organization_id"] = organization_id
                            
                            
                            # Ensure language is set
                            if "language" not in extracted_data:
                                extracted_data["language"] = "unknown"
                            
                            
                            logger.info(f"Successfully extracted job data locally using spaCy for {file_name}")
                            return extracted_data
                        else:
                            response_text = await response.text()
                            logger.error(f"API request failed with status {response.status}: {response_text}")
                            
                            if response.status == 400:
                                # Validation error
                                raise ValueError(f"Invalid job data: {response_text}")
                            else:
                                # Server error
                                raise Exception(f"Failed to extract job data: {response_text}")
            except aiohttp.ClientConnectError as e:
                logger.warning(f"Could not connect to local API: {str(e)}. Falling back to local spaCy extraction.")
                raise Exception(f"Failed to connect to local API: {str(e)}")
                
        except ValueError as ve:
            # Track metrics if available
            if self.metrics_service:
                self.metrics_service.update_metrics("llm_extraction", {
                    "text_length": len(text),
                    "file_name": file_name,
                    "success": False,
                    "error": str(ve)
                })
            logger.error(f"Validation error extracting job data: {str(ve)}")
            # Re-raise the error instead of creating fallback data
            raise ValueError(f"Failed to extract job data: {str(ve)}")
            
        except Exception as e:
            # Track metrics if available
            if self.metrics_service:
                self.metrics_service.update_metrics("llm_extraction", {
                    "text_length": len(text),
                    "file_name": file_name,
                    "success": False,
                    "error": str(e)
                })
            logger.error(f"Error extracting job data: {str(e)}")
            # Re-raise the error instead of creating fallback data
            raise Exception(f"Failed to extract job data: {str(e)}")
    

    async def validate_schema(self, job_data: Dict[str, Any]) -> List[str]:
        """Validate job data against schema
        
        Args:
            job_data: Job data to validate
            
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        data = job_data
        # Validate job type
        valid_job_types = [
            "FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", 
            "INTERNSHIP", "VOLUNTEER", "TO_BE_DETERMINED",
            "CDD", "CDI", "ALTERNANCE", "STAGE", "ALTERNANCE",
            "TELETRAVAIL", "TELETRAVAIL_PARTIEL", "TELETRAVAIL_TOTAL",
            "A DETERMINER", "A DOMICILE", "A DISTANCE", "A DISTANCE_PARTIELLE",
            "APPRENTISSAGE"
        ]
        if "job_type" not in data:
            errors.append("Missing job_type")
        elif data["job_type"] not in valid_job_types:
            errors.append(f"Invalid job type: {data['job_type']}")

        # Validate required fields
        required_fields = ["title", "description", "location"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing {field}")
                continue
        
        # Validate language field
        if "language" not in data:
            errors.append("Missing language field")
        elif not isinstance(data["language"], str):
            errors.append(f"Language must be a string, got {type(data['language'])}")
        
        # Validate title and description are strings (or handle legacy format)
        for field in ["title", "description"]:
            if field in data:
                # Handle legacy format (dict with language keys)
                if isinstance(data[field], dict):
                    # Check if the dict has the language key
                    lang = data.get("language", "unknown")
                    if lang not in data[field]:
                        errors.append(f"Missing {lang} translation for {field}")
                elif not isinstance(data[field], str):
                    errors.append(f"{field} must be a string, got {type(data[field])}")

        # Validate location fields
        if "location" in data:
            required_loc_fields = ["city", "country"]  # State is not always required
            
            # Check if location is a dict
            if not isinstance(data["location"], dict):
                errors.append(f"Location must be a dictionary, got {type(data['location'])}")
            else:
                # Check required location fields
                for loc_field in required_loc_fields:
                    if loc_field not in data["location"]:
                        errors.append(f"Missing location.{loc_field}")
                    elif isinstance(data["location"][loc_field], dict):
                        # Handle legacy format (dict with language keys)
                        lang = data.get("language", "unknown")
                        if lang not in data["location"][loc_field]:
                            errors.append(f"Missing {lang} translation for location.{loc_field}")
                    elif not isinstance(data["location"][loc_field], str):
                        errors.append(f"location.{loc_field} must be a string, got {type(data['location'][loc_field])}")

        # Validate requirements
        if "requirements" in data:
            # Handle legacy format (dict with language keys)
            if isinstance(data["requirements"], dict):
                lang = data.get("language", "unknown")
                if lang not in data["requirements"]:
                    errors.append(f"Missing {lang} translation for requirements")
                elif not isinstance(data["requirements"][lang], list):
                    errors.append(f"Requirements.{lang} must be a list")
            elif not isinstance(data["requirements"], list):
                errors.append("Requirements must be a list")
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
        
        # Validate summary field
        if "summary" in data and not isinstance(data["summary"], str):
            errors.append(f"Summary must be a string, got {type(data['summary'])}")

        return errors
    
    def normalize_job_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize job data to ensure it conforms to the expected schema
        
        Args:
            job_data: Raw job data to normalize
            
        Returns:
            Normalized job data
        """
        normalized_data = copy.deepcopy(job_data)
        logger.debug(f"Normalizing job data: {json.dumps(job_data, indent=2)[:500]}...")
        
        # Determine language (default to English)
        language = normalized_data.get("language", "en")
        
        # Normalize title
        if "title" in normalized_data:
            if isinstance(normalized_data["title"], dict):
                # Extract string from multilingual format
                if language in normalized_data["title"]:
                    normalized_data["title"] = normalized_data["title"][language]
                elif "en" in normalized_data["title"]:
                    normalized_data["title"] = normalized_data["title"]["en"]
                else:
                    # Get first available language
                    first_lang = next(iter(normalized_data["title"]))
                    normalized_data["title"] = normalized_data["title"][first_lang]
            
            # Ensure title is a string
            if not isinstance(normalized_data["title"], str):
                logger.warning(f"Invalid title format: {type(normalized_data['title'])}. Setting default title.")
                normalized_data["title"] = "Untitled Position"
        else:
            logger.warning("Title is missing. Setting default title.")
            normalized_data["title"] = "Untitled Position"
            
        # Normalize description
        if "description" in normalized_data:
            if isinstance(normalized_data["description"], dict):
                # Extract string from multilingual format
                if language in normalized_data["description"]:
                    normalized_data["description"] = normalized_data["description"][language]
                elif "en" in normalized_data["description"]:
                    normalized_data["description"] = normalized_data["description"]["en"]
                else:
                    # Get first available language
                    first_lang = next(iter(normalized_data["description"]))
                    normalized_data["description"] = normalized_data["description"][first_lang]
            
            # Ensure description is a string
            if not isinstance(normalized_data["description"], str):
                logger.warning(f"Invalid description format: {type(normalized_data['description'])}. Setting default description.")
                normalized_data["description"] = "No description provided"
        else:
            logger.warning("Description is missing. Setting default description.")
            normalized_data["description"] = "No description provided"
            
        # Normalize requirements
        if "requirements" in normalized_data:
            if isinstance(normalized_data["requirements"], dict):
                # Extract list from multilingual format
                if language in normalized_data["requirements"]:
                    normalized_data["requirements"] = normalized_data["requirements"][language]
                elif "en" in normalized_data["requirements"]:
                    normalized_data["requirements"] = normalized_data["requirements"]["en"]
                else:
                    # Get first available language
                    first_lang = next(iter(normalized_data["requirements"]))
                    normalized_data["requirements"] = normalized_data["requirements"][first_lang]
            
            # Ensure requirements is a list
            if not isinstance(normalized_data["requirements"], list):
                logger.warning(f"Invalid requirements format: {type(normalized_data['requirements'])}. Setting empty requirements.")
                normalized_data["requirements"] = []
        else:
            logger.debug("Requirements not provided. Setting empty requirements.")
            normalized_data["requirements"] = []
            
        # Normalize skills (convert to uppercase)
        if "skills" in normalized_data:
            if isinstance(normalized_data["skills"], list):
                logger.debug(f"Converting skills to uppercase: {normalized_data['skills']}")
                normalized_data["skills"] = [s.upper() for s in normalized_data["skills"] if isinstance(s, str)]
            else:
                logger.warning(f"Skills must be a list, got: {type(normalized_data['skills'])}. Setting empty skills.")
                normalized_data["skills"] = []
        else:
            logger.debug("Skills not provided. Setting empty skills.")
            normalized_data["skills"] = []
            
        # Normalize location
        if "location" in normalized_data:
            location = normalized_data["location"]
            normalized_location = {}
            
            if not isinstance(location, dict):
                logger.warning(f"Location is not a dict: {type(location)}. Setting default location.")
                normalized_location = {
                    "city": "Unknown City",
                    "state": "",
                    "country": "Unknown Country",
                    "postal_code": ""
                }
            else:
                # Normalize city
                if "city" in location:
                    if isinstance(location["city"], dict):
                        # Extract string from multilingual format
                        if language in location["city"]:
                            normalized_location["city"] = location["city"][language]
                        elif "en" in location["city"]:
                            normalized_location["city"] = location["city"]["en"]
                        else:
                            # Get first available language
                            first_lang = next(iter(location["city"]))
                            normalized_location["city"] = location["city"][first_lang]
                    elif isinstance(location["city"], str):
                        normalized_location["city"] = location["city"]
                    else:
                        normalized_location["city"] = "Unknown City"
                else:
                    normalized_location["city"] = "Unknown City"
                
                # Normalize state
                if "state" in location:
                    if isinstance(location["state"], dict):
                        # Extract string from multilingual format
                        if language in location["state"]:
                            normalized_location["state"] = location["state"][language]
                        elif "en" in location["state"]:
                            normalized_location["state"] = location["state"]["en"]
                        else:
                            # Get first available language
                            first_lang = next(iter(location["state"]))
                            normalized_location["state"] = location["state"][first_lang]
                    elif isinstance(location["state"], str):
                        normalized_location["state"] = location["state"]
                    else:
                        normalized_location["state"] = ""
                else:
                    normalized_location["state"] = ""
                
                # Normalize country
                if "country" in location:
                    if isinstance(location["country"], dict):
                        # Extract string from multilingual format
                        if language in location["country"]:
                            normalized_location["country"] = location["country"][language]
                        elif "en" in location["country"]:
                            normalized_location["country"] = location["country"]["en"]
                        else:
                            # Get first available language
                            first_lang = next(iter(location["country"]))
                            normalized_location["country"] = location["country"][first_lang]
                    elif isinstance(location["country"], str):
                        normalized_location["country"] = location["country"]
                    else:
                        normalized_location["country"] = "Unknown Country"
                else:
                    normalized_location["country"] = "Unknown Country"
                
                # Normalize postal_code
                if "postal_code" in location:
                    if isinstance(location["postal_code"], dict):
                        # Extract string from multilingual format
                        if language in location["postal_code"]:
                            normalized_location["postal_code"] = location["postal_code"][language]
                        elif "en" in location["postal_code"]:
                            normalized_location["postal_code"] = location["postal_code"]["en"]
                        else:
                            # Get first available language
                            first_lang = next(iter(location["postal_code"]))
                            normalized_location["postal_code"] = location["postal_code"][first_lang]
                    elif isinstance(location["postal_code"], str):
                        normalized_location["postal_code"] = location["postal_code"]
                    else:
                        normalized_location["postal_code"] = ""
                else:
                    normalized_location["postal_code"] = ""
                
                # Ensure all location fields are strings
                for field in ["city", "state", "country", "postal_code"]:
                    if not isinstance(normalized_location[field], str):
                        normalized_location[field] = str(normalized_location[field])
                    
                # Set default values for empty fields
                if not normalized_location["city"]:
                    normalized_location["city"] = "Unknown City"
                if not normalized_location["country"]:
                    normalized_location["country"] = "Unknown Country"
            
            normalized_data["location"] = normalized_location
        else:
            logger.debug("Location not provided. Setting default location.")
            normalized_data["location"] = {
                "city": "Unknown City",
                "state": "",
                "country": "Unknown Country",
                "postal_code": ""
            }
            
        # Normalize job_type
        if "job_type" in normalized_data:
            job_type = normalized_data["job_type"]
            valid_job_types = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "VOLUNTEER", "TO_BE_DETERMINED"]
            
            if isinstance(job_type, str) and job_type.upper() in valid_job_types:
                normalized_data["job_type"] = job_type.upper()
            else:
                logger.debug(f"Invalid job type: {job_type}. Setting TO_BE_DETERMINED.")
                normalized_data["job_type"] = "TO_BE_DETERMINED"
        else:
            logger.debug("Job type not provided. Setting TO_BE_DETERMINED.")
            normalized_data["job_type"] = "TO_BE_DETERMINED"

        # Ensure organization_id is present
        if "organization_id" not in normalized_data:
            logger.error("organization_id is missing from job data")
            raise ValueError("organization_id is required")

        # Add or normalize other required fields
        if "remote" not in normalized_data:
            logger.debug("Remote flag not provided. Setting to False.")
            normalized_data["remote"] = False

        # Keep is_mock flag for database purposes only
        normalized_data["is_mock"] = job_data.get("is_mock", False)
        
        # Ensure language is set
        if "language" not in normalized_data:
            normalized_data["language"] = language
        
        # Ensure summary is set
        if "summary" not in normalized_data or not normalized_data["summary"]:
            logger.debug("Summary not provided. Using description as summary.")
            normalized_data["summary"] = normalized_data["description"]
        
        logger.info(f"Normalized job data successfully. Title: {normalized_data['title']}")
        return normalized_data

class LLMIntegration:
    """Handles communication with LLM services for job data extraction"""
    
    def __init__(self, api_client: APIClient, max_concurrency: int = 3, batch_size: int = 5):
        """Initialize the LLM integration
        
        Args:
            api_client: API client for communication
            max_concurrency: Maximum number of concurrent LLM requests
            batch_size: Number of files to process in a batch
        """
        self.api_client = api_client
        self.max_concurrency = max_concurrency
        self.batch_size = batch_size
        self.semaphore = asyncio.Semaphore(max_concurrency)
    
    @backoff.on_exception(
        backoff.expo,
        (Exception,),
        max_tries=3,
        giveup=lambda e: isinstance(e, ValueError),
        on_backoff=lambda details: logger.warning(
            f"Retrying LLM request after {details['wait']:.1f}s delay. Attempt {details['tries']}/3"
        )
    )
    async def extract_job_data(self, text: str, file_name: str, organization_id: str) -> Dict[str, Any]:
        """Extract job data from text using LLM
        
        Args:
            text: Text content to extract data from
            file_name: Name of the original file
            organization_id: Organization ID
            
        Returns:
            Extracted job data
            
        Raises:
            ValueError: If text is too short for reliable extraction
            Exception: If LLM processing fails
        """
        async with self.semaphore:
            logger.info(f"Extracting job data from: {file_name}")
            start_time = time.time()
            
            # Log text preview for debugging
            text_preview = text[:100] + "..." if len(text) > 100 else text
            logger.debug(f"Text preview: {text_preview}")
            
            if not text or len(text.strip()) < 50:
                logger.warning(f"Text is too short ({len(text)} chars) for reliable extraction.")
                raise ValueError(f"Text is too short ({len(text)} chars) for reliable extraction")
            
            # Call the LLM service to extract job data
            payload = {
                "text": text,
                "filename": file_name,
                "organization_id": organization_id
            }
            
            logger.info(f"Sending request to /v1/jobs/extract-data for {file_name}")
            try:
                response = await self.api_client.post("/v1/jobs/extract-data", json=payload)
                
                # Check response status
                if response.status != 200:
                    response_text = await response.text()
                    logger.error(f"API request failed with status {response.status}: {response_text}")
                    raise Exception(f"Failed to extract job data: {response_text}")
                
                # Parse response
                response_text = await response.text()
                logger.debug(f"API response: {response_text[:500]}...")
                
                try:
                    extracted_data = json.loads(response_text)
                except json.JSONDecodeError as jde:
                    logger.error(f"Failed to parse API response as JSON: {response_text[:200]}...")
                    logger.error(f"JSON decode error: {str(jde)}")
                    raise Exception("Invalid response format from job data extraction")
                
                # Add organization_id if not present
                if "organization_id" not in extracted_data:
                    logger.info(f"Adding missing organization_id to extracted data")
                    extracted_data["organization_id"] = organization_id
                
                # Log processing time
                processing_time = time.time() - start_time
                logger.info(f"LLM processing completed in {processing_time:.2f}s for {file_name}")
                
                return extracted_data
                
            except aiohttp.ClientError as ce:
                logger.error(f"API connection error: {str(ce)}")
                raise Exception(f"Failed to connect to API: {str(ce)}")
            except json.JSONDecodeError as jde:
                logger.error(f"Failed to parse API response as JSON")
                logger.error(f"JSON decode error: {str(jde)}")
                raise Exception("Invalid response format from job data extraction")
            except Exception as e:
                logger.error(f"Unexpected error during API request: {str(e)}")
                raise
    
    async def process_batch(self, items: List[Dict[str, Any]], organization_id: str) -> List[Dict[str, Any]]:
        """Process a batch of items with the LLM
        
        Args:
            items: List of items to process
            organization_id: Organization ID
            
        Returns:
            List of processed items with extracted data
        """
        logger.info(f"Processing batch of {len(items)} items")
        
        tasks = []
        for item in items:
            task = asyncio.create_task(
                self.extract_job_data(
                    text=item["text"],
                    file_name=item["file_name"],
                    organization_id=organization_id
                )
            )
            tasks.append(task)
            logger.debug(f"Tasks: {tasks}")
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        processed_items = []
        for i, result in enumerate(results):
            item = items[i].copy()
            if isinstance(result, Exception):
                item["status"] = "error"
                item["error"] = str(result)
            else:
                item["status"] = "success"
                item["data"] = result
            processed_items.append(item)
        
        return processed_items 