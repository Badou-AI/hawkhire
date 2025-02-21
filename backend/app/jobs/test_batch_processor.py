"""
Test script for batch job processing functionality.
"""
import asyncio
import tempfile
from pathlib import Path
import zipfile
from fastapi import UploadFile
from .batch_processor import BatchProcessor

SAMPLE_JOB_PDF = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 150>>stream
BT
/F1 12 Tf
72 720 Td
(Senior Software Engineer) Tj
0 -20 Td
(Requirements:) Tj
0 -20 Td
(- 5+ years of Python experience) Tj
0 -20 Td
(- Cloud computing expertise) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000056 00000 n
0000000107 00000 n
0000000200 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
400
%%EOF"""

async def create_test_zip():
    """Create a test ZIP file with a sample job PDF"""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create sample PDF file
        pdf_path = temp_path / "senior_engineer_job.pdf"
        with open(pdf_path, 'wb') as f:
            f.write(SAMPLE_JOB_PDF)
        
        # Create ZIP file
        zip_path = temp_path / "test.zip"
        with zipfile.ZipFile(zip_path, 'w') as zip_ref:
            zip_ref.write(pdf_path, pdf_path.name)
        
        # Read ZIP content
        with open(zip_path, 'rb') as f:
            content = f.read()
            
        return content

async def test_batch_processor():
    """Test the batch processor functionality"""
    try:
        # Create test ZIP file
        zip_content = await create_test_zip()
        
        # Create mock UploadFile
        class MockFile:
            async def read(self):
                return zip_content
                
        mock_file = MockFile()
        mock_file.filename = "test.zip"
        
        # Initialize processor with lower concurrency for testing
        processor = BatchProcessor(
            pdf_concurrency=2,
            llm_concurrency=1,
            batch_size=2,
            max_retries=2,
            retry_delay=0.5
        )
        
        print("\nStarting batch processing test...")
        
        # Process the ZIP file
        async for event in processor.process_zip(
            file=mock_file,
            organization_id="test_org_123",
            is_mock=True,
            status="DRAFT"
        ):
            print(f"\nReceived event: {event.model_dump_json()}")  # Using model_dump_json instead of json
            
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_batch_processor()) 