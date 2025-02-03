# generators/job_generator.py (modified version)"""
"""
Job generator module for creating mock job listings. Generates realistic job postings with detailed
requirements, skills, and compensation data. Ensures jobs are properly linked to organizations and
maintains consistent formatting across languages.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random
from .base import BaseGenerator
from config.settings import (
    JOB_TYPES,
    REMOTE_OPTIONS,
    EXPERIENCE_LEVELS,
    EDUCATION_LEVELS,
    JOB_STATUSES
)
class JobGenerator(BaseGenerator):
    def generate_job(self, organization_id: str) -> Dict:
        """Generate a single job posting with proper localization"""
        # Generate base job data
        title = self.generate_localized_field('job')
        description = self.generate_localized_paragraph(5)
        
        # Generate salary range
        salary_min = random.randint(40000, 80000)
        salary_max = salary_min + random.randint(20000, 60000)
        
        # Select random skills with translations
        selected_skills = self.get_random_items(
            list(self.skills_cache.values()),
            min_items=3,
            max_items=8
        )
        
        # Generate requirements with proper localization
        requirements = {
            'en': [],
            'fr': []
        }
        
        for skill in selected_skills[:3]:
            years = random.randint(2, 8)
            requirements['en'].append(
                f"Minimum {years} years of experience in {skill['en']}"
            )
            requirements['fr'].append(
                f"Minimum {years} ans d'expérience en {skill['fr']}"
            )
        
        job_type = random.choice(JOB_TYPES)
        remote_option = random.choice(REMOTE_OPTIONS)
        experience_level = random.choice(EXPERIENCE_LEVELS)
        
        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "title": title,
            "description": description,
            "requirements": requirements,
            "skills": [skill['en'] for skill in selected_skills],  # Store primary in English
            "skills_localized": {  # Store all translations
                'en': [skill['en'] for skill in selected_skills],
                'fr': [skill['fr'] for skill in selected_skills]
            },
            "status": random.choice(JOB_STATUSES),
            "location": self.generate_location(),
            "job_type": {
                'code': job_type,
                'localized': self.get_localized_term(job_type.lower())
            },
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "USD",
            "remote": {
                'code': remote_option,
                'localized': self.get_localized_term(remote_option.lower())
            },
            "experience_level": {
                'code': experience_level,
                'localized': self.get_localized_term(experience_level.lower())
            },
            "education_requirement": random.choice(EDUCATION_LEVELS),
            "application_deadline": datetime.now() + timedelta(days=random.randint(7, 60)),
            "created_at": self.generate_date_in_range(),
            "updated_at": datetime.now()
        }
