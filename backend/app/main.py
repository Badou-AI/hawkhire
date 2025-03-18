from fastapi import FastAPI, UploadFile, HTTPException, Form, Query, Request, Header, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
from dotenv import load_dotenv
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
import aiofiles
import mimetypes
from typing import Dict, List, Optional, Union, Any
import humanize
import hashlib
from datetime import datetime
import json
from enum import Enum
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
import time
from slugify import slugify
from supabase import create_client, Client
from pydantic import BaseModel, Field, UUID4, HttpUrl, constr
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from asyncio import Semaphore
import traceback
import logging
import spacy

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / '.env')

# Verify critical environment variables
REMOTE_API_URL = os.getenv("REMOTE_API_URL")
if not REMOTE_API_URL:
    print("Warning: REMOTE_API_URL not set, services will use mock mode")

# Get frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Initialize FastAPI app
app = FastAPI(
    title="HawkHire Local API",
    description="Local API for HawkHire application",
    version="1.0.0"
)

# Get CORS origins from environment variable
def get_cors_origins() -> List[str]:
    """Get CORS origins from environment variable"""
    # Default frontend URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Additional CORS origins
    additional_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://hawkhire.com,https://beta.hawkhire.com")
    
    # Combine default and additional origins
    all_origins = [frontend_url]
    all_origins.extend(additional_origins.split(","))
    
    # return unique origins
    return list(set(all_origins))

# Configure CORS with dynamic origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage configuration
UPLOAD_DIR = Path("storage/uploads")
PROCESSED_DIR = Path("storage/processed")
CONFIG_DIR = Path("app/config")

# Ensure storage directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Load index configuration
def load_index_config() -> Dict:
    """Load the resume index configuration from JSON file"""
    config_path = CONFIG_DIR / "resume_index.json"
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"Index configuration file not found at {config_path}")
    except json.JSONDecodeError:
        raise RuntimeError(f"Invalid JSON in index configuration file at {config_path}")

# Load configuration at startup
RESUME_INDEX_CONFIG = load_index_config()

class EmbeddingModel(str, Enum):
    ENGLISH_ONLY_LIGHT = 'embed-english-light-v3.0'
    MULTILINGUAL_LIGHT = 'embed-multilingual-light-v3.0'
    ENGLISH_ONLY_HEAVY = 'embed-english-v3.0'
    MULTILINGUAL_HEAVY = 'embed-multilingual-v3.0'

class EmbeddingInputType(str, Enum):
    SEARCH_DOCUMENT = 'search_document'
    SEARCH_QUERY = 'search_query'
    CLUSTERING = 'clustering'
    CLASSIFICATION = 'classification'
    IMAGE = 'image'


class MockSemanticService:
    """Mock service for local development and testing"""
    def __init__(self):
        self.indices = {}

    async def create_index(self, index_name: str, config: Dict) -> None:
        """Create a mock index"""
        self.indices[index_name] = {"config": config, "documents": []}

    def index_exists(self, index_name: str) -> bool:
        """Check if mock index exists"""
        return index_name in self.indices

    async def convert_pdf_to_text(self, file_path: Path) -> Dict:
        return {
            "pages": ["Sample text from PDF for testing purposes"],
            "metadata": {"page_count": 1}
        }

    async def generate_embedding(self, text: str) -> List[float]:
        return [0.0] * 1024  # Return zero vector of standard size

    async def extract_knowledge(self, text: str, schema: Dict) -> Dict:
        return {"data": schema}  # Return empty schema structure

    async def analyze_document(self, text: str, schema: Dict) -> Dict:
        """Mock implementation of document analysis"""
        return {
            "justification": "This is a mock analysis of the document.",
            "score": 0.75  # Mock matching score
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
        
        self.client = httpx.AsyncClient(timeout=30.0)
        self.mock_service = MockSemanticService()
        self.use_mock = self.base_url is None
        if self.use_mock:
            print("WARNING: Using mock semantic service - REMOTE_API_URL not configured")
        else:
            print(f"Using remote semantic service at {self.base_url}")

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using remote service"""
        if self.use_mock:
            return await self.mock_service.generate_embedding(text)
            
        try:
            print(f"\n=== Generating Embedding ===")
            print(f"Text length: {len(text)}")
            
            # response = await self.client.post(
            #     f"{self.base_url}/v1/tools/generate_embedding",
            #     json={"text": text}
            # )
            response = await self.client.post(
                f"{self.base_url}/v1/embedding/text",
                json={
                    'texts': [text],
                    'model': EmbeddingModel.MULTILINGUAL_HEAVY,
                    'input_type': EmbeddingInputType.SEARCH_DOCUMENT
                }
            )
            response.raise_for_status()
            result = response.json()
            return result['embeddings'][0]
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            raise ProcessingError(operation="embedding generation", file_path="text input", error=e)

    async def convert_pdf_to_text(self, file_path: Path) -> Dict:
        """Convert PDF to text using remote service"""
        if self.use_mock:
            return await self.mock_service.convert_pdf_to_text(file_path)
            
        try:
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
                files = {'file': (file_path.name, content, 'application/pdf')}
                response = await self.client.post(f"{self.base_url}/v1/tools/convert_pdf2text", files=files)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error converting PDF to text: {str(e)}")
            raise ProcessingError(operation="PDF to text conversion", file_path=str(file_path), error=e)

    async def extract_knowledge(self, text: str, schema: Dict) -> Dict:
        """Extract structured knowledge from text"""
        if self.use_mock:
            return await self.mock_service.extract_knowledge(text, schema)
            
        try:
            response = await self.client.post(
                f"{self.base_url}/v1/tools/convert_doc2json",
                json={
                    'text': text,
                    'target_json_schema': schema,
                    'extraction_steps': 'extract structured information from the text',
                    'model': os.getenv('AI_MODEL', 'gpt-4')
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error extracting knowledge: {str(e)}")
            raise ProcessingError(operation="knowledge extraction", file_path="text input", error=e)

    async def analyze_document(self, text: str, job_description: str, schema: Dict) -> Dict:
        """Analyze document content and compare with job description"""
        if self.use_mock:
            return await self.mock_service.analyze_document(text, job_description, schema)
            
        try:
            print(f"\n=== Analyzing Document ===")
            print(f"Job description length: {len(job_description)} characters")
            
            print(f"\n=== Making Request to Analyze Document ===")
            url = f"{self.base_url}/v1/tools/convert_doc2json"
            print(f"URL: {url}")
            
            payload={
                'text': f"cv: {text}\n### job: {job_description}",
                'target_json_schema': schema,
                'extraction_steps': 'anlysze the matching of the cv with the job description and provide a score and justification',
                'model': 'gpt-4o-mini'
            }
            print(f"Payload structure: {list(payload.keys())}")
            
            response = await self.client.post(url, json=payload)
            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            try:
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"HTTP Error Response Body: {response.text}")
                raise
                
        except Exception as e:
            print(f"\n=== Error in analyze_document ===")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            if isinstance(e, httpx.HTTPError):
                print(f"HTTP Error details: {e.response.text if hasattr(e, 'response') else 'No response'}")
            traceback.print_exc()
            raise ProcessingError(operation="document analysis", file_path="text input", error=e)
    
    async def index_document(self, index_name: str, doc_id: str, document: Dict) -> Dict:
        """Index a processed document"""
        print(f"\n=== Indexing Current Document ===")
        response = await self.client.post(
            f"{self.base_url}/v1/index/{index_name}/document/{doc_id}",
            json={'structured_doc': document}
        )
        response.raise_for_status()
        return response.json()


# Initialize the semantic service
semantic_service = SemanticService()

async def create_semantic_index(index_name: str) -> Dict:
    """Create a new semantic search index with the specified configuration"""
    try:
        # Create vector index in Supabase
        await supabase.execute(f"""
            create index if not exists idx_{index_name}_embedding
            on jobs using ivfflat (embedding vector_cosine_ops)
            with (lists = 100);
        """)
        return {"message": f"Index '{index_name}' created successfully"}
    except Exception as e:
        print(f"Error creating index: {str(e)}")
        raise

@app.post("/v1/index/{index_name}")
async def create_index(index_name: str):
    """Endpoint to create a new semantic search index"""
    try:
        result = await create_semantic_index(index_name)
        return {
            "message": f"Index '{index_name}' created successfully",
            "details": result,
            "mode": "remote"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/indices/{index_name}/verify")
async def verify_index(index_name: str):
    """Verify an index exists and return its status"""
    try:
        async with httpx.AsyncClient() as client:
            # Keep only the remote service checks
            exist_response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/exist",
                timeout=30.0
            )
            exist_response.raise_for_status()
            
            count_response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/count",
                timeout=30.0
            )
            count_response.raise_for_status()
            doc_count = count_response.json().get("count", 0)
            
            settings_response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/settings",
                timeout=30.0
            )
            settings_response.raise_for_status()
            settings = settings_response.json()
            
            return {
                "name": index_name,
                "document_count": doc_count,
                "created_at": settings.get("creation_date", datetime.now().isoformat()),
                "status": "active" if doc_count > 0 else "empty",
                "mode": "remote"
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return {
                "name": index_name,
                "document_count": 0,
                "status": "does_not_exist",
                "mode": "remote"
            }
        raise HTTPException(status_code=e.response.status_code, detail=str(e))

def generate_upload_id(file_content: bytes, job_id: str) -> str:
    """Generate a unique ID for an upload based on content hash and job ID"""
    content_hash = hashlib.sha256(file_content).hexdigest()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    upload_id = f"{job_id}_{timestamp}_{content_hash[:8]}"
    return upload_id

def generate_index_name(job_id: str, job_title: str = "") -> str:
    """Generate a consistent index name from job ID and title"""
    if not job_title:
        return f"job-{job_id}"
    
    # Convert title to slug
    slug = job_title.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return f"job-{slug}-{job_id}"

async def ensure_job_index(job_id: str, job_title: str = "") -> str:
    """Ensure an index exists for the given job, create if it doesn't exist"""
    index_name = generate_index_name(job_id, job_title)
    print(f"Using index name: {index_name}")  # Debug log
    
    try:
        # Check if index exists
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/exist",
                timeout=30.0
            )
            
            if response.status_code == 404:
                # Create index if it doesn't exist
                print(f"Creating new index: {index_name}")  # Debug log
                await create_semantic_index(index_name)
            elif not response.is_success:
                print(f"Error checking index: {response.status_code}")  # Debug log
                # Try creating anyway
                await create_semantic_index(index_name)
    except Exception as e:
        print(f"Error ensuring index: {str(e)}, falling back to mock mode")  # Debug log
        # Fall back to mock service
        if not mock_semantic_service.index_exists(index_name):
            await mock_semantic_service.create_index(index_name, RESUME_INDEX_CONFIG)
    
    return index_name

async def save_upload(file: UploadFile, job_id: str) -> Dict:
    """Save an uploaded file and return its metadata"""
    content = await file.read()
    upload_id = generate_upload_id(content, job_id)
    
    # Create upload directory
    upload_path = UPLOAD_DIR / upload_id
    upload_path.mkdir(exist_ok=True)
    
    # Save original file
    file_path = upload_path / file.filename
    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(content)
    
    return {
        "upload_id": upload_id,
        "original_filename": file.filename,
        "file_path": str(file_path),
        "timestamp": datetime.now().isoformat()
    }

