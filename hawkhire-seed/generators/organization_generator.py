"""
Organization generator module for creating mock company data. Generates realistic company profiles
with consistent localization across languages, including company details, member information, and
verification records.
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
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

    def generate_organization(self) -> Dict:
        """Generate a single organization with complete profile and localization"""
        # Generate base company name and description
        company_name = self.generate_localized_field('company')
        company_desc = {
            'en': f"{self.faker_instances['en'].catch_phrase()}. {self.faker_instances['en'].bs()}",
            'fr': f"{self.faker_instances['fr'].catch_phrase()}. {self.faker_instances['fr'].bs()}"
        }

        # Select keys for lookups
        industry_key = random.choice(list(INDUSTRIES.keys()))
        company_type_key = random.choice(list(COMPANY_TYPES.keys()))
        size_range_key = random.choice(list(COMPANY_SIZES.keys()))
        verification_status_key = random.choice(list(VERIFICATION_STATUSES.keys()))

        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "name": company_name,
            "description": company_desc,
            "tier": random.choice(['free', 'professional', 'enterprise']),
            "industry": {
                'code': industry_key,
                'localized': INDUSTRIES[industry_key]
            },
            "company_type": {
                'code': company_type_key,
                'localized': COMPANY_TYPES[company_type_key]
            },
            "founded_year": random.randint(1950, 2024),
            "size_range": {
                'code': size_range_key,
                'localized': COMPANY_SIZES[size_range_key]
            },
            "website_url": self.generate_url_safe_string(company_name['en']),
            "logo_url": f"https://logo.clearbit.com/{self.faker_instances['en'].domain_name()}",
            "cover_image_url": f"https://picsum.photos/seed/{random.randint(1, 1000)}/1200/300",
            "primary_location": self.generate_location(),
            "additional_locations": [
                self.generate_location() 
                for _ in range(random.randint(0, 3))
            ],
            "languages": self.get_random_items(LANGUAGES, 1, len(LANGUAGES)),
            "verification_status": {
                'code': verification_status_key,
                'localized': VERIFICATION_STATUSES[verification_status_key]
            },
            "created_at": self.generate_date_in_range(),
            "updated_at": datetime.now()
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
                    item['id'], item['name'], item['description'],
                    item['tier'], item['industry'], item['company_type'],
                    item['founded_year'], item['size_range'], item['website_url'],
                    item['logo_url'], item['cover_image_url'], item['primary_location'],
                    item['additional_locations'], item['languages'],
                    item['verification_status'], item['is_mock'], item['mock_batch_id'],
                    item['created_at'], item['updated_at']
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
