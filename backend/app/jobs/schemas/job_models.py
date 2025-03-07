from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class JobLocation(BaseModel):
    """Model for job location data"""
    city: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")
    state: str = Field("", description="State/province")
    postal_code: str = Field("", description="Postal code")

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
        json_schema_extra = {
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
                "requirements": ["3+ years of experience", "Bachelor's degree"],
                "skills": ["PYTHON", "JAVASCRIPT", "REACT"],
                "remote": True,
                "is_mock": False,
                "status": "DRAFT",
                "language": "en",
                "summary": "We are looking for a software engineer to join our team."
            }
        }

class ProcessedJobData(BaseModel):
    """Model for processed job data"""
    original_file: str = Field(..., description="Original file name")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted job data")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors")
    processing_time: float = Field(0.0, description="Processing time in seconds") 