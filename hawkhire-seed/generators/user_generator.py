"""
User generator module for creating mock user accounts with proper authentication records. Handles
both candidate and organization user types, including profile information and authentication details.
All user data is properly localized and linked to Supabase auth.
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
from uuid import uuid4
from .base import BaseGenerator
from config.settings import (
    DEFAULT_MOCK_PASSWORD,
    LANGUAGES,
    EDUCATION_LEVELS,
    EXPERIENCE_LEVELS,
    REMOTE_OPTIONS,
    JOB_TYPES
)

class UserGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_password = DEFAULT_MOCK_PASSWORD
        self.language_proficiency_levels = {
            'BASIC': {'en': 'Basic', 'fr': 'Basique'},
            'INTERMEDIATE': {'en': 'Intermediate', 'fr': 'Intermédiaire'},
            'ADVANCED': {'en': 'Advanced', 'fr': 'Avancé'},
            'NATIVE': {'en': 'Native', 'fr': 'Langue Maternelle'}
        }
        self.available_languages = {
            'EN': {'en': 'English', 'fr': 'Anglais'},
            'FR': {'en': 'French', 'fr': 'Français'},
            'ES': {'en': 'Spanish', 'fr': 'Espagnol'},
            'DE': {'en': 'German', 'fr': 'Allemand'}
        }

    async def generate_user(self, user_type: str = 'candidate') -> Dict:
        """Generate a single user with authentication"""
        # Generate basic user info
        first_name = self.faker_instances['en'].first_name()
        last_name = self.faker_instances['en'].last_name()
        email = f"test.{user_type}.{first_name.lower()}.{str(uuid4())[:8]}@hawkhire-mock.com"

        # Create user in Supabase Auth
        try:
            user_data = await self.supabase.auth.sign_up({
                "email": email,
                "password": self.default_password,
                "options": {
                    "data": {
                        "first_name": first_name,
                        "last_name": last_name,
                        "user_type": user_type,
                        "is_mock": True,
                        "mock_batch_id": self.mock_batch_id
                    }
                }
            })

            # Generate profile data
            profile = {
                "id": user_data.user.id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "user_type": user_type,
                "headline": self.generate_localized_field('job_title'),
                "summary": self.generate_localized_paragraph(3),
                "location": self.generate_location(),
                "preferred_language": random.choice(LANGUAGES),
                "contact_info": self.generate_contact_info(),
                "is_mock": True,
                "mock_batch_id": self.mock_batch_id,
                "created_at": self.generate_date_in_range(),
                "updated_at": datetime.now()
            }

            # Add candidate-specific fields
            if user_type == 'candidate':
                education_key = random.choice(list(EDUCATION_LEVELS.keys()))
                profile.update({
                    "education_level": {
                        "code": education_key,
                        "localized": EDUCATION_LEVELS[education_key]
                    },
                    "skills": self.generate_candidate_skills(),
                    "experience": self.generate_work_experience(),
                    "languages": self.generate_language_proficiency(),
                    "preferences": self.generate_job_preferences()
                })

            return profile

        except Exception as e:
            print(f"Error creating user {email}: {e}")
            return None

    def generate_candidate_skills(self) -> Dict[str, List[Dict]]:
        """Generate candidate skills with proficiency levels"""
        proficiency_levels = {
            'BEGINNER': {'en': 'Beginner', 'fr': 'Débutant'},
            'INTERMEDIATE': {'en': 'Intermediate', 'fr': 'Intermédiaire'},
            'ADVANCED': {'en': 'Advanced', 'fr': 'Avancé'},
            'EXPERT': {'en': 'Expert', 'fr': 'Expert'}
        }
        
        skills = []
        num_skills = random.randint(3, 8)
        
        for _ in range(num_skills):
            proficiency_key = random.choice(list(proficiency_levels.keys()))
            skill_name = self.generate_localized_field('job_title')  # Using job_title as a proxy for skill
            
            skills.append({
                'name': skill_name,
                'proficiency': {
                    'code': proficiency_key,
                    'localized': proficiency_levels[proficiency_key]
                }
            })
        
        return skills

    def generate_work_experience(self) -> List[Dict]:
        """Generate work experience entries"""
        experiences = []
        num_entries = random.randint(1, 4)
        
        for _ in range(num_entries):
            start_date = self.generate_date_in_range(
                datetime(2015, 1, 1),
                datetime(2023, 12, 31)
            )
            end_date = self.generate_date_in_range(start_date, datetime.now()) if random.random() > 0.3 else None
            
            experience = {
                'company': self.generate_localized_field('company'),
                'title': self.generate_localized_field('job_title'),
                'description': self.generate_localized_paragraph(2),
                'start_date': start_date,
                'end_date': end_date,
                'is_current': end_date is None,
                'location': self.generate_location(),
                'achievements': self.generate_localized_list('bs', 3)  # Using bs for achievements
            }
            
            experiences.append(experience)
        
        return experiences

    def generate_language_proficiency(self) -> List[Dict]:
        """Generate language proficiency list"""
        num_languages = random.randint(1, 3)
        selected_languages = random.sample(list(self.available_languages.keys()), num_languages)
        
        return [{
            'language': {
                'code': lang_code,
                'localized': self.available_languages[lang_code]
            },
            'proficiency': {
                'code': random.choice(list(self.language_proficiency_levels.keys())),
                'localized': self.language_proficiency_levels[
                    random.choice(list(self.language_proficiency_levels.keys()))
                ]
            }
        } for lang_code in selected_languages]

    def generate_job_preferences(self) -> Dict:
        """Generate job preferences"""
        job_type_keys = random.sample(list(JOB_TYPES.keys()), random.randint(1, 2))
        remote_key = random.choice(list(REMOTE_OPTIONS.keys()))
        
        return {
            'desired_salary_range': {
                'min': random.randint(40000, 80000),
                'max': random.randint(81000, 150000),
                'currency': 'USD'
            },
            'preferred_job_types': [
                {
                    'code': job_type,
                    'localized': JOB_TYPES[job_type]
                }
                for job_type in job_type_keys
            ],
            'preferred_locations': [
                self.generate_location()
                for _ in range(random.randint(1, 3))
            ],
            'remote_preference': {
                'code': remote_key,
                'localized': REMOTE_OPTIONS[remote_key]
            },
            'willing_to_relocate': random.choice([True, False])
        }

    def save_batch(self, items: List[Dict]):
        """Save a batch of users to the database"""
        query = """
            INSERT INTO users (
                id, email, first_name, last_name, user_type,
                headline, summary, location, preferred_language,
                contact_info, education_level, skills, experience,
                languages, preferences, is_mock, mock_batch_id,
                created_at, updated_at
            ) VALUES %s
        """
        
        values = [
            (
                item['id'], item['email'], item['first_name'],
                item['last_name'], item['user_type'], item['headline'],
                item['summary'], item['location'], item['preferred_language'],
                item['contact_info'],
                item.get('education_level'),  # Optional fields for non-candidates
                item.get('skills'),
                item.get('experience'),
                item.get('languages'),
                item.get('preferences'),
                item['is_mock'], item['mock_batch_id'],
                item['created_at'], item['updated_at']
            )
            for item in items
        ]
        
        self.db.execute_batch(query, values)

    async def cleanup_mock_users(self):
        """Clean up mock users from both Auth and database"""
        try:
            # Get mock user IDs
            query = "SELECT id FROM users WHERE is_mock = true"
            mock_user_ids = [row[0] for row in self.db.execute_query(query)]
            
            # Delete from Supabase Auth
            for user_id in mock_user_ids:
                await self.supabase.auth.admin.delete_user(user_id)
            
            # Delete from database
            self.db.cleanup_mock_data(self.mock_batch_id)
            
        except Exception as e:
            print(f"Error cleaning up mock users: {e}")
