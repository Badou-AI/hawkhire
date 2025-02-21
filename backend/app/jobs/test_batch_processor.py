"""
Test script for batch job processing functionality.
"""
import asyncio
import tempfile
from pathlib import Path
import zipfile
from fastapi import UploadFile
import httpx
from unittest.mock import AsyncMock, patch
from .batch_processor import BatchProcessor, ProcessedJobData
import time

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

MOCK_RESPONSES = {
    "/v1/jobs/convert-pdf": {
        "text": "Senior Software Engineer\n\nRequirements:\n- 5+ years of Python experience\n- Cloud computing expertise"
    },
    "/v1/jobs/extract-data": {
        "title": {
            "en": "Senior Software Engineer",
            "fr": "Ingénieur logiciel senior"
        },
        "description": {
            "en": "Requirements:\n- 5+ years of Python experience\n- Cloud computing expertise",
            "fr": "Exigences:\n- 5+ ans d'expérience en Python\n- Expertise en cloud computing"
        },
        "job_type": "FULL_TIME",
        "location": {
            "city": {"en": "New York", "fr": "New York"},
            "state": {"en": "NY", "fr": "NY"},
            "country": {"en": "USA", "fr": "États-Unis"},
            "postal_code": {"en": "10001", "fr": "10001"}
        }
    },
    "/v1/jobs/bulk": [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "title": {
                "en": "Senior Software Engineer",
                "fr": "Ingénieur logiciel senior"
            },
            "created_at": "2024-02-20T12:00:00Z",
            "updated_at": "2024-02-20T12:00:00Z"
        }
    ],
    "/v1/jobs": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "title": {
            "en": "Senior Software Engineer",
            "fr": "Ingénieur logiciel senior"
        },
        "created_at": "2024-02-20T12:00:00Z",
        "updated_at": "2024-02-20T12:00:00Z"
    }
}

class MockResponse:
    def __init__(self, status_code: int, json_data: dict):
        self.status_code = status_code
        self._json_data = json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPError(f"HTTP Error: {self.status_code}")

    def json(self):
        return self._json_data

async def mock_post(url: str, **kwargs) -> MockResponse:
    """Mock HTTP POST requests"""
    if url in MOCK_RESPONSES:
        return MockResponse(200, MOCK_RESPONSES[url])
    return MockResponse(404, {"error": "Not found"})

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
        
        # Replace the HTTP client with our mock
        processor.client.post = mock_post
        
        print("\nStarting batch processing test...")
        
        # Process the ZIP file
        async for event in processor.process_zip(
            file=mock_file,
            organization_id="test_org_123",
            is_mock=True,
            status="DRAFT"
        ):
            print(f"\nReceived event: {event.model_dump_json()}")
            
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        raise

async def test_bulk_creation():
    """Test bulk job creation functionality"""
    try:
        print("\nTesting bulk job creation...")
        
        # Create test jobs
        jobs = [
            ProcessedJobData(
                original_file="job1.pdf",
                extracted_data={
                    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": {
                        "en": "Senior Software Engineer",
                        "fr": "Ingénieur logiciel senior"
                    },
                    "description": {
                        "en": "Job description",
                        "fr": "Description du poste"
                    },
                    "job_type": "FULL_TIME",
                    "location": {
                        "city": {"en": "New York", "fr": "New York"},
                        "state": {"en": "NY", "fr": "NY"},
                        "country": {"en": "USA", "fr": "États-Unis"},
                        "postal_code": {"en": "10001", "fr": "10001"}
                    }
                },
                processing_time=1.0
            ),
            # Add an invalid job to test validation
            ProcessedJobData(
                original_file="job2.pdf",
                extracted_data={
                    "organization_id": "invalid-uuid",
                    "title": {
                        "en": "Software Engineer"
                        # Missing fr translation
                    }
                },
                processing_time=1.0
            )
        ]
        
        # Initialize processor
        processor = BatchProcessor(db_batch_size=2)
        processor.client.post = mock_post
        
        # Test bulk creation
        result = await processor.create_jobs_bulk(jobs)
        
        print("\nBulk creation results:")
        print(f"Total jobs: {result.stats['total']}")
        print(f"Successful: {result.stats['successful']}")
        print(f"Failed: {result.stats['failed']}")
        print(f"Processing time: {result.total_time:.2f}s")
        
        if result.failed_jobs:
            print("\nFailed jobs:")
            for job in result.failed_jobs:
                print(f"- File: {job['file']}")
                print(f"  Errors: {', '.join(job['errors'])}")
        
        print("\nBulk creation test completed!")
        
    except Exception as e:
        print(f"\nBulk creation test failed with error: {str(e)}")
        raise

