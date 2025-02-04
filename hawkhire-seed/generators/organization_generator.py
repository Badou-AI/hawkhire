"""
Organization generator module for creating mock company data. Generates realistic company profiles
with consistent localization across languages, including company details, member information, and
verification records.
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
from uuid import uuid4
import json
from .base import BaseGenerator
from config.settings import (
    INDUSTRIES,
    COMPANY_TYPES,
    COMPANY_SIZES,
    ORGANIZATION_ROLES,
    VERIFICATION_STATUSES,
    LANGUAGES
)

class OrganizationGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def generate_organization_name(self) -> Dict[str, str]:
        """Generate a localized organization name"""
        company_name = self.faker_instances['en'].company()
        return {
            'en': company_name,
            'fr': company_name  # Keep same name for both languages
        }

    def generate_organization(self) -> Dict:
        """Generate a single organization with proper JSON serialization"""
        name = self.generate_organization_name()
        description = self.generate_localized_paragraph(3)
        industry = random.choice(list(INDUSTRIES.keys()))
        company_type = random.choice(list(COMPANY_TYPES.keys()))
        
        # Generate a list of languages
        supported_languages = ['en', 'fr']
        
        # Generate a slug from the English name
        slug = self.generate_url_safe_string(name['en'])
        
        return {
            'id': str(uuid4()),
            'name': json.dumps(name),
            'slug': slug,
            'description': json.dumps(description),
            'tier': 'free',
            'industry': '{' + industry + '}',  # PostgreSQL array format
            'company_type': json.dumps(COMPANY_TYPES[company_type]),
            'founded_year': random.randint(1990, 2023),
            'size_range': json.dumps(COMPANY_SIZES[random.choice(list(COMPANY_SIZES.keys()))]),
            'website_url': self.faker_instances['en'].url(),
            'logo_url': None,
            'cover_image_url': None,
            'primary_location': json.dumps(self.generate_location()),
            'additional_locations': '{}',  # Empty PostgreSQL array
            'languages': '{' + ','.join(supported_languages) + '}',  # PostgreSQL array format
            'verification_status': 'pending',  # Direct string, not JSON
            'verification_notes': None,
            'members': '{' + self.faker_instances['en'].email() + '}',  # PostgreSQL array with initial member
            'is_mock': True,
            'mock_batch_id': self.mock_batch_id,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }

    def generate_organization_member(
        self,
        organization_id: str,
        user_id: str
    ) -> Dict:
        """Generate an organization member with localized content"""
        role_key = random.choice(list(ORGANIZATION_ROLES.keys()))
        title = self.generate_localized_field('job_title')
        
        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "user_id": user_id,
            "role": {
                'code': role_key,
                'localized': ORGANIZATION_ROLES[role_key]
            },
            "title": title,
            "permissions": self.generate_permissions(),
            "invited_by": None,
            "status": "active",
            "created_at": self.generate_date_in_range(),
            "updated_at": datetime.now()
        }

    def generate_organization_verification(
        self,
        organization_id: str,
        verified_by: Optional[str] = None
    ) -> Dict:
        """Generate an organization verification record with localized content"""
        status_key = random.choice(list(VERIFICATION_STATUSES.keys()))
        notes = {
            'en': self.faker_instances['en'].text(max_nb_chars=200),
            'fr': self.faker_instances['fr'].text(max_nb_chars=200)
        } if status_key != "PENDING" else None

        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "status": {
                'code': status_key,
                'localized': VERIFICATION_STATUSES[status_key]
            },
            "verified_by": verified_by if status_key != "PENDING" else None,
            "notes": notes,
            "created_at": self.generate_date_in_range()
        }

    def generate_permissions(self) -> Dict[str, Dict[str, bool]]:
        """Generate random permissions with localized descriptions"""
        permissions = {
            'edit_organization': random.choice([True, False]),
            'manage_members': random.choice([True, False]),
            'post_jobs': random.choice([True, False]),
            'view_applications': random.choice([True, False]),
            'manage_billing': random.choice([True, False])
        }

        # Add localized permission descriptions
        permission_descriptions = {
            'en': {
                k: f"Can {k.replace('_', ' ')}" 
                for k, v in permissions.items() if v
            },
            'fr': {
                'edit_organization': 'Peut modifier l\'organisation',
                'manage_members': 'Peut gérer les membres',
                'post_jobs': 'Peut publier des offres d\'emploi',
                'view_applications': 'Peut voir les candidatures',
                'manage_billing': 'Peut gérer la facturation'
            }
        }

        return {
            'permissions': permissions,
            'descriptions': permission_descriptions
        }

    def save_batch(self, items: List[Dict], table: str = 'organizations'):
        """Save a batch of items to the specified table"""
        if table == 'organizations':
            query = """
                INSERT INTO organizations (
                    id, name, description, tier, industry, company_type,
                    founded_year, size_range, website_url, logo_url,
                    cover_image_url, primary_location, additional_locations,
                    languages, verification_status, is_mock, mock_batch_id,
                    created_at, updated_at
                ) VALUES %s
            """
            values = [
                (
                    item['id'], 
                    item['name'],
                    item['description'], 
                    item['tier'],
                    item['industry'],
                    item['company_type'],
                    item['founded_year'],
                    item['size_range'],
                    item['website_url'],
                    item['logo_url'],
                    item['cover_image_url'],
                    item['primary_location'],
                    item['additional_locations'],
                    item['languages'],
                    item['verification_status'],
                    item['is_mock'],
                    item['mock_batch_id'],
                    item['created_at'],
                    item['updated_at']
                )
                for item in items
            ]
        
        elif table == 'organization_members':
            query = """
                INSERT INTO organization_members (
                    id, organization_id, user_id, role, title,
                    permissions, invited_by, status, is_mock,
                    mock_batch_id, created_at, updated_at
                ) VALUES %s
            """
            values = [
                (
                    item['id'], item['organization_id'], item['user_id'],
                    item['role'], item['title'], item['permissions'],
                    item['invited_by'], item['status'], item['is_mock'],
                    item['mock_batch_id'], item['created_at'], item['updated_at']
                )
                for item in items
            ]
        
        elif table == 'organization_verifications':
            query = """
                INSERT INTO organization_verifications (
                    id, organization_id, status, verified_by,
                    notes, is_mock, mock_batch_id, created_at
                ) VALUES %s
            """
            values = [
                (
                    item['id'], item['organization_id'], item['status'],
                    item['verified_by'], item['notes'], item['is_mock'],
                    item['mock_batch_id'], item['created_at']
                )
                for item in items
            ]
        
        self.db.execute_batch(query, values)
