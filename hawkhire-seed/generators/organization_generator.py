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
        self.industry_translations = self._generate_industry_translations()
        self.company_type_translations = self._generate_company_type_translations()

    def _generate_industry_translations(self) -> Dict[str, Dict[str, str]]:
        """Generate translations for industries"""
        return {
            'Technology': {'en': 'Technology', 'fr': 'Technologie'},
            'Healthcare': {'en': 'Healthcare', 'fr': 'Santé'},
            'Finance': {'en': 'Finance', 'fr': 'Finance'},
            'Education': {'en': 'Education', 'fr': 'Éducation'},
            'Manufacturing': {'en': 'Manufacturing', 'fr': 'Fabrication'},
            'Retail': {'en': 'Retail', 'fr': 'Commerce de détail'},
            'Construction': {'en': 'Construction', 'fr': 'Construction'},
            'Media': {'en': 'Media', 'fr': 'Médias'}
        }

    def _generate_company_type_translations(self) -> Dict[str, Dict[str, str]]:
        """Generate translations for company types"""
        return {
            'Public': {'en': 'Public Company', 'fr': 'Société Publique'},
            'Private': {'en': 'Private Company', 'fr': 'Société Privée'},
            'Startup': {'en': 'Startup', 'fr': 'Startup'},
            'Non-profit': {'en': 'Non-profit', 'fr': 'Organisation à but non lucratif'},
            'Government': {'en': 'Government', 'fr': 'Gouvernement'},
            'Educational': {'en': 'Educational Institution', 'fr': 'Institution Éducative'}
        }

    def generate_organization(self) -> Dict:
        """Generate a single organization with complete profile and localization"""
        # Generate base company name and description
        company_name = self.generate_localized_field('company')
        company_desc = {
            'en': f"{self.faker_instances['en'].catch_phrase()}. {self.faker_instances['en'].bs()}",
            'fr': f"{self.faker_instances['fr'].catch_phrase()}. {self.faker_instances['fr'].bs()}"
        }

        # Select industry and company type with translations
        industry = random.choice(list(self.industry_translations.keys()))
        company_type = random.choice(list(self.company_type_translations.keys()))

        # Generate size range with localization
        size_range = random.choice(COMPANY_SIZES)
        size_range_localized = {
            'en': size_range,
            'fr': size_range.replace('-', ' à ') + ' employés'
        }

        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "name": company_name,
            "description": company_desc,
            "tier": random.choice(['free', 'professional', 'enterprise']),
            "industry": {
                'code': industry,
                'localized': self.industry_translations[industry]
            },
            "company_type": {
                'code': company_type,
                'localized': self.company_type_translations[company_type]
            },
            "founded_year": random.randint(1950, 2024),
            "size_range": {
                'code': size_range,
                'localized': size_range_localized
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
                'code': random.choice(VERIFICATION_STATUSES),
                'localized': self.get_localized_term(random.choice(VERIFICATION_STATUSES).lower())
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
        role = random.choice(ORGANIZATION_ROLES)
        title = self.generate_localized_field('job_title')
        
        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "user_id": user_id,
            "role": {
                'code': role,
                'localized': self.get_localized_term(role.lower())
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
        status = random.choice(VERIFICATION_STATUSES)
        notes = {
            'en': self.faker_instances['en'].text(max_nb_chars=200),
            'fr': self.faker_instances['fr'].text(max_nb_chars=200)
        } if status != "pending" else None

        return {
            "id": str(self.faker_instances['en'].uuid4()),
            "organization_id": organization_id,
            "status": {
                'code': status,
                'localized': self.get_localized_term(status.lower())
            },
            "verified_by": verified_by if status != "pending" else None,
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
                k: f"Can {k.replace('_', ' ')}" for k, v in permissions.items() if v
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
