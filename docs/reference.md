# Resume Processing System Documentation

## Overview
This document explains the resume processing system implemented in `__main__.py`, which handles the processing of resumes against job descriptions using semantic search and AI-powered analysis.

## Core Components

### 1. Embedding Types and Models
```python
class EmbeddingInputType(str, Enum):
    SEARCH_DOCUMENT = 'search_document'
    SEARCH_QUERY = 'search_query'
    CLUSTERING = 'clustering'
    CLASSIFICATION = 'classification'
    IMAGE = 'image'

class EmbeddingModel(str, Enum):
    ENGLISH_ONLY_LIGHT = 'embed-english-light-v3.0'
    MULTILINGUAL_LIGHT = 'embed-multilingual-light-v3.0'
    ENGLISH_ONLY_HEAVY = 'embed-english-v3.0'
    MULTILINGUAL_HEAVY = 'embed-multilingual-v3.0'
```
These enums define the types of embedding operations and available models for text processing.

### 2. Main Commands

#### Create Index
```python
@handler.command()
def create_index(ctx, index, path2config_json)
```
- Creates a new search index using provided configuration
- Configuration includes schema for storing resume data
- Sends POST request to create index endpoint

#### Fill Index
```python
@handler.command()
def fill_index(ctx, index, path2corpus)
```
Processes resumes and adds them to the search index through several steps:

1. **PDF Processing**
   - Reads PDF files from specified directory
   - Converts PDFs to text using API endpoint

2. **Data Extraction**
   - Processes text to extract structured information
   - Uses predefined JSON schema for consistency

3. **Semantic Analysis**
   - Compares resume against job description
   - Generates matching scores and justifications
   - Uses GPT-4 for analysis

4. **Embedding Generation**
   - Creates vector embeddings for semantic search
   - Uses multilingual heavy model for best accuracy

5. **Index Storage**
   - Generates unique document ID using SHA256
   - Stores processed data in search index

## Data Schema

### Resume Processing Schema
```json
{
    "title": {
        "type": "string",
        "description": "The main title of the content",
        "required": true
    },
    "profile": {
        "type": "object",
        "properties": {
            "first_name": {"type": "string", "required": true},
            "last_name": {"type": "string", "required": true},
            "tel_num": {"type": "string", "required": false},
            "email": {"type": "string", "required": false}
        }
    },
    "summary": {
        "type": "string",
        "description": "A concise summary of the main content",
        "required": true
    },
    "question_answer": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
                "answer": {"type": "string"}
            }
        }
    },
    "example_queries": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Semantic search queries highlighting candidate skills"
    },
    "topics": {
        "type": "array",
        "items": {"type": "string"}
    }
}
```

### Matching Score Schema
```json
{
    "score": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "domain": {"type": "string"},
                "value": {"type": "float"}
            }
        }
    },
    "justification": {
        "type": "string",
        "description": "Explanation of matching score"
    }
}
```

## Processing Flow

1. **Document Ingestion**
   - System reads PDF resumes from specified directory
   - Converts PDFs to text format
   - Validates file format and content

2. **Semantic Analysis**
   - Compares resume text against job description
   - Uses AI to generate matching scores
   - Provides detailed justification for scores
   - Outputs results in French language

3. **Vector Embedding**
   - Generates vector embeddings for processed documents
   - Uses MULTILINGUAL_HEAVY model for accuracy
   - Enables efficient semantic search

4. **Storage**
   - Generates unique document ID
   - Stores processed data and embeddings
   - Maintains searchable index

## API Integration

The system integrates with several API endpoints:
- `/v1/tools/convert_pdf2text`: PDF to text conversion
- `/v1/tools/convert_doc2json`: Document structure extraction
- `/v1/embedding/text`: Vector embedding generation
- `/v1/index/{index}/document/{document_id}`: Document storage

## Error Handling
- Implements try-catch blocks for each API call
- Logs errors for debugging
- Continues processing remaining documents if one fails
- Maintains data integrity through transaction-like processing 