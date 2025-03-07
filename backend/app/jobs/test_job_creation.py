import pytest
import asyncio
import os
from uuid import uuid4
from app.jobs.services.bulk_creator import BulkJobCreator
from app.jobs.services.api_client import APIClient
from app.jobs.schemas.job_models import ProcessedJobData

@pytest.mark.asyncio
async def test_french_job_creation():
    """Test creating a job with French data"""
    # Initialize API client
    local_api_url = os.getenv("LOCAL_API_URL", "http://127.0.0.1:8080")
    api_client = APIClient(base_url=local_api_url)

    # Create a test organization first
    org_data = {
        "name": "Test Organization",
        "description": "A test organization for job creation",
        "language": "fr",
        "tier": "FREE",
        "industry": "TECHNOLOGY",
        "company_type": "CORPORATION",
        "founded_year": 2020,
        "size_range": "1-10",
        "website_url": "https://example.com",
        "primary_location": {
            "city": "Paris",
            "state": "",
            "country": "France",
            "postal_code": ""
        },
        "is_mock": True
    }

    # Create organization
    org_response = await api_client.post("/v1/organizations", json=org_data)
    if org_response.status != 200 and org_response.status != 201:
        org_error = await org_response.text()
        pytest.fail(f"Failed to create test organization: {org_error}")
    
    org_data = await org_response.json()
    org_id = org_data["id"]

    # Sample job data that matches what we're getting from extraction
    job_data = {
        "title": "Vendeur",
        "description": "Garantir une expérience client optimale...",
        "requirements": [
            "Bac ou équivalent en Commerce",
            "Minimum 2 ans dans un rôle similaire"
        ],
        "skills": [
            "Dynamisme et proactivité",
            "Sens du service client"
        ],
        "summary": "En tant que Vendeur chez SenMatériaux...",
        "location": {
            "city": "Bargny",
            "state": "",  # Empty string for non-North American countries
            "country": "Senegal",
            "postal_code": ""  # Empty string for non-North American countries
        },
        "job_type": "A_DETERMINER",
        "remote": False,
        "salary_min": None,
        "salary_max": None,
        "salary_currency": "",  # Empty string when no salary specified
        "organization_id": org_id,  # Use the created organization's ID
        "is_mock": True,
        "status": "PUBLISHED",
        "language": "fr"
    }
    
    # Create ProcessedJobData object
    processed_job = ProcessedJobData(
        original_file="test_job.pdf",
        extracted_data=job_data,
        processing_time=1.0,
        validation_errors=[]
    )
    
    # Initialize bulk creator
    bulk_creator = BulkJobCreator(api_client=api_client, local_api_url=local_api_url)
    
    try:
        # Attempt to create the job
        job_id = await bulk_creator.create_job(processed_job)
        assert job_id is not None, "Job creation failed - no job ID returned"
        print(f"Successfully created job with ID: {job_id}")
        
    except Exception as e:
        pytest.fail(f"Job creation failed with error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_french_job_creation()) 