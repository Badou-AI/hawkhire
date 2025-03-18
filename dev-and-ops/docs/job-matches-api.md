# Job Matches API Documentation

## Overview

The Job Matches API provides access to candidate matches for specific jobs. It retrieves candidate profiles that match job requirements and calculates statistics such as average match scores and top skills.

## Endpoints

### Get Job Matches

```
GET /api/jobs/{jobId}/matches
```

Retrieves candidate matches for a specific job.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | string | **Required**. The ID of the job to get matches for. |
| `exclude_fields` | string | Optional. Comma-separated list of fields to exclude from the response. Example: `embedding` |
| `offset` | number | Optional. Number of items to skip. Default: `0` |
| `size` | number | Optional. Maximum number of items to return. Default: `5000` |
| `update_stats` | boolean | Optional. Whether to update the job's processed data. Default: `true` |

#### Response

```json
{
  "documents": [
    {
      "id": "string",
      "item_data": {
        "upload_id": "string",
        "job_id": "string",
        "timestamp": "string",
        "content": {
          "title": "string",
          "profile": {
            "first_name": "string",
            "last_name": "string",
            "tel_num": "string",
            "email": "string"
          },
          "years_of_experience": 0,
          "summary": "string",
          "skills": [
            {
              "skill": "string",
              "score": 0
            }
          ],
          "topics": ["string"]
        },
        "file_info": {
          "name": "string",
          "size": 0,
          "mime_type": "string",
          "processed_path": "string"
        },
        "matching_score": {
          "data": {
            "justification": {
              "type": "string",
              "meta": {
                "description": "string"
              }
            },
            "score": {
              "type": "string",
              "minimum": 0,
              "maximum": 1,
              "meta": {
                "description": "string"
              },
              "value": 0
            }
          }
        }
      }
    }
  ],
  "total": 0
}
```

### Update Job Processed Data

```
GET /api/jobs/update-processed
```

Updates the processed data for all jobs.

#### Response

```json
{
  "total": 0,
  "processed": 0,
  "skipped": 0,
  "errors": 0,
  "results": [
    {
      "jobId": "string",
      "indexName": "string",
      "status": "processed | skipped | error",
      "reason": "string",
      "documentCount": 0,
      "error": "string"
    }
  ]
}
```

## Processed Data Structure

The processed data for a job includes:

```json
{
  "index_name": "string",
  "total_applicants": 0,
  "last_processed_at": "string",
  "processing_status": "pending | processing | completed | failed",
  "average_match_score": 0,
  "top_skills": [
    {
      "skill": "string",
      "count": 0,
      "average_score": 0
    }
  ],
  "processing_duration": 0
}
```

## Testing

You can test the Job Matches API using the provided test script:

```bash
node scripts/test-job-matches.js [jobId]
```

This script will:
1. Get job matches for the specified job ID
2. Update the job's processed data
3. Get the job details to verify the processed data was updated

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: The request was successful
- `404 Not Found`: The job or index was not found
- `500 Internal Server Error`: An error occurred while processing the request 