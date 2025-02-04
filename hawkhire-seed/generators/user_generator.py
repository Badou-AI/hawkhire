"""
User generator module for creating mock user accounts with proper authentication records. Handles
both candidate and organization user types, including profile information and authentication details.
All user data is properly localized and linked to Supabase auth.
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
import json
from uuid import uuid4
from .base import BaseGenerator
from config.settings import (
    DEFAULT_MOCK_PASSWORD,
    LANGUAGES,
    EDUCATION_LEVELS,
    EXPERIENCE_LEVELS,
    REMOTE_OPTIONS,
    JOB_TYPES,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)
from supabase import create_client, Client

class UserGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_password = DEFAULT_MOCK_PASSWORD
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
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

    async def generate_user(self, user_type: str = 'candidate') -> Dict:
        """Generate a single user with authentication"""
        # Generate basic user info
        first_name = self.faker_instances['en'].first_name()
        last_name = self.faker_instances['en'].last_name()
        email = f"test.{user_type}.{first_name.lower()}.{str(uuid4())[:8]}@hawkhire-mock.com"

        # Create user in Supabase Auth
        try:
            auth_response = await self.supabase.auth.sign_up({
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
            
            if not auth_response.user:
                print(f"Failed to create user {email}: No user data in response")
                return None

            # Generate profile data
            title_key = random.choice(list(self.job_titles.keys()))
            profile = {
                "id": auth_response.user.id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "user_type": user_type,
                "headline": self.job_titles[title_key],
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
            title_key = random.choice(list(self.job_titles.keys()))
            
            skills.append({
                'name': self.job_titles[title_key],
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
            title_key = random.choice(list(self.job_titles.keys()))
            
            experience = {
                'company': self.generate_localized_field('company'),
                'title': self.job_titles[title_key],
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
                item['last_name'], item['user_type'], json.dumps(item['headline']),
                json.dumps(item['summary']), json.dumps(item['location']), item['preferred_language'],
                json.dumps(item['contact_info']),
                json.dumps(item.get('education_level')) if item.get('education_level') else None,
                json.dumps(item.get('skills')) if item.get('skills') else None,
                json.dumps(item.get('experience')) if item.get('experience') else None,
                json.dumps(item.get('languages')) if item.get('languages') else None,
                json.dumps(item.get('preferences')) if item.get('preferences') else None,
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
            query = "SELECT id FROM users WHERE is_mock = true AND mock_batch_id = %s"
            mock_user_ids = [row[0] for row in self.db.execute_query(query, [self.mock_batch_id])]
            
            # Delete from Supabase Auth if available
            if hasattr(self, 'supabase') and self.supabase:
                for user_id in mock_user_ids:
                    try:
                        await self.supabase.auth.admin.delete_user(user_id)
                    except Exception as e:
                        print(f"Error deleting auth user {user_id}: {e}")
            
            # Delete from database
            self.db.cleanup_mock_data(self.mock_batch_id)
            
        except Exception as e:
            print(f"Error cleaning up mock users: {e}")
