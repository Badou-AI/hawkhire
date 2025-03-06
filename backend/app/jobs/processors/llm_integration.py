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
            
            # Clean up the text by removing excessive newlines and spaces
            cleaned_text = text
            if not has_extraction_error:
                # Replace "\n " pattern (newline followed by space) with just space
                cleaned_text = re.sub(r'\n\s+', ' ', text)
                # Normalize multiple spaces to single space
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
                # Normalize remaining newlines (replace multiple with double newlines)
                cleaned_text = re.sub(r'\n{2,}', '\n\n', cleaned_text)
                # Remove any leading/trailing whitespace
                cleaned_text = cleaned_text.strip()
            
            # Generate markdown directly from the cleaned text instead of creating a temporary file
            markdown_text = self._format_text_as_markdown(cleaned_text) if not has_extraction_error else cleaned_text
            
            # Prepare payload for local API
            payload = {
                "text": cleaned_text,
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
                            
                            # Clean up the description - updated for single language model
                            if "description" in extracted_data:
                                if isinstance(extracted_data["description"], dict):
                                    # Handle legacy format (convert to single language)
                                    lang = extracted_data.get("language", "en")
                                    if lang in extracted_data["description"]:
                                        extracted_data["description"] = extracted_data["description"][lang]
                                    else:
                                        # Fallback to English or first available language
                                        if "en" in extracted_data["description"]:
                                            extracted_data["description"] = extracted_data["description"]["en"]
                                        else:
                                            # Get the first value from the dict
                                            first_lang = next(iter(extracted_data["description"]))
                                            extracted_data["description"] = extracted_data["description"][first_lang]
                                
                                # Ensure description is properly formatted
                                if isinstance(extracted_data["description"], str):
                                    extracted_data["description"] = self._format_text_as_markdown(extracted_data["description"])
                            
                            # Handle requirements - updated for single language model
                            if "requirements" in extracted_data:
                                if isinstance(extracted_data["requirements"], dict):
                                    # Handle legacy format (convert to single language)
                                    lang = extracted_data.get("language", "en")
                                    if lang in extracted_data["requirements"]:
                                        extracted_data["requirements"] = extracted_data["requirements"][lang]
                                    elif "en" in extracted_data["requirements"]:
                                        extracted_data["requirements"] = extracted_data["requirements"]["en"]
                                    else:
                                        # Get the first value from the dict
                                        first_lang = next(iter(extracted_data["requirements"]))
                                        extracted_data["requirements"] = extracted_data["requirements"][first_lang]
                            
                            # Ensure language is set
                            if "language" not in extracted_data:
                                extracted_data["language"] = "en"
                            
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
                                "is_mock": False,
                                "summary": description[:500] + ("..." if len(description) > 500 else "")
                            }
                            
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
                doc = nlp(cleaned_text)
                
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
                    "is_mock": False,
                    "summary": description[:500] + ("..." if len(description) > 500 else "")
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
    
    def _format_text_as_markdown(self, text: str) -> str:
        """Format extracted text as Markdown
        
        Args:
            text: Raw extracted text
            
        Returns:
            Markdown formatted text
        """
        logger.info("Formatting text as Markdown")
        
        try:
            # Check if text is empty or contains error messages
            if not text or len(text.strip()) < 10 or any(error in text for error in [
                '[Error extracting text from PDF',
                'EOF marker not found',
                '[PDF file not found:',
                '[No readable text content found in'
            ]):
                logger.warning(f"Text is too short or contains errors: {text[:100]}")
                return text
            
            # Clean up the text first - normalize spaces and newlines while preserving formatting
            # Replace multiple consecutive spaces (more than 2) with 2 spaces
            text = re.sub(r' {3,}', '  ', text)
            
            # Replace multiple consecutive newlines (more than 2) with 2 newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
            
            # Identify potential headers (all caps lines or lines ending with colon)
            lines = text.split('\n')
            markdown_lines = []
            
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    markdown_lines.append('')
                    continue
                
                # Check if this line looks like a header
                if (line.isupper() and len(line) > 3 and len(line) < 100) or \
                   (line.endswith(':') and len(line) < 100):
                    # Make it a markdown header
                    if i > 0 and markdown_lines and markdown_lines[-1]:  # Add extra line before header if needed
                        markdown_lines.append('')
                    markdown_lines.append(f"## {line}")
                    if i < len(lines) - 1 and lines[i+1].strip():  # Add extra line after header if needed
                        markdown_lines.append('')
                # Check if this line looks like a subheader (title case, not too long)
                elif line.istitle() and len(line) > 3 and len(line) < 80 and not line.endswith('.'):
                    if i > 0 and markdown_lines and markdown_lines[-1]:  # Add extra line before subheader if needed
                        markdown_lines.append('')
                    markdown_lines.append(f"### {line}")
                    if i < len(lines) - 1 and lines[i+1].strip():  # Add extra line after subheader if needed
                        markdown_lines.append('')
                # Check if this line looks like a list item
                elif line.startswith(('•', '-', '*', '○', '·', '>', '»')) or \
                     re.match(r'^\d+[\.\)]\s', line):
                    # Ensure it's formatted as a markdown list item
                    if not line.startswith(('- ', '* ', '1. ')):
                        if line.startswith(('•', '○', '·')):
                            line = '- ' + line[1:].strip()
                        elif line.startswith(('>', '»')):
                            line = '- ' + line[1:].strip()
                        elif re.match(r'^\d+[\.\)]\s', line):
                            # Already a numbered list, just ensure proper spacing
                            num_match = re.match(r'^\d+[\.\)]', line)
                            if num_match:
                                num_part = num_match.group(0)
                                line = num_part + ' ' + line[len(num_part):].strip()
                    markdown_lines.append(line)
                else:
                    # Regular paragraph text
                    markdown_lines.append(line)
            
            # Join the lines back together
            markdown_text = '\n'.join(markdown_lines)
            
            # Add some basic markdown formatting
            # Bold text that appears to be important (all caps within sentences)
            markdown_text = re.sub(r'([^A-Z]|^)([A-Z]{2,}[A-Z\s]{0,10})([^A-Z]|$)', 
                                  r'\1**\2**\3', markdown_text)
            
            # Ensure proper spacing for lists
            markdown_text = re.sub(r'\n(- .*)\n(- )', r'\n\1\n\2', markdown_text)
            
            logger.info("Successfully formatted text as Markdown")
            return markdown_text
            
        except Exception as e:
            logger.error(f"Error formatting text as Markdown: {str(e)}", exc_info=True)
            # Return the original text if formatting fails
            return text
    
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
        
        # Validate language field
        if "language" not in job_data:
            errors.append("Missing language field")
        elif not isinstance(job_data["language"], str):
            errors.append(f"Language must be a string, got {type(job_data['language'])}")
        
        # Validate title and description are strings (or handle legacy format)
        for field in ["title", "description"]:
            if field in job_data:
                # Handle legacy format (dict with language keys)
                if isinstance(job_data[field], dict):
                    # Check if the dict has the language key
                    lang = job_data.get("language", "en")
                    if lang not in job_data[field]:
                        errors.append(f"Missing {lang} translation for {field}")
                elif not isinstance(job_data[field], str):
                    errors.append(f"{field} must be a string, got {type(job_data[field])}")

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
                    elif not isinstance(job_data["location"][loc_field], str):
                        errors.append(f"location.{loc_field} must be a string, got {type(job_data['location'][loc_field])}")

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
                # Convert from multilingual to single language
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
                # Convert from multilingual to single language
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
                # Convert from multilingual to single language
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
                logger.warning(f"Location is not a dict: {type(location)}. Setting empty location.")
                normalized_location = {
                    "city": "",
                    "state": "",
                    "country": "",
                    "postal_code": ""
                }
            else:
                # Handle multilingual location format
                if "city" in location and isinstance(location["city"], dict):
                    # Convert from multilingual to single language
                    if language in location["city"]:
                        location["city"] = location["city"][language]
                    elif "en" in location["city"]:
                        location["city"] = location["city"]["en"]
                    else:
                        # Get first available language
                        first_lang = next(iter(location["city"]))
                        location["city"] = location["city"][first_lang]
                
                if "state" in location and isinstance(location["state"], dict):
                    # Convert from multilingual to single language
                    if language in location["state"]:
                        location["state"] = location["state"][language]
                    elif "en" in location["state"]:
                        location["state"] = location["state"]["en"]
                    else:
                        # Get first available language
                        first_lang = next(iter(location["state"]))
                        location["state"] = location["state"][first_lang]
                
                if "country" in location and isinstance(location["country"], dict):
                    # Convert from multilingual to single language
                    if language in location["country"]:
                        location["country"] = location["country"][language]
                    elif "en" in location["country"]:
                        location["country"] = location["country"]["en"]
                    else:
                        # Get first available language
                        first_lang = next(iter(location["country"]))
                        location["country"] = location["country"][first_lang]
                
                if "postal_code" in location and isinstance(location["postal_code"], dict):
                    # Convert from multilingual to single language
                    if language in location["postal_code"]:
                        location["postal_code"] = location["postal_code"][language]
                    elif "en" in location["postal_code"]:
                        location["postal_code"] = location["postal_code"]["en"]
                    else:
                        # Get first available language
                        first_lang = next(iter(location["postal_code"]))
                        location["postal_code"] = location["postal_code"][first_lang]
                
                # Normalize city
                normalized_location["city"] = location.get("city", "")
                if not isinstance(normalized_location["city"], str):
                    normalized_location["city"] = ""
                
                # Normalize state
                normalized_location["state"] = location.get("state", "")
                if not isinstance(normalized_location["state"], str):
                    normalized_location["state"] = ""
                
                # Normalize country
                normalized_location["country"] = location.get("country", "")
                if not isinstance(normalized_location["country"], str):
                    normalized_location["country"] = ""
                
                # Normalize postal_code
                normalized_location["postal_code"] = location.get("postal_code", "")
                if not isinstance(normalized_location["postal_code"], str):
                    normalized_location["postal_code"] = ""
            
            normalized_data["location"] = normalized_location
        else:
            logger.debug("Location not provided. Setting empty location.")
            normalized_data["location"] = {
                "city": "",
                "state": "",
                "country": "",
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