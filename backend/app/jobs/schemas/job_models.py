from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class JobLocation(BaseModel):
    """Model for job location data"""
    city: Dict[str, str] = Field(..., description="City name in multiple languages")
    country: Dict[str, str] = Field(..., description="Country name in multiple languages")
    state: Dict[str, str] = Field(default_factory=dict, description="State/province in multiple languages")
    postal_code: Dict[str, str] = Field(default_factory=dict, description="Postal code in multiple languages")

class JobRequirements(BaseModel):
    """Model for job requirements in different languages"""
    en: List[str] = Field(default_factory=list, description="Requirements in English")
    fr: List[str] = Field(default_factory=list, description="Requirements in French")

class BaseJobData(BaseModel):
    """Base model for job data"""
    
    title: Dict[str, str] = Field(..., description="Job title in different languages")
    description: Dict[str, str] = Field(..., description="Job description in different languages")
    location: Dict[str, Dict[str, str]] = Field(..., description="Job location")
    job_type: str = Field(..., description="Job type")
    organization_id: str = Field(..., description="Organization ID")
    requirements: Dict[str, List[str]] = Field(..., description="Job requirements in different languages")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    remote: bool = Field(False, description="Whether the job is remote")
    is_mock: bool = Field(False, description="Whether the job is mock data")
    status: str = Field("DRAFT", description="Job status")
    
    class Config:
        schema_extra = {
            "example": {
                "title": {"en": "Software Engineer", "fr": "Ingénieur Logiciel"},
                "description": {"en": "Job description in English", "fr": "Description du poste en français"},
                "location": {
                    "city": {"en": "New York", "fr": "New York"},
                    "country": {"en": "United States", "fr": "États-Unis"},
                    "state": {"en": "NY", "fr": "NY"},
                    "postal_code": {"en": "10001", "fr": "10001"}
                },
                "job_type": "FULL_TIME",
                "organization_id": "00000000-0000-0000-0000-000000000000",
                "requirements": {
                    "en": ["Bachelor's degree", "3+ years experience"],
                    "fr": ["Diplôme de bachelor", "3+ ans d'expérience"]
                },
                "skills": ["Python", "FastAPI", "React"],
                "remote": True,
                "is_mock": False,
                "status": "DRAFT"
            }
        }

class ProcessedJobData(BaseModel):
    """Model for processed job data"""
    
    original_file: str = Field(..., description="Original file path")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted job data")
    processing_time: float = Field(..., description="Processing time in seconds")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors if any") 