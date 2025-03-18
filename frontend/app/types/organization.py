from pydantic import BaseModel
from typing import List, Optional, Literal, Dict
from datetime import datetime

class LocalizedText(BaseModel):
    en: str
    fr: Optional[str] = None

class LocalizedLocation(BaseModel):
    city: LocalizedText
    state: LocalizedText
    country: LocalizedText
    postal_code: LocalizedText

class Organization(BaseModel):
    id: str
    name: LocalizedText
    tier: Literal["FREE", "PREMIUM", "ENTERPRISE"]
    is_mock: bool
    industry: str
    logo_url: str
    languages: List[str]
    created_at: datetime
    size_range: str
    updated_at: datetime
    description: LocalizedText
    website_url: str
    company_type: Literal["CORPORATION", "STARTUP", "NONPROFIT", "GOVERNMENT", "OTHER"]
    founded_year: int
    mock_batch_id: Optional[str] = None
    cover_image_url: str
    primary_location: LocalizedLocation
    verification_status: Literal["PENDING", "VERIFIED", "REJECTED"]
    additional_locations: List[LocalizedLocation] = []

class OrganizationsResponse(BaseModel):
    organizations: Dict[str, Organization] 