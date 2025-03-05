# Batch Job Processor

This module provides functionality for batch processing of job files (PDF, TXT) to extract job information and create job listings in bulk.

## Structure

The batch processor has been refactored into a modular architecture with clear separation of concerns:

```
backend/app/jobs/
├── processors/           # Core processing components
│   ├── file_processor.py # Handles file operations (ZIP extraction, text extraction)
│   ├── llm_integration.py # Handles LLM integration for job data extraction
│   └── job_validator.py  # Validates job data against schema
├── services/             # Supporting services
│   ├── api_client.py     # Client for API communication
│   ├── bulk_creator.py   # Handles bulk job creation
│   └── metrics.py        # Tracks and reports metrics
├── schemas/              # Data models
│   ├── events.py         # Event models for processing updates
│   └── job_models.py     # Job data models
└── batch_processor.py    # Main orchestrator
```

## Usage

```python
from pathlib import Path
from backend.app.jobs.batch_processor import BatchProcessor

async def process_jobs(zip_file_path: Path, organization_id: str):
    async with BatchProcessor() as processor:
        async for event in processor.process_zip(
            file_path=zip_file_path,
            organization_id=organization_id,
            status="DRAFT",
            is_mock=False
        ):
            print(f"Event: {event.event}")
            print(f"Progress: {event.processed_count}/{event.total_files}")
            
            if event.error:
                print(f"Error: {event.error}")
```

## Components

### BatchProcessor

The main orchestrator that coordinates the processing workflow.

### FileProcessor

Handles file operations including:
- ZIP file extraction
- Text extraction from PDF and TXT files
- Streaming file content

### LLMClient

Handles LLM integration for job data extraction:
- Communicates with the LLM API
- Normalizes job data
- Validates schema

### JobValidator

Validates job data against schema requirements.

### BulkJobCreator

Handles bulk creation of jobs with fallback to individual creation.

### APIClient

Client for API communication with retry logic and connection testing.

### MetricsService

Tracks and reports processing metrics.

## Events

The processor emits events during processing to provide real-time updates:

- `processing_started`: Processing has started
- `file_processed`: A file has been processed
- `file_processing_failed`: A file processing has failed
- `batch_completed`: Batch processing has completed
- `error`: An error occurred during processing 