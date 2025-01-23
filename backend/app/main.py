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
SEMANTIC_SEARCH_URL = os.getenv("SEMANTIC_SEARCH_URL", "http://localhost:8080")

# Storage configuration
UPLOAD_DIR = Path("storage/uploads")
PROCESSED_DIR = Path("storage/processed")

# Ensure storage directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

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
            
            # Save extracted files to processed directory
            processed_path = PROCESSED_DIR / upload_info["upload_id"]
            processed_path.mkdir(parents=True, exist_ok=True)
            
            for file_path in extract_path.rglob('*'):
                if file_path.is_file():
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
                    files.append(file_info)
                    total_size += stats.size
                    
                    # Count file types
                    file_type = stats.mime_type.split('/')[0] if stats.mime_type else 'unknown'
                    file_types[file_type] = file_types.get(file_type, 0) + 1
            
            # Add upload info to response
            return {
                "upload_id": upload_info["upload_id"],
                "total_files": len(files),
                "total_size": total_size,
                "human_total_size": humanize.naturalsize(total_size),
                "file_types": file_types,
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
