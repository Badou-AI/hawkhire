import logging
from typing import Dict, Any, List, Tuple
from uuid import UUID

from ..schemas.job_models import BaseJobData, ProcessedJobData

logger = logging.getLogger(__name__)

class JobValidator:
    """Validates job data against schema requirements"""
    
    def __init__(self):
        """Initialize the job validator"""
        pass
    
    async def validate_job_data(self, job_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate job data against schema
        
        Args:
            job_data: Job data to validate
            
        Returns:
            Tuple of (is_valid, error_list)
        """
        errors = []
        
        # Get title for logging
        title = job_data.get('title', 'Unknown title')
        if isinstance(title, dict):
            title = title.get('en', 'Unknown title')
        logger.info(f"Validating job data: {title}")
        
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
        
        # Validate language field
        if "language" not in job_data:
            errors.append("Missing language field")
        elif not isinstance(job_data["language"], str):
            errors.append(f"Language must be a string, got {type(job_data['language'])}")
        
        # Validate title and description
        for field in ["title", "description"]:
            if field in job_data:
                # Handle legacy format (dict with language keys)
                if isinstance(job_data[field], dict):
                    # Check if the dict has the language key
                    lang = job_data.get("language", "en")
                    if lang not in job_data[field]:
                        errors.append(f"Missing {lang} translation for {field}")
                    elif not job_data[field][lang]:
                        errors.append(f"Empty {lang} translation for {field}")
                elif not isinstance(job_data[field], str):
                    errors.append(f"{field} must be a string, got {type(job_data[field])}")
                elif not job_data[field]:
                    errors.append(f"Empty {field}")

        # Validate location fields
        if "location" in job_data:
            required_loc_fields = ["city", "country"]  # State is not always required
            
            # Check if location is a dict
            if not isinstance(job_data["location"], dict):
                errors.append(f"Location must be a dictionary, got {type(job_data['location'])}")
            else:
                # Check required location fields
                for loc_field in required_loc_fields:
                    if loc_field not in job_data["location"]:
                        errors.append(f"Missing location.{loc_field}")
                    elif isinstance(job_data["location"][loc_field], dict):
                        # Handle legacy format (dict with language keys)
                        lang = job_data.get("language", "en")
                        if lang not in job_data["location"][loc_field]:
                            errors.append(f"Missing {lang} translation for location.{loc_field}")
                        elif not job_data["location"][loc_field][lang]:
                            errors.append(f"Empty {lang} translation for location.{loc_field}")
                    elif not isinstance(job_data["location"][loc_field], str):
                        errors.append(f"location.{loc_field} must be a string, got {type(job_data['location'][loc_field])}")
                    elif not job_data["location"][loc_field]:
                        errors.append(f"Empty location.{loc_field}")

        # Validate requirements
        if "requirements" in job_data:
            # Handle legacy format (dict with language keys)
            if isinstance(job_data["requirements"], dict):
                lang = job_data.get("language", "en")
                if lang not in job_data["requirements"]:
                    errors.append(f"Missing {lang} translation for requirements")
                elif not isinstance(job_data["requirements"][lang], list):
                    errors.append(f"Requirements.{lang} must be a list")
            elif not isinstance(job_data["requirements"], list):
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
        if "summary" in job_data and not isinstance(job_data["summary"], str):
            errors.append(f"Summary must be a string, got {type(job_data['summary'])}")

        # Log validation results
        if errors:
            logger.error(f"Validation errors: {errors}")
        
        # Return validation result
        is_valid = len(errors) == 0
        logger.info(f"Job validation {'passed' if is_valid else 'failed'} with {len(errors)} errors")
        return is_valid, errors
    
    def create_processed_job_data(
        self, 
        original_file: str, 
        extracted_data: Dict[str, Any], 
        processing_time: float,
        validation_errors: List[str] = None
    ) -> ProcessedJobData:
        """Create a ProcessedJobData object from extracted data
        
        Args:
            original_file: Path to the original file
            extracted_data: Extracted job data
            processing_time: Time taken to process the file
            validation_errors: Optional list of validation errors
            
        Returns:
            ProcessedJobData object
        """
        return ProcessedJobData(
            original_file=original_file,
            extracted_data=extracted_data,
            processing_time=processing_time,
            validation_errors=validation_errors or []
        ) 