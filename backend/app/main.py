from fastapi import FastAPI, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
import aiofiles
import mimetypes
from typing import Dict, List
import humanize
import hashlib
from datetime import datetime
import json
from enum import Enum

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="HawkHire Local API",
    description="Local API for HawkHire application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Remote API URLs
REMOTE_API_URL = "http://147.79.115.55:8000"
SEMANTIC_SEARCH_URL = os.getenv("SEMANTIC_SEARCH_URL", REMOTE_API_URL)  # Default to REMOTE_API_URL if not set

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

class SemanticService:
    """Service layer for interacting with the semantic search API"""
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def convert_pdf_to_text(self, file_path: Path) -> Dict:
        """Convert PDF file to text using the API"""
        async with aiofiles.open(file_path, 'rb') as f:
            content = await f.read()
            files = {'file': (file_path.name, content, 'application/pdf')}
            response = await self.client.post(
                f"{self.base_url}/v1/tools/convert_pdf2text",
                files=files
            )
            response.raise_for_status()
            return response.json()

    async def analyze_document(self, text: str, job_description: str) -> Dict:
        """Analyze document content and compare with job description"""
        response = await self.client.post(
            f"{self.base_url}/v1/tools/convert_doc2json",
            json={
                'text': f"cv: {text}\n### job: {job_description}",
                'target_json_schema': {
                    "score": {
                        "type": "array of object where each object is {'domain': 'string', 'value': 'float'}",
                        "description": "semantic score matching job/candidate entre 0 et 1"
                    },
                    "justification": {
                        "type": "string",
                        "description": "justification du score de matching"
                    }
                },
                'extraction_steps': 'analyze the input text, fill all fields',
                'model': 'gpt-4'
            }
        )
        response.raise_for_status()
        return response.json()

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
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

    async def index_document(self, index_name: str, doc_id: str, document: Dict) -> Dict:
        """Index a processed document"""
        response = await self.client.post(
            f"{self.base_url}/v1/index/{index_name}/document/{doc_id}",
            json={'structured_doc': document}
        )
        response.raise_for_status()
        return response.json()

    async def create_index(self, index_name: str, config: Dict) -> Dict:
        """Create a new search index"""
        response = await self.client.post(
            f"{self.base_url}/v1/index/{index_name}",
            json=config
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Initialize the semantic service
semantic_service = SemanticService(SEMANTIC_SEARCH_URL)

async def create_semantic_index(index_name: str) -> Dict:
    """Create a new semantic search index with the specified configuration"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SEMANTIC_SEARCH_URL}/v1/index/{index_name}",
                json=RESUME_INDEX_CONFIG,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error creating index: {str(e)}")  # Debug logging
            print(f"Response content: {e.response.content if hasattr(e, 'response') else 'No response'}")
            raise

@app.post("/v1/index/{index_name}")
async def create_index(index_name: str):
    """Endpoint to create a new semantic search index"""
    try:
        result = await create_semantic_index(index_name)
        return {"message": f"Index '{index_name}' created successfully", "details": result}
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, 'response') else 500,
            detail=f"Error from semantic search API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

def generate_upload_id(file_content: bytes, job_id: str) -> str:
    """Generate a unique ID for an upload based on content hash and job ID"""
    content_hash = hashlib.sha256(file_content).hexdigest()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    upload_id = f"{job_id}_{timestamp}_{content_hash[:8]}"
    return upload_id

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

async def process_zip_file(zip_file: UploadFile, job_id: str) -> Dict:
    """Process uploaded ZIP file containing resumes"""
    # First save the upload
    upload_info = await save_upload(zip_file, job_id)
    
    # Create a temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir) / zip_file.filename
        
        # Read the saved file
        async with aiofiles.open(upload_info["file_path"], 'rb') as file:
            content = await file.read()
            
        # Save to temp for processing
        async with aiofiles.open(temp_path, 'wb') as out_file:
            await out_file.write(content)
        
        try:
            # Extract zip
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                extract_path = Path(temp_dir) / "extracted"
                extract_path.mkdir(exist_ok=True)
                zip_ref.extractall(extract_path)
            
            # Process files
            files: List[Dict] = []
            total_size = 0
            file_types = {}  # Track count of each file type
            processed_files = []  # Track successfully processed files
            failed_files = []  # Track failed files
            
            # Save extracted files to processed directory
            processed_path = PROCESSED_DIR / upload_info["upload_id"]
            processed_path.mkdir(parents=True, exist_ok=True)
            
            for file_path in extract_path.rglob('*'):
                if not file_path.is_file():
                    continue

                stats = FileStats(file_path)
                # Copy to processed directory
                dest_path = processed_path / file_path.relative_to(extract_path)
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file_path, dest_path)
                
                file_info = {
                    "name": stats.name,
                    "size": stats.size,
                    "human_size": stats.human_size,
                    "mime_type": stats.mime_type,
                    "processed_path": str(dest_path)
                }

                # Process PDFs through semantic service
                if stats.mime_type == 'application/pdf':
                    try:
                        print(f"Processing PDF: {dest_path}")  # Debug log
                        # Convert PDF to text
                        text_result = await semantic_service.convert_pdf_to_text(dest_path)
                        print(f"Text extraction result: {json.dumps(text_result, indent=2)[:500]}...")  # Debug log
                        text_content = "\n".join(text_result.get('pages', []))
                        
                        # Generate document ID
                        doc_id = hashlib.sha256(text_content.encode()).hexdigest()
                        print(f"Generated doc_id: {doc_id}")  # Debug log
                        
                        # Add to processed files
                        file_info.update({
                            "doc_id": doc_id,
                            "text_content": text_content[:500] + "...",  # Truncate for logging
                            "status": "processed"
                        })
                        processed_files.append(file_info)
                        print(f"Successfully processed {dest_path}")  # Debug log
                    except Exception as e:
                        print(f"Error processing PDF {dest_path}: {str(e)}")  # Debug log
                        file_info.update({
                            "status": "failed",
                            "error": str(e)
                        })
                        failed_files.append(file_info)
                else:
                    file_info.update({"status": "unsupported"})

                files.append(file_info)
                total_size += stats.size
                
                # Count file types
                file_type = stats.mime_type.split('/')[0] if stats.mime_type else 'unknown'
                file_types[file_type] = file_types.get(file_type, 0) + 1
            
            # Add upload info to response
            return {
                "upload_id": upload_info["upload_id"],
                "job_id": job_id,
                "total_files": len(files),
                "total_size": total_size,
                "human_total_size": humanize.naturalsize(total_size),
                "file_types": file_types,
                "processed_count": len(processed_files),
                "failed_count": len(failed_files),
                "files": sorted(files, key=lambda x: x["size"], reverse=True),  # Sort by size
                "timestamp": upload_info["timestamp"]
            }
            
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid zip file")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-zip")
async def process_zip(
    file: UploadFile,
    job_id: str = Form(...),  # Use Form to get from form data
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    return await process_zip_file(file, job_id)

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
