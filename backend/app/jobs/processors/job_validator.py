import logging
from typing import Dict, Any, List, Tuple
from uuid import UUID
import json

from ..schemas.job_models import BaseJobData, ProcessedJobData

logger = logging.getLogger(__name__)
# Set logging level to DEBUG to see debug logs
logger.setLevel(logging.DEBUG)

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
        
        # Debug log the job data
        data = job_data
        logger.debug(f"Validating job data: {json.dumps(job_data, indent=2)}")
        
        # Get title for logging
        title = data.get('title', 'Unknown title')
        logger.info(f"Validating job data: {title}")
        
        # Validate job type - 
        valid_job_types = [
            "FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", 
            "INTERNSHIP", "VOLUNTEER", "TO_BE_DETERMINED",
            "TEMPS_PLEIN", "TEMPS_PARTIEL", "CONTRAT", "FREELANCE",
            "STAGE", "BENEVOLAT", "A DETERMINER", "CDI", "CDD", "ALTERNANCE"
        ]
        job_type = data.get("job_type", "")
        
        if job_type not in valid_job_types:
            job_type = "TO_BE_DETERMINED"

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
        
        # Validate title and description
        for field in ["title", "description"]:
            if field in data:
                if not isinstance(data[field], str):
                    errors.append(f"{field} must be a string, got {type(data[field])}")
                elif not data[field]:
                    errors.append(f"Empty {field}")

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
                    elif not isinstance(data["location"][loc_field], str):
                        errors.append(f"location.{loc_field} must be a string, got {type(data['location'][loc_field])}")
                    elif not data["location"][loc_field]:
                        errors.append(f"Empty location.{loc_field}")

        # Validate requirements
        if "requirements" in data:
            if not isinstance(data["requirements"], list):
                errors.append(f"Requirements must be a list, got {type(data['requirements'])}")
            else:
                # Check that all requirements are strings
                for i, req in enumerate(data["requirements"]):
                    if not isinstance(req, str):
                        errors.append(f"Requirement at index {i} must be a string, got {type(req)}")
        
        # Validate skills
        if "skills" in data:
            if not isinstance(data["skills"], list):
                errors.append(f"Skills must be a list, got {type(data['skills'])}")
            else:
                # Check that all skills are strings
                for i, skill in enumerate(data["skills"]):
                    if not isinstance(skill, str):
                        errors.append(f"Skill at index {i} must be a string, got {type(skill)}")
        
        # Validate remote flag
        if "remote" in data and not isinstance(data["remote"], bool):
            errors.append(f"Remote must be a boolean, got {type(data['remote'])}")
        
        # Validate organization_id
        if "organization_id" not in job_data:
            errors.append("Missing organization_id")
        else:
            try:
                UUID(job_data["organization_id"])
            except (ValueError, TypeError):
                errors.append(f"Invalid organization_id format: {job_data['organization_id']}")
        
        # Log validation result
        logger.info(f"Job validation {'passed' if not errors else 'failed'} with {len(errors)} errors")
        return not errors, errors
    
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