class FileStats:
    def __init__(self, path: Path):
        self.name = path.name
        self.size = path.stat().st_size
        self.mime_type = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
        self.human_size = humanize.naturalsize(self.size)

    def to_dict(self):
        return {
            "name": self.name,
            "size": self.size,
            "mime_type": self.mime_type,
            "human_size": self.human_size
        }

async def process_single_pdf(
    file_path: Path,
    dest_path: Path,
    semantic_service: SemanticService,
    index_name: str,
    upload_id: str,
    job_id: str,
    job_description: str,
    progress_callback: callable
) -> Dict:
    """Process a single PDF file with all necessary steps"""
    # Get file stats
    stats = FileStats(file_path)
    
    # Initialize result structure
    result = {
        "name": stats.name,
        "size": stats.size,
        "human_size": stats.human_size,
        "mime_type": stats.mime_type,
        "processed_path": str(dest_path),
        "status": "processing",
        "failures": [],
        "timings": {}
    }
    
    try:
        print(f"\n=== Starting PDF Processing ===")
        print(f"File: {file_path}")
        print(f"Index: {index_name}")
        print(f"Job ID: {job_id}")
        
        # Initialize timings
        timings = {}

        # Convert PDF to text
        text_extraction_start = time.time()
        try:
            text_result = await semantic_service.convert_pdf_to_text(dest_path)
            text_content = "\n".join(text_result.get('pages', []))
            timings['text_extraction'] = time.time() - text_extraction_start
            
            print(f"\n=== Converting PDF to Text ===")
            print(f"Using path: {file_path}")
            print(f"Extracted text length: {len(text_content)} characters")
            print(f"First 200 chars: {text_content[:200]}...")
        except ProcessingError as e:
            result["failures"].append({
                "operation": e.operation,
                "error": str(e.original_error)
            })
            # Cannot proceed without text content
            raise
        
        # Detect language
        try:
            language = await detect_language(text_content)
            print(f"\n=== Language Detection ===")
            print(f"Resume Language: {language}")
        except Exception as e:
            # Default to English if language detection fails
            language = "en"
            result["failures"].append({
                "operation": "language detection",
                "error": str(e)
            })
        
        # Generate embedding
        try:
            embedding_start = time.time()
            print(f"\n=== Generating Embedding ===")
            print(f"Text length: {len(text_content)}")
            embedding = await semantic_service.generate_embedding(text_content)
            print(f"Embedding vector size: {len(embedding)}")
            timings['embedding'] = time.time() - embedding_start
        except ProcessingError as e:
            result["failures"].append({
                "operation": e.operation,
                "error": str(e.original_error)
            })
            # Cannot proceed without embedding for search
            raise
        
        # Extract knowledge
        try:
            knowledge_start = time.time()
            extracted_knowledge = await semantic_service.extract_knowledge(
                text_content,
                RESUME_INDEX_CONFIG['mappings']['properties']['content']['properties']
            )
            print(f"\n=== Extracting Knowledge ===")
            print(f"Extracted knowledge keys: {list(extracted_knowledge.keys())}")
            timings['knowledge_extraction'] = time.time() - knowledge_start
        except ProcessingError as e:
            result["failures"].append({
                "operation": e.operation,
                "error": str(e.original_error)
            })
            # Use empty knowledge structure if extraction fails
            extracted_knowledge = {"data": {}}
        
        # Analyze document
        try:
            analysis_start = time.time()
            extracted_matching_score = await semantic_service.analyze_document(
                text_content,
                job_description,
                RESUME_INDEX_CONFIG['mappings']['properties']['matching_score']['properties']
            )
            timings['analysis'] = time.time() - analysis_start
        except ProcessingError as e:
            result["failures"].append({
                "operation": e.operation,
                "error": str(e.original_error)
            })
            # Use default matching score if analysis fails
            extracted_matching_score = {
                "justification": "Analysis failed due to technical error.",
                "score": 0.0
            }
        
        # Generate document ID from file content
        doc_id = hashlib.sha256(text_content.encode()).hexdigest()
        
        # Create structured document
        document = {
            "upload_id": upload_id,
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "content": extracted_knowledge.get('data', {}),
            "file_info": {
                "name": stats.name,
                "size": stats.size,
                "mime_type": stats.mime_type,
                "processed_path": str(dest_path)
            },
            "matching_score": extracted_matching_score,
            "embedding": embedding
        }
        
        # Index the document
        try:
            indexing_start = time.time()
            await semantic_service.index_document(index_name, doc_id, document)
            timings['indexing'] = time.time() - indexing_start
        except Exception as e:
            result["failures"].append({
                "operation": "document indexing",
                "error": str(e)
            })
        
        # Calculate total processing time
        total_time = sum(timings.values())
        
        # Update result
        result.update({
            "doc_id": doc_id,
            "text_content": text_content[:500] + "...",
            "status": "processed" if not result["failures"] else "partially_processed",
            "indexed": "document indexing" not in [f["operation"] for f in result["failures"]],
            "timings": timings,
            "total_time": total_time
        })
        
        # Call progress callback
        if progress_callback:
            await progress_callback(result)
            
        return result
        
    except Exception as e:
        print(f"\n=== Error Processing PDF ===")
        print(f"Error details: {str(e)}")
        print(f"File: {file_path}")
        traceback.print_exc()
        
        # Update result with error information
        result.update({
            "status": "failed",
            "error": str(e)
        })
        
        if progress_callback:
            await progress_callback(result)
            
        return result

# Get number of CPU cores for optimal threading
CPU_COUNT = os.cpu_count() or 4
MAX_CONCURRENT_TASKS = CPU_COUNT * 2  # Double the CPU count for I/O bound tasks

async def process_pdf_file(
    file_path: Path,
    semantic_service: SemanticService,
    session_token: str,
    progress_callback: callable
) -> Dict:
    try:
        # Convert PDF to text
        text_result = await semantic_service.convert_pdf_to_text(file_path)
        text_content = "\n".join(text_result.get('pages', []))
        
        if not text_content or len(text_content.strip()) < 50:
            raise ValueError("Extracted text is too short or empty")
            
        # Extract job data
        job_data = await semantic_service.extract_job_data(text_content, file_path.name)
        
        await progress_callback({
            'status': 'success',
            'file_name': file_path.name,
            'data': job_data
        })
        
        return job_data
    except Exception as e:
        await progress_callback({
            'status': 'error',
            'file_name': file_path.name,
            'error': str(e)
        })
        raise

async def process_zip_file(zip_file: UploadFile, job_id: str, job_title: str = "", job_description: str = "") -> Dict:  # Add job_description parameter
    """Process uploaded ZIP file containing resumes with parallel processing"""
    # Ensure index exists
    index_name = await ensure_job_index(job_id, job_title)
    print(f"Using index: {index_name}")
    
    # Save the upload
    upload_info = await save_upload(zip_file, job_id)
    temp_dir = tempfile.mkdtemp()  # Create a temporary directory that won't auto-delete
    
    try:
        temp_path = Path(temp_dir) / zip_file.filename
        
        # Read the saved file
        async with aiofiles.open(upload_info["file_path"], 'rb') as file:
            content = await file.read()
            
        # Save to temp for processing
        async with aiofiles.open(temp_path, 'wb') as out_file:
            await out_file.write(content)
        
        # Extract zip with explicit close
        zip_ref = None
        try:
            zip_ref = zipfile.ZipFile(temp_path, 'r')
            extract_path = Path(temp_dir) / "extracted"
            extract_path.mkdir(exist_ok=True)
            zip_ref.extractall(extract_path)
        finally:
            if zip_ref:
                zip_ref.close()
                print("ZIP file handle explicitly closed")
            # Add small delay to ensure file handle is released
            await asyncio.sleep(0.1)
        
        # Process files
        processed_files = []
        failed_files = []
        total_size = 0
        file_types = {}
        
        # Save extracted files to processed directory
        processed_path = PROCESSED_DIR / upload_info["upload_id"]
        processed_path.mkdir(parents=True, exist_ok=True)

        # Collect all PDF files first
        pdf_files = []
        other_files = []
        
        for file_path in extract_path.rglob('*'):
            if not file_path.is_file():
                continue
                
            stats = FileStats(file_path)
            dest_path = processed_path / file_path.relative_to(extract_path)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy with explicit close of file handles
            with open(file_path, 'rb') as src, open(dest_path, 'wb') as dst:
                shutil.copyfileobj(src, dst)
            
            total_size += stats.size
            file_type = stats.mime_type.split('/')[0] if stats.mime_type else 'unknown'
            file_types[file_type] = file_types.get(file_type, 0) + 1
            
            if stats.mime_type == 'application/pdf':
                pdf_files.append((dest_path, dest_path))  # Use destination path for both
            else:
                other_files.append({
                    "name": stats.name,
                    "size": stats.size,
                    "human_size": stats.human_size,
                    "mime_type": stats.mime_type,
                    "processed_path": str(dest_path),
                    "status": "unsupported"
                })

        # Send initial count
        total_files = len(pdf_files) + len(other_files)
        print(f"Found {len(pdf_files)} PDFs and {len(other_files)} other files")
        yield json.dumps({
            "event": "processing_started",
            "total_files": total_files,
            "processed_count": 0,
            "failed_count": 0
        })

        # Process PDFs in parallel with semaphore for concurrency control
        semaphore = asyncio.Semaphore(10)  # Reduced from 15 to 10 for better stability
        
        async def process_with_semaphore(file_path, dest_path):
            async with semaphore:
                return await process_single_pdf(
                    file_path,
                    dest_path,
                    semantic_service,
                    index_name,
                    upload_info["upload_id"],
                    job_id,
                    job_description,  # Add job_description parameter
                    progress_callback
                )

        # Create a queue for progress updates
        progress_queue = asyncio.Queue()

        async def progress_callback(file_info: Dict):
            await progress_queue.put(file_info)

        # Create processing tasks
        tasks = [
            process_with_semaphore(file_path, dest_path)
            for file_path, dest_path in pdf_files
        ]

        # Process all PDFs with controlled concurrency
        start_time = time.time()
        processed_count = 0
        failed_count = 0
        
        # Start processing files
        processing = asyncio.gather(*tasks)
        
        # Process files while monitoring progress
        while not processing.done() or not progress_queue.empty():
            try:
                file_info = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                if file_info.get("status") == "processed":
                    processed_files.append(file_info)
                    processed_count += 1
                else:
                    failed_files.append(file_info)
                    failed_count += 1
                
                yield json.dumps({
                    "event": "file_processed" if file_info.get("status") == "processed" else "file_failed",
                    "file_name": file_info.get("name", "Unknown"),
                    "total_files": total_files,
                    "processed_count": processed_count,
                    "failed_count": failed_count
                })
            except asyncio.TimeoutError:
                if processing.done():
                    break
                continue
            except Exception as e:
                print(f"Error in progress reporter: {str(e)}")
                continue
        
        # Wait for processing to complete and handle any exceptions
        try:
            results = await processing
        except Exception as e:
            print(f"Error in processing: {str(e)}")
        
        processing_time = time.time() - start_time
        print(f"Parallel processing completed in {processing_time:.2f} seconds")
        print(f"Processed: {len(processed_files)}, Failed: {len(failed_files)}, Other: {len(other_files)}")
        
        # Add other files to the list
        processed_files.extend(other_files)

        # Final response
        yield json.dumps({
            "event": "completed",
            "upload_id": upload_info["upload_id"],
            "job_id": job_id,
            "total_files": total_files,
            "total_size": total_size,
            "human_total_size": humanize.naturalsize(total_size),
            "file_types": file_types,
            "processed_count": len([f for f in processed_files if f.get("status") == "processed"]),
            "failed_count": len(failed_files),
            "files": sorted(processed_files + failed_files, key=lambda x: x["size"], reverse=True),
            "timestamp": upload_info["timestamp"],
            "processing_time": processing_time
        })
        
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid zip file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            print(f"Cleaned up temp directory: {temp_dir}")
        except Exception as e:
            print(f"Warning: Error during cleanup: {str(e)}")

