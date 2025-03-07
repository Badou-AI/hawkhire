import asyncio
import logging
import os
from app.jobs.processors.file_processor import FileProcessor
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set environment variables for testing
os.environ["REMOTE_API_URL"] = "http://147.93.44.131:8000"

async def test():
    try:
        logger.info("Initializing FileProcessor")
        fp = FileProcessor()
        logger.info(f"FileProcessor initialized with remote_api_url: {fp.remote_api_url}")
        
        # Test with a sample PDF file if available
        test_files = [
            Path('storage/valid/ff22beb5-6234-4109-a0ba-3564f5530370/20250306_204844_FP-Vendeur.pdf'),
            Path('test.pdf')
        ]
        
        test_file = None
        for file_path in test_files:
            if file_path.exists():
                test_file = file_path
                break
        
        if test_file:
            logger.info(f"Testing with file: {test_file}")
            
            # Test direct PyMuPDF extraction
            logger.info("Testing _extract_with_pymupdf method...")
            text = await fp._extract_with_pymupdf(test_file)
            logger.info(f"Extracted {len(text)} characters with _extract_with_pymupdf")
            
            # Test the full PDF extraction process
            logger.info("Testing _extract_text_from_pdf method...")
            full_text = await fp._extract_text_from_pdf(test_file)
            logger.info(f"Extracted {len(full_text)} characters with _extract_text_from_pdf")
            
            # Test the general extraction method
            logger.info("Testing extract_text method...")
            general_text = await fp.extract_text(test_file)
            logger.info(f"Extracted {len(general_text)} characters with extract_text")
            
            # Print a sample of the extracted text
            preview_length = min(200, len(general_text))
            logger.info(f"Text preview: {general_text[:preview_length]}...")
        else:
            logger.warning("No test PDF file found")
        
        logger.info("Test completed successfully")
        return True
    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    asyncio.run(test()) 