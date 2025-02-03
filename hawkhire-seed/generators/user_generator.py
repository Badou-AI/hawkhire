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
    EDUCATION_LEVELS
)

class UserGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_password = DEFAULT_MOCK_PASSWORD
        self.education_translations = self._generate_education_translations()

    def _generate_education_translations(self) -> Dict[str, Dict[str, str]]:
        """Generate translations for education levels"""
        return {
            'HIGH_SCHOOL': {'en': 'High School', 'fr': 'Lycée'},
            'BACHELOR': {'en': 'Bachelor\'s Degree', 'fr': 'Licence'},
            'MASTER': {'en': 'Master\'s Degree', 'fr': 'Master'},
            'PHD': {'en': 'PhD', 'fr': 'Doctorat'}
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
                profile.update({
                    "education_level": {
                        "code": random.choice(EDUCATION_LEVELS),
                        "localized": self.education_translations[random.choice(EDUCATION_LEVELS)]
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
        skills_en = [
            "Python", "JavaScript", "React", "Node.js", "AWS",
            "Project Management", "Communication", "Team Leadership"
        ]
        skills_fr = [
            "Python", "JavaScript", "React", "Node.js", "AWS",
            "Gestion de Projet", "Communication", "Leadership d'équipe"
        ]
        
        num_skills = random.randint(3, 8)
        selected_indices = random.sample(range(len(skills_en)), num_skills)
        
        return {
            'en': [{
                'name': skills_en[i],
                'proficiency': random.choice(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
            } for i in selected_indices],
            'fr': [{
                'name': skills_fr[i],
                'proficiency': random.choice(['Débutant', 'Intermédiaire', 'Avancé', 'Expert'])
            } for i in selected_indices]
        }

    def generate_work_experience(self) -> Dict[str, List[Dict]]:
        """Generate work experience entries"""
        num_entries = random.randint(1, 4)
        experience = {'en': [], 'fr': []}
        
        for _ in range(num_entries):
            start_date = self.generate_date_in_range(
                datetime(2015, 1, 1),
                datetime(2023, 12, 31)
            )
            end_date = self.generate_date_in_range(start_date, datetime.now()) if random.random() > 0.3 else None
            
            company_name = self.generate_localized_field('company')
            job_title = self.generate_localized_field('job_title')
            description = self.generate_localized_paragraph(2)
            
            experience['en'].append({
                'company': company_name['en'],
                'title': job_title['en'],
                'description': description['en'],
                'start_date': start_date,
                'end_date': end_date,
                'is_current': end_date is None
            })
            
            experience['fr'].append({
                'company': company_name['fr'],
                'title': job_title['fr'],
                'description': description['fr'],
                'start_date': start_date,
                'end_date': end_date,
                'is_current': end_date is None
            })
        
        return experience

    def generate_language_proficiency(self) -> List[Dict]:
        """Generate language proficiency list"""
        languages = [
            {'code': 'en', 'en': 'English', 'fr': 'Anglais'},
            {'code': 'fr', 'en': 'French', 'fr': 'Français'},
            {'code': 'es', 'en': 'Spanish', 'fr': 'Espagnol'},
            {'code': 'de', 'en': 'German', 'fr': 'Allemand'}
        ]
        
        proficiency_levels = {
            'en': ['Basic', 'Intermediate', 'Advanced', 'Native'],
            'fr': ['Basique', 'Intermédiaire', 'Avancé', 'Langue Maternelle']
        }
        
        num_languages = random.randint(1, 3)
        selected_languages = random.sample(languages, num_languages)
        
        return [{
            'language': lang,
            'proficiency': {
                'en': random.choice(proficiency_levels['en']),
                'fr': random.choice(proficiency_levels['fr'])
            }
        } for lang in selected_languages]

    def generate_job_preferences(self) -> Dict:
        """Generate job preferences"""
        return {
            'desired_salary_range': {
                'min': random.randint(40000, 80000),
                'max': random.randint(81000, 150000),
                'currency': 'USD'
            },
            'preferred_job_types': self.get_random_items(
                ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
                1, 2
            ),
            'preferred_locations': [
                self.generate_location()
                for _ in range(random.randint(1, 3))
            ],
            'remote_preference': random.choice(['REMOTE', 'HYBRID', 'ONSITE']),
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