async def test_performance_optimizations():
    """Test performance optimizations"""
    try:
        print("\nTesting performance optimizations...")
        
        # Create all files in a single temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create test PDFs of different sizes
            pdf_files = []
            sizes = [1, 5, 10]  # Different sizes in MB
            for size in sizes:
                for i in range(2):  # 2 files of each size
                    pdf_path = temp_path / f"job_{size}mb_{i}.pdf"
                    # Create PDF with specified size
                    with open(pdf_path, 'wb') as f:
                        f.write(SAMPLE_JOB_PDF)
                        # Pad the file to reach desired size
                        f.write(b'0' * (size * 1024 * 1024))
                    pdf_files.append(pdf_path)
            
            # Create ZIP file
            zip_path = temp_path / "test.zip"
            with zipfile.ZipFile(zip_path, 'w') as zip_ref:
                for file in pdf_files:
                    zip_ref.write(file, file.name)
            
            # Read ZIP content
            with open(zip_path, 'rb') as f:
                zip_content = f.read()
            
            # Create mock UploadFile with streaming support
            class MockFile:
                def __init__(self, content):
                    self.content = content
                    self.pos = 0
                
                async def read(self):
                    return self.content
                
                async def stream(self):
                    chunk_size = 8192
                    while self.pos < len(self.content):
                        end = min(self.pos + chunk_size, len(self.content))
                        chunk = self.content[self.pos:end]
                        self.pos += chunk_size
                        yield chunk
                    
            mock_file = MockFile(zip_content)
            mock_file.filename = "test.zip"
            
            # Initialize processor with optimized settings
            processor = BatchProcessor(
                pdf_concurrency=5,
                llm_concurrency=3,
                batch_size=2,
                max_retries=2,
                retry_delay=0.5,
                cache_ttl=60,
                max_memory_percent=80.0,
                chunk_size=8192
            )
            
            # Replace the HTTP client with our mock
            processor.client.post = mock_post
            
            print("\nTesting first run (no cache)...")
            start_time = time.time()
            
            # First run - no cache
            events = []
            async for event in processor.process_zip(
                file=mock_file,
                organization_id="test_org_123",
                is_mock=True,
                status="DRAFT"
            ):
                events.append(event)
                print(f"\nReceived event: {event.model_dump_json()}")
            
            first_run_time = time.time() - start_time
            print(f"\nFirst run completed in {first_run_time:.2f}s")
            
            # Check metrics after first run
            metrics = processor.metrics
            print("\nPerformance metrics after first run:")
            print(f"Memory usage: {metrics['memory_usage']['current']['memory_rss']:.2f}MB")
            print(f"Average processing time: {metrics['processing_times']['average']:.2f}s")
            print(f"Average batch size: {metrics['batch_sizes']['average']:.2f}")
            
            print("\nTesting second run (with cache)...")
            mock_file.pos = 0  # Reset file position
            start_time = time.time()
            
            # Second run - should use cache
            cached_events = []
            async for event in processor.process_zip(
                file=mock_file,
                organization_id="test_org_123",
                is_mock=True,
                status="DRAFT"
            ):
                cached_events.append(event)
                print(f"\nReceived event: {event.model_dump_json()}")
            
            second_run_time = time.time() - start_time
            print(f"\nSecond run completed in {second_run_time:.2f}s")
            
            # Check metrics after second run
            metrics = processor.metrics
            print("\nPerformance metrics after second run:")
            print(f"Memory usage: {metrics['memory_usage']['current']['memory_rss']:.2f}MB")
            print(f"Average processing time: {metrics['processing_times']['average']:.2f}s")
            print(f"Average batch size: {metrics['batch_sizes']['average']:.2f}")
            
            # Verify cache effectiveness
            cache_speedup = first_run_time / second_run_time if second_run_time > 0 else float('inf')
            print(f"\nCache speedup: {cache_speedup:.2f}x")
            
            # Verify results
            print("\nVerifying results...")
            print(f"First run events: {len(events)}")
            print(f"Second run events: {len(cached_events)}")
            assert len(events) == len(cached_events), "Number of events should match between runs"
            
            # Count successful files
            first_run_success = sum(1 for e in events if e.event == "file_processed")
            second_run_success = sum(1 for e in cached_events if e.event == "file_processed")
            print(f"First run successful files: {first_run_success}")
            print(f"Second run successful files: {second_run_success}")
            assert first_run_success == second_run_success, "Number of successful files should match"
            
            # Verify memory optimization
            memory_samples = metrics['memory_usage']['history']
            max_memory = max(sample['memory_percent'] for sample in memory_samples)
            print(f"\nMemory usage stayed under limit: {max_memory:.1f}% < {processor.max_memory_percent:.1f}%")
            assert max_memory < processor.max_memory_percent, "Memory usage exceeded limit"
            
            print("\nPerformance optimization test completed!")
        
    except Exception as e:
        print(f"\nPerformance test failed with error: {str(e)}")
        raise

async def main():
    """Run all tests"""
    await test_batch_processor()
    await test_bulk_creation()
    await test_performance_optimizations()

if __name__ == "__main__":
    asyncio.run(main()) 