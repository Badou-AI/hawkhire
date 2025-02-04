"""
Storage utility module for handling file operations with Supabase Storage.
"""

from supabase import create_client, Client
from pathlib import Path
import random
from datetime import datetime
from typing import Dict, Optional, BinaryIO
import asyncio
from config.settings import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    RESUME_STORAGE_BUCKET,
    ALLOWED_MIME_TYPES,
    SAMPLE_RESUMES_DIR
)

class StorageManager:
    def __init__(self):
        self.supabase: Client = create_client(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        )
        self.bucket_name = RESUME_STORAGE_BUCKET
        print(f"Successfully connected to Supabase project")

    async def initialize(self):
        """Initialize storage connection and ensure bucket exists"""
        try:
            print(f"Checking bucket '{self.bucket_name}'...")
            buckets = list(self.supabase.storage.list_buckets())
            bucket_exists = any(b.name == self.bucket_name for b in buckets)
            
            if not bucket_exists:
                print(f"Creating bucket '{self.bucket_name}'...")
                self.supabase.storage.create_bucket(self.bucket_name)
                
            print("Storage initialized successfully")
            return True
            
        except Exception as e:
            print(f"Storage initialization error: {e}")
            return False

    def upload_mock_resume(self, user_id: str) -> Dict:  # Removed async
        """Upload a mock resume and return file details"""
        try:
            sample_dir = Path(SAMPLE_RESUMES_DIR)
            sample_files = list(sample_dir.glob("*.pdf"))
            if not sample_files:
                raise FileNotFoundError("No sample resumes found")

            sample_resume = random.choice(sample_files)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = f"{user_id}/{timestamp}_{sample_resume.name}"

            print(f"Uploading resume {sample_resume.name} to {file_path}")
            
            with open(sample_resume, 'rb') as f:
                self.supabase.storage.from_(self.bucket_name).upload(
                    file_path,
                    f
                )

            file_url = self.supabase.storage.from_(self.bucket_name).get_url(file_path)
            print(f"Resume uploaded successfully. URL: {file_url}")

            return {
                "file_path": file_path,
                "file_url": file_url,
                "file_name": sample_resume.name,
                "file_size": sample_resume.stat().st_size,
                "mime_type": "application/pdf"
            }
        except Exception as e:
            print(f"Error uploading resume: {str(e)}")
            return None

    def cleanup_mock_files(self, file_paths: list[str]):  # Removed async
        """Remove mock files from storage"""
        try:
            for file_path in file_paths:
                try:
                    self.supabase.storage.from_(self.bucket_name).remove([file_path])
                except Exception as e:
                    print(f"Error removing file {file_path}: {e}")
        except Exception as e:
            print(f"Error in cleanup: {e}")
