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
        title = self.generate_localized_field('job_title')
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
        experience_key = random.choice(list(EXPERIENCE_LEVELS.keys()))
        education_key = random.choice(list(EDUCATION_LEVELS.keys()))
        status_key = random.choice(list(JOB_STATUSES.keys()))
        
        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "title": title,
            "description": description,
            "requirements": requirements,
            "skills": [
                {
                    'code': skill_key,
                    'localized': self.skills_cache[skill_key]
                }
                for skill_key in selected_skills
            ],
            "status": {
                'code': status_key,
                'localized': JOB_STATUSES[status_key]
            },
            "location": self.generate_location(),
            "job_type": {
                'code': job_type_key,
                'localized': JOB_TYPES[job_type_key]
            },
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "USD",
            "remote": {
                'code': remote_key,
                'localized': REMOTE_OPTIONS[remote_key]
            },
            "experience_level": {
                'code': experience_key,
                'localized': EXPERIENCE_LEVELS[experience_key]
            },
            "education_requirement": {
                'code': education_key,
                'localized': EDUCATION_LEVELS[education_key]
            },
            "application_deadline": datetime.now() + timedelta(days=random.randint(7, 60)),
            "rating": round(random.uniform(3.5, 5.0), 1),
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
                skills, status, location, job_type, salary_min,
                salary_max, salary_currency, remote, experience_level,
                education_requirement, application_deadline, rating,
                is_mock, mock_batch_id, created_at, updated_at
            ) VALUES %s
        """
        
        values = [
            (
                item['id'], item['organization_id'], item['title'],
                item['description'], item['requirements'], item['skills'],
                item['status'], item['location'], item['job_type'],
                item['salary_min'], item['salary_max'], item['salary_currency'],
                item['remote'], item['experience_level'], item['education_requirement'],
                item['application_deadline'], item['rating'], item['is_mock'],
                item['mock_batch_id'], item['created_at'], item['updated_at']
            )
            for item in items
        ]
        
        self.db.execute_batch(query, values)
