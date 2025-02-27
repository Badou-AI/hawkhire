"""
Semantic service for text processing and analysis.
"""
import os
from pathlib import Path
import httpx
import traceback
import aiofiles
from typing import Dict, List
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

logger = logging.getLogger(__name__)

class ProcessingError(Exception):
    """Exception raised when processing a file fails"""
    def __init__(self, file_path: str, operation: str, error: Exception):
        self.file_path = file_path
        self.operation = operation
        self.original_error = error
        self.message = f"Error during {operation} for file {file_path}: {str(error)}"
        super().__init__(self.message)

class MockSemanticService:
    """Mock service for local development and testing"""
    def __init__(self):
        self.indices = {}

    async def convert_pdf_to_text(self, file_path: Path) -> Dict:
        return {
            "pages": ["Sample text from PDF for testing purposes"],
            "metadata": {"page_count": 1}
        }

    async def extract_knowledge(self, text: str, schema: Dict) -> Dict:
        return {
            "data": {
                "title": {
                    "en": "Sample Job Title",
                    "fr": "Exemple de titre d'emploi"
                },
                "description": {
                    "en": "Sample job description",
                    "fr": "Exemple de description d'emploi"
                },
                "job_type": "FULL_TIME",
                "location": {
                    "city": {"en": "New York", "fr": "New York"},
                    "state": {"en": "NY", "fr": "NY"},
                    "country": {"en": "USA", "fr": "États-Unis"},
                    "postal_code": {"en": "10001", "fr": "10001"}
                }
            }
        }

class SemanticService:
    """Service layer for handling semantic operations"""
    def __init__(self):
        self.base_url = os.getenv("REMOTE_API_URL")
        print(f"\n=== Semantic Service Initialization ===")
        print(f"Base URL: {self.base_url}")
        print(f"Environment variables:")
        print(f"- REMOTE_API_URL: {os.getenv('REMOTE_API_URL')}")
        print(f"- AI_MODEL: {os.getenv('AI_MODEL')}")
        
        self.client = httpx.AsyncClient(
            timeout=30.0,
            base_url=self.base_url if self.base_url else "http://localhost:8000"
        )
        self.mock_service = MockSemanticService()
        self.use_mock = self.base_url is None
        if self.use_mock:
            print("WARNING: Using mock semantic service - REMOTE_API_URL not configured")
        else:
            print(f"Using remote semantic service at {self.base_url}")

    async def convert_pdf_to_text(self, file_path: Path) -> Dict:
        """Convert PDF to text using remote service"""
        logger.debug(f"Converting PDF to text: {file_path}")
        if self.use_mock:
            logger.debug("Using mock service for PDF conversion")
            return await self.mock_service.convert_pdf_to_text(file_path)
            
        try:
            logger.debug(f"Sending PDF to remote service: {self.base_url}/v1/tools/convert_pdf2text")
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
                files = {'file': (file_path.name, content, 'application/pdf')}
                response = await self.client.post("/v1/tools/convert_pdf2text", files=files)
                response.raise_for_status()
                result = response.json()
                logger.debug(f"PDF conversion successful: {len(result.get('text', ''))} characters extracted")
                return result
        except Exception as e:
            logger.error(f"Error converting PDF to text: {str(e)}", exc_info=True)
            raise ProcessingError(file_path=str(file_path), operation="PDF to text conversion", error=e)

    async def extract_knowledge(self, text: str, schema: Dict) -> Dict:
        """Extract structured knowledge from text"""
        logger.debug("Extracting knowledge from text")
        if self.use_mock:
            logger.debug("Using mock service for knowledge extraction")
            return await self.mock_service.extract_knowledge(text, schema)
            
        try:
            logger.debug(f"Sending text to remote service: {self.base_url}/v1/tools/convert_doc2json")
            response = await self.client.post(
                "/v1/tools/convert_doc2json",
                json={
                    'text': text,
                    'target_json_schema': schema,
                    'extraction_steps': 'extract structured information from the text',
                    'model': os.getenv('AI_MODEL', 'gpt-4')
                }
            )
            response.raise_for_status()
            result = response.json()
            logger.debug("Knowledge extraction successful")
            return result
        except Exception as e:
            logger.error(f"Error extracting knowledge: {str(e)}", exc_info=True)
            raise ProcessingError(file_path="text input", operation="knowledge extraction", error=e)

# Initialize the semantic service
semantic_service = SemanticService() 