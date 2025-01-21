from fastapi import FastAPI, UploadFile, HTTPException
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

# Remote API URL
REMOTE_API_URL = "http://147.79.115.55:8000"

class FileStats:
    def __init__(self, path: Path):
        self.name = path.name
        self.size = path.stat().st_size
        self.mime_type = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
        self.human_size = humanize.naturalsize(self.size)

async def process_zip_file(zip_file: UploadFile) -> Dict:
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir) / zip_file.filename
        
        # Save uploaded file
        async with aiofiles.open(temp_path, 'wb') as out_file:
            content = await zip_file.read()
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
            
            for file_path in extract_path.rglob('*'):
                if file_path.is_file():
                    stats = FileStats(file_path)
                    file_info = {
                        "name": stats.name,
                        "size": stats.size,
                        "human_size": stats.human_size,
                        "mime_type": stats.mime_type
                    }
                    files.append(file_info)
                    total_size += stats.size
                    
                    # Count file types
                    file_type = stats.mime_type.split('/')[0] if stats.mime_type else 'unknown'
                    file_types[file_type] = file_types.get(file_type, 0) + 1
            
            return {
                "total_files": len(files),
                "total_size": total_size,
                "human_total_size": humanize.naturalsize(total_size),
                "file_types": file_types,
                "files": sorted(files, key=lambda x: x["size"], reverse=True)  # Sort by size
            }
            
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid zip file")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-zip")
async def process_zip(file: UploadFile):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    return await process_zip_file(file)

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
