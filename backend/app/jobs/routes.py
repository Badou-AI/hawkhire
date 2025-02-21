"""
FastAPI routes for job processing endpoints.
"""
from fastapi import APIRouter, UploadFile, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional
from .batch_processor import BatchProcessor

router = APIRouter(prefix="/v2/jobs", tags=["jobs"])
processor = BatchProcessor()

@router.post("/process-zip")
async def process_zip_v2(
    file: UploadFile,
    organization_id: str = Form(...),
    is_mock: bool = Form(False),
    status: str = Form("DRAFT")
) -> StreamingResponse:
    """
    Process a ZIP file containing job descriptions with optimized performance.
    
    This endpoint provides:
    - Parallel processing of PDF files
    - Batched LLM operations
    - Real-time progress updates via SSE
    - Proper error handling and retries
    """
    async def event_generator():
        async for event in processor.process_zip(
            file=file,
            organization_id=organization_id,
            is_mock=is_mock,
            status=status
        ):
            yield f"data: {event.json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    ) 