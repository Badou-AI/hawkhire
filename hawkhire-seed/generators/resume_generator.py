"""
Resume generator module for creating mock resume files and records. Handles both the physical PDF
generation/storage and database records, with support for multiple languages and different resume
formats. Includes parsing simulation for extracted content.
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
from pathlib import Path
import json
from uuid import uuid4
from .base import BaseGenerator
from config.settings import (
    SAMPLE_RESUMES_DIR,
    ALLOWED_MIME_TYPES,
    EDUCATION_LEVELS,
    EXPERIENCE_LEVELS,
    LANGUAGES
)

class ResumeGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.resume_status_translations = {
            'PENDING': {'en': 'Pending', 'fr': 'En attente'},
            'PROCESSED': {'en': 'Processed', 'fr': 'Traité'},
            'FAILED': {'en': 'Failed', 'fr': 'Échec'},
            'ARCHIVED': {'en': 'Archived', 'fr': 'Archivé'}
        }
        self.certification_translations = {
            'AWS_CERT': {
                'en': 'AWS Certified Solutions Architect',
                'fr': 'Architecte Solutions AWS Certifié'
            },
            'PMP': {
                'en': 'Project Management Professional (PMP)',
                'fr': 'Professionnel en Gestion de Projet (PMP)'
            },
            'SCRUM': {
                'en': 'Certified Scrum Master',
                'fr': 'Scrum Master Certifié'
            },
            'GOOGLE_CLOUD': {
                'en': 'Google Cloud Professional',
                'fr': 'Professionnel Google Cloud'
            }
        }
        self._ensure_sample_resumes_exist()

    def _ensure_sample_resumes_exist(self):
        """Ensure sample resume directory exists and contains files"""
        sample_dir = Path(SAMPLE_RESUMES_DIR)
        sample_dir.mkdir(parents=True, exist_ok=True)
        
        if not list(sample_dir.glob("*.pdf")):
            raise FileNotFoundError(
                f"No sample resumes found in {SAMPLE_RESUMES_DIR}. "
                "Please add sample PDF resumes before generating mock data."
            )

    async def generate_resume(
        self,
        user_id: str,
        job_id: Optional[str] = None
    ) -> Dict:
        """Generate a single resume record with file storage"""
        try:
            # Upload file to storage
            file_data = await self.storage.upload_mock_resume(user_id)
            if not file_data:
                raise Exception("Failed to upload resume file")

            # Generate parsed content (simulating resume parsing)
            parsed_content = self.generate_parsed_content()
            status_key = 'PROCESSED'

            # Create resume record
            resume = {
                "id": str(uuid4()),
                "user_id": user_id,
                "job_id": job_id,
                "file_path": file_data['file_path'],
                "file_name": file_data['file_name'],
                "file_size": file_data['file_size'],
                "mime_type": file_data['mime_type'],
                "status": {
                    "code": status_key,
                    "localized": self.resume_status_translations[status_key]
                },
                "parsed_content": parsed_content,
                "metadata": self.generate_resume_metadata(),
                "is_mock": True,
                "mock_batch_id": self.mock_batch_id,
                "created_at": self.generate_date_in_range(),
                "updated_at": datetime.now()
            }

            return resume

        except Exception as e:
            print(f"Error generating resume for user {user_id}: {e}")
            return None

    def generate_parsed_content(self) -> Dict:
        """Generate simulated parsed content from resume"""
        return {
            "contact_info": {
                "email": self.faker_instances['en'].email(),
                "phone": self.faker_instances['en'].phone_number(),
                "address": self.generate_location()
            },
            "education": self.generate_education_history(),
            "experience": self.generate_work_experience(),
            "skills": self.generate_skills(),
            "languages": self.generate_language_proficiency(),
            "certifications": self.generate_certifications(),
            "summary": self.generate_localized_paragraph(2)
        }

    def generate_education_history(self) -> Dict[str, List[Dict]]:
        """Generate education history entries"""
        education = {'en': [], 'fr': []}
        num_entries = random.randint(1, 3)
        
        for _ in range(num_entries):
            start_year = random.randint(2010, 2020)
            duration = random.randint(2, 4)
            education_level_key = random.choice(list(EDUCATION_LEVELS.keys()))
            
            institution = self.generate_localized_field('university')
            field_of_study = self.generate_localized_field('job_title')
            
            education['en'].append({
                'institution': institution['en'],
                'degree': EDUCATION_LEVELS[education_level_key]['en'],
                'field': field_of_study['en'],
                'start_year': start_year,
                'end_year': start_year + duration,
                'gpa': round(random.uniform(3.0, 4.0), 2)
            })
            
            education['fr'].append({
                'institution': institution['fr'],
                'degree': EDUCATION_LEVELS[education_level_key]['fr'],
                'field': field_of_study['fr'],
                'start_year': start_year,
                'end_year': start_year + duration,
                'gpa': round(random.uniform(10, 20), 2)  # French grading system
            })
        
        return education

    def generate_skills(self) -> Dict[str, List[Dict]]:
        """Generate skills with proficiency levels"""
        skills = {'en': [], 'fr': []}
        num_skills = random.randint(5, 10)
        
        for _ in range(num_skills):
            skill_name = self.generate_localized_field('job_title')
            proficiency = random.randint(1, 5)
            
            skills['en'].append({
                'name': skill_name['en'],
                'proficiency': proficiency,
                'years': random.randint(1, 8)
            })
            
            skills['fr'].append({
                'name': skill_name['fr'],
                'proficiency': proficiency,
                'years': random.randint(1, 8)
            })
        
        return skills

    def generate_language_proficiency(self) -> List[Dict]:
        """Generate language proficiency entries"""
        num_languages = random.randint(1, 3)
        available_languages = [lang for lang in LANGUAGES]
        selected_languages = random.sample(available_languages, min(num_languages, len(available_languages)))
        
        proficiency_levels = {
            'BASIC': {'en': 'Basic', 'fr': 'Basique'},
            'INTERMEDIATE': {'en': 'Intermediate', 'fr': 'Intermédiaire'},
            'ADVANCED': {'en': 'Advanced', 'fr': 'Avancé'},
            'NATIVE': {'en': 'Native', 'fr': 'Langue Maternelle'}
        }

        return [
            {
                'language': lang,
                'proficiency': {
                    'code': random.choice(list(proficiency_levels.keys())),
                    'localized': proficiency_levels[random.choice(list(proficiency_levels.keys()))]
                }
            }
            for lang in selected_languages
        ]

    def generate_certifications(self) -> Dict[str, List[Dict]]:
        """Generate certification entries"""
        num_certs = random.randint(0, 3)
        cert_keys = random.sample(list(self.certification_translations.keys()), num_certs)
        
        return {
            'en': [{
                'name': self.certification_translations[cert_key]['en'],
                'issuer': self.faker_instances['en'].company(),
                'date_obtained': self.generate_date_in_range(),
                'expires': random.choice([True, False])
            } for cert_key in cert_keys],
            'fr': [{
                'name': self.certification_translations[cert_key]['fr'],
                'issuer': self.faker_instances['fr'].company(),
                'date_obtained': self.generate_date_in_range(),
                'expires': random.choice([True, False])
            } for cert_key in cert_keys]
        }

    def generate_resume_metadata(self) -> Dict:
        """Generate metadata for resume"""
        return {
            "file_version": "1.0",
            "parser_version": "2.0",
            "processing_time": random.uniform(0.5, 2.0),
            "confidence_score": random.uniform(0.7, 1.0),
            "language_detection": {
                "primary": random.choice(LANGUAGES),
                "confidence": random.uniform(0.8, 1.0)
            },
            "processing_steps": [
                {
                    "step": "text_extraction",
                    "status": "success",
                    "duration": random.uniform(0.1, 0.5)
                },
                {
                    "step": "structure_analysis",
                    "status": "success",
                    "duration": random.uniform(0.2, 0.6)
                },
                {
                    "step": "content_parsing",
                    "status": "success",
                    "duration": random.uniform(0.3, 0.8)
                }
            ]
        }

    def save_batch(self, items: List[Dict]):
        """Save a batch of resumes to the database"""
        query = """
            INSERT INTO resumes (
                id, user_id, job_id, file_path, file_name,
                file_size, mime_type, status, parsed_content,
                metadata, is_mock, mock_batch_id, created_at,
                updated_at
            ) VALUES %s
        """
        
        values = [
            (
                item['id'], item['user_id'], item['job_id'],
                item['file_path'], item['file_name'], item['file_size'],
                item['mime_type'], json.dumps(item['status']),
                json.dumps(item['parsed_content']), json.dumps(item['metadata']),
                item['is_mock'], item['mock_batch_id'],
                item['created_at'], item['updated_at']
            )
            for item in items
        ]
        
        self.db.execute_batch(query, values)

    async def cleanup_mock_resumes(self):
        """Clean up mock resumes from both storage and database"""
        try:
            # Get mock resume file paths
            query = "SELECT file_path FROM resumes WHERE is_mock = true AND mock_batch_id = %s"
            mock_file_paths = [row[0] for row in self.db.execute_query(query, [self.mock_batch_id])]
            
            if self.storage:
                await self.storage.cleanup_mock_files(mock_file_paths)
            
            # Delete database records
            self.db.cleanup_mock_data(self.mock_batch_id)
            
        except Exception as e:
            print(f"Error cleaning up mock resumes: {e}")
