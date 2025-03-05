# Batch Processor Refactoring Plan

## 1. Target Architecture 

jobs/
├── processors/
│ ├── file_processor.py # File handling & text extraction
│ ├── llm_integration.py # LLM communication layer
│ └── job_validator.py # Validation & normalization
├── services/
│ ├── api_client.py # HTTP client management
│ ├── bulk_creator.py # Bulk job creation logic
│ └── metrics.py # Metrics collection
├── schemas/
│ ├── job_models.py # Pydantic data models
│ └── events.py # Processing event models
└── batch_processor.py # Main coordinator


## 2. Core Component Specifications

### 2.1 Data Models (`schemas/job_models.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class JobLocation(BaseModel):
    city: Dict[str, str] = Field(..., min_length=2)
    country: Dict[str, str] = Field(...)
    state: Dict[str, str] = Field(default_factory=dict)
    postal_code: Dict[str, str] = Field(default_factory=dict)

class JobRequirements(BaseModel):
    en: List[str] = Field(default_factory=list)
    fr: List[str] = Field(default_factory=list)

class BaseJobData(BaseModel):
    title: Dict[str, str]
    description: Dict[str, str]
    location: JobLocation
    job_type: str = Field(..., regex=r"^(FULL_TIME|PART_TIME|CONTRACT|...)$")
    organization_id: str = Field(..., min_length=36, max_length=36)
    requirements: JobRequirements
    skills: List[str] = Field(default_factory=list)
    remote: bool = False
```

### 2.2 File Processor (`processors/file_processor.py`)
```python
class FileProcessor:
    async def process_zip(self, file: UploadFile) -> AsyncIterator[Path]:
        """Stream and extract ZIP file incrementally"""
        # Uses zipfile module with streaming support
        # Yields extracted file paths
    
    async def extract_text(self, file_path: Path) -> str:
        """Universal text extractor with format detection"""
        # Implements PDF/TXT handling with pdfminer.six
        # Includes fallback text extraction strategies
```

### 2.3 LLM Integration (`processors/llm_integration.py`)
```python
class LLMIntegration:
    def __init__(self, api_client: APIClient):
        self.api_client = api_client
    
    async def extract_job_data(self, text: str) -> BaseJobData:
        """Send text to LLM and parse response"""
        # Implements retry logic with exponential backoff
        # Includes response validation
        # Handles API rate limiting
```

### 2.4 Job Validator (`processors/job_validator.py`)
```python
class JobValidator:
    def __init__(self, schema_validator: BaseJobData):
        self.schema = schema_validator
    
    async def validate_job(self, raw_data: dict) -> tuple[BaseJobData, list[str]]:
        """Validate and normalize job data"""
        # Uses Pydantic validation
        # Includes business rule checks
        # Returns normalized data + warnings
```

### 2.5 Bulk Creator (`services/bulk_creator.py`)
```python
class BulkJobCreator:
    async def create_batch(self, jobs: list[BaseJobData]) -> BatchResult:
        """Optimized batch creation with chunking"""
        # Implements:
        # - Auto-chunking based on payload size
        # - Parallel request processing
        # - Transactional fallback
        # - Progress tracking
```

### 2.6 API Client (`services/api_client.py`)
```python
class APIClient:
    def __init__(self):
        self.session = aiohttp.ClientSession()
    
    async def send_batch(self, jobs: list[BaseJobData]) -> list[dict]:
        """Send validated jobs to backend API"""
        # Handles:
        # - Authentication
        # - Retryable error detection
        # - Payload compression
        # - Response parsing
```

## 3. Main Processor Flow (`batch_processor.py`)
```python
class BatchProcessor:
    def __init__(self):
        self.file_processor = FileProcessor()
        self.llm = LLMIntegration(APIClient())
        self.validator = JobValidator(BaseJobData)
        self.bulk_creator = BulkJobCreator()

    async def process_zip(self, file: UploadFile) -> AsyncIterator[ProcessingEvent]:
        async for event in self._process_pipeline(file):
            yield event

    async def _process_pipeline(self, file: UploadFile):
        async for file_path in self.file_processor.process_zip(file):
            try:
                text = await self.file_processor.extract_text(file_path)
                raw_data = await self.llm.extract_job_data(text)
                validated = await self.validator.validate_job(raw_data)
                yield ProcessingEvent.file_validated(file_path.name)
                
            except ValidationError as e:
                yield ProcessingEvent.validation_failed(file_path.name, e)
                continue

        batch_result = await self.bulk_creator.create_batch(validated_jobs)
        yield ProcessingEvent.batch_completed(batch_result)
```

## 4. Key Improvements

1. **Separation of Concerns**
   - Clear module boundaries between file handling, LLM comms, validation
   - Single responsibility for each component
   - Pure business logic separated from I/O operations

2. **Data Validation**
   - Strong typing with Pydantic
   - Schema versioning support
   - Automatic documentation generation

3. **Performance Enhancements**
   - Stream-based ZIP processing
   - Parallel file processing
   - Configurable batch sizes
   - Memory usage monitoring

4. **Error Handling**
   - Structured error taxonomy
   - Retry queues for transient failures
   - Dead letter queue for unrecoverable errors
   - Detailed error diagnostics

5. **Observability**
   - Built-in metrics collection
   - Processing timeline tracking
   - LLM performance monitoring
   - Detailed audit logs

## 5. Migration Strategy

1. **Phase 1: Foundation**
   - Implement data models and validation
   - Build file processor with streaming
   - Create API client with retry logic

2. **Phase 2: Core Implementation**
   - Develop LLM integration layer
   - Implement bulk creator with chunking
   - Build metrics service

3. **Phase 3: Integration**
   - Create migration wrapper for old processor
   - Implement parallel processing
   - Add comprehensive logging

4. **Phase 4: Optimization**
   - Add memory monitoring
   - Implement auto-scaling batch sizes
   - Introduce circuit breakers

## 6. Testing Strategy

1. **Unit Tests**
   - Pure validation logic
   - Data normalization
   - Error classification

2. **Integration Tests**
   - Full processing pipeline
   - Failure recovery scenarios
   - LLM API contract tests

3. **Performance Tests**
   - Large file handling (1GB+ ZIPs)
   - High concurrency scenarios
   - Long-running stress tests

4. **Contract Tests**
   - Validate API client compatibility
   - LLM response format verification
   - Schema version compatibility