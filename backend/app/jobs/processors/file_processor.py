import asyncio
import tempfile
import zipfile
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator, List, Dict, Any, Optional, Tuple
from ..services.api_client import APIClient
import aiofiles
from fastapi import UploadFile
import re

logger = logging.getLogger(__name__)

# Constants for storage paths
STORAGE_BASE_DIR = os.environ.get("STORAGE_BASE_DIR", "storage")
VALID_FILES_DIR = "valid"
PROCESSED_FILES_DIR = "processed"
FAILED_FILES_DIR = "failed"

class FileProcessor:
    """Handles file operations for batch processing"""
    
    def __init__(
        self, 
        remote_api_url: str = os.getenv("REMOTE_API_URL", "http://147.93.44.131:8000"),
        api_client: APIClient = APIClient(),
        max_concurrency: int = 5, 
        chunk_size: int = 1024 * 1024
        ):
        """Initialize the file processor
        
        Args:
            max_concurrency: Maximum number of concurrent file operations
            chunk_size: Size of chunks for file streaming (1MB default)
        """
        self.remote_api_url = remote_api_url
        self.api_client = api_client
        self.max_concurrency = max_concurrency
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.chunk_size = chunk_size
        
        # Ensure storage directories exist
        self._init_storage_dirs()
    
    def _init_storage_dirs(self):
        """Initialize storage directories"""
        base_dir = Path(STORAGE_BASE_DIR)
        
        # Create base directory if it doesn't exist
        if not base_dir.exists():
            logger.info(f"Creating storage base directory: {base_dir}")
            base_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        for subdir in [VALID_FILES_DIR, PROCESSED_FILES_DIR, FAILED_FILES_DIR]:
            dir_path = base_dir / subdir
            if not dir_path.exists():
                logger.info(f"Creating storage subdirectory: {dir_path}")
                dir_path.mkdir(parents=True, exist_ok=True)
    
    def _get_storage_path(self, file_type: str, org_id: str) -> Path:
        """Get storage path for a specific organization and file type
        
        Args:
            file_type: Type of storage (valid, processed, failed)
            org_id: Organization ID
            
        Returns:
            Path to the storage directory
        """
        # Create organization-specific directory
        base_dir = Path(STORAGE_BASE_DIR)
        org_dir = base_dir / file_type / org_id
        
        # Create directory if it doesn't exist
        if not org_dir.exists():
            logger.info(f"Creating organization directory: {org_dir}")
            org_dir.mkdir(parents=True, exist_ok=True)
        
        return org_dir
    
    async def store_file(self, file_path: Path, org_id: str, file_type: str) -> Path:
        """Store a file in the appropriate storage directory
        
        Args:
            file_path: Path to the file to store
            org_id: Organization ID
            file_type: Type of storage (valid, processed, failed)
            
        Returns:
            Path to the stored file
        """
        # Get storage directory
        storage_dir = self._get_storage_path(file_type, org_id)
        
        # Create timestamped filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"{timestamp}_{file_path.name}"
        target_path = storage_dir / new_filename
        
        # Copy file to storage directory
        try:
            logger.info(f"Storing file {file_path.name} to {target_path}")
            shutil.copy2(file_path, target_path)
            return target_path
        except Exception as e:
            logger.error(f"Error storing file {file_path.name}: {str(e)}", exc_info=True)
            raise
    
    async def process_zip(self, file: UploadFile, org_id: str) -> AsyncIterator[Tuple[Path, Path]]:
        """Stream and extract ZIP file incrementally
        
        Args:
            file: The uploaded ZIP file
            org_id: Organization ID
            
        Yields:
            Tuple of (temp_file_path, storage_file_path) for each extracted file
        """
        logger.info(f"Processing ZIP file: {file.filename}, size: {file.size if hasattr(file, 'size') else 'unknown'} for organization: {org_id}")
        
        # Create a temporary directory for extraction
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            zip_path = temp_path / file.filename
            
            logger.info(f"Created temporary directory: {temp_dir}")
            logger.info(f"Saving ZIP file to: {zip_path}")
            
            # Stream the file in chunks to avoid loading entire file into memory
            try:
                with open(zip_path, 'wb') as f:
                    # Reset file position
                    await file.seek(0)
                    
                    # Read and write in chunks
                    bytes_written = 0
                    while chunk := await file.read(self.chunk_size):
                        f.write(chunk)
                        bytes_written += len(chunk)
                    
                    logger.info(f"Successfully wrote ZIP file: {bytes_written} bytes")
            except Exception as e:
                logger.error(f"Error writing ZIP file: {str(e)}", exc_info=True)
                raise
            
            # Extract the ZIP file
            try:
                logger.info(f"Extracting ZIP file: {zip_path}")
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    file_list = zip_ref.namelist()
                    logger.info(f"ZIP contains {len(file_list)} files: {', '.join(file_list[:10])}" + 
                               (f"... and {len(file_list) - 10} more" if len(file_list) > 10 else ""))
                    
                    # Create a mapping of original paths to extracted paths
                    path_mapping = {}
                    
                    # Extract all files
                    zip_ref.extractall(temp_path)
                    logger.info(f"ZIP extraction complete to: {temp_path}")
                    
                    # Process each file in the ZIP
                    supported_count = 0
                    unsupported_count = 0
                    
                    # First, find all files
                    all_files = []
                    for extracted_file in temp_path.rglob('*'):
                        if extracted_file.is_file() and extracted_file != zip_path:
                            all_files.append(extracted_file)
                    
                    # Log all found files for debugging
                    logger.info(f"Found {len(all_files)} files in extracted ZIP:")
                    for file_path in all_files:
                        logger.info(f"  - {file_path.relative_to(temp_path)}")
                    
                    # Process supported files
                    for extracted_file in all_files:
                        if self._is_supported_file_type(extracted_file):
                            logger.info(f"Found supported file in ZIP: {extracted_file.name} ({extracted_file.stat().st_size} bytes)")
                            
                            # Copy the file to a more accessible location if it's in a subdirectory
                            if len(extracted_file.parts) > len(temp_path.parts) + 1:
                                # File is in a subdirectory, copy it to the temp root for easier access
                                flat_path = temp_path / extracted_file.name
                                try:
                                    shutil.copy2(extracted_file, flat_path)
                                    logger.info(f"Copied file from {extracted_file} to {flat_path} for easier access")
                                    extracted_file = flat_path
                                except Exception as copy_error:
                                    logger.error(f"Error copying file: {str(copy_error)}", exc_info=True)
                            
                            # Store file in valid files directory
                            storage_path = await self.store_file(extracted_file, org_id, VALID_FILES_DIR)
                            
                            supported_count += 1
                            yield (extracted_file, storage_path)
                        else:
                            logger.warning(f"Unsupported file type: {extracted_file.name}")
                            unsupported_count += 1
                    
                    logger.info(f"ZIP processing complete. Supported files: {supported_count}, Unsupported files: {unsupported_count}")
            except zipfile.BadZipFile as e:
                logger.error(f"Bad ZIP file: {str(e)}", exc_info=True)
                raise
            except Exception as e:
                logger.error(f"Error extracting ZIP file: {str(e)}", exc_info=True)
                raise
    
    async def mark_file_processed(self, file_path: Path, org_id: str, success: bool = True) -> Path:
        """Mark a file as processed by moving it to the processed directory
        
        Args:
            file_path: Path to the file to mark as processed
            org_id: Organization ID
            success: Whether processing was successful
            
        Returns:
            Path to the processed file
        """
        target_dir = PROCESSED_FILES_DIR if success else FAILED_FILES_DIR
        return await self.store_file(file_path, org_id, target_dir)
    
    async def extract_text(self, file_path: Path) -> str:
        """Extract text from a file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Extracted text
            
        Raises:
            ValueError: If file type is not supported
            Exception: For other errors
        """
        logger.info(f"Extracting text from file: {file_path}")
        
        try:
            async with self.semaphore:
                file_type = self._get_file_type(file_path)
                logger.info(f"Detected file type: {file_type}")
                
                if file_type == "pdf":
                    logger.info(f"Extracting text from PDF: {file_path}")
                    text = await self._extract_text_from_pdf(file_path)
                elif file_type == "txt":
                    logger.info(f"Extracting text from TXT: {file_path}")
                    text = await self._extract_text_from_txt(file_path)
                else:
                    error_msg = f"Unsupported file type: {file_type}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                
                # Log text length and a preview
                text_length = len(text)
                preview = text[:100] + "..." if text_length > 100 else text
                logger.info(f"Successfully extracted {text_length} characters from {file_path}")
                logger.debug(f"Text preview: {preview}")
                
                return text
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}", exc_info=True)
            raise
    
    async def _extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from a PDF file using the remote API"""
        if not isinstance(file_path, Path):
            file_path = Path(str(file_path))
        
        logger.info(f"Processing PDF file: {file_path}")
        
        if not file_path.exists():
            logger.error(f"PDF file not found: {file_path}")
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        try:
            # Read file content first, separate from API call
            logger.info(f"Reading file content: {file_path}")
            content = None
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
            
            if not content:
                raise ValueError("Failed to read PDF content")
                
            # Now make API call with content
            logger.info(f"Sending PDF to conversion API: {file_path.name}")
            files = {'file': (file_path.name, content, 'application/pdf')}
            
            # Add timeout to API call - increased for debugging
            async with asyncio.timeout(120):  # 120 second timeout for debugging
                response = await self.api_client.post(
                    "/v1/tools/convert_pdf2text", 
                    files=files, 
                    api_url=self.remote_api_url
                )
                
                if response.status == 200:
                    response_json = await response.json()
                    
                    if 'pages' in response_json and isinstance(response_json['pages'], list):
                        extracted_text = '\n\n'.join(response_json['pages'])
                        logger.info(f"PDF conversion successful: {len(extracted_text)} characters extracted")
                        return extracted_text
                    elif 'text' in response_json:
                        logger.info(f"PDF conversion successful: {len(response_json['text'])} characters extracted")
                        return response_json['text']
                    else:
                        logger.warning(f"Unexpected response format: {response_json}")
                        # Fallback to PyPDF
                        return await self._extract_with_pypdf(file_path)
                else:
                    error_text = await response.text()
                    logger.error(f"PDF conversion failed with status {response.status}: {error_text}")
                    # Fallback to PyPDF
                    return await self._extract_with_pypdf(file_path)
                    
        except asyncio.TimeoutError:
            logger.error(f"Timeout while processing PDF: {file_path}")
            # Fallback to PyPDF
            return await self._extract_with_pypdf(file_path)
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {str(e)}", exc_info=True)
            # Fallback to PyPDF
            return await self._extract_with_pypdf(file_path)
    
    async def _extract_with_pypdf(self, file_path: Path) -> str:
        """Extract text from PDF using PyPDF2
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        import PyPDF2
        
        logger.info(f"Opening PDF file with PyPDF2: {file_path}")
        with open(file_path, 'rb') as pdf_file:
            try:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                num_pages = len(pdf_reader.pages)
                logger.info(f"PDF has {num_pages} pages")
                
                text_content = []
                for i, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
                    else:
                        logger.warning(f"No text extracted from page {i+1}")
                
                full_text = "\n".join(text_content)
                return full_text
            except Exception as e:
                logger.warning(f"PyPDF2 extraction failed: {str(e)}")
                raise
    
    def _get_file_type(self, file_path: Path) -> str:
        """Get the file type based on extension
        
        Args:
            file_path: Path to the file
            
        Returns:
            File type as string
        """
        extension = file_path.suffix.lower()
        if extension == '.pdf':
            return 'pdf'
        elif extension == '.txt':
            return 'txt'
        else:
            return 'unknown'
    
    def _is_supported_file_type(self, file_path: Path) -> bool:
        """Check if the file type is supported
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if supported, False otherwise
        """
        return self._get_file_type(file_path) in ['pdf', 'txt']
    
    async def stream_file(self, file_path: Path) -> AsyncIterator[bytes]:
        """Stream file content in chunks
        
        Args:
            file_path: Path to the file
            
        Yields:
            File content chunks
        """
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(self.chunk_size):
                yield chunk 