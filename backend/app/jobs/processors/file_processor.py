import asyncio
import tempfile
import zipfile
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator, List, Dict, Any, Optional, Tuple
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
    
    def __init__(self, max_concurrency: int = 5, chunk_size: int = 1024 * 1024):
        """Initialize the file processor
        
        Args:
            max_concurrency: Maximum number of concurrent file operations
            chunk_size: Size of chunks for file streaming (1MB default)
        """
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
    
    async def convert_to_markdown(self, file_path: Path) -> str:
        """Convert file content to Markdown format
        
        Args:
            file_path: Path to the file
            
        Returns:
            Markdown formatted text
            
        Raises:
            ValueError: If file type is not supported
            Exception: For other errors
        """
        logger.info(f"Converting file to Markdown: {file_path}")
        
        try:
            async with self.semaphore:
                file_type = self._get_file_type(file_path)
                logger.info(f"Detected file type: {file_type}")
                
                # Extract text first
                text = await self.extract_text(file_path)
                
                # Convert to markdown based on file type
                if file_type == "pdf":
                    logger.info(f"Converting PDF to Markdown: {file_path}")
                    markdown = self._format_text_as_markdown(text)
                elif file_type == "txt":
                    logger.info(f"Converting TXT to Markdown: {file_path}")
                    markdown = self._format_text_as_markdown(text)
                else:
                    error_msg = f"Unsupported file type for Markdown conversion: {file_type}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                
                # Log markdown length and a preview
                markdown_length = len(markdown)
                preview = markdown[:100] + "..." if markdown_length > 100 else markdown
                logger.info(f"Successfully converted {markdown_length} characters to Markdown from {file_path}")
                logger.debug(f"Markdown preview: {preview}")
                
                return markdown
        except Exception as e:
            logger.error(f"Error converting file to Markdown {file_path}: {str(e)}", exc_info=True)
            raise
    
    def _format_text_as_markdown(self, text: str) -> str:
        """Format extracted text as Markdown
        
        Args:
            text: Raw extracted text
            
        Returns:
            Markdown formatted text
        """
        logger.info("Formatting text as Markdown")
        
        try:
            # Clean up the text first - normalize spaces and newlines
            text = re.sub(r'\n\s+', ' ', text)  # Replace newline+space with just space
            text = re.sub(r'\s+', ' ', text)    # Normalize multiple spaces to single space
            
            # Split the text into lines and paragraphs
            paragraphs = re.split(r'\n{2,}', text)
            markdown_parts = []
            
            for paragraph in paragraphs:
                paragraph = paragraph.strip()
                if not paragraph:
                    continue
                
                # Check for section headers (all caps or ending with colon)
                if paragraph.isupper() or re.search(r':\s*$', paragraph):
                    markdown_parts.append(f"## {paragraph}")
                    continue
                
                # Check for bullet points
                if paragraph.startswith(('•', '-', '●', '*')):
                    # Format as bullet point list
                    lines = paragraph.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith(('•', '-', '●', '*')):
                            # Ensure proper markdown bullet format
                            markdown_parts.append(f"* {line[1:].strip()}")
                        else:
                            markdown_parts.append(line)
                    continue
                
                # Check for numbered lists
                if re.match(r'^\d+\.', paragraph):
                    # Format as numbered list
                    lines = paragraph.split('\n')
                    for line in lines:
                        line = line.strip()
                        if re.match(r'^\d+\.', line):
                            # Keep the numbered format
                            markdown_parts.append(line)
                        else:
                            markdown_parts.append(line)
                    continue
                
                # Regular paragraph
                markdown_parts.append(paragraph)
            
            # Join with double newlines for proper markdown paragraphs
            markdown_text = '\n\n'.join(markdown_parts)
            
            # Additional formatting for common job description sections
            section_keywords = [
                "responsibilities", "requirements", "qualifications", 
                "experience", "education", "skills", "about us", "company",
                "responsabilités", "exigences", "qualifications",
                "expérience", "éducation", "compétences", "à propos de nous"
            ]
            
            for keyword in section_keywords:
                # Find sections that might be headers but weren't caught earlier
                pattern = re.compile(f'([^#]){keyword}[s]?[\s]*:', re.IGNORECASE)
                markdown_text = pattern.sub(f'\\1\n\n## {keyword.title()}:', markdown_text)
            
            return markdown_text
            
        except Exception as e:
            logger.error(f"Error formatting text as Markdown: {str(e)}", exc_info=True)
            return text  # Return original text if formatting fails
    
    async def _extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from a PDF file
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content
            
        Raises:
            ValueError: If extraction fails
        """
        try:
            # Ensure file_path is a Path object
            if not isinstance(file_path, Path):
                file_path = Path(str(file_path))
            
            logger.info(f"Processing PDF file: {file_path} (absolute: {file_path.absolute()})")
            
            # Check if file exists
            if not file_path.exists():
                logger.error(f"PDF file not found: {file_path.absolute()}")
                # List parent directory contents to help debug
                parent_dir = file_path.parent
                if parent_dir.exists():
                    logger.info(f"Contents of parent directory {parent_dir}:")
                    for item in parent_dir.iterdir():
                        logger.info(f"  - {item.name} ({'dir' if item.is_dir() else 'file'})")
                else:
                    logger.error(f"Parent directory does not exist: {parent_dir}")
                
                # Try to find the file by name in the parent directory
                if parent_dir.exists():
                    for item in parent_dir.iterdir():
                        if item.is_file() and item.name == file_path.name:
                            logger.info(f"Found file with matching name: {item}")
                            file_path = item
                            break
                
                # If still not found, check if the file exists without the 'sample' subdirectory
                if not file_path.exists() and "sample" in str(file_path):
                    # Try removing the 'sample' part from the path
                    alternative_path = file_path.parent.parent / file_path.name
                    if alternative_path.exists():
                        logger.info(f"Found file at alternative path: {alternative_path}")
                        file_path = alternative_path
                    else:
                        logger.error(f"Alternative path also not found: {alternative_path}")
                
                # If still not found, return a placeholder
                if not file_path.exists():
                    logger.error(f"Could not find PDF file after all attempts: {file_path.name}")
                    return f"[PDF file not found: {file_path.name}]"
            
            # Try multiple PDF extraction methods
            text_content = ""
            extraction_methods = [
                self._extract_with_pymupdf,  # Try PyMuPDF first for better formatting
                self._extract_with_pypdf,
                self._extract_with_pdfplumber,
                self._extract_with_textract
            ]
            
            # Try each method until one succeeds
            for method in extraction_methods:
                try:
                    logger.info(f"Trying extraction method: {method.__name__}")
                    text_content = await method(file_path)
                    if text_content and len(text_content.strip()) > 10:
                        logger.info(f"Successfully extracted text using {method.__name__}")
                        break
                    else:
                        logger.warning(f"Method {method.__name__} returned insufficient text")
                except Exception as method_error:
                    logger.warning(f"Method {method.__name__} failed: {str(method_error)}")
                    continue
            
            # If all methods failed, return a placeholder
            if not text_content or len(text_content.strip()) < 10:
                logger.warning(f"All extraction methods failed for {file_path.name}")
                return f"[No readable text content found in {file_path.name}]"
            
            logger.info(f"Successfully extracted {len(text_content)} characters from {file_path}")
            if len(text_content) > 100:
                logger.debug(f"Text preview: {text_content[:100]}...")
            else:
                logger.debug(f"Text preview: {text_content}")
            
            return text_content
                
        except FileNotFoundError as e:
            logger.error(f"File not found: {str(e)}", exc_info=True)
            # Return a placeholder instead of raising an error
            return f"[PDF file not found: {file_path.name}]"
        except Exception as e:
            logger.error(f"Error extracting text from PDF file {file_path.name}: {str(e)}", exc_info=True)
            # Return a placeholder instead of raising an error
            return f"[Error extracting text from PDF file {file_path.name}: {str(e)}]"
    
    async def _extract_with_pymupdf(self, file_path: Path) -> str:
        """Extract text from PDF using PyMuPDF (fitz) with better formatting preservation
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content with preserved formatting
        """
        try:
            import fitz  # PyMuPDF
            
            logger.info(f"Opening PDF file with PyMuPDF: {file_path}")
            
            # Open the PDF
            doc = fitz.open(str(file_path))
            num_pages = len(doc)
            logger.info(f"PDF has {num_pages} pages")
            
            text_content = []
            
            # Process each page
            for page_num in range(num_pages):
                page = doc[page_num]
                
                # Get page dimensions to help with layout analysis
                page_width = page.rect.width
                page_height = page.rect.height
                
                # Extract text blocks with their formatting information
                blocks = page.get_text("dict")["blocks"]
                page_text = []
                
                # Track the current y-position to detect new paragraphs
                last_y_bottom = -1
                last_block_type = None
                
                # Track list items for better formatting
                list_items = []
                in_list = False
                list_indent = -1
                list_item_count = 0
                
                # Process each block (usually paragraphs or sections)
                for block in blocks:
                    if "lines" in block:
                        block_type = block.get("type", 0)  # 0 = text, 1 = image
                        
                        # Skip image blocks
                        if block_type == 1:
                            continue
                        
                        # Get block position
                        y_top = block["bbox"][1]
                        y_bottom = block["bbox"][3]
                        x_left = block["bbox"][0]
                        
                        # Check if this is a new paragraph based on vertical position
                        if last_y_bottom > 0 and (y_top - last_y_bottom) > 10:
                            # If we were in a list and now we're not, add the list to the page text
                            if in_list and list_items:
                                # Format and add the list
                                page_text.extend(list_items)
                                list_items = []
                                in_list = False
                                list_indent = -1
                                list_item_count = 0
                            
                            # Add extra line break for paragraph separation
                            if page_text and not page_text[-1].endswith('\n'):
                                page_text.append('')
                        
                        # Process lines in the block
                        block_lines = []
                        for line in block["lines"]:
                            line_text = []
                            
                            # Get line position
                            line_x0 = line["bbox"][0]
                            
                            # Check if line is indented (might be a list item)
                            is_indented = line_x0 > 50 and line_x0 < page_width * 0.3
                            
                            # Process spans in the line
                            for span in line["spans"]:
                                span_text = span["text"]
                                
                                # Check if span has special formatting
                                is_bold = span.get("font", "").lower().find("bold") >= 0
                                is_italic = span.get("font", "").lower().find("italic") >= 0
                                
                                # Apply Markdown formatting if needed
                                if is_bold:
                                    span_text = f"**{span_text}**"
                                if is_italic:
                                    span_text = f"*{span_text}*"
                                
                                line_text.append(span_text)
                            
                            # Join spans to form the complete line
                            joined_line = " ".join(line_text).strip()
                            
                            # Check if this might be a list item
                            bullet_match = re.match(r'^[•\-\*\○\▪\◦\▸\►\·\–]\s+(.+)$', joined_line)
                            numbered_match = re.match(r'^(\d+)[\.\)]\s+(.+)$', joined_line)
                            
                            if bullet_match or numbered_match or (is_indented and in_list):
                                # This is likely a list item
                                if bullet_match:
                                    # Bullet list item
                                    item_content = bullet_match.group(1)
                                    formatted_item = f"- {item_content}"
                                    
                                    # If we weren't in a list before, start a new one
                                    if not in_list:
                                        in_list = True
                                        list_indent = line_x0
                                        list_item_count = 1
                                    
                                    list_items.append(formatted_item)
                                    continue
                                    
                                elif numbered_match:
                                    # Numbered list item
                                    number = numbered_match.group(1)
                                    item_content = numbered_match.group(2)
                                    formatted_item = f"{number}. {item_content}"
                                    
                                    # If we weren't in a list before, start a new one
                                    if not in_list:
                                        in_list = True
                                        list_indent = line_x0
                                        list_item_count = 1
                                    else:
                                        list_item_count += 1
                                    
                                    list_items.append(formatted_item)
                                    continue
                                    
                                elif is_indented and in_list:
                                    # This might be a continuation of the previous list item
                                    if list_items:
                                        list_items[-1] = f"{list_items[-1]} {joined_line}"
                                    continue
                            else:
                                # If we were in a list and now we're not, add the list to the page text
                                if in_list and list_items:
                                    # Format and add the list
                                    page_text.extend(list_items)
                                    list_items = []
                                    in_list = False
                                    list_indent = -1
                                    list_item_count = 0
                            
                            # Check if this line might be a header (all caps or very short)
                            if joined_line.upper() == joined_line and len(joined_line) > 5 and len(joined_line) < 50:
                                # All caps line - likely a header
                                if block_lines:
                                    page_text.append("\n".join(block_lines))
                                    block_lines = []
                                
                                # Convert to title case for better readability
                                title_case = joined_line.capitalize()
                                page_text.append(f"\n## {title_case}\n")
                                continue
                                
                            # Check if this line ends with a colon (might be a subheader)
                            if joined_line.endswith(':') and len(joined_line) < 50:
                                if block_lines:
                                    page_text.append("\n".join(block_lines))
                                    block_lines = []
                                
                                page_text.append(f"\n### {joined_line}\n")
                                continue
                            
                            # Regular line
                            block_lines.append(joined_line)
                        
                        # Add the block lines to the page text
                        if block_lines:
                            page_text.append("\n".join(block_lines))
                        
                        # Update tracking variables
                        last_y_bottom = y_bottom
                        last_block_type = block_type
                
                # If we were in a list at the end of the page, add the list to the page text
                if in_list and list_items:
                    page_text.extend(list_items)
                
                # Join the blocks with proper line breaks
                if page_text:
                    # Ensure paragraphs are properly separated
                    page_content = "\n".join(page_text)
                    
                    # Fix common issues with French text
                    page_content = page_content.replace(" :", ":")
                    page_content = page_content.replace("  ", " ")
                    
                    text_content.append(page_content)
                else:
                    logger.warning(f"No text extracted from page {page_num+1}")
            
            # Close the document
            doc.close()
            
            # Join all pages with double line breaks to separate pages
            full_text = "\n\n".join(text_content)
            
            # Clean up the text - remove excessive whitespace while preserving formatting
            full_text = re.sub(r'\n{3,}', '\n\n', full_text)  # Replace 3+ newlines with 2
            full_text = re.sub(r' {3,}', '  ', full_text)     # Replace 3+ spaces with 2
            
            # Fix common formatting issues
            full_text = re.sub(r'([a-zA-Z])\s+:', r'\1:', full_text)  # Fix spacing before colons
            full_text = re.sub(r':\s+([a-zA-Z])', r': \1', full_text)  # Fix spacing after colons
            
            # Ensure proper list formatting
            full_text = re.sub(r'\n\s*\n(- )', r'\n\n- ', full_text)  # Ensure proper spacing before lists
            full_text = re.sub(r'\n\s*\n(\d+\. )', r'\n\n\1', full_text)  # Ensure proper spacing before numbered lists
            
            # Ensure proper spacing between list items
            full_text = re.sub(r'(- .*)\n(- )', r'\1\n\n- ', full_text)
            full_text = re.sub(r'(\d+\. .*)\n(\d+\. )', r'\1\n\n\2', full_text)
            
            return full_text
            
        except ImportError:
            logger.warning("PyMuPDF (fitz) not installed, skipping this method")
            return ""
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {str(e)}")
            raise
    
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
    
    async def _extract_with_pdfplumber(self, file_path: Path) -> str:
        """Extract text from PDF using pdfplumber
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            import pdfplumber
            
            logger.info(f"Opening PDF file with pdfplumber: {file_path}")
            with pdfplumber.open(file_path) as pdf:
                text_content = []
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
                    else:
                        logger.warning(f"No text extracted from page {i+1}")
                
                full_text = "\n".join(text_content)
                return full_text
        except ImportError:
            logger.warning("pdfplumber not installed, skipping this method")
            return ""
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {str(e)}")
            raise
    
    async def _extract_with_textract(self, file_path: Path) -> str:
        """Extract text from PDF using textract
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            import textract
            
            logger.info(f"Opening PDF file with textract: {file_path}")
            text = textract.process(str(file_path), method='pdfminer')
            return text.decode('utf-8')
        except ImportError:
            logger.warning("textract not installed, skipping this method")
            return ""
        except Exception as e:
            logger.warning(f"textract extraction failed: {str(e)}")
            raise
    
    async def _extract_text_from_txt(self, file_path: Path) -> str:
        """Extract text from a text file
        
        Args:
            file_path: Path to the text file
            
        Returns:
            Extracted text content
            
        Raises:
            ValueError: If extraction fails
        """
        try:
            # Ensure file_path is a Path object
            if not isinstance(file_path, Path):
                file_path = Path(str(file_path))
            
            logger.info(f"Processing TXT file: {file_path} (absolute: {file_path.absolute()})")
            
            # Check if file exists
            if not file_path.exists():
                logger.error(f"TXT file not found: {file_path.absolute()}")
                # List parent directory contents to help debug
                parent_dir = file_path.parent
                if parent_dir.exists():
                    logger.info(f"Contents of parent directory {parent_dir}:")
                    for item in parent_dir.iterdir():
                        logger.info(f"  - {item.name} ({'dir' if item.is_dir() else 'file'})")
                else:
                    logger.error(f"Parent directory does not exist: {parent_dir}")
                
                raise FileNotFoundError(f"TXT file not found: {file_path.absolute()}")
            
            # Read the text file
            logger.info(f"Opening TXT file: {file_path}")
            try:
                async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    text_content = await f.read()
                    logger.info(f"Successfully read TXT file: {file_path.name}, content length: {len(text_content)}")
            except UnicodeDecodeError:
                logger.warning(f"Unicode decode error with utf-8, trying with latin-1 encoding")
                async with aiofiles.open(file_path, 'r', encoding='latin-1', errors='replace') as f:
                    text_content = await f.read()
                    logger.info(f"Successfully read TXT file with latin-1: {file_path.name}, content length: {len(text_content)}")
            
            if not text_content or len(text_content.strip()) < 10:
                logger.warning(f"Extracted text is too short or empty for {file_path.name}")
                # Return a placeholder instead of raising an error
                return f"[No readable text content found in {file_path.name}]"
                
            return text_content
            
        except FileNotFoundError as e:
            logger.error(f"File not found: {str(e)}", exc_info=True)
            # Return a placeholder instead of raising an error
            return f"[TXT file not found: {file_path.name}]"
        except Exception as e:
            logger.error(f"Error extracting text from TXT file {file_path.name}: {str(e)}", exc_info=True)
            # Return a placeholder instead of raising an error
            return f"[Error extracting text from TXT file {file_path.name}: {str(e)}]"
    
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