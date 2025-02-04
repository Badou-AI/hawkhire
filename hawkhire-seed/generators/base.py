"""
Base generator module providing common functionality for all mock data generators. Implements core
generation methods, batch processing, and common utilities that are inherited by specific generators
for organizations, jobs, users, and resumes.
"""

from typing import Dict, List, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import random
from faker import Faker
from utils.database import DatabaseManager
from utils.storage import StorageManager
from config.settings import LANGUAGES, MOCK_BATCH_SIZE

class BaseGenerator:
    def __init__(self, db: DatabaseManager, storage: StorageManager = None):
        self.db = db
        self.storage = storage
        self.mock_batch_id = str(uuid4())
        self.batch_id = self.mock_batch_id
        self.faker_instances = {
            'en': Faker('en_US'),
            'fr': Faker('fr_FR')
        }

    # Add predefined translations for common terms
    COMMON_TERMS = {
        'full_time': {'en': 'Full Time', 'fr': 'Temps Plein'},
        'part_time': {'en': 'Part Time', 'fr': 'Temps Partiel'},
        'contract': {'en': 'Contract', 'fr': 'Contrat'},
        'remote': {'en': 'Remote', 'fr': 'Télétravail'},
        'hybrid': {'en': 'Hybrid', 'fr': 'Hybride'},
        'onsite': {'en': 'On-site', 'fr': 'Sur Site'},
        'entry_level': {'en': 'Entry Level', 'fr': 'Débutant'},
        'mid_level': {'en': 'Mid Level', 'fr': 'Intermédiaire'},
        'senior_level': {'en': 'Senior Level', 'fr': 'Sénior'},
        'executive': {'en': 'Executive', 'fr': 'Cadre'},
    }

    def get_faker(self, locale: str) -> Faker:
        """Get or create a Faker instance for a specific locale"""
        if locale not in self.faker_instances:
            self.faker_instances[locale] = Faker(locale)
        return self.faker_instances[locale]

    def generate_localized_text(self, min_chars: int = 50, max_chars: int = 200) -> Dict[str, str]:
        """Generate localized text without requiring a specific generator method"""
        return {
            'en': self.faker_instances['en'].text(max_nb_chars=random.randint(min_chars, max_chars)),
            'fr': self.faker_instances['fr'].text(max_nb_chars=random.randint(min_chars, max_chars))
        }

    def generate_localized_field(
        self,
        field_method: str,
        locales: List[str] = None,
        **kwargs
    ) -> Dict[str, str]:
        """
        Generate localized content for a specific field
        Example: generate_localized_field('job_title') returns {'en': 'Software Engineer', 'fr': 'Ingénieur Logiciel'}
        """
        locales = locales or ['en_US', 'fr_FR']
        return {
            locale.split('_')[0]: getattr(self.get_faker(locale), field_method)(**kwargs)
            for locale in locales
        }

    def generate_localized_paragraph(self, num_sentences: int = 5) -> Dict[str, str]:
        """Generate a localized paragraph with specified number of sentences"""
        return {
            'en': ' '.join(self.faker_instances['en'].sentences(num_sentences)),
            'fr': ' '.join(self.faker_instances['fr'].sentences(num_sentences))
        }

    def generate_localized_list(
        self,
        generator_method: str,
        num_items: int = 3,
        **kwargs
    ) -> Dict[str, List[str]]:
        """Generate a localized list of items"""
        return {
            'en': [getattr(self.faker_instances['en_US'], generator_method)(**kwargs) 
                  for _ in range(num_items)],
            'fr': [getattr(self.faker_instances['fr_FR'], generator_method)(**kwargs) 
                  for _ in range(num_items)]
        }
    
    def get_localized_term(self, term_key: str) -> Dict[str, str]:
        """Get predefined translation for common terms"""
        return self.COMMON_TERMS.get(term_key, {
            'en': term_key,
            'fr': term_key
        })
    
    def generate_batch(
        self,
        num_items: int,
        generator_method: str,
        batch_size: int = MOCK_BATCH_SIZE
    ) -> List[Dict]:
        """Generate a batch of items using the specified generator method"""
        items = []
        for _ in range(num_items):
            try:
                item = getattr(self, generator_method)()
                item['is_mock'] = True
                item['mock_batch_id'] = self.mock_batch_id
                items.append(item)

                if len(items) >= batch_size:
                    self.save_batch(items)
                    items = []

            except Exception as e:
                print(f"Error generating item: {e}")
                continue

        if items:  # Save any remaining items
            self.save_batch(items)

        return items

    def save_batch(self, items: List[Dict]):
        """Save a batch of items to the database - to be implemented by child classes"""
        raise NotImplementedError("save_batch method must be implemented by child classes")

    def generate_date_in_range(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> datetime:
        """Generate a random date between start_date and end_date"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=365)
        if not end_date:
            end_date = datetime.now()

        time_between_dates = end_date - start_date
        days_between_dates = time_between_dates.days
        random_number_of_days = random.randrange(days_between_dates)
        
        return start_date + timedelta(days=random_number_of_days)

    def generate_url_safe_string(self, text: str) -> str:
        """Generate a URL-safe string from text"""
        return text.lower().replace(' ', '-').replace('_', '-')

    def generate_random_coordinates(self) -> Dict[str, float]:
        """Generate random coordinates"""
        return {
            'latitude': float(self.faker_instances['en'].latitude()),
            'longitude': float(self.faker_instances['en'].longitude())
        }

    def generate_location(self) -> Dict[str, Dict[str, str]]:
        """Generate a localized location object"""
        return {
            'city': self.generate_localized_field('city'),
            'state': {  # Use state_abbr for English and region for French
                'en': self.faker_instances['en'].state(),
                'fr': self.faker_instances['fr'].region()
            },
            'country': {
                'en': self.faker_instances['en'].country(),
                'fr': self.faker_instances['fr'].country()
            },
            'postal_code': {
                'en': self.faker_instances['en'].postcode(),
                'fr': self.faker_instances['fr'].postcode()
            }
        }

    def generate_contact_info(self) -> Dict[str, str]:
        """Generate contact information"""
        faker = self.faker_instances['en']
        return {
            'email': faker.email(),
            'phone': faker.phone_number(),
            'address': faker.address()
        }

    def get_random_items(
        self,
        items: List[Any],
        min_items: int = 1,
        max_items: int = None
    ) -> List[Any]:
        """Get a random number of items from a list"""
        if max_items is None:
            max_items = min_items
        num_items = random.randint(min_items, max_items)
        return random.sample(items, min(num_items, len(items)))

    def cleanup_mock_data(self, batch_id: Optional[str] = None):
        """Clean up mock data for a specific batch or all mock data"""
        batch_id = batch_id or self.mock_batch_id
        self.db.cleanup_mock_data(batch_id)