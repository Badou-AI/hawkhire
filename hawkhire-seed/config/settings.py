# config/settings.py
"""
Central configuration module for the HawkHire mock data generator. Manages environment variables,
database connections, and defines constants for generating realistic job market data. All mock data
parameters and valid field values are defined here to ensure consistency across the generation process.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

# Mock Data Configuration
MOCK_BATCH_SIZE = int(os.getenv('MOCK_BATCH_SIZE', 50))
NUM_ORGANIZATIONS = int(os.getenv('NUM_ORGANIZATIONS', 100))
NUM_JOBS_PER_ORGANIZATION = eval(os.getenv('NUM_JOBS_PER_ORGANIZATION', '(1,5)'))
NUM_USERS = int(os.getenv('NUM_USERS', 200))
DEFAULT_MOCK_PASSWORD = os.getenv('DEFAULT_MOCK_PASSWORD', 'TestPass123!')

# Sample Data Constants
INDUSTRIES = [
    'Technology', 'Healthcare', 'Finance', 'Education',
    'Manufacturing', 'Retail', 'Construction', 'Media'
]

COMPANY_TYPES = [
    'Public', 'Private', 'Startup', 'Non-profit',
    'Government', 'Educational'
]

COMPANY_SIZES = [
    '1-10', '11-50', '51-200', '201-500',
    '501-1000', '1001-5000', '5000+'
]

JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']
REMOTE_OPTIONS = ['REMOTE', 'HYBRID', 'ONSITE']
EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']
EDUCATION_LEVELS = ['HIGH_SCHOOL', 'BACHELOR', 'MASTER', 'PHD']

LANGUAGES = ['en', 'fr']

ORGANIZATION_ROLES = [
    'OWNER',
    'ADMIN',
    'RECRUITER',
    'HIRING_MANAGER'
]

VERIFICATION_STATUSES = [
    'PENDING',
    'VERIFIED',
    'REJECTED'
]

JOB_STATUSES = [
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'CLOSED'
]

# File Storage
RESUME_STORAGE_BUCKET = 'resumes'
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

# Sample resume directory
SAMPLE_RESUMES_DIR = BASE_DIR / 'data' / 'sample_resumes'
