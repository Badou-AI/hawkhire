# Batch Jobs Upload Implementation Plan

## Overview
This document outlines the implementation plan for adding batch job upload functionality to HawkHire. The feature will allow users to upload multiple job descriptions in a ZIP file (containing PDFs or text files) and process them into structured job data.

## Current State
- [x] Basic bulk create functionality with JSON files via `/v1/jobs/bulk` endpoint
- [x] Frontend UI for ZIP file upload with progress tracking
- [x] Support for ZIP file extraction
- [x] Basic PDF and TXT file support
- [x] Real-time progress tracking during processing
- [x] Option to mark jobs as mock data
- [x] Option to publish jobs immediately or keep as draft
- [x] Complete PDF processing integration
- [x] Proper error handling and validation
- [x] Integration with existing bulk creation endpoint
- [x] Basic concurrent processing with dual semaphores
- [-] Batch processing for LLM operations (needs optimization)
- [-] Memory efficient file handling (needs improvement)
- [ ] Optimized processing speed (current: ~50s for 10 files, target: <15s)
- [ ] Advanced batch processing with proper retries
- [ ] Comprehensive test coverage
- [ ] Production-ready monitoring and metrics
- [ ] Backend migration to Python for improved performance

Note: Items marked with [-] are partially implemented but need significant improvements.

## Target State
- Support for ZIP files containing multiple job descriptions
- Support for PDF and TXT file formats
- Real-time progress tracking during processing
- Validation and error handling for each file
- Option to mark jobs as mock data
- Structured conversion of text to job data
- Batch creation of validated jobs via existing `/v1/jobs/bulk` endpoint

## Implementation Steps

### 1. Frontend Changes

#### 1.1 Update Bulk Create Dialog (`bulk-create-dialog.tsx`)
[x] Modify file input to accept ZIP files
[x] Add `is_mock` checkbox
[x] Add progress tracking UI
[x] Add file validation
[x] Add error handling and user feedback
[x] Add processing status indicators

#### 1.2 Add Processing UI Components
[x] Add progress bar for overall processing
[x] Add status cards for:
  - Total files
  - Processed files
  - Failed files
  - Processing time
[x] Add file list with status indicators
[x] Add error messages and warnings

#### 1.3 Add API Integration
[x] Add file upload handler
[x] Add progress event listeners
[x] Add batch job creation handler
[x] Add error handling

### 2. Backend Changes

#### 2.1 Update Next.js API Route
- [ ] Refactor `/api/jobs/process-zip` to use `/v1/jobs/bulk` endpoint
- [ ] Improve error handling and validation
- [ ] Add proper cleanup of temporary files
- [ ] Add rate limiting and file size checks

#### 2.2 Update FastAPI Integration
- [ ] Create dedicated PDF processing endpoint
- [ ] Implement proper text extraction service
- [ ] Add validation for extracted content
- [ ] Improve error handling and reporting

#### 2.3 Add Text to Job Data Conversion
- [ ] Implement proper text parsing logic
- [ ] Add validation for required fields
- [ ] Handle multilingual content
- [ ] Improve title extraction from filenames

#### 2.4 Optimize Batch Processing
- [ ] Implement proper batching strategy
- [ ] Add retry logic for failed items
- [ ] Improve progress tracking accuracy
- [ ] Add proper cleanup procedures

### 3. Schema Updates

#### 3.1 Job Processing Schema
```typescript
interface JobProcessingEvent {
  event: 'processing_started' | 'file_processed' | 'file_failed' | 'completed';
  total_files: number;
  processed_count: number;
  failed_count: number;
  file_name?: string;
  error?: string;
}

interface ProcessedJobData {
  original_file: string;
  extracted_data: JobCreationRequest;
  validation_errors?: string[];
  processing_time: number;
}

interface BatchProcessingResult {
  successful_jobs: ProcessedJobData[];
  failed_jobs: ProcessedJobData[];
  total_time: number;
  stats: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

### 4. Testing Plan

#### 4.1 Frontend Tests
- [ ] File upload validation
- [ ] Progress tracking
- [ ] Error handling
- [ ] UI state management
- [ ] API integration

#### 4.2 Backend Tests
- [ ] File processing
- [ ] Data extraction
- [ ] Batch job creation
- [ ] Error scenarios
- [ ] Performance testing

#### 4.3 Integration Tests
- [ ] End-to-end upload flow
- [ ] Progress streaming
- [ ] Error handling
- [ ] Large file handling
- [ ] Concurrent uploads

### 5. Deployment Plan

#### 5.1 Prerequisites
- [ ] Update dependencies
- [ ] Configure file size limits
- [ ] Set up error monitoring
- [ ] Update API documentation

#### 5.2 Rollout Stages
1. Development testing
2. Staging deployment
3. Beta testing with limited users
4. Full production rollout

### 5. Performance Optimization Plan

#### 5.1 Current Performance
- Processing time: ~50s for 10 files (5s per file average)
- Bottlenecks identified:
  - PDF to text conversion speed
  - Sequential LLM processing
  - Network latency between services
  - File I/O operations

#### 5.2 Optimization Targets
1. **Batch Processing Improvements**
   - Increase LLM batch size (from 5 to 10-15 files)
   - Implement smarter batching based on file sizes
   - Add batch priority queue for better resource utilization

2. **Concurrent Processing Enhancements**
   - Increase PDF processing concurrency
   - Implement parallel LLM requests for different batches
   - Add worker pool for CPU-intensive tasks

3. **Service Optimizations**
   - Cache intermediate results (PDF to text)
   - Optimize PDF text extraction
   - Implement streaming responses from LLM service
   - Reduce network round trips

4. **Memory and I/O Optimizations**
   - Implement streaming file processing
   - Optimize temporary file handling
   - Add memory usage monitoring
   - Implement cleanup strategies

#### 5.3 Performance Targets
- Phase 1: Reduce to 30s for 10 files
- Phase 2: Reduce to 20s for 10 files
- Phase 3: Achieve target of <15s for 10 files

#### 5.4 Monitoring and Metrics
- Add detailed performance logging
- Track processing time per phase
- Monitor resource utilization
- Implement performance regression tests

## Success Criteria
1. Users can successfully upload ZIP files containing job descriptions
2. Files are processed with >95% accuracy
3. Real-time progress updates are provided
4. Failed files are properly reported with clear error messages
5. Batch job creation is atomic and handles errors gracefully
6. Performance meets targets (processing time < 30s for 10 files)

## Future Enhancements
1. Support for more file formats (DOCX, RTF)
2. AI-powered job description improvement suggestions
3. Template-based job creation
4. Bulk editing of processed jobs before creation
5. Job description quality scoring 