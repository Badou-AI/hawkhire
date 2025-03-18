# Resume Processing Flow Audit

## Overview

This document provides a comprehensive audit of the resume processing flow in the HawkHire application, covering both frontend and backend components.

## 1. Frontend Flow

### A. Upload Initiation (`app/(protected)/resume-processing/page.tsx`)

1. **Main Component**: `ResumeProcessingPage`
   - Handles file upload and processing status
   - Manages job selection and validation
   - Displays processing progress

2. **Key Methods**:
```typescript
handleFileUpload(file: File) {
  // Validates job selection
  // Prepares FormData
  // Initiates upload to /api/resumes endpoint
  // Handles streaming response for progress updates
}
```

### B. Next.js API Route (`app/api/resumes/route.ts`)

1. **POST Handler**:
```typescript
export async function POST(request: NextRequest) {
  // Forwards request to FastAPI backend
  // Handles streaming response
  // Error handling and response formatting
}
```

## 2. Backend Flow (FastAPI)

### A. Main Processing Endpoints

1. **ZIP Processing Endpoint** (`backend/app/main.py`):
```python
@app.post("/process-zip")
async def process_zip(
    file: UploadFile,
    job_id: str,
    job_description: str
)
```

2. **PDF Processing** (`backend/app/main.py`):
```python
async def process_single_pdf(
    file_path: Path,
    dest_path: Path,
    semantic_service: SemanticService,
    index_name: str,
    upload_id: str,
    job_id: str,
    job_description: str,
    progress_callback: callable
)
```

### B. Supporting Services

1. **Semantic Service** (`backend/app/main.py`):
```python
class SemanticService:
    async def convert_pdf_to_text(self, file_path: Path) -> Dict
    async def generate_embedding(self, text: str) -> List[float]
    async def extract_knowledge(self, text: str, schema: Dict) -> Dict
    async def analyze_document(self, text: str, job_description: str, schema: Dict) -> Dict
```

2. **Mock Semantic Service** (Fallback):
```python
class MockSemanticService:
    async def convert_pdf_to_text(self, file_path: Path) -> Dict
    async def generate_embedding(self, text: str) -> List[float]
    async def extract_knowledge(self, text: str, schema: Dict) -> Dict
```

## 3. Processing Flow Steps

1. **Frontend Upload**:
   - User selects job position
   - Uploads ZIP file
   - Receives real-time progress updates

2. **API Gateway** (Next.js):
   - Validates request
   - Forwards to FastAPI backend
   - Maintains streaming connection

3. **Backend Processing**:
   ```
   ZIP Upload → Extract Files → Process Each PDF → Generate Embeddings → Match Against Job → Return Results
   ```

4. **File Processing Pipeline**:
   ```
   PDF → Text Extraction → Knowledge Extraction → Embedding Generation → Matching → Results
   ```

## 4. Critical Points for Audit

### A. Error Handling

1. Frontend:
   - File type validation
   - Size limits
   - Job selection validation
   - Progress tracking

2. Backend:
   - ZIP file validation
   - PDF extraction
   - Text processing
   - Service availability

### B. Performance Considerations

1. **Batch Processing**:
```python
async def process_text_batch(batch: List[Dict]) -> List[Dict]
```

2. **Concurrent Processing**:
   - Semaphore usage
   - Memory management
   - Temporary file cleanup

### C. Security Checks

1. Authentication:
   - Session validation
   - File access permissions
   - API rate limiting

2. File Processing:
   - File type validation
   - Content validation
   - Secure file handling

## 5. Event System

### A. Processing Events
```typescript
interface ProcessingEvent {
  event: 'processing_started' | 'file_processed' | 'file_failed' | 'completed' | 'error';
  total_files?: number;
  processed_count?: number;
  failed_count?: number;
  file_name?: string;
  error?: string;
}
```

### B. Status Updates

1. Frontend Display:
   - Upload progress
   - Processing status
   - File counts
   - Error messages

## 6. Data Models

### A. Job Data
```typescript
interface JobData {
  title: { en: string; fr?: string };
  description: { en: string; fr?: string };
  organization_id: string;
  // ... other fields
}
```

### B. Processing Stats
```typescript
interface ProcessingStats {
  totalFiles: number;
  processedCount: number;
  failedCount: number;
  processingTime: number;
}
```

## 7. Configuration Points

1. **Environment Variables**:
   - `REMOTE_API_URL`
   - `SEMANTIC_SEARCH_URL`
   - File size limits
   - Batch processing settings

2. **Service Configuration**:
   - Semantic service selection
   - Index configuration
   - Processing timeouts

## 8. Recommendations for Audit

1. **Performance Testing**:
   - Test with large ZIP files
   - Monitor memory usage
   - Measure processing times

2. **Error Scenarios**:
   - Invalid file types
   - Corrupt PDFs
   - Service failures
   - Network interruptions

3. **Security Review**:
   - File validation
   - Authentication flow
   - Data handling
   - Temporary file management

4. **Monitoring Points**:
   - Processing success rates
   - Error frequencies
   - Processing times
   - Service availability

## 9. Known Issues and Limitations

1. **Performance**:
   - Processing time increases linearly with file count
   - Memory usage spikes during large file processing
   - Network latency affects processing time

2. **Compatibility**:
   - Limited to PDF files only
   - ZIP file structure must be flat
   - File size limited to 500MB

## 10. Future Improvements

1. **Performance Optimizations**:
   - Implement parallel processing
   - Add file streaming support
   - Optimize memory usage

2. **Feature Enhancements**:
   - Support for more file formats
   - Advanced matching algorithms
   - Better error recovery

3. **Monitoring**:
   - Add detailed logging
   - Implement metrics collection
   - Set up alerting system

## 11. Testing Guidelines

1. **Unit Tests**:
   - Test each processing step
   - Validate error handling
   - Check edge cases

2. **Integration Tests**:
   - End-to-end flow testing
   - API integration testing
   - Performance benchmarking

3. **Load Testing**:
   - Concurrent uploads
   - Large file processing
   - System resource monitoring
