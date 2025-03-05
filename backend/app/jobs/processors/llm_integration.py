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
                        if response.status == 200:
                            response_text = await response.text()
                            logger.debug(f"API response: {response_text[:500]}...")
                            extracted_data = json.loads(response_text)
                            
                            # Add organization_id if not present
                            if "organization_id" not in extracted_data:
                                logger.info(f"Adding missing organization_id to extracted data")
                                extracted_data["organization_id"] = organization_id
                            
                            # Clean up the description
                            if "description" in extracted_data and isinstance(extracted_data["description"], dict):
                                for lang in ["en", "fr"]:
                                    if lang in extracted_data["description"] and isinstance(extracted_data["description"][lang], str):
                                        # Format the description better
                                        desc = extracted_data["description"][lang]
                                        
                                        # Remove the title from the beginning if it's there
                                        if "title" in extracted_data and isinstance(extracted_data["title"], dict) and lang in extracted_data["title"]:
                                            title = extracted_data["title"][lang]
                                            if desc.startswith(title):
                                                desc = desc[len(title):].strip()
                                        
                                        # Fix excessive whitespace and newlines
                                        # First, replace "\n " pattern (newline followed by space) with just space
                                        desc = re.sub(r'\n\s+', ' ', desc)
                                        
                                        # Then normalize remaining newlines (replace multiple with double newlines)
                                        desc = re.sub(r'\n{2,}', '\n\n', desc)
                                        
                                        # Remove any leading/trailing whitespace
                                        desc = desc.strip()
                                        
                                        # Update the description
                                        extracted_data["description"][lang] = desc
                            
                            # Also clean up the title if it has newlines
                            title = re.sub(r'\n\s+', ' ', title)
                            
                            logger.info(f"Successfully extracted job data from {file_name}")
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
                # Fall back to local spaCy extraction
                import spacy
                try:
                    nlp = spacy.load("en_core_web_sm")
                except OSError:
                    logger.warning("Spacy model not found. Downloading...")
                    import subprocess
                    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
                    nlp = spacy.load("en_core_web_sm")
                
                # Process text with spaCy
                doc = nlp(text)
                
                # Extract title from first sentence
                title = next((sent.text.strip() for sent in doc.sents), "Untitled Position")
                
                # Clean up the title - remove newlines and excessive spaces
                title = re.sub(r'\n\s+', ' ', title)  # Replace newline+space with just space
                title = re.sub(r'\s+', ' ', title)    # Normalize spaces (multiple spaces to single space)
                title = title.strip()
                
                # Clean up the title - remove "Fiche de Poste" or similar prefixes
                title_prefixes = ["fiche de poste", "fiche de poste :", "fiche poste", "poste :"]
                title_lower = title.lower()
                for prefix in title_prefixes:
                    if title_lower.startswith(prefix):
                        title = title[len(prefix):].strip()
                        break
                
                # Extract location information
                locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
                location = {
                    "city": {"en": locations[0] if locations else "", "fr": ""},
                    "state": {"en": locations[1] if len(locations) > 1 else "", "fr": ""},
                    "country": {"en": locations[-1] if locations else "", "fr": ""},
                    "postal_code": {"en": "", "fr": ""}
                }
                
                # Check for multi-location patterns in the title or first part of text
                multi_location_patterns = [
                    r"\((.*?)\)",  # Text in parentheses
                    r"à\s+([^\.;]+)",  # French "à" followed by location
                    r"in\s+([^\.;]+)",  # English "in" followed by location
                    r"location\s*:\s*([^\.;]+)",  # Location: format
                    r"localisation\s*:\s*([^\.;]+)"  # Localisation: format
                ]
                
                for pattern in multi_location_patterns:
                    matches = re.findall(pattern, title + " " + text[:500], re.IGNORECASE)
                    if matches:
                        potential_locations = []
                        for match in matches:
                            # Clean up the match text
                            match = re.sub(r'\n\s+', ' ', match)  # Replace newline+space with just space
                            match = re.sub(r'\s+', ' ', match)    # Normalize spaces
                            match = match.strip()
                            
                            # Split by commas or other separators
                            parts = re.split(r'[,/]', match)
                            parts = [part.strip() for part in parts if part.strip()]
                            potential_locations.extend(parts)
                        
                        if potential_locations:
                            # Update city with the first location
                            location["city"]["en"] = potential_locations[0]
                            location["city"]["fr"] = potential_locations[0]
                            
                            # If we have multiple locations, update state
                            if len(potential_locations) > 1:
                                location["state"]["en"] = potential_locations[1]
                                location["state"]["fr"] = potential_locations[1]
                            
                            # If we have more than 2 locations, use the last one as country
                            if len(potential_locations) > 2:
                                location["country"]["en"] = potential_locations[-1]
                                location["country"]["fr"] = potential_locations[-1]
                
                # Format the description better
                # Remove the title from the beginning of the description
                description = text
                if title and description.startswith(title):
                    description = description[len(title):].strip()
                
                # Clean up the description - remove excessive newlines
                description = re.sub(r'\n\s+', ' ', description)  # Replace "\n " pattern with space
                description = re.sub(r'\n{2,}', '\n\n', description)  # Replace multiple newlines with double newlines
                
                # Extract skills (technical terms and proper nouns)
                skills = list(set([
                    ent.text.upper() for ent in doc.ents 
                    if ent.label_ in ["ORG", "PRODUCT"] 
                    or (ent.text.isupper() and len(ent.text) > 1)
                ]))
                
                # Extract requirements (bullet points or numbered lists)
                requirements = []
                for sent in doc.sents:
                    sent_text = sent.text.strip()
                    if any(char in sent_text for char in ["•", "-", "●", "•", "*"]) or sent_text.startswith(tuple("123456789")):
                        # Clean up the requirement
                        req = sent_text
                        for prefix in ["•", "-", "●", "•", "*"]:
                            if req.startswith(prefix):
                                req = req[1:].strip()
                        
                        # Clean up newlines and excessive spaces
                        req = re.sub(r'\n\s+', ' ', req)  # Replace newline+space with just space
                        req = re.sub(r'\s+', ' ', req)    # Normalize spaces
                        req = req.strip()
                        
                        requirements.append(req)
                
                # If we didn't find any requirements with bullet points, try to extract them from sections
                if not requirements:
                    requirement_sections = [
                        r"requirements\s*:\s*(.*?)(?:\n\n|\Z)",
                        r"qualifications\s*:\s*(.*?)(?:\n\n|\Z)",
                        r"exigences\s*:\s*(.*?)(?:\n\n|\Z)",
                        r"compétences\s*:\s*(.*?)(?:\n\n|\Z)"
                    ]
                    
                    for pattern in requirement_sections:
                        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
                        if matches:
                            # Split by newlines and clean up
                            req_text = matches[0]
                            req_lines = []
                            for line in req_text.split('\n'):
                                if line.strip():
                                    # Clean up newlines and excessive spaces
                                    clean_line = re.sub(r'\n\s+', ' ', line)
                                    clean_line = re.sub(r'\s+', ' ', clean_line)
                                    clean_line = clean_line.strip()
                                    req_lines.append(clean_line)
                            requirements.extend(req_lines)
                            break
                
                # Determine job type
                job_types = {
                    "full time": "FULL_TIME",
                    "full-time": "FULL_TIME",
                    "part time": "PART_TIME",
                    "part-time": "PART_TIME",
                    "contract": "CONTRACT",
                    "freelance": "FREELANCE",
                    "intern": "INTERNSHIP",
                    "internship": "INTERNSHIP",
                    "volunteer": "VOLUNTEER",
                    "temps plein": "FULL_TIME",
                    "temps partiel": "PART_TIME",
                    "contrat": "CONTRACT",
                    "stage": "INTERNSHIP",
                    "bénévolat": "VOLUNTEER"
                }
                
                job_type = "TO_BE_DETERMINED"
                text_lower = text.lower()
                for key, value in job_types.items():
                    if key in text_lower:
                        job_type = value
                        break
                
                # Create structured response
                extracted_data = {
                    "title": {"en": title, "fr": title},
                    "description": {"en": description, "fr": description},
                    "location": location,
                    "requirements": {"en": requirements, "fr": requirements},
                    "skills": skills,
                    "job_type": job_type,
                    "remote": "remote" in text_lower or "télétravail" in text_lower or "à distance" in text_lower,
                    "organization_id": organization_id,
                    "status": "DRAFT",
                    "is_mock": False
                }
                
                logger.info(f"Successfully extracted job data locally using spaCy for {file_name}")
                return extracted_data
            
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
                    if lang not in job_data[field] or not job_data[field][lang]:
                        errors.append(f"Missing {lang} translation for {field}")

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
                    if lang not in job_data["location"][loc_field] or not job_data["location"][loc_field][lang]:
                        errors.append(f"Missing {lang} translation for location.{loc_field}")

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
                # We'll convert it later, so no error here
                pass
            else:
                errors.append("Requirements must be a dictionary with language keys or a list")
        else:
            errors.append("Missing requirements")

        # Validate organization_id
        try:
            from uuid import UUID
            if "organization_id" not in job_data:
                errors.append("Missing organization_id")
            else:
                UUID(job_data["organization_id"])
        except ValueError:
            errors.append("Invalid organization_id format")

        return errors
    
    def normalize_job_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize job data to match required schema
        
        Args:
            job_data: Job data to normalize
            
        Returns:
            Normalized job data
            
        Raises:
            ValueError: If normalization fails
        """
        normalized_data = job_data.copy()
        logger.info(f"Normalizing job data: {json.dumps(job_data, indent=2)[:500]}...")
        
        # Detect if the content is primarily French
        is_french_document = False
        if "title" in job_data and isinstance(job_data["title"], dict) and "en" in job_data["title"]:
            title_text = job_data["title"]["en"]
            # Check for common French words
            french_indicators = ["poste", "emploi", "travail", "entreprise", "société", "fiche"]
            if any(indicator in title_text.lower() for indicator in french_indicators):
                logger.info("Detected French content in the document")
                is_french_document = True
        
        # Normalize title
        if "title" in normalized_data:
            if isinstance(normalized_data["title"], str):
                logger.debug(f"Converting title from string to dict: {normalized_data['title']}")
                normalized_data["title"] = {"en": normalized_data["title"], "fr": normalized_data["title"]}
            elif not isinstance(normalized_data["title"], dict):
                logger.warning(f"Invalid title format: {type(normalized_data['title'])}. Setting default title.")
                normalized_data["title"] = {"en": "Untitled Position", "fr": "Poste sans titre"}
            else:
                # Ensure both language fields are populated
                if "en" in normalized_data["title"] and not "fr" in normalized_data["title"]:
                    normalized_data["title"]["fr"] = normalized_data["title"]["en"]
                elif "fr" in normalized_data["title"] and not "en" in normalized_data["title"]:
                    normalized_data["title"]["en"] = normalized_data["title"]["fr"]
                
                # If this is a French document and French field is empty but English isn't
                if is_french_document and "fr" in normalized_data["title"] and "en" in normalized_data["title"]:
                    if not normalized_data["title"]["fr"] and normalized_data["title"]["en"]:
                        normalized_data["title"]["fr"] = normalized_data["title"]["en"]
        else:
            logger.warning("Title is missing. Setting default title.")
            normalized_data["title"] = {"en": "Untitled Position", "fr": "Poste sans titre"}
            
        # Normalize description
        if "description" in normalized_data:
            if isinstance(normalized_data["description"], str):
                logger.debug(f"Converting description from string to dict")
                normalized_data["description"] = {"en": normalized_data["description"], "fr": normalized_data["description"]}
            elif not isinstance(normalized_data["description"], dict):
                logger.warning(f"Invalid description format: {type(normalized_data['description'])}. Setting default description.")
                normalized_data["description"] = {"en": "No description provided", "fr": "Aucune description fournie"}
            else:
                # Ensure both language fields are populated
                if "en" in normalized_data["description"] and not "fr" in normalized_data["description"]:
                    normalized_data["description"]["fr"] = normalized_data["description"]["en"]
                elif "fr" in normalized_data["description"] and not "en" in normalized_data["description"]:
                    normalized_data["description"]["en"] = normalized_data["description"]["fr"]
                
                # If this is a French document and French field is empty but English isn't
                if is_french_document and "fr" in normalized_data["description"] and "en" in normalized_data["description"]:
                    if not normalized_data["description"]["fr"] and normalized_data["description"]["en"]:
                        normalized_data["description"]["fr"] = normalized_data["description"]["en"]
        else:
            logger.warning("Description is missing. Setting default description.")
            normalized_data["description"] = {"en": "No description provided", "fr": "Aucune description fournie"}
            
        # Normalize requirements
        if "requirements" in normalized_data:
            if isinstance(normalized_data["requirements"], list):
                logger.debug(f"Converting requirements from list to dict")
                normalized_data["requirements"] = {
                    "en": normalized_data["requirements"],
                    "fr": normalized_data["requirements"]
                }
            elif not isinstance(normalized_data["requirements"], dict):
                logger.warning(f"Invalid requirements format: {type(normalized_data['requirements'])}. Setting empty requirements.")
                normalized_data["requirements"] = {"en": [], "fr": []}
            else:
                # Ensure both language fields are populated
                if "en" in normalized_data["requirements"] and not "fr" in normalized_data["requirements"]:
                    normalized_data["requirements"]["fr"] = normalized_data["requirements"]["en"]
                elif "fr" in normalized_data["requirements"] and not "en" in normalized_data["requirements"]:
                    normalized_data["requirements"]["en"] = normalized_data["requirements"]["fr"]
        else:
            logger.debug("Requirements not provided. Setting empty requirements.")
            normalized_data["requirements"] = {"en": [], "fr": []}
            
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
                logger.warning(f"Location is not a dict: {type(location)}. Setting empty location.")
                normalized_location = {
                    "city": {"en": "", "fr": ""},
                    "state": {"en": "", "fr": ""},
                    "country": {"en": "", "fr": ""},
                    "postal_code": {"en": "", "fr": ""}
                }
            else:
                # Normalize city
                if "city" in location:
                    if isinstance(location["city"], str):
                        normalized_location["city"] = {"en": location["city"], "fr": location["city"]}
                    elif isinstance(location["city"], dict):
                        if not ("en" in location["city"] and "fr" in location["city"]):
                            city_value = next(iter(location["city"].values()), "")
                            normalized_location["city"] = {"en": city_value, "fr": city_value}
                        else:
                            normalized_location["city"] = location["city"]
                            # If this is a French document and French field is empty but English isn't
                            if is_french_document and not location["city"]["fr"] and location["city"]["en"]:
                                normalized_location["city"]["fr"] = location["city"]["en"]
                            # If English field is empty but French isn't
                            elif not location["city"]["en"] and location["city"]["fr"]:
                                normalized_location["city"]["en"] = location["city"]["fr"]
                    else:
                        logger.warning(f"Invalid city format: {type(location['city'])}. Setting empty city.")
                        normalized_location["city"] = {"en": "", "fr": ""}
                else:
                    normalized_location["city"] = {"en": "", "fr": ""}
                    
                # Normalize state
                if "state" in location:
                    if isinstance(location["state"], str):
                        normalized_location["state"] = {"en": location["state"], "fr": location["state"]}
                    elif isinstance(location["state"], dict):
                        if not ("en" in location["state"] and "fr" in location["state"]):
                            state_value = next(iter(location["state"].values()), "")
                            normalized_location["state"] = {"en": state_value, "fr": state_value}
                        else:
                            normalized_location["state"] = location["state"]
                            # If this is a French document and French field is empty but English isn't
                            if is_french_document and not location["state"]["fr"] and location["state"]["en"]:
                                normalized_location["state"]["fr"] = location["state"]["en"]
                            # If English field is empty but French isn't
                            elif not location["state"]["en"] and location["state"]["fr"]:
                                normalized_location["state"]["en"] = location["state"]["fr"]
                    else:
                        logger.warning(f"Invalid state format: {type(location['state'])}. Setting empty state.")
                        normalized_location["state"] = {"en": "", "fr": ""}
                else:
                    normalized_location["state"] = {"en": "", "fr": ""}
                    
                # Normalize country
                if "country" in location:
                    if isinstance(location["country"], str):
                        normalized_location["country"] = {"en": location["country"], "fr": location["country"]}
                    elif isinstance(location["country"], dict):
                        if not ("en" in location["country"] and "fr" in location["country"]):
                            country_value = next(iter(location["country"].values()), "")
                            normalized_location["country"] = {"en": country_value, "fr": country_value}
                        else:
                            normalized_location["country"] = location["country"]
                            # If this is a French document and French field is empty but English isn't
                            if is_french_document and not location["country"]["fr"] and location["country"]["en"]:
                                normalized_location["country"]["fr"] = location["country"]["en"]
                            # If English field is empty but French isn't
                            elif not location["country"]["en"] and location["country"]["fr"]:
                                normalized_location["country"]["en"] = location["country"]["fr"]
                    else:
                        logger.warning(f"Invalid country format: {type(location['country'])}. Setting empty country.")
                        normalized_location["country"] = {"en": "", "fr": ""}
                else:
                    normalized_location["country"] = {"en": "", "fr": ""}
                    
                # Normalize postal code
                if "postal_code" in location:
                    if isinstance(location["postal_code"], str):
                        normalized_location["postal_code"] = {"en": location["postal_code"], "fr": location["postal_code"]}
                    elif isinstance(location["postal_code"], dict):
                        if not ("en" in location["postal_code"] and "fr" in location["postal_code"]):
                            postal_value = next(iter(location["postal_code"].values()), "")
                            normalized_location["postal_code"] = {"en": postal_value, "fr": postal_value}
                        else:
                            normalized_location["postal_code"] = location["postal_code"]
                            # If this is a French document and French field is empty but English isn't
                            if is_french_document and not location["postal_code"]["fr"] and location["postal_code"]["en"]:
                                normalized_location["postal_code"]["fr"] = location["postal_code"]["en"]
                            # If English field is empty but French isn't
                            elif not location["postal_code"]["en"] and location["postal_code"]["fr"]:
                                normalized_location["postal_code"]["en"] = location["postal_code"]["fr"]
                    else:
                        logger.warning(f"Invalid postal_code format: {type(location['postal_code'])}. Setting empty postal_code.")
                        normalized_location["postal_code"] = {"en": "", "fr": ""}
                else:
                    normalized_location["postal_code"] = {"en": "", "fr": ""}

            normalized_data["location"] = normalized_location
        else:
            logger.debug("Location not provided. Setting empty location.")
            normalized_data["location"] = {
                "city": {"en": "", "fr": ""},
                "state": {"en": "", "fr": ""},
                "country": {"en": "", "fr": ""},
                "postal_code": {"en": "", "fr": ""}
            }

        # Ensure job_type is valid
        if "job_type" in normalized_data:
            job_type = str(normalized_data["job_type"]).upper()
            valid_types = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "VOLUNTEER", "TO_BE_DETERMINED"]
            if job_type not in valid_types:
                logger.warning(f"Invalid job_type: {job_type}. Setting TO_BE_DETERMINED.")
                normalized_data["job_type"] = "TO_BE_DETERMINED"
            else:
                normalized_data["job_type"] = job_type
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
        
        # Final check for empty translations in a French document
        if is_french_document:
            logger.info("Performing final check for empty translations in French document")
            # Check all bilingual fields to ensure French translations exist
            for field in ["title", "description"]:
                if field in normalized_data and isinstance(normalized_data[field], dict):
                    if "en" in normalized_data[field] and "fr" in normalized_data[field]:
                        if not normalized_data[field]["fr"] and normalized_data[field]["en"]:
                            logger.info(f"Copying English content to empty French field for {field}")
                            normalized_data[field]["fr"] = normalized_data[field]["en"]
            
            # Check location fields
            if "location" in normalized_data and isinstance(normalized_data["location"], dict):
                for loc_field in ["city", "state", "country", "postal_code"]:
                    if loc_field in normalized_data["location"] and isinstance(normalized_data["location"][loc_field], dict):
                        if "en" in normalized_data["location"][loc_field] and "fr" in normalized_data["location"][loc_field]:
                            if not normalized_data["location"][loc_field]["fr"] and normalized_data["location"][loc_field]["en"]:
                                logger.info(f"Copying English content to empty French field for location.{loc_field}")
                                normalized_data["location"][loc_field]["fr"] = normalized_data["location"][loc_field]["en"]
        
        logger.info(f"Normalized job data successfully. Title: {normalized_data['title'].get('en', 'N/A')}")
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
            Exception: If LLM processing fails
        """
        async with self.semaphore:
            logger.info(f"Extracting job data from: {file_name}")
            start_time = time.time()
            
            # Log text preview for debugging
            text_preview = text[:100] + "..." if len(text) > 100 else text
            logger.debug(f"Text preview: {text_preview}")
            
            if not text or len(text.strip()) < 50:
                logger.warning(f"Text is too short ({len(text)} chars) for reliable extraction. Using fallback data.")
                # Create fallback job data
                fallback_data = {
                    "title": {"en": f"Job from {file_name}", "fr": f"Emploi de {file_name}"},
                    "description": {"en": "No description could be extracted from the file.", 
                                   "fr": "Aucune description n'a pu être extraite du fichier."},
                    "requirements": {"en": [], "fr": []},
                    "skills": [],
                    "location": {
                        "city": {"en": "", "fr": ""},
                        "state": {"en": "", "fr": ""},
                        "country": {"en": "", "fr": ""},
                        "postal_code": {"en": "", "fr": ""}
                    },
                    "job_type": "TO_BE_DETERMINED",
                    "remote": False,
                    "organization_id": organization_id,
                    "is_mock": False,
                    "status": "DRAFT"
                }
                logger.info(f"Created fallback job data for {file_name}")
                return fallback_data
            
            try:
                # Call the LLM service to extract job data
                payload = {
                    "text": text,
                    "filename": file_name,
                    "organization_id": organization_id
                }
                
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
                    extracted_data = json.loads(response_text)
                    
                    # Add organization_id if not present
                    if "organization_id" not in extracted_data:
                        logger.info(f"Adding missing organization_id to extracted data")
                        extracted_data["organization_id"] = organization_id
                    
                except aiohttp.ClientError as ce:
                    logger.error(f"API connection error: {str(ce)}")
                    raise Exception(f"Failed to connect to API: {str(ce)}")
                except json.JSONDecodeError as jde:
                    logger.error(f"Failed to parse API response as JSON")
                    logger.error(f"JSON decode error: {str(jde)}")
                    raise Exception("Invalid response format from job data extraction")
                
                # Log processing time
                processing_time = time.time() - start_time
                logger.info(f"LLM processing completed in {processing_time:.2f}s for {file_name}")
                
                return extracted_data
            except Exception as e:
                logger.error(f"Error extracting job data: {str(e)}")
                
                # Create fallback job data for errors
                fallback_data = {
                    "title": {"en": f"Job from {file_name}", "fr": f"Emploi de {file_name}"},
                    "description": {"en": f"Error during extraction: {str(e)}", 
                                   "fr": f"Erreur lors de l'extraction: {str(e)}"},
                    "requirements": {"en": [], "fr": []},
                    "skills": [],
                    "location": {
                        "city": {"en": "", "fr": ""},
                        "state": {"en": "", "fr": ""},
                        "country": {"en": "", "fr": ""},
                        "postal_code": {"en": "", "fr": ""}
                    },
                    "job_type": "TO_BE_DETERMINED",
                    "remote": False,
                    "organization_id": organization_id,
                    "is_mock": False,
                    "status": "DRAFT"
                }
                logger.info(f"Created fallback job data for {file_name} due to error")
                return fallback_data
    
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