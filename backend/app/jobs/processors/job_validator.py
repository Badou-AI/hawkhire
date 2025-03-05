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
        
        logger.info(f"Validating job data: {job_data.get('title', {}).get('en', 'Unknown title')}")
        
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
                    if lang not in job_data[field]:
                        errors.append(f"Missing {lang} translation for {field}")
                    elif not job_data[field][lang]:
                        errors.append(f"Empty {lang} translation for {field}")

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
                    if lang not in job_data["location"][loc_field]:
                        errors.append(f"Missing {lang} translation for location.{loc_field}")
                    elif not job_data["location"][loc_field][lang]:
                        errors.append(f"Empty {lang} translation for location.{loc_field}")

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
                errors.append("Requirements is a list, expected a dictionary with language keys")
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