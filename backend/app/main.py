from fastapi import FastAPI, UploadFile, HTTPException, Form
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
from typing import Dict, List
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

# Load environment variables
load_dotenv()

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
SEMANTIC_SEARCH_URL = REMOTE_API_URL

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
        
    async def extract_knowledge(self, text: str, schema: Dict) -> Dict:
        """Analyze document content and compare with job description"""
        response = await self.client.post(
            f"{self.base_url}/v1/tools/convert_doc2json",
            json={
                'text': f"cv: {text}",
                'target_json_schema': {
                    "title": {
                        "type": "text",
                        "description": "Resume title or headline"
                    },
                    "profile": {
                        "type": "object with keys",
                        "description": "Personal contact information",
                        "properties": {
                            "first_name": {"type": "text", "description": "First name"},
                            "last_name": {"type": "text", "description": "Last name"},
                            "tel_num": {"type": "keyword", "description": "Phone number"},
                            "email": {"type": "keyword", "description": "Email address"}
                        }
                    },
                    "years_of_experience": {
                        "type": "integer", 
                        "description": "Years of experience"
                    },
                    "summary": {
                        "type": "text", 
                        "description": "Professional summary"
                    },
                "skills": {
                    "type": "array of object where each object is {'skill': 'text', 'score': 'integer'}",
                    "description": "Liste des compétences professionnelles du candidat",
                    "properties": {
                        "skill": {"type": "text", "description": "Nom de la compétence"},
                        "score": {"type": "integer", "description": "Niveau de la compétence (0-1)"}
                    }
                },
                "topics": {
                    "type": "keyword", 
                    "description": "Mots clés professionnels du candidat"
                }
            },
                'extraction_steps': 'tout les champs sont requis. le document est un cv',
                'model': 'gpt-4'
            }
        )
        response.raise_for_status()
        return response.json()


    async def analyze_document(self, text: str, job_description: str, schema: Dict) -> Dict:
        """Analyze document content and compare with job description"""
        response = await self.client.post(
            f"{self.base_url}/v1/tools/convert_doc2json",
            json={
                'text': f"cv: {text}\n### job: {job_description}",
                'target_json_schema': schema,
                'extraction_steps': 'anlysze the matching of the cv with the job description and provide a score and justification',
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
semantic_service = SemanticService(REMOTE_API_URL)

async def create_semantic_index(index_name: str) -> Dict:
    """Create a new semantic search index with the specified configuration"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{REMOTE_API_URL}/v1/index/{index_name}",
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

async def process_single_pdf(
    file_path: Path,
    dest_path: Path,
    semantic_service: SemanticService,
    index_name: str,
    upload_id: str,
    job_id: str,
    progress_callback: callable
) -> Dict:
    """Process a single PDF file with all necessary steps"""
    try:
        stats = FileStats(file_path)
        timings = {}
        
        # Convert PDF to text
        text_start = time.time()
        text_result = await semantic_service.convert_pdf_to_text(dest_path)
        text_content = "\n".join(text_result.get('pages', []))
        timings['text_extraction'] = time.time() - text_start
        
        # Generate document ID
        doc_id = hashlib.sha256(text_content.encode()).hexdigest()
        
        # Generate embedding
        embedding_start = time.time()
        embedding = await semantic_service.generate_embedding(text_content)
        timings['embedding'] = time.time() - embedding_start
        
        job_description = """
            # Ingénieur Deep Learning & Image Processing

## À propos du poste
Nous recherchons un(e) ingénieur(e) talentueux(se) spécialisé(e) en deep learning et traitement d'images pour rejoindre notre équipe R&D. Le candidat idéal associera une expertise technique pointue en deep learning à une solide expérience en optimisation GPU et conteneurisation.

## Responsabilités principales
- Concevoir et développer des solutions innovantes de traitement d'images basées sur le deep learning
- Optimiser les performances des modèles sur GPU en utilisant CUDA
- Implémenter des pipelines de traitement distribué avec ZeroMQ
- Conteneuriser les applications avec Docker pour faciliter le déploiement
- Collaborer avec les équipes produit pour l'intégration des solutions
- Assurer une veille technologique active dans le domaine

## Compétences techniques requises
### Deep Learning & Computer Vision
- Maîtrise des frameworks de deep learning (PyTorch, TensorFlow)
- Expertise en traitement d'images et computer vision
- Expérience pratique avec les architectures CNN, transformers et detection/segmentation
- Connaissance approfondie des techniques d'optimisation de modèles

### Développement & Optimisation
- Expertise en programmation CUDA pour l'accélération GPU
- Maîtrise de Python et C++
- Expérience avec ZeroMQ pour la communication distribuée
- Pratique de Docker et des outils de conteneurisation
- Bonnes pratiques de versioning (Git) et CI/CD

### Compétences additionnelles appréciées
- Expérience avec Kubernetes
- Connaissance des plateformes cloud (AWS, GCP, Azure)
- Contributions à des projets open source
- Publications scientifiques dans le domaine

## Formation & Expérience
- Master ou Doctorat en Computer Science, Machine Learning ou domaine connexe
- Minimum 5 ans d'expérience professionnelle en deep learning
- Portfolio de projets démontrant une expertise en traitement d'images

## Qualités personnelles
- Forte capacité d'analyse et de résolution de problèmes
- Excellentes aptitudes en communication technique
- Autonomie et prise d'initiative
- Esprit d'équipe et collaboration
- Passion pour l'innovation technologique

## Environnement de travail
- Équipe internationale et dynamique
- Projets innovants à fort impact
- Infrastructure de calcul GPU dernière génération
- Possibilité de télétravail partiel
- Formation continue et participation à des conférences
        """
        # text to json 

        # Create structured document
        extracted_knowledge = await semantic_service.extract_knowledge(text_content, RESUME_INDEX_CONFIG['mappings']['properties']['content']['properties'])
        extracted_matching_score = await semantic_service.analyze_document(text_content, job_description, RESUME_INDEX_CONFIG['mappings']['properties']['matching_score']['properties'])
        document = {
            "upload_id": upload_id,
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "content": extracted_knowledge,
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
        indexing_start = time.time()
        await semantic_service.index_document(index_name, doc_id, document)
        timings['indexing'] = time.time() - indexing_start
        
        # Calculate total API time
        total_api_time = sum(timings.values())
        print(f"API calls timing for {stats.name}:")
        print(f"  Text Extraction: {timings['text_extraction']:.2f}s")
        print(f"  Embedding: {timings['embedding']:.2f}s")
        print(f"  Indexing: {timings['indexing']:.2f}s")
        print(f"  Total API Time: {total_api_time:.2f}s")
        
        file_info = {
            "name": stats.name,
            "size": stats.size,
            "human_size": stats.human_size,
            "mime_type": stats.mime_type,
            "processed_path": str(dest_path),
            "doc_id": doc_id,
            "text_content": text_content[:500] + "...",
            "status": "processed",
            "indexed": True,
            "timings": timings
        }
        
        # Call progress callback
        await progress_callback(file_info)
        
        return file_info
    except Exception as e:
        print(f"Error processing PDF {dest_path}: {str(e)}")
        return {
            "name": file_path.name,
            "size": file_path.stat().st_size,
            "human_size": humanize.naturalsize(file_path.stat().st_size),
            "mime_type": 'application/pdf',
            "processed_path": str(dest_path),
            "status": "failed",
            "error": str(e)
        }

async def process_zip_file(zip_file: UploadFile, job_id: str, job_title: str = "") -> Dict:
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
        
        # Extract zip
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            extract_path = Path(temp_dir) / "extracted"
            extract_path.mkdir(exist_ok=True)
            zip_ref.extractall(extract_path)
        
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
            shutil.copy2(file_path, dest_path)
            
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
        semaphore = asyncio.Semaphore(15)  # Increased from 10 to 20 concurrent tasks
        
        async def process_with_semaphore(file_path, dest_path):
            async with semaphore:
                return await process_single_pdf(
                    file_path,
                    dest_path,
                    semantic_service,
                    index_name,
                    upload_info["upload_id"],
                    job_id,
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
                if file_info["status"] == "processed":
                    processed_files.append(file_info)
                    processed_count += 1
                else:
                    failed_files.append(file_info)
                    failed_count += 1
                
                yield json.dumps({
                    "event": "file_processed" if file_info["status"] == "processed" else "file_failed",
                    "file_name": file_info["name"],
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
            "processed_count": len([f for f in processed_files if f["status"] == "processed"]),
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
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/process-zip")
async def process_zip(
    file: UploadFile,
    job_id: str = Form(...),
    job_title: str = Form(""),
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
            async for event in process_zip_file(new_file, job_id, job_title):
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

@app.get("/v1/jobs")
async def list_jobs():
    """
    Fetch all jobs from Supabase database
    """
    try:
        response = supabase.table('jobs').select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
