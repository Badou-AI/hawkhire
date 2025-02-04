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
MOCK_BATCH_SIZE = int(os.getenv('MOCK_BATCH_SIZE', 10))
NUM_ORGANIZATIONS = int(os.getenv('NUM_ORGANIZATIONS', 4))
NUM_JOBS_PER_ORGANIZATION = eval(os.getenv('NUM_JOBS_PER_ORGANIZATION', '(2,4)'))
NUM_USERS = int(os.getenv('NUM_USERS', 8))
DEFAULT_MOCK_PASSWORD = os.getenv('DEFAULT_MOCK_PASSWORD', 'TestPass123!')

# Localized Constants
INDUSTRIES = {
    'TECHNOLOGY': {'en': 'Technology', 'fr': 'Technologie'},
    'HEALTHCARE': {'en': 'Healthcare', 'fr': 'Santé'},
    'FINANCE': {'en': 'Finance', 'fr': 'Finance'},
    'EDUCATION': {'en': 'Education', 'fr': 'Éducation'},
    'MANUFACTURING': {'en': 'Manufacturing', 'fr': 'Fabrication'},
    'RETAIL': {'en': 'Retail', 'fr': 'Commerce de détail'},
    'CONSTRUCTION': {'en': 'Construction', 'fr': 'Construction'},
    'MEDIA': {'en': 'Media', 'fr': 'Médias'}
}

COMPANY_TYPES = {
    'PUBLIC': {'en': 'Public Company', 'fr': 'Société Publique'},
    'PRIVATE': {'en': 'Private Company', 'fr': 'Société Privée'},
    'STARTUP': {'en': 'Startup', 'fr': 'Startup'},
    'NON_PROFIT': {'en': 'Non-profit', 'fr': 'Organisation à but non lucratif'},
    'GOVERNMENT': {'en': 'Government', 'fr': 'Gouvernement'},
    'EDUCATIONAL': {'en': 'Educational Institution', 'fr': 'Institution Éducative'}
}

COMPANY_SIZES = {
    'TINY': {'en': '1-10', 'fr': '1-10'},
    'SMALL': {'en': '11-50', 'fr': '11-50'},
    'MEDIUM': {'en': '51-200', 'fr': '51-200'},
    'LARGE': {'en': '201-500', 'fr': '201-500'},
    'XLARGE': {'en': '501-1000', 'fr': '501-1000'},
    'HUGE': {'en': '1001-5000', 'fr': '1001-5000'},
    'MASSIVE': {'en': '5000+', 'fr': '5000+'}
}

JOB_TYPES = {
    'FULL_TIME': {'en': 'Full Time', 'fr': 'Temps Plein'},
    'PART_TIME': {'en': 'Part Time', 'fr': 'Temps Partiel'},
    'CONTRACT': {'en': 'Contract', 'fr': 'Contrat'},
    'FREELANCE': {'en': 'Freelance', 'fr': 'Freelance'}
}

REMOTE_OPTIONS = {
    'REMOTE': {'en': 'Remote', 'fr': 'Télétravail'},
    'HYBRID': {'en': 'Hybrid', 'fr': 'Hybride'},
    'ONSITE': {'en': 'On-site', 'fr': 'Sur Site'}
}

EXPERIENCE_LEVELS = {
    'ENTRY': {'en': 'Entry Level', 'fr': 'Débutant'},
    'MID': {'en': 'Mid Level', 'fr': 'Intermédiaire'},
    'SENIOR': {'en': 'Senior Level', 'fr': 'Sénior'},
    'LEAD': {'en': 'Lead', 'fr': 'Chef d\'équipe'},
    'EXECUTIVE': {'en': 'Executive', 'fr': 'Cadre'}
}

EDUCATION_LEVELS = {
    'HIGH_SCHOOL': {'en': 'High School', 'fr': 'Lycée'},
    'BACHELOR': {'en': 'Bachelor\'s Degree', 'fr': 'Licence'},
    'MASTER': {'en': 'Master\'s Degree', 'fr': 'Master'},
    'PHD': {'en': 'PhD', 'fr': 'Doctorat'}
}

LANGUAGES = ['en', 'fr']

ORGANIZATION_ROLES = {
    'OWNER': {'en': 'Owner', 'fr': 'Propriétaire'},
    'ADMIN': {'en': 'Administrator', 'fr': 'Administrateur'},
    'RECRUITER': {'en': 'Recruiter', 'fr': 'Recruteur'},
    'HIRING_MANAGER': {'en': 'Hiring Manager', 'fr': 'Responsable du Recrutement'}
}

VERIFICATION_STATUSES = {
    'PENDING': {'en': 'Pending', 'fr': 'En attente'},
    'VERIFIED': {'en': 'Verified', 'fr': 'Vérifié'},
    'REJECTED': {'en': 'Rejected', 'fr': 'Rejeté'}
}

JOB_STATUSES = {
    'DRAFT': {'en': 'Draft', 'fr': 'Brouillon'},
    'ACTIVE': {'en': 'Active', 'fr': 'Actif'},
    'PAUSED': {'en': 'Paused', 'fr': 'En pause'},
    'CLOSED': {'en': 'Closed', 'fr': 'Fermé'}
}

# File Storage
RESUME_STORAGE_BUCKET = 'resumes'
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

# Sample resume directory
SAMPLE_RESUMES_DIR = BASE_DIR / 'data' / 'sample_resumes'
