from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class JobLocation(BaseModel):
    """Model for job location data"""
    city: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")
    state: str = Field("", description="State/province")
    postal_code: str = Field("", description="Postal code")

class JobRequirements(BaseModel):
    """Model for job requirements in different languages (for backward compatibility)"""
    en: List[str] = Field(default_factory=list, description="Requirements in English")
    fr: List[str] = Field(default_factory=list, description="Requirements in French")

class LocalizedText(BaseModel):
    """Model for multilingual text (for backward compatibility)"""
    en: str = Field("", description="English text")
    fr: str = Field("", description="French text")

class BaseJobData(BaseModel):
    """Base model for job data"""
    
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Job description")
    location: Dict[str, str] = Field(..., description="Job location")
    job_type: str = Field(..., description="Job type")
    organization_id: str = Field(..., description="Organization ID")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    remote: bool = Field(False, description="Whether the job is remote")
    is_mock: bool = Field(False, description="Whether the job is mock data")
    status: str = Field("DRAFT", description="Job status")
    language: str = Field("en", description="Language of the job posting")
    summary: Optional[str] = Field(None, description="Descriptive summary for the candidate to read")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Software Engineer",
                "description": "Job description",
                "location": {
                    "city": "New York",
                    "country": "United States",
                    "state": "NY",
                    "postal_code": "10001"
                },
                "job_type": "FULL_TIME",
                "organization_id": "00000000-0000-0000-0000-000000000000",
                "requirements": ["Bachelor's degree", "3+ years experience"],
                "skills": ["Python", "FastAPI", "React"],
                "remote": True,
                "is_mock": False,
                "status": "DRAFT",
                "language": "en",
                "summary": "We are looking for a Software Engineer to join our team."
            }
        }

class ProcessedJobData(BaseModel):
    """Model for processed job data"""
    
    original_file: str = Field(..., description="Original file path")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted job data")
    processing_time: float = Field(..., description="Processing time in seconds")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors if any") 