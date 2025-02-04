"""
Job generator module for creating mock job listings. Generates realistic job postings with detailed
requirements, skills, and compensation data. Ensures jobs are properly linked to organizations and
maintains consistent localization across languages.
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
    JOB_STATUSES,
    LANGUAGES
)

class JobGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.skills_cache = self._generate_skills_cache()
        self.job_titles = {
            'SOFTWARE_ENGINEER': {'en': 'Software Engineer', 'fr': 'Ingénieur Logiciel'},
            'FRONTEND_DEVELOPER': {'en': 'Frontend Developer', 'fr': 'Développeur Frontend'},
            'BACKEND_DEVELOPER': {'en': 'Backend Developer', 'fr': 'Développeur Backend'},
            'FULLSTACK_DEVELOPER': {'en': 'Full Stack Developer', 'fr': 'Développeur Full Stack'},
            'DATA_SCIENTIST': {'en': 'Data Scientist', 'fr': 'Data Scientist'},
            'DEVOPS_ENGINEER': {'en': 'DevOps Engineer', 'fr': 'Ingénieur DevOps'},
            'PRODUCT_MANAGER': {'en': 'Product Manager', 'fr': 'Chef de Produit'},
            'PROJECT_MANAGER': {'en': 'Project Manager', 'fr': 'Chef de Projet'},
            'UX_DESIGNER': {'en': 'UX Designer', 'fr': 'Designer UX'},
            'UI_DESIGNER': {'en': 'UI Designer', 'fr': 'Designer UI'},
            'QA_ENGINEER': {'en': 'QA Engineer', 'fr': 'Ingénieur QA'},
            'SYSTEM_ARCHITECT': {'en': 'System Architect', 'fr': 'Architecte Système'},
            'CLOUD_ENGINEER': {'en': 'Cloud Engineer', 'fr': 'Ingénieur Cloud'},
            'MOBILE_DEVELOPER': {'en': 'Mobile Developer', 'fr': 'Développeur Mobile'},
            'DATA_ENGINEER': {'en': 'Data Engineer', 'fr': 'Ingénieur Data'}
        }

    def _generate_skills_cache(self) -> Dict[str, Dict[str, str]]:
        """Generate a cache of skills with translations"""
        technical_skills = [
            ('PYTHON', {'en': 'Python', 'fr': 'Python'}),
            ('JAVASCRIPT', {'en': 'JavaScript', 'fr': 'JavaScript'}),
            ('REACT', {'en': 'React', 'fr': 'React'}),
            ('NODEJS', {'en': 'Node.js', 'fr': 'Node.js'}),
            ('AWS', {'en': 'AWS', 'fr': 'AWS'}),
            ('DOCKER', {'en': 'Docker', 'fr': 'Docker'}),
            ('KUBERNETES', {'en': 'Kubernetes', 'fr': 'Kubernetes'}),
            ('SQL', {'en': 'SQL', 'fr': 'SQL'})
        ]
        
        soft_skills = [
            ('PROJECT_MANAGEMENT', {'en': 'Project Management', 'fr': 'Gestion de projet'}),
            ('TEAM_LEADERSHIP', {'en': 'Team Leadership', 'fr': 'Leadership d\'équipe'}),
            ('COMMUNICATION', {'en': 'Communication', 'fr': 'Communication'}),
            ('PROBLEM_SOLVING', {'en': 'Problem Solving', 'fr': 'Résolution de problèmes'}),
            ('AGILE', {'en': 'Agile Methodology', 'fr': 'Méthodologie Agile'})
        ]
        
        return dict(technical_skills + soft_skills)

    def generate_job(self, organization_id: str) -> Dict:
        """Generate a single job posting with proper localization"""
        # Generate base job title and description
        title_key = random.choice(list(self.job_titles.keys()))
        title = self.job_titles[title_key]
        description = self.generate_localized_paragraph(5)
        
        # Generate salary range
        salary_min = random.randint(40000, 80000)
        salary_max = salary_min + random.randint(20000, 60000)
        
        # Select random skills with translations
        selected_skills = self.get_random_items(
            list(self.skills_cache.keys()),
            min_items=3,
            max_items=8
        )
        
        # Generate requirements with proper localization
        requirements = {
            'en': [],
            'fr': []
        }
        
        for skill_key in selected_skills[:3]:
            years = random.randint(2, 8)
            skill = self.skills_cache[skill_key]
            requirements['en'].append(
                f"Minimum {years} years of experience in {skill['en']}"
            )
            requirements['fr'].append(
                f"Minimum {years} ans d'expérience en {skill['fr']}"
            )

        # Select type and status keys
        job_type_key = random.choice(list(JOB_TYPES.keys()))
        remote_key = random.choice(list(REMOTE_OPTIONS.keys()))
        status_key = random.choice(list(JOB_STATUSES.keys()))
        
        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "title": title,
            "description": description,
            "requirements": requirements,
            "location": self.generate_location(),
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "USD",
            "job_type": job_type_key,
            "remote": remote_key == 'REMOTE',
            "skills": selected_skills,
            "status": status_key,
            "rating": round(random.uniform(3.5, 5.0), 1),
            "is_mock": True,
            "mock_batch_id": self.mock_batch_id,
            "created_at": self.generate_date_in_range(),
            "updated_at": datetime.now()
        }

    def generate_jobs_for_organization(
        self,
        organization_id: str,
        min_jobs: int = 1,
        max_jobs: int = 5
    ) -> List[Dict]:
        """Generate multiple jobs for an organization"""
        num_jobs = random.randint(min_jobs, max_jobs)
        jobs = []
        
        for _ in range(num_jobs):
            job = self.generate_job(organization_id)
            job['is_mock'] = True
            job['mock_batch_id'] = self.mock_batch_id
            jobs.append(job)
            
            if len(jobs) >= 100:  # Batch size of 100
                self.save_batch(jobs)
                jobs = []
        
        if jobs:  # Save any remaining jobs
            self.save_batch(jobs)
            
        return jobs

    def save_batch(self, items: List[Dict]):
        """Save a batch of jobs to the database"""
        query = """
            INSERT INTO jobs (
                id, organization_id, title, description, requirements,
                location, salary_min, salary_max, salary_currency,
                job_type, remote, skills, status, rating,
                is_mock, mock_batch_id, created_at, updated_at
            ) VALUES %s
        """
        
        import json
        
        values = [
            (
                item['id'], 
                item['organization_id'], 
                json.dumps(item['title']),  # JSONB
                json.dumps(item['description']),  # JSONB
                json.dumps(item['requirements']),  # JSONB
                json.dumps(item['location']),  # JSONB
                item['salary_min'],
                item['salary_max'],
                item['salary_currency'],
                item['job_type'],
                item['remote'],
                item['skills'],
                item['status'],
                item['rating'],
                item['is_mock'],
                item['mock_batch_id'],
                item['created_at'],
                item['updated_at']
            )
            for item in items
        ]
        
        self.db.execute_batch(query, values)