@app.post("/process-zip")
async def process_zip(
    file: UploadFile,
    job_id: str = Form(...),
    job_title: str = Form(""),
    job_description: str = Form(...)  # Add job_description parameter
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    # Read file content and create a new SpooledTemporaryFile
    content = await file.read()
    temp_file = tempfile.SpooledTemporaryFile()
    temp_file.write(content)
    temp_file.seek(0)
    
    # Create new UploadFile with the temp file
    new_file = UploadFile(
        filename=file.filename,
        file=temp_file
    )
    
    async def event_generator():
        try:
            async for event in process_zip_file(new_file, job_id, job_title, job_description):  # Pass job_description
                yield f"data: {event}\n\n"
        finally:
            await new_file.close()
            temp_file.close()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hawkhire-local-api"}

# Example of a proxy endpoint that forwards to remote API
@app.get("/proxy-example")
async def proxy_example():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{REMOTE_API_URL}/some-endpoint")
        return response.json()

# Add more endpoints here for your internal processing

@app.get("/uploads/{upload_id}/status")
async def get_upload_status(upload_id: str):
    """Get the processing status and results for a specific upload"""
    # Check if upload exists
    upload_dir = UPLOAD_DIR / upload_id
    if not upload_dir.exists():
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Check processed files
    processed_dir = PROCESSED_DIR / upload_id
    if not processed_dir.exists():
        raise HTTPException(status_code=404, detail="No processed files found")
    
    # Gather results
    results = {
        "upload_id": upload_id,
        "original_files": [],
        "processed_files": []
    }
    
    # List original files
    for file_path in upload_dir.rglob("*"):
        if file_path.is_file():
            stats = FileStats(file_path)
            results["original_files"].append({
                "name": stats.name,
                "size": stats.size,
                "human_size": stats.human_size,
                "mime_type": stats.mime_type
            })
    
    # List processed files
    for file_path in processed_dir.rglob("*"):
        if file_path.is_file():
            stats = FileStats(file_path)
            file_info = {
                "name": stats.name,
                "size": stats.size,
                "human_size": stats.human_size,
                "mime_type": stats.mime_type,
                "path": str(file_path.relative_to(processed_dir))
            }
            
            # If it's a PDF, try to read the text content
            if stats.mime_type == 'application/pdf':
                try:
                    text_result = await semantic_service.convert_pdf_to_text(file_path)
                    file_info.update({
                        "text_content_preview": "\n".join(text_result.get('pages', []))[:500] + "...",
                        "status": "processed"
                    })
                except Exception as e:
                    file_info.update({
                        "status": "failed",
                        "error": str(e)
                    })
            
            results["processed_files"].append(file_info)
    
    return results

@app.get("/v1/indices")
async def list_indices():
    """List all job-specific indices"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{REMOTE_API_URL}/v1/index",
                timeout=30.0
            )
            response.raise_for_status()
            indices = response.json()
            
            # Filter for job-specific indices
            job_indices = [idx for idx in indices if idx.startswith('job-')]
            
            return {
                "indices": job_indices,
                "total": len(job_indices)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing indices: {str(e)}")

@app.delete("/v1/indices/{index_name}")
async def delete_index(index_name: str):
    """Delete a specific index"""
    if not index_name.startswith('job-'):
        raise HTTPException(status_code=400, detail="Can only delete job-specific indices")
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{REMOTE_API_URL}/v1/index/{index_name}",
                timeout=30.0
            )
            response.raise_for_status()
            return {"message": f"Index '{index_name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting index: {str(e)}")

@app.get("/v1/indices/{index_name}/status")
async def get_index_status(index_name: str):
    """Get detailed status of an index including document count and settings"""
    try:
        async with httpx.AsyncClient() as client:
            # Get document count
            count_response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/count",
                timeout=30.0
            )
            count_response.raise_for_status()
            doc_count = count_response.json().get("count", 0)
            
            # Get index settings
            settings_response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/settings",
                timeout=30.0
            )
            settings_response.raise_for_status()
            settings = settings_response.json()
            
            return {
                "name": index_name,
                "document_count": doc_count,
                "settings": settings,
                "created_at": settings.get("creation_date"),
                "status": "active" if doc_count > 0 else "empty"
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Index '{index_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting index status: {str(e)}")

async def detect_language(text: str) -> str:
    """Detect the primary language of the text using the first few paragraphs"""
    # Use the semantic service to detect language
    response = await semantic_service.client.post(
        f"{semantic_service.base_url}/v1/tools/convert_doc2json",
        json={
            'text': text[:1000],  # Use first 1000 chars for detection
            'target_json_schema': {
                "language": {
                    "type": "string",
                    "description": "The ISO language code of the document (e.g., 'en', 'fr')"
                }
            },
            'extraction_steps': 'detect the language of the text and return the ISO language code',
            'model': os.getenv('AI_MODEL', 'gpt-4')
        }
    )
    response.raise_for_status()
    result = response.json()
    return result.get('language', 'en')

async def generate_feedback(
    knowledge: dict,
    matching_score: dict,
    job_description: str,
    language: str
) -> str:
    """Generate comprehensive markdown feedback based on resume analysis"""
    
    # Use semantic service to generate detailed feedback
    response = await semantic_service.client.post(
        f"{semantic_service.base_url}/v1/tools/convert_doc2json",
        json={
            'text': f"""
Resume Analysis Task:
Compare the following resume against the job requirements and provide detailed feedback.

Resume Skills and Experience:
{json.dumps(knowledge.get('data', {}), indent=2)}

Job Description:
{job_description}

Matching Score: {matching_score.get('data', {}).get('score', {}).get('value', 0)}
Score Justification: {matching_score.get('data', {}).get('justification', {}).get('meta', {}).get('description', '')}
            """,
            'target_json_schema': {
                "feedback": {
                    "type": "object",
                    "required": ["overview", "strengths", "gaps", "improvement_plan"],
                    "properties": {
                        "overview": {
                            "type": "string",
                            "description": "A detailed overview of how well the candidate matches the position, including key findings"
                        },
                        "strengths": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["skill", "analysis", "relevance"],
                                "properties": {
                                    "skill": {"type": "string"},
                                    "analysis": {"type": "string"},
                                    "relevance": {"type": "string", "description": "How relevant this strength is to the job requirements"}
                                }
                            }
                        },
                        "gaps": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["skill", "importance", "suggestion", "impact"],
                                "properties": {
                                    "skill": {"type": "string"},
                                    "importance": {"type": "string", "enum": ["Critical", "Important", "Nice to have"]},
                                    "suggestion": {"type": "string"},
                                    "impact": {"type": "string", "description": "How this gap impacts the candidate's suitability"}
                                }
                            }
                        },
                        "improvement_plan": {
                            "type": "object",
                            "required": ["short_term", "long_term", "rewrite_suggestions"],
                            "properties": {
                                "short_term": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Immediate actions the candidate can take (1-3 months)"
                                },
                                "long_term": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Long-term development suggestions (3-12 months)"
                                },
                                "rewrite_suggestions": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Specific suggestions for resume improvements"
                                }
                            }
                        }
                    }
                }
            },
            'extraction_steps': f"""
1. Analyze the resume content and job requirements thoroughly
2. Generate comprehensive feedback in {language} language following these steps:
   - Evaluate overall match quality
   - Identify and analyze key strengths with concrete examples from the resume
   - Identify gaps and their impact on candidacy
   - Create actionable improvement plan
   - Suggest specific resume improvements
3. Ensure feedback is:
   - Specific and actionable
   - Supported by examples from the resume
   - Professional but encouraging
   - In the correct language ({language})
            """,
            'model': os.getenv('AI_MODEL', 'gpt-4')
        }
    )
    response.raise_for_status()
    feedback_data = response.json().get('feedback', {})
    
    # Convert the feedback data into markdown format
    markdown = f"""# Resume Analysis Feedback

## Overview
{feedback_data.get('overview', '')}

## Key Strengths
"""
    
    for strength in feedback_data.get('strengths', []):
        markdown += f"""
### {strength['skill']}
{strength['analysis']}
**Relevance to Position**: {strength['relevance']}
"""

    markdown += "\n## Areas for Improvement\n"
    
    for gap in feedback_data.get('gaps', []):
        markdown += f"""
### {gap['skill']}
- **Importance**: {gap['importance']}
- **Impact**: {gap['impact']}
- **Suggestion**: {gap['suggestion']}
"""

    improvement_plan = feedback_data.get('improvement_plan', {})
    markdown += "\n## Improvement Plan\n"

    markdown += "\n### Short-term Actions (1-3 months)\n"
    for action in improvement_plan.get('short_term', []):
        markdown += f"- {action}\n"

    markdown += "\n### Long-term Development (3-12 months)\n"
    for action in improvement_plan.get('long_term', []):
        markdown += f"- {action}\n"

    if improvement_plan.get('rewrite_suggestions'):
        markdown += "\n### Resume Improvement Suggestions\n"
        for suggestion in improvement_plan.get('rewrite_suggestions', []):
            markdown += f"- {suggestion}\n"
    
    return markdown

@app.post("/v1/analyze-resume", tags=["Resume Analysis"])
async def analyze_resume(
    resume: UploadFile,
    job_description: str = Form(...),
    existing_job_id: str = Form(None),
    exclude_fields: str = Form(None)
):
    """
    Analyze a resume against a job description.
    
    Returns structured knowledge about the resume, matching score against the job description,
    and detailed feedback with improvement suggestions.
    
    - **resume**: The resume file to analyze (PDF format recommended)
    - **job_description**: The job description to match against
    - **existing_job_id**: Optional ID of an existing job posting
    - **exclude_fields**: Optional comma-separated list of fields to exclude from response
    """
    # Read the file content
    content = await resume.read()
    
    # Create the files dictionary for the API request
    files = {'file': (resume.filename, content, resume.content_type)}
    
    # Use the API directly since we have the file content
    response = await semantic_service.client.post(
        f"{semantic_service.base_url}/v1/tools/convert_pdf2text",
        files=files
    )
    response.raise_for_status()
    text_result = response.json()
    text_content = "\n".join(text_result.get('pages', []))

    # Detect document language
    doc_language = await detect_language(text_content)

    # Extract structured knowledge from resume
    knowledge = await semantic_service.extract_knowledge(
        text_content,
        {
            **RESUME_INDEX_CONFIG['mappings']['properties']['content']['properties'],
            "extraction_language": doc_language  # Add language hint
        }
    )

    # Analyze matching score against job description
    matching = await semantic_service.analyze_document(
        text_content,
        job_description,
        {
            **RESUME_INDEX_CONFIG['mappings']['properties']['matching_score']['properties'],
            "response_language": doc_language,  # Add language hint
            "meta": {
                "description": "Analyze the match between resume and job description",
                "response_format": f"Provide analysis in {doc_language} language"
            }
        }
    )

    # Generate comprehensive feedback
    feedback = await generate_feedback(knowledge, matching, job_description, doc_language)

    # Generate embedding for the resume only if not excluded
    embedding = None
    if not exclude_fields or 'embedding' not in exclude_fields.split(','):
        embedding = await semantic_service.generate_embedding(text_content)
    
    # Construct the complete response following the schema
    response = {
        "upload_id": hashlib.sha256(content).hexdigest()[:8],
        "job_id": existing_job_id or "direct_analysis",
        "timestamp": datetime.now().isoformat(),
        "content": knowledge,
        "file_info": {
            "name": resume.filename,
            "size": len(content),
            "mime_type": resume.content_type,
            "processed_path": None,
            "language": doc_language
        },
        "matching_score": matching,
        "feedback": feedback
    }
    
    # Add embedding only if not excluded
    if embedding is not None:
        response["embedding"] = embedding

    # Remove any other excluded fields
    if exclude_fields:
        excluded = exclude_fields.split(',')
        for field in excluded:
            if field in response:
                del response[field]
    
    return response

# Add new endpoint to retrieve feedback
@app.get("/v1/feedback/{feedback_slug}")
async def get_feedback(feedback_slug: str):
    """Retrieve feedback content by slug"""
    import os
    
    feedback_path = os.path.join("data", "feedback", f"{feedback_slug}.md")
    
    if not os.path.exists(feedback_path):
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    with open(feedback_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    return {"content": content}

class JobStatus(str, Enum):
    """Job status options"""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    CLOSED = "CLOSED"

class JobType(str, Enum):
    """Job type options"""
    # English types
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    FREELANCE = "FREELANCE"
    INTERNSHIP = "INTERNSHIP"
    VOLUNTEER = "VOLUNTEER"
    TO_BE_DETERMINED = "TO_BE_DETERMINED"
    
    # French types
    TEMPS_PLEIN = "TEMPS_PLEIN"
    TEMPS_PARTIEL = "TEMPS_PARTIEL"
    CONTRAT = "CONTRAT"
    STAGE = "STAGE"
    BENEVOLAT = "BENEVOLAT"
    A_DETERMINER = "A_DETERMINER"
    CDI = "CDI"
    CDD = "CDD"
    ALTERNANCE = "ALTERNANCE"

class Location(BaseModel):
    """Model for location fields"""
    city: str = Field(..., description="City name", example="New York")
    state: str = Field("", description="State/Province (use empty string for non-North American locations)", example="")
    country: str = Field(..., description="Country name", example="Senegal")
    postal_code: str = Field("", description="Postal/ZIP code (use empty string for non-North American locations)", example="")

class Organization(BaseModel):
    """Model for organization details"""
    id: UUID4 = Field(..., description="Organization's unique identifier")
    name: Dict[str, str] = Field(..., description="Organization name in different languages", example={"en": "Company Name", "fr": "Nom de l'entreprise"})
    tier: str = Field(..., description="Organization's subscription tier", example="FREE")
    is_mock: bool = Field(False, description="Whether this is a mock organization")
    industry: str = Field(..., description="Organization's industry sector", example="OTHER")
    logo_url: Optional[str] = Field(None, description="URL to organization's logo image")
    languages: List[str] = Field(..., description="Supported languages", example=["en", "fr"])
    created_at: datetime = Field(..., description="Organization creation timestamp")
    size_range: str = Field(..., description="Organization size range", example="1001-5000")
    updated_at: datetime = Field(..., description="Last update timestamp")
    description: Dict[str, str] = Field(..., description="Organization description in different languages")
    website_url: Optional[str] = Field(None, description="Organization's website URL")
    company_type: str = Field(..., description="Type of company", example="CORPORATION")
    founded_year: Optional[int] = Field(None, description="Year organization was founded")
    mock_batch_id: Optional[str] = Field(None, description="Batch ID if this is mock data")
    cover_image_url: Optional[str] = Field(None, description="URL to organization's cover image")
    primary_location: Dict[str, Dict[str, str]] = Field(..., description="Organization's primary location with translations")
    verification_status: str = Field(..., description="Organization verification status", example="PENDING")
    additional_locations: List = Field(default_factory=list, description="Additional organization locations")


class JobBase(BaseModel):
    """Base model for job data"""
    organization_id: UUID4 = Field(
        ..., 
        description="ID of the organization posting the job",
        example="f6560f9b-c8c4-45ae-8265-18d435a56202"
    )
    language: str = Field(
        default="en",
        description="Language of the job posting",
        example="en"
    )
    title: str = Field(
        ..., 
        description="Job title",
        example="Senior Software Engineer"
    )
    description: str = Field(
        ..., 
        description="Job description",
        example="We are looking for a senior software engineer..."
    )
    requirements: List[str] = Field(
        default_factory=list,
        description="Job requirements",
        example=[
            "5+ years of experience with Python",
            "Strong knowledge of cloud services"
        ]
    )
    skills: List[str] = Field(
        default_factory=list,
        description="Required skills (uppercase constants)",
        example=["PYTHON", "AWS", "DOCKER"]
    )
    status: JobStatus = Field(
        default=JobStatus.DRAFT,
        description="Job status",
        example="DRAFT"
    )
    location: Location = Field(
        ...,
        description="Job location details"
    )
    job_type: JobType = Field(
        ...,
        description="Type of employment",
        example="FULL_TIME"
    )
    salary_min: Optional[int] = Field(
        None,
        description="Minimum salary (null if not specified)",
        example=80000
    )
    salary_max: Optional[int] = Field(
        None,
        description="Maximum salary (null if not specified)",
        example=120000
    )
    salary_currency: str = Field(
        default="",
        description="Salary currency code (use empty string when salary is not specified)",
        example="USD"
    )
    remote: bool = Field(
        default=False,
        description="Whether the job is remote",
        example=True
    )
    rating: Optional[float] = Field(
        None,
        description="Job rating",
        example=4.5
    )
    is_mock: bool = Field(
        default=False,
        description="Whether this is mock data",
        example=False
    )
    mock_batch_id: Optional[UUID4] = Field(
        None,
        description="ID of the mock data batch",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    summary: Optional[str] = Field(
        None,
        description="Descriptive summary for the candidate to read",
        example="We are looking for a software engineer to join our team..."
    )
    organizations: Optional[Any] = Field(
        None,
        description="Organization details"
    )
    

class JobCreate(JobBase):
    """Model for creating a new job"""
    pass

class JobUpdate(JobBase):
    """Model for updating an existing job"""
    pass

class JobInDB(JobBase):
    """Model for job data as stored in the database"""
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID4: str,
            datetime: lambda v: v.isoformat()
        }

class JobList(BaseModel):
    """Response model for job listing"""
    data: List[JobInDB]
    page: int
    page_size: int
    total: int

@app.get("/v1/jobs", tags=["Jobs"], response_model=JobList)
async def list_jobs(
    select: str = None,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    id: Optional[UUID4] = None,
    language: str = Query("en", description="Language filter"),
    order: str = Query(None, description="Order by column (prefix with - for descending)")
):
    """
    Fetch jobs from Supabase database with various query options
    
    Parameters:
    - select: Comma-separated list of columns to return
    - page: Page number (0-based)
    - page_size: Number of items per page (max 100)
    - id: Filter by specific job ID (UUID)
    - language: Filter by language (default: en)
    - order: Order by column (prefix with - for descending)
    """
    try:
        query = supabase.table('jobs')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        # Handle filtering
        if id is not None:
            query = query.eq('id', str(id))  # Convert UUID to string for Supabase query
        
        # Filter by language
        query = query.eq('language', language)
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                query = query.order(order[1:], desc=True)
            else:
                query = query.order(order)
                
        # Get total count before pagination
        count_response = query.execute()
        total_count = len(count_response.data)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        return JobList(
            data=[JobInDB(**job) for job in response.data],
            page=page,
            page_size=page_size,
            total=total_count
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/jobs/{job_id}", tags=["Jobs"])
async def get_job(job_id: UUID4, select: str = None):
    """
    Fetch a specific job by ID with optional column selection
    
    Parameters:
    - job_id: The ID of the job to fetch (UUID)
    - select: Comma-separated list of columns to return
    """
    try:
        query = supabase.table('jobs')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        response = query.eq('id', str(job_id)).execute()  # Convert UUID to string for Supabase query
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
            
        return response.data[0]
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/jobs/with/{related_table}", tags=["Jobs"], response_model=JobList)
async def list_jobs_with_related(
    related_table: str,
    select: str = None,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    id: Optional[UUID4] = None,
    language: str = Query("en", description="Language filter"),
    order: str = Query(None, description="Order by column (prefix with - for descending)")
):
    """
    Fetch jobs with related table data
    
    Parameters:
    - related_table: Name of the related table to include
    - select: Comma-separated list of columns to return
    - page: Page number (0-based)
    - page_size: Number of items per page (max 100)
    - id: Filter by specific job ID (UUID)
    - language: Filter by language (default: en)
    - order: Order by column (prefix with - for descending)
    """
    try:
        # Validate related table name to prevent injection
        allowed_tables = ['organizations', 'applications', 'categories']
        if related_table not in allowed_tables:
            raise HTTPException(status_code=400, detail=f"Invalid related table. Allowed tables: {', '.join(allowed_tables)}")
        
        query = supabase.table('jobs')
        
        # Build the select statement
        if select:
            base_columns = select.replace(" ", "").split(",")
        else:
            base_columns = ["*"]
            
        # Add the related table to the selection
        select_statement = f"{','.join(base_columns)},{related_table}(*)"
        query = query.select(select_statement)
        
        # Handle filtering
        if id is not None:
            query = query.eq('id', str(id))  # Convert UUID to string for Supabase query
        
        # Filter by language
        query = query.eq('language', language)
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                query = query.order(order[1:], desc=True)
            else:
                query = query.order(order)
                
        # Get total count before pagination
        count_response = query.execute()
        total_count = len(count_response.data)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        # Convert the response data to JobInDB objects
        jobs_data = []
        for job in response.data:
            # Extract the related table data
            related_data = job.pop(related_table, None)
            
            # Add the related data back with the correct key
            job[related_table] = related_data
            
            jobs_data.append(JobInDB(**job))
        
        return JobList(
            data=jobs_data,
            page=page,
            page_size=page_size,
            total=total_count
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/jobs/search", tags=["Jobs"])
async def search_jobs(
    query: str = None,
    category: str = None,
    location: str = None,
    min_salary: float = None,
    max_salary: float = None,
    employment_type: str = None,
    page: int = 0,
    page_size: int = 10,
    order: str = None
):
    """
    Search jobs with multiple filter criteria
    
    Parameters:
    - query: Search term for job title or description
    - category: Job category
    - location: Job location
    - min_salary: Minimum salary
    - max_salary: Maximum salary
    - employment_type: Type of employment (full-time, part-time, etc.)
    - page: Page number (0-based)
    - page_size: Number of items per page
    - order: Order by column (prefix with - for descending)
    """
    try:
        db_query = supabase.table('jobs').select("*")
        
        # Apply filters
        if query:
            db_query = db_query.or_(f"title.ilike.%{query}%,description.ilike.%{query}%")
        if category:
            db_query = db_query.eq('category', category)
        if location:
            db_query = db_query.ilike('location', f'%{location}%')
        if min_salary is not None:
            db_query = db_query.gte('salary', min_salary)
        if max_salary is not None:
            db_query = db_query.lte('salary', max_salary)
        if employment_type:
            db_query = db_query.eq('employment_type', employment_type)
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                db_query = db_query.order(order[1:], desc=True)
            else:
                db_query = db_query.order(order)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        
        # Get total count before pagination
        total_count = len(db_query.execute().data)
        
        # Apply pagination
        db_query = db_query.range(start, end)
        response = db_query.execute()
        
        return {
            "data": response.data,
            "page": page,
            "page_size": page_size,
            "total": total_count,  # Now returns total count of all matching jobs
            "filters_applied": {
                "query": query,
                "category": category,
                "location": location,
                "min_salary": min_salary,
                "max_salary": max_salary,
                "employment_type": employment_type
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/jobs", tags=["Jobs"], response_model=JobInDB)
async def create_job(job: JobCreate):
    """
    Create a new job posting

    Parameters:
    - job: Job data including:
        - organization_id: UUID of the organization
        - title: Job title
        - description: Job description
        - language: Content language (e.g., "en" or "fr")
        - location: {
            city: string,
            state: string (empty for non-North American),
            country: string,
            postal_code: string (empty for non-North American)
        }
        - job_type: One of the valid job types (e.g., "A_DETERMINER" for French jobs)
        - requirements: List of strings
        - skills: List of strings
        - salary_min: number or null
        - salary_max: number or null
        - salary_currency: string (empty when salary not specified)
        - remote: boolean
        - status: "DRAFT" or "PUBLISHED"
        - is_mock: boolean

    Example request body:
    ```json
    {
        "title": "Vendeur",
        "language": "fr",
        "description": "Description du poste...",
        "requirements": ["Bac+2 en commerce", "2 ans d'expérience"],
        "skills": ["Vente", "Communication"],
        "location": {
            "city": "Dakar",
            "state": "",
            "country": "Senegal",
            "postal_code": ""
        },
        "job_type": "A_DETERMINER",
        "remote": false,
        "salary_min": null,
        "salary_max": null,
        "salary_currency": "",
        "organization_id": "uuid-here",
        "is_mock": false,
        "status": "PUBLISHED"
    }
    ```

    Returns:
    - The created job data
    """
    try:
        # Convert the job data to a JSON-serializable format
        job_data = jsonable_encoder(job)
        response = supabase.table('jobs').insert(job_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create job")
            
        return JobInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/jobs/bulk", tags=["Jobs"])
async def create_jobs_bulk(jobs: List[JobCreate]):
    """
    Create multiple job postings in bulk
    
    Parameters:
    - jobs: List of job data objects
    
    Returns:
    - The created jobs data
    """
    try:
        # Convert all jobs to JSON-serializable dictionaries
        jobs_data = [jsonable_encoder(job) for job in jobs]
        
        response = supabase.table('jobs').insert(jobs_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create jobs")
            
        return {
            "message": f"Successfully created {len(response.data)} jobs",
            "data": [JobInDB(**job) for job in response.data]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/jobs/upsert", tags=["Jobs"], response_model=JobInDB)
async def upsert_job(job: JobUpdate):
    """
    Create or update a job posting (upsert operation)
    
    Parameters:
    - job: Job data including title, description, organization_id, etc.
    
    Returns:
    - The created or updated job data
    """
    try:
        # Convert the job data to a JSON-serializable format
        job_data = jsonable_encoder(job)
        response = supabase.table('jobs').upsert(job_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to upsert job")
            
        return JobInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Organization-related enums
class OrganizationTier(str, Enum):
    """Organization tier options"""
    FREE = "FREE"
    STARTER = "STARTER"
    PROFESSIONAL = "PROFESSIONAL"
    ENTERPRISE = "ENTERPRISE"
    OTHER = "OTHER"

class OrganizationIndustry(str, Enum):
    """Industry options"""
    TECHNOLOGY = "TECHNOLOGY"
    HEALTHCARE = "HEALTHCARE"
    FINANCE = "FINANCE"
    EDUCATION = "EDUCATION"
    RETAIL = "RETAIL"
    MANUFACTURING = "MANUFACTURING"
    ENERGY = "ENERGY"
    TRANSPORTATION = "TRANSPORTATION"
    CONSTRUCTION = "CONSTRUCTION"
    AGRICULTURE = "AGRICULTURE"
    OTHER = "OTHER"

class OrganizationCompanyType(str, Enum):
    """Company type options"""
    STARTUP = "STARTUP"
    SMB = "SMB"
    ENTERPRISE = "ENTERPRISE"
    NONPROFIT = "NONPROFIT"
    GOVERNMENT = "GOVERNMENT"
    EDUCATION = "EDUCATION"
    OTHER = "OTHER"

class OrganizationSizeRange(str, Enum):
    """Company size range options"""
    MICRO = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    XLARGE = "1001-5000"
    ENTERPRISE = "5000+"

class OrganizationVerificationStatus(str, Enum):
    """Organization verification status options"""
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class OrganizationBase(BaseModel):
    """Base model for organization data"""
    name: str = Field(..., description="Organization name")
    description: str = Field(..., description="Organization description")
    language: str = Field(
        default="en",
        description="Language of the organization data",
        example="en"
    )
    tier: OrganizationTier = Field(
        default=OrganizationTier.FREE,
        description="Organization subscription tier"
    )
    industry: OrganizationIndustry = Field(
        ...,
        description="Primary industry of the organization"
    )
    company_type: OrganizationCompanyType = Field(
        ...,
        description="Type of company/organization"
    )
    founded_year: int = Field(
        ...,
        ge=1800,
        le=datetime.now().year,
        description="Year the organization was founded"
    )
    size_range: OrganizationSizeRange = Field(
        ...,
        description="Range of number of employees"
    )
    website_url: HttpUrl = Field(
        ...,
        description="Organization's website URL"
    )
    logo_url: str = Field(
        default="/placeholders/organization-logo.png",
        description="URL to organization's logo"
    )
    cover_image_url: Optional[str] = Field(
        default="/placeholders/organization-cover.png",
        description="URL to organization's cover image"
    )
    primary_location: Dict[str, str] = Field(
        ...,
        description="Primary location of the organization"
    )
    additional_locations: List[Dict[str, str]] = Field(
        default=[],
        description="Additional organization locations"
    )
    languages: List[str] = Field(
        default=["en"],
        min_items=1,
        description="Languages supported by the organization"
    )
    verification_status: OrganizationVerificationStatus = Field(
        default=OrganizationVerificationStatus.PENDING,
        description="Organization verification status"
    )
    is_mock: bool = Field(
        default=False,
        description="Whether this is mock data"
    )
    mock_batch_id: Optional[UUID4] = Field(
        None,
        description="ID of the mock data batch"
    )

class OrganizationCreate(OrganizationBase):
    """Model for creating a new organization"""
    pass

class OrganizationUpdate(OrganizationBase):
    """Model for updating an organization"""
    pass

class OrganizationInDB(OrganizationBase):
    """Model for organization data as stored in the database"""
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID4: str,
            datetime: lambda v: v.isoformat()
        }

class OrganizationList(BaseModel):
    """Response model for organization listing"""
    data: List[OrganizationInDB]
    page: int
    page_size: int
    total: int

@app.get("/v1/organizations", tags=["Organizations"], response_model=OrganizationList)
async def list_organizations(
    select: str = None,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    id: Optional[UUID4] = None,
    order: str = Query(None, description="Order by column (prefix with - for descending)")
):
    """
    Fetch organizations from Supabase database with various query options
    """
    try:
        query = supabase.table('organizations')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        # Handle filtering
        if id is not None:
            query = query.eq('id', str(id))
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                query = query.order(order[1:], desc=True)
            else:
                query = query.order(order)
                
        # Get total count before pagination
        count_response = query.execute()
        total_count = len(count_response.data)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        # Transform the data to match the Pydantic model
        transformed_data = []
        for org in response.data:
            try:
                # Ensure enums are uppercase
                org['tier'] = org.get('tier', 'FREE').upper()
                org['verification_status'] = org.get('verification_status', 'PENDING').upper()
                
                # Handle industry field - it might be a stringified JSON
                industry = org.get('industry')
                if isinstance(industry, str):
                    try:
                        if industry.startswith('{'):
                            # It's a stringified JSON, try to parse it
                            industry = 'TECHNOLOGY' if 'TECHNOLOGY' in industry.upper() else 'OTHER'
                        else:
                            industry = industry.upper()
                    except:
                        industry = 'OTHER'
                org['industry'] = industry
                
                # Handle company_type field - it might be a stringified JSON
                company_type = org.get('company_type')
                if isinstance(company_type, str):
                    try:
                        if company_type.startswith('{'):
                            # It's a stringified JSON, try to parse it
                            parsed = json.loads(company_type)
                            company_type = parsed.get('en', '').upper()
                            # Map common variations to enum values
                            company_type_mapping = {
                                'PRIVATE COMPANY': 'ENTERPRISE',
                                'PUBLIC COMPANY': 'ENTERPRISE',
                                'STARTUP COMPANY': 'STARTUP',
                                'SMALL BUSINESS': 'SMB'
                            }
                            company_type = company_type_mapping.get(company_type, 'OTHER')
                        else:
                            company_type = company_type.upper()
                    except:
                        company_type = 'OTHER'
                org['company_type'] = company_type
                
                # Handle size_range field - it might be a stringified JSON
                size_range = org.get('size_range')
                if isinstance(size_range, str):
                    try:
                        if size_range.startswith('{'):
                            # It's a stringified JSON, try to parse it
                            parsed = json.loads(size_range)
                            size_range = parsed.get('en', '1-10')
                        # Ensure it matches one of our enum values
                        valid_ranges = ['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+']
                        if size_range not in valid_ranges:
                            # Try to map to closest range
                            if '1001-5000' in size_range:
                                size_range = '1001-5000'
                            elif '5000+' in size_range:
                                size_range = '5000+'
                            else:
                                size_range = '1-10'  # Default
                    except:
                        size_range = '1-10'
                org['size_range'] = size_range
                
                # Ensure logo_url has a default value
                if org.get('logo_url') is None:
                    org['logo_url'] = "/placeholders/organization-logo.png"
                
                # Ensure cover_image_url has a default value
                if org.get('cover_image_url') is None:
                    org['cover_image_url'] = "/placeholders/organization-cover.png"
                
                # Handle localized text fields
                for field in ['name', 'description']:
                    field_value = org.get(field)
                    if isinstance(field_value, str):
                        if field_value.startswith('{'):
                            try:
                                # Try to parse stringified JSON
                                parsed = json.loads(field_value)
                                org[field] = parsed
                            except:
                                org[field] = {'en': field_value, 'fr': field_value}
                        else:
                            org[field] = {'en': field_value, 'fr': field_value}
                    elif not isinstance(field_value, dict):
                        org[field] = {'en': '', 'fr': ''}
                
                # Handle location fields
                primary_location = org.get('primary_location')
                if isinstance(primary_location, str):
                    try:
                        # Try to parse stringified JSON
                        org['primary_location'] = json.loads(primary_location)
                    except:
                        org['primary_location'] = {
                            'city': {'en': '', 'fr': ''},
                            'state': {'en': '', 'fr': ''},
                            'country': {'en': '', 'fr': ''},
                            'postal_code': {'en': '', 'fr': ''}
                        }
                elif not isinstance(primary_location, dict):
                    org['primary_location'] = {
                        'city': {'en': '', 'fr': ''},
                        'state': {'en': '', 'fr': ''},
                        'country': {'en': '', 'fr': ''},
                        'postal_code': {'en': '', 'fr': ''}
                    }
                
                # Handle additional_locations
                additional_locations = org.get('additional_locations')
                if isinstance(additional_locations, str):
                    try:
                        # Try to parse stringified JSON
                        org['additional_locations'] = json.loads(additional_locations)
                    except:
                        org['additional_locations'] = []
                elif not isinstance(additional_locations, list):
                    org['additional_locations'] = []
                
                # Ensure languages is a list with at least one item
                languages = org.get('languages')
                if isinstance(languages, str):
                    try:
                        # Try to parse stringified JSON
                        org['languages'] = json.loads(languages)
                    except:
                        org['languages'] = ['en']
                elif not isinstance(languages, list) or not languages:
                    org['languages'] = ['en']
                
                transformed_data.append(org)
            except Exception as e:
                print(f"Error transforming organization data: {str(e)}")
                continue
        
        return OrganizationList(
            data=[OrganizationInDB(**org) for org in transformed_data],
            page=page,
            page_size=page_size,
            total=total_count
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/organizations/{org_id}", tags=["Organizations"])
async def get_organization(org_id: UUID4, select: str = None):
    """
    Fetch a specific organization by ID with optional column selection
    
    Parameters:
    - org_id: The ID of the organization to fetch (UUID)
    - select: Comma-separated list of columns to return
    """
    try:
        query = supabase.table('organizations')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        response = query.eq('id', str(org_id)).execute()  # Convert UUID to string for Supabase query
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
            
        return response.data[0]
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/organizations/with/{related_table}", tags=["Organizations"])
async def get_organizations_with_related(
    related_table: str,
    select: str = None,
    page: int = 0,
    page_size: int = 10,
    order: str = None
):
    """
    Fetch organizations with related table data
    
    Parameters:
    - related_table: Name of the related table to include
    - select: Comma-separated list of columns to return
    - page: Page number (0-based)
    - page_size: Number of items per page
    - order: Order by column (prefix with - for descending)
    """
    try:
        # Validate related table name to prevent injection
        allowed_tables = ['jobs', 'applications', 'categories']  # Add your actual related tables
        if related_table not in allowed_tables:
            raise HTTPException(status_code=400, detail=f"Invalid related table. Allowed tables: {', '.join(allowed_tables)}")
        
        query = supabase.table('organizations')
        
        # Build the select statement
        if select:
            base_columns = select.replace(" ", "").split(",")
        else:
            base_columns = ["*"]
            
        # Add the related table to the selection
        select_statement = f"{','.join(base_columns)},{related_table}(*)"
        query = query.select(select_statement)
        
        # Handle ordering
        if order:
            if order.startswith('-'):
                query = query.order(order[1:], desc=True)
            else:
                query = query.order(order)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        return {
            "data": response.data,
            "page": page,
            "page_size": page_size,
            "total": len(response.data)  # Note: This is page total, not overall total
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/organizations/search", tags=["Organizations"])
async def search_organizations(
    query: str = None,
    category: str = None,
    location: str = None,
    min_size: int = None,
    max_size: int = None,
    industry: str = None,
    page: int = 0,
    page_size: int = 10,
    order: str = None
):
    """
    Search organizations with multiple filter criteria
    
    Parameters:
    - query: Search term for organization name or description
    - category: Organization category
    - location: Organization location
    - min_size: Minimum number of employees
    - max_size: Maximum number of employees
    - industry: Primary industry of the organization
    - page: Page number (0-based)
    - page_size: Number of items per page
    - order: Order by column (prefix with - for descending)
    """
    try:
        db_query = supabase.table('organizations').select("*")
        
        # Apply filters
        if query:
            db_query = db_query.or_(f"name.ilike.%{query}%,description.ilike.%{query}%")
        if category:
            db_query = db_query.eq('industry', category)
        if location:
            db_query = db_query.ilike('location', f'%{location}%')
        if min_size is not None:
            db_query = db_query.gte('size_range', min_size)
        if max_size is not None:
            db_query = db_query.lte('size_range', max_size)
        if industry:
            db_query = db_query.eq('industry', industry)
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                db_query = db_query.order(order[1:], desc=True)
            else:
                db_query = db_query.order(order)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        return {
            "data": response.data,
            "page": page,
            "page_size": page_size,
            "total": len(response.data),  # Note: This is page total, not overall total
            "filters_applied": {
                "query": query,
                "category": category,
                "location": location,
                "min_size": min_size,
                "max_size": max_size,
                "industry": industry
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/organizations", tags=["Organizations"], response_model=OrganizationInDB)
async def create_organization(org: OrganizationCreate):
    """
    Create a new organization posting
    """
    try:
        # Convert the organization data to a JSON-serializable format
        org_data = jsonable_encoder(org)
        
        # Transform the data to match existing format
        transformed_data = {
            **org_data,
            # Convert company_type to localized format
            'company_type': {
                'en': org_data['company_type'],
                'fr': org_data['company_type']
            },
            # Convert size_range to localized format
            'size_range': {
                'en': org_data['size_range'],
                'fr': org_data['size_range']
            },
            # Set NULL for empty logo/cover
            'logo_url': org_data.get('logo_url') if org_data.get('logo_url') != "/placeholders/organization-logo.png" else None,
            'cover_image_url': org_data.get('cover_image_url') if org_data.get('cover_image_url') != "/placeholders/organization-cover.png" else None,
        }
        
        response = supabase.table('organizations').insert(transformed_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create organization")
            
        return OrganizationInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/organizations/bulk", tags=["Organizations"])
async def create_organizations_bulk(orgs: List[OrganizationCreate]):
    """
    Create multiple organization postings in bulk
    """
    try:
        # Convert all organizations to JSON-serializable dictionaries and transform them
        orgs_data = []
        for org in orgs:
            org_data = jsonable_encoder(org)
            transformed_data = {
                **org_data,
                # Convert company_type to localized format
                'company_type': {
                    'en': org_data['company_type'],
                    'fr': org_data['company_type']
                },
                # Convert size_range to localized format
                'size_range': {
                    'en': org_data['size_range'],
                    'fr': org_data['size_range']
                },
                # Set NULL for empty logo/cover
                'logo_url': org_data.get('logo_url') if org_data.get('logo_url') != "/placeholders/organization-logo.png" else None,
                'cover_image_url': org_data.get('cover_image_url') if org_data.get('cover_image_url') != "/placeholders/organization-cover.png" else None,
            }
            orgs_data.append(transformed_data)
        
        response = supabase.table('organizations').insert(orgs_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create organizations")
            
        return {
            "message": f"Successfully created {len(response.data)} organizations",
            "data": [OrganizationInDB(**org) for org in response.data]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/organizations/upsert", tags=["Organizations"], response_model=OrganizationInDB)
async def upsert_organization(org: OrganizationUpdate):
    """
    Create or update an organization posting (upsert operation)
    
    Parameters:
    - org: Organization data including name, description, etc.
    
    Returns:
    - The created or updated organization data
    """
    try:
        # Convert the organization data to a JSON-serializable format
        org_data = jsonable_encoder(org)
        response = supabase.table('organizations').upsert(org_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to upsert organization")
            
        return OrganizationInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/v1/organizations/{org_id}", tags=["Organizations"], response_model=OrganizationInDB)
async def update_organization(
    org_id: UUID4,
    org_update: OrganizationUpdate
):
    """
    Update an existing organization
    
    Parameters:
    - org_id: The ID of the organization to update
    - org_update: The updated organization data
    
    Returns:
    - The updated organization data
    """
    try:
        # Check if organization exists
        check_response = supabase.table('organizations').select("id").eq('id', str(org_id)).execute()
        if not check_response.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        
        # Convert the organization data to a JSON-serializable format
        update_data = jsonable_encoder(org_update)
        response = supabase.table('organizations').update(update_data).eq('id', str(org_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update organization")
            
        return OrganizationInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/v1/organizations/{org_id}", tags=["Organizations"])
async def delete_organization(org_id: UUID4):
    """
    Delete an organization
    
    Parameters:
    - org_id: The ID of the organization to delete
    
    Returns:
    - Success message
    """
    try:
        # Check if organization exists
        check_response = supabase.table('organizations').select("id").eq('id', str(org_id)).execute()
        if not check_response.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        
        # Delete the organization
        response = supabase.table('organizations').delete().eq('id', str(org_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to delete organization")
            
        return {
            "message": "Organization deleted successfully",
            "id": org_id
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/jobs/with/{related_table}/{job_id}", tags=["Jobs"])
async def get_job_with_related(
    related_table: str,
    job_id: UUID4,
    select: str = None
):
    """
    Fetch a specific job with related table data
    
    Parameters:
    - related_table: Name of the related table to include
    - job_id: The ID of the job to fetch (UUID)
    - select: Comma-separated list of columns to return
    """
    try:
        # Validate related table name to prevent injection
        allowed_tables = ['organizations', 'applications', 'categories']
        if related_table not in allowed_tables:
            raise HTTPException(status_code=400, detail=f"Invalid related table. Allowed tables: {', '.join(allowed_tables)}")
        
        query = supabase.table('jobs')
        
        # Build the select statement
        if select:
            base_columns = select.replace(" ", "").split(",")
        else:
            base_columns = ["*"]
            
        # Add the related table to the selection
        select_statement = f"{','.join(base_columns)},{related_table}(*)"
        query = query.select(select_statement)
            
        response = query.eq('id', str(job_id)).execute()  # Convert UUID to string for Supabase query
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
            
        return response.data[0]
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def create_vector_similarity_function():
    """Create SQL function for vector similarity search on startup"""
    try:
        # Enable vector extension if not enabled
        await supabase.from_('extensions').execute(
            'create extension if not exists vector with schema extensions'
        )
        
        # Add embedding column if it doesn't exist
        await supabase.from_('jobs').execute(
            'alter table jobs add column if not exists embedding vector(384)'
        )
        
        # Create matching function
        await supabase.from_('jobs').execute("""
                create or replace function match_jobs (
                    query_embedding vector(384),
                    match_threshold float,
                    match_count int
                )
                returns table (
                    id uuid,
                    similarity float
                )
                language sql
                as $$
                    select id, 1 - (jobs.embedding <=> query_embedding) as similarity
                    from jobs
                    where 1 - (jobs.embedding <=> query_embedding) > match_threshold
                    order by jobs.embedding <=> query_embedding
                    limit match_count;
                $$;
        """)
    except Exception as e:
        print(f"Error setting up vector similarity: {str(e)}")
        # Don't raise - allow service to start without vector search

# Add webhook handler for new/updated jobs
@app.post("/v1/jobs/webhook", tags=["Jobs"])
async def handle_job_webhook(
    request: Request,
    x_webhook_token: str = Header(None, alias="X-Webhook-Token")
):
    """
    Webhook handler for job changes (create/update).
    Automatically generates embeddings for new or updated jobs.
    
    The webhook should be configured in Supabase to trigger on job insert/update.
    """
    try:
        # Verify webhook token if configured
        expected_token = os.getenv("WEBHOOK_TOKEN")
        if expected_token and x_webhook_token != expected_token:
            raise HTTPException(status_code=401, detail="Invalid webhook token")
            
        # Parse webhook payload
        payload = await request.json()
        
        # Extract job data
        job = payload.get('record', {})
        if not job:
            raise HTTPException(status_code=400, detail="No job data in webhook payload")
            
        # Generate embedding for the job
        job_text = f"{job.get('title', {}).get('en', '')} {job.get('description', {}).get('en', '')}"
        if not job_text.strip():
            raise HTTPException(status_code=400, detail="Job has no text content for embedding")
            
        embedding = await semantic_service.generate_embedding(job_text)
        
        # Update the job with the new embedding
        response = supabase.table('jobs').update({
            'embedding': embedding
        }).eq('id', job['id']).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update job with embedding")
            
        return {
            "message": "Job embedding updated successfully",
            "job_id": job['id']
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error handling webhook: {str(e)}")

@app.post("/v1/jobs/reset-embeddings", tags=["Jobs"])
async def reset_job_embeddings():
    """Reset the embeddings column to prepare for regeneration"""
    try:
        # Drop the existing embedding column
        await supabase.table('jobs').execute("""
            alter table jobs drop column if exists embedding;
            alter table jobs add column embedding vector(384);
        """)
        
        return {
            "message": "Embeddings column reset successfully",
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Error resetting embeddings",
                "error": str(e)
            }
        )

class OrganizationMemberRole(str, Enum):
    """Organization member role options"""
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    GUEST = "GUEST"

class OrganizationMemberStatus(str, Enum):
    """Organization member status options"""
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    INACTIVE = "INACTIVE"
    REJECTED = "REJECTED"

class OrganizationMemberBase(BaseModel):
    """Base model for organization member data"""
    organization_id: UUID4 = Field(..., description="ID of the organization")
    user_id: UUID4 = Field(..., description="ID of the user")
    role: OrganizationMemberRole = Field(
        default=OrganizationMemberRole.MEMBER,
        description="Role of the member in the organization"
    )
    title: str = Field(
        default="",
        description="Job title of the member"
    )
    permissions: Dict[str, Any] = Field(
        default={},
        description="JSON object containing member permissions"
    )
    invited_by: Optional[UUID4] = Field(
        None,
        description="ID of the user who invited this member"
    )
    status: OrganizationMemberStatus = Field(
        default=OrganizationMemberStatus.PENDING,
        description="Status of the membership"
    )
    is_mock: bool = Field(
        default=False,
        description="Whether this is mock data"
    )
    mock_batch_id: Optional[UUID4] = Field(
        None,
        description="ID of the mock data batch"
    )

class OrganizationMemberCreate(OrganizationMemberBase):
    """Model for creating a new organization member"""
    pass

class OrganizationMemberUpdate(OrganizationMemberBase):
    """Model for updating an organization member"""
    pass

class OrganizationMemberInDB(OrganizationMemberBase):
    """Model for organization member data as stored in the database"""
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID4: str,
            datetime: lambda v: v.isoformat()
        }

class OrganizationMemberList(BaseModel):
    """Response model for organization member listing"""
    data: List[OrganizationMemberInDB]
    page: int
    page_size: int
    total: int

@app.get("/v1/organization-members", tags=["Organization Members"], response_model=OrganizationMemberList)
async def list_organization_members(
    select: str = None,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    organization_id: Optional[UUID4] = None,
    user_id: Optional[UUID4] = None,
    role: Optional[OrganizationMemberRole] = None,
    status: Optional[OrganizationMemberStatus] = None,
    order: str = Query(None, description="Order by column (prefix with - for descending)")
):
    """
    Fetch organization members with various query options
    """
    try:
        query = supabase.table('organization_members')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        # Handle filtering
        if organization_id:
            query = query.eq('organization_id', str(organization_id))
        if user_id:
            query = query.eq('user_id', str(user_id))
        if role:
            query = query.eq('role', role)
        if status:
            query = query.eq('status', status)
            
        # Handle ordering
        if order:
            if order.startswith('-'):
                query = query.order(order[1:], desc=True)
            else:
                query = query.order(order)
                
        # Get total count before pagination
        count_response = query.execute()
        total_count = len(count_response.data)
                
        # Handle pagination
        start = page * page_size
        end = start + page_size - 1
        query = query.range(start, end)
        
        response = query.execute()
        
        return OrganizationMemberList(
            data=[OrganizationMemberInDB(**member) for member in response.data],
            page=page,
            page_size=page_size,
            total=total_count
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/organization-members/{member_id}", tags=["Organization Members"])
async def get_organization_member(member_id: UUID4, select: str = None):
    """
    Fetch a specific organization member by ID
    """
    try:
        query = supabase.table('organization_members')
        
        # Handle column selection
        if select:
            columns = select.replace(" ", "").split(",")
            query = query.select(",".join(columns))
        else:
            query = query.select("*")
            
        response = query.eq('id', str(member_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Organization member with ID {member_id} not found")
            
        return response.data[0]
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/organization-members", tags=["Organization Members"], response_model=OrganizationMemberInDB)
async def create_organization_member(member: OrganizationMemberCreate):
    """
    Create a new organization member
    """
    try:
        # Convert the member data to a JSON-serializable format
        member_data = jsonable_encoder(member)
        response = supabase.table('organization_members').insert(member_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create organization member")
            
        return OrganizationMemberInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/organization-members/bulk", tags=["Organization Members"])
async def create_organization_members_bulk(members: List[OrganizationMemberCreate]):
    """
    Create multiple organization members in bulk
    """
    try:
        # Convert all members to JSON-serializable dictionaries
        members_data = [jsonable_encoder(member) for member in members]
        
        response = supabase.table('organization_members').insert(members_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create organization members")
            
        return {
            "message": f"Successfully created {len(response.data)} organization members",
            "data": [OrganizationMemberInDB(**member) for member in response.data]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/v1/organization-members/{member_id}", tags=["Organization Members"], response_model=OrganizationMemberInDB)
async def update_organization_member(
    member_id: UUID4,
    member_update: OrganizationMemberUpdate
):
    """
    Update an existing organization member
    """
    try:
        # Check if member exists
        check_response = supabase.table('organization_members').select("id").eq('id', str(member_id)).execute()
        if not check_response.data:
            raise HTTPException(status_code=404, detail=f"Organization member with ID {member_id} not found")
        
        # Convert the member data to a JSON-serializable format
        update_data = jsonable_encoder(member_update)
        response = supabase.table('organization_members').update(update_data).eq('id', str(member_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update organization member")
            
        return OrganizationMemberInDB(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/v1/organization-members/{member_id}", tags=["Organization Members"])
async def delete_organization_member(member_id: UUID4):
    """
    Delete an organization member
    """
    try:
        # Check if member exists
        check_response = supabase.table('organization_members').select("id").eq('id', str(member_id)).execute()
        if not check_response.data:
            raise HTTPException(status_code=404, detail=f"Organization member with ID {member_id} not found")
        
        # Delete the member
        response = supabase.table('organization_members').delete().eq('id', str(member_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to delete organization member")
            
        return {
            "message": "Organization member deleted successfully",
            "id": member_id
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/process-pdf", tags=["Document Processing"])
async def process_pdf(file_path: str):
    """
    Process a PDF file and extract its text content.
    
    Parameters:
    - file_path: Path to the PDF file in Supabase storage
    
    Returns:
    - The extracted text content
    """
    try:
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        temp_path = Path(temp_dir) / "temp.pdf"
        
        # Download file from Supabase storage using storage bucket
        bucket_name = 'temp-uploads'
        try:
            data = supabase.storage.get_bucket(bucket_name).download(file_path)
            async with aiofiles.open(temp_path, 'wb') as f:
                await f.write(data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error downloading file from storage: {str(e)}"
            )
        
        # Process PDF
        text_result = await semantic_service.convert_pdf_to_text(temp_path)
        text_content = "\n".join(text_result.get('pages', []))
        
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Delete file from storage
        try:
            supabase.storage.get_bucket(bucket_name).remove([file_path])
        except Exception as e:
            print(f"Warning: Failed to delete temporary file {file_path}: {str(e)}")
        
        return {
            "text": text_content
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )

@app.post("/v1/tools/extract_job_data", tags=["Document Processing"])
async def extract_job_data(
    request: Request,
    text: str,
    filename: str,
    target_schema: Dict
):
    """
    Extract structured job data from text using LLM.
    
    Parameters:
    - text: The job description text to process
    - filename: Original filename (used for context)
    - target_schema: JSON schema defining the expected structure
    
    Returns:
    - Structured job data matching the schema
    """
    try:
        semantic_service = SemanticService()
        
        # Detect language to handle non-English content
        language = await detect_language(text)
        
        # If not English, translate first
        if language != 'en':
            # TODO: Add translation service
            pass
            
        # Extract structured data using LLM
        extracted_data = await semantic_service.extract_knowledge(
            text=text,
            schema=target_schema,
            extraction_steps=[
                "Read and understand the job description text",
                "Identify key job details like title, type, location, and remote status",
                "Extract and structure the information according to the schema",
                "Ensure all required fields are populated with reasonable defaults if not explicitly stated"
            ]
        )
        
        # Validate the extracted data matches our schema
        try:
            JobCreate(**extracted_data)
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Extracted data does not match job schema: {str(e)}"
            )
            
        return extracted_data
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting job data: {str(e)}"
        )

@app.post("/v1/jobs/convert-pdf", tags=["Jobs"])
async def convert_job_pdf(
    file: UploadFile = File(...),
):
    """Convert a job description PDF to text"""
    try:
        content = await file.read()
        temp_dir = tempfile.mkdtemp()
        temp_path = Path(temp_dir) / "job.pdf"
        
        # Save uploaded file
        async with aiofiles.open(temp_path, 'wb') as f:
            await f.write(content)
        
        # Convert to text
        text_result = await semantic_service.convert_pdf_to_text(temp_path)
        text_content = "\n".join(text_result.get('pages', []))
        
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return {
            "text": text_content
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error converting PDF: {str(e)}"
        )

# @app.post("/v1/jobs/extract-data", tags=["Jobs"])
# async def extract_job_data(body: Dict = Body(...)):
#     """Extract structured job data from text using spaCy"""
#     try:
#         text = body.get('text')
#         filename = body.get('filename', '')
#         organization_id = body.get('organization_id')
#         is_mock = body.get('is_mock', False)
#         status = body.get('status', 'DRAFT')
        
#         if not text:
#             raise HTTPException(status_code=422, detail="Text is required in request body")
            
#         if not organization_id:
#             raise HTTPException(status_code=422, detail="organization_id is required")

#         # Use spaCy to extract structured data
#         doc = nlp(text)
        
#         # Extract title from first sentence
#         title = next((sent.text.strip() for sent in doc.sents), "Untitled Position")
        
#         # Extract location information
#         locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
#         location = {
#             "city": {"en": locations[0] if locations else "", "fr": ""},
#             "state": {"en": locations[1] if len(locations) > 1 else "", "fr": ""},
#             "country": {"en": locations[-1] if locations else "", "fr": ""},
#             "postal_code": {"en": "", "fr": ""}
#         }
        
#         # Extract skills (technical terms and proper nouns)
#         skills = list(set([
#             ent.text.upper() for ent in doc.ents 
#             if ent.label_ in ["ORG", "PRODUCT"] 
#             or (ent.text.isupper() and len(ent.text) > 1)
#         ]))
        
#         # Extract requirements (bullet points or numbered lists)
#         requirements = [
#             sent.text.strip() 
#             for sent in doc.sents 
#             if any(char in sent.text for char in ["•", "-", "●"]) 
#             or sent.text.strip().startswith(tuple("123456789"))
#         ]
        
#         # Determine job type
#         job_types = {
#             "full time": "FULL_TIME",
#             "part time": "PART_TIME",
#             "contract": "CONTRACT",
#             "freelance": "FREELANCE",
#             "intern": "INTERNSHIP",
#             "volunteer": "VOLUNTEER"
#         }
        
#         job_type = "TO_BE_DETERMINED"
#         text_lower = text.lower()
#         for key, value in job_types.items():
#             if key in text_lower:
#                 job_type = value
#                 break
        
#         # Create structured response
#         extracted_data = {
#             "title": {"en": title, "fr": title},
#             "description": {"en": text, "fr": text},
#             "location": location,
#             "requirements": {"en": requirements, "fr": requirements},
#             "skills": skills,
#             "job_type": job_type,
#             "remote": "remote" in text_lower or "télétravail" in text_lower,
#             "organization_id": organization_id,
#             "status": status,
#             "is_mock": is_mock,
#             "salary_currency": "USD"
#         }
        
#         logger.info(f"Successfully extracted job data from {filename}")
#         return extracted_data

#     except Exception as e:
#         logger.error(f"Error extracting job data from {filename}: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to extract job data: {str(e)}"
#         )

@app.post("/v1/test/process-resume", tags=["Testing"])
async def test_resume_processing(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_id: str = Form(default="test_job_123")
):
    """
    Test endpoint for resume processing with detailed logging
    
    This endpoint processes a resume file and generates a semantic index name based on the job ID.
    It then ensures the job index exists and processes the resume file, providing progress updates.
    
    Parameters:
    - file: The resume file to process
    - job_description: The job description text
    - job_id: The job ID (default: "test_job_123")

    Returns:
    - A JSON object containing the result of the resume processing

    Raises:
    - HTTPException: 500 if there is an error processing the resume
    - HTTPException: 404 if the job is not found
    """
    try:
        # Create temp directory for processing
        temp_dir = Path(tempfile.mkdtemp())
        file_path = temp_dir / file.filename
        
        try:
            # Save uploaded file
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Generate unique upload ID
            upload_id = generate_upload_id(content, job_id)
            
            # Create semantic service instance
            semantic_service = SemanticService()
            
            # Create index name
            index_name = generate_index_name(job_id)
            await ensure_job_index(job_id)
            
            # Process the PDF
            async def progress_callback(info: Dict):
                print("\nProgress Update:", json.dumps(info, indent=2))
            
            result = await process_single_pdf(
                file_path=file_path,
                dest_path=file_path,
                semantic_service=semantic_service,
                index_name=index_name,
                upload_id=upload_id,
                job_id=job_id,
                job_description=job_description,
                progress_callback=progress_callback
            )
            
            return {
                "message": "Resume processing completed",
                "result": result
            }
            
        finally:
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except Exception as e:
        print(f"Error in test endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Error processing resume",
                "error": str(e)
            }
        )



@app.get("/v1/jobs/{job_id}/matches", tags=["Jobs"])
async def get_job_matches(
    job_id: UUID4,
    offset: int = Query(0, ge=0),
    limit: int = Query(5000, le=10000),
    exclude_fields: str = Query(None)
):
    """
    Fetches candidate matches for a specific job from the semantic search index.
    
    This endpoint retrieves candidate matches by:
    1. Validating the job exists
    2. Generating the correct semantic index name 
    3. Querying the remote semantic service for matches

    Parameters:
        job_id (UUID4): UUID of the job to fetch matches for
        offset (int): Starting offset for paginating through matches (min: 0)
        limit (int): Maximum number of matches to return (max: 10000)
        exclude_fields (str): Optional comma-separated list of fields to exclude from results

    Returns:
        dict: JSON object containing:
            - matches: Array of candidate match objects
            - total: Total number of matches found

    Raises:
        HTTPException: 404 if job is not found
        HTTPException: 500 for other server errors
    """
    try:
        # First get the job to ensure it exists and get its title
        job_response = await get_job(job_id)
        if not job_response:
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
            
        # Generate the correct index name
        index_name = generate_index_name(str(job_id), job_response.get('title', {}).get('en', ''))
        
        # Fetch matches from the semantic service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{REMOTE_API_URL}/v1/index/{index_name}/matches",
                params={
                    'offset': offset,
                    'size': limit,
                    'exclude_fields': exclude_fields
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return {"matches": [], "total": 0}
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Import our new job processing module
from .jobs.routes import router as jobs_v2_router

# Add the v2 jobs router
app.include_router(jobs_v2_router)

class ProcessingError(Exception):
    """Exception raised when processing a file fails"""
    def __init__(self, file_path: str, operation: str, error: Exception):
        self.file_path = file_path
        self.operation = operation
        self.original_error = error
        self.message = f"Error during {operation} for file {file_path}: {str(error)}"
        super().__init__(self.message)

# Load configuration from environment variables
REMOTE_API_URL = os.getenv("REMOTE_API_URL")
if not REMOTE_API_URL:
    print("Warning: REMOTE_API_URL not set, services will use mock mode")

# Initialize logger
logger = logging.getLogger(__name__)

@app.post("/v1/jobs/extract-data", tags=["Jobs"])
async def extract_job_data(body: Dict = Body(...)):
    """Extract structured job data from text content"""
    try:
        text = body.get("text", "")
        filename = body.get("filename", "unknown")
        organization_id = body.get("organization_id")
        is_mock = body.get("is_mock", False)
        status = body.get("status", "DRAFT")

        if not text or not organization_id:
            raise ValueError("Text content and organization_id are required")

        # Define the schema for job data extraction
        schema = {
            "title": {"type": "string", "required": True},
            "language": {"type": "string", "required": True, "description": "The language of the job description. This should be a valid language code like 'en', 'fr', 'es', etc."},
            "description": {"type": "string", "required": True},
            "requirements": {"type": "array", "items": {"type": "string"}},
            "skills": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string", "required": True, "description": "A thorough summary of the job in a digest format that includes the description, requirements, and skills. This should be a minimum of 2 paragraphs that is directly addressed to the candidate. Add as many details as possible to make it as useful as possible for the candidate."},
            "location": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Can be a single city or a comma delimited list of locations"},
                    "state": {"type": "string", "description": "Only required if the detected country is the United States, Canada, or Mexico. Can be a single state or a comma delimited list of states. Should be null for other countries."},
                    "country": {"type": "string"},
                    "postal_code": {"type": "string", "description": "Only required if the detected country is the United States, Canada, or Mexico. Should be null for other countries."}
                },
                "required": ["city", "country"]
            },
            "job_type": {"type": "string", "description": "Regardless of the language, escape all accent and special characters and return it as an all caps slug with an underscore as the delimiter."},
            "remote": {"type": "boolean", "description": "Assess whether the job is remote or not based on the document language and if the remote keyword is present or implied."},
            "salary_min": {"type": "number", "description": "Minimum salary. If not specified, should be null."},
            "salary_max": {"type": "number", "description": "Maximum salary. If not specified, should be null."},
            "salary_currency": {"type": "string", "description": "Currency code. Should only be provided if both salary_min and salary_max are specified, otherwise should be null."},
            "questions": {"type": "array", "items": {"type": "object", "properties": {
                "question": {"type": "string", "description": "The question to ask the candidate."},
                "type": {"type": "string", "description": "The type of question to ask the candidate. This should be a valid question type like 'text', 'number', 'boolean', 'date', etc."},
                "required": {"type": "boolean", "description": "Whether the question is required or not."}
            }}}
        }

        # Extract job data using semantic service
        data = await semantic_service.extract_knowledge(text, schema)
        
        extracted_data = data.get("data", None)
        if not extracted_data:
            raise ValueError("Failed to extract job data from text")

        # Add required fields
        extracted_data["organization_id"] = organization_id
        extracted_data["is_mock"] = is_mock
        extracted_data["status"] = status

        logger.info(f"Successfully extracted job data from {filename}")
        return extracted_data

    except ValueError as e:
        logger.error(f"Validation error extracting job data from {filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error extracting job data from {filename}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Load spaCy model for text processing
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spaCy model not found, downloading...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logger.error(f"Failed to load spaCy model: {str(e)}")
    raise

def extract_structured_data(text: str) -> Dict:
    """Extract structured job data from text using spaCy"""
    doc = nlp(text)
    
    # Basic extraction of title (first sentence usually contains the role)
    title = next((sent.text for sent in doc.sents), "").strip()
    
    # Extract skills (look for technical terms and proper nouns)
    skills = list(set([
        ent.text.upper() for ent in doc.ents 
        if ent.label_ in ["ORG", "PRODUCT", "GPE"] 
        or ent.text.isupper()
    ]))
    
    # Extract location information (look for GPE entities)
    locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
    location = {
        "city": locations[0] if locations else "",
        "state": locations[1] if len(locations) > 1 else "",
        "country": locations[-1] if locations else "",
        "postal_code": ""
    }
    
    # Extract job type (look for common patterns)
    job_types = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "VOLUNTEER"]
    job_type = next(
        (jt for jt in job_types if jt.lower().replace("_", " ") in text.lower()),
        "FULL_TIME"  # Default to full time
    )
    
    # Extract requirements (look for bullet points or numbered lists)
    requirements = []
    for sent in doc.sents:
        sent_text = sent.text.strip()
        if sent_text.startswith("•") or sent_text.startswith("-") or re.match(r"^\d+\.", sent_text):
            requirements.append(sent_text)
    
    # Create a summary
    summary = text[:500] + "..." if len(text) > 500 else text
    
    # Detect language
    language = detect_language(text)
    
    return {
        "title": title,
        "description": text,
        "requirements": requirements,
        "skills": skills,
        "location": location,
        "job_type": job_type,
        "language": language,
        "summary": summary
    }
