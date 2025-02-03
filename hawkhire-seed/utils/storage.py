"""
Storage utility module for handling file operations with Supabase Storage. Manages resume file uploads, bucket creation, and cleanup operations for mock data files. Includes helper methods for generating unique file paths and handling batch operations.
"""

from supabase import create_client, Client
from pathlib import Path
import random
from datetime import datetime
from typing import Dict, Optional, BinaryIO
from config.settings import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    RESUME_STORAGE_BUCKET,
    SAMPLE_RESUMES_DIR,
    ALLOWED_MIME_TYPES
)

class StorageManager:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        self.bucket_name = RESUME_STORAGE_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists, create if it doesn't"""
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
        except:
            self.supabase.storage.create_bucket(
                self.bucket_name,
                options={'public': False}
            )

    def generate_file_path(self, user_id: str, file_name: str) -> str:
        """Generate a unique file path for a resume"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{user_id}/{timestamp}_{file_name}"

    def get_sample_resume(self) -> Optional[Path]:
        """Get a random sample resume from the samples directory"""
        sample_files = list(Path(SAMPLE_RESUMES_DIR).glob("*.pdf"))
        return random.choice(sample_files) if sample_files else None

    async def upload_mock_resume(self, user_id: str) -> Dict:
        """Upload a mock resume and return file details"""
        sample_resume = self.get_sample_resume()
        if not sample_resume:
            raise FileNotFoundError("No sample resumes found in directory")

        file_path = self.generate_file_path(user_id, sample_resume.name)
        
        try:
            with open(sample_resume, 'rb') as f:
                self.supabase.storage.from_(self.bucket_name).upload(
                    file_path,
                    f
                )

            # Get the file URL
            file_url = self.supabase.storage.from_(self.bucket_name).get_url(file_path)

            return {
                "file_path": file_path,
                "file_url": file_url,
                "file_name": sample_resume.name,
                "file_size": sample_resume.stat().st_size,
                "mime_type": "application/pdf"
            }
        except Exception as e:
            print(f"Error uploading resume for user {user_id}: {e}")
            return None

    async def cleanup_mock_files(self, file_paths: list[str]):
        """Remove mock files from storage"""
        try:
            # Delete files in batches of 100
            for i in range(0, len(file_paths), 100):
                batch = file_paths[i:i + 100]
                self.supabase.storage.from_(self.bucket_name).remove(batch)
        except Exception as e:
            print(f"Error cleaning up mock files: {e}")

    def get_file_url(self, file_path: str) -> str:
        """Get the URL for a file"""
        return self.supabase.storage.from_(self.bucket_name).get_url(file_path)

    async def upload_file(
        self,
        file: BinaryIO,
        file_path: str,
        mime_type: str = None
    ) -> Dict:
        """Upload a single file and return its details"""
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported file type: {mime_type}")

        try:
            self.supabase.storage.from_(self.bucket_name).upload(
                file_path,
                file
            )

            file_url = self.get_file_url(file_path)

            return {
                "file_path": file_path,
                "file_url": file_url,
                "mime_type": mime_type
            }
        except Exception as e:
            print(f"Error uploading file {file_path}: {e}")
            return None
