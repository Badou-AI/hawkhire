"""
FastAPI routes for job processing endpoints.
"""
from fastapi import APIRouter, UploadFile, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional
import logging
from .batch_processor import BatchProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    # Log incoming request details
    logger.info("Received ZIP processing request:")
    logger.info(f"File: {file.filename}, size: {file.size if hasattr(file, 'size') else 'unknown'}")
    logger.info(f"Organization ID: {organization_id}")
    logger.info(f"Is Mock: {is_mock}")
    logger.info(f"Status: {status}")
    logger.info(f"Content Type: {file.content_type}")

    async def event_generator():
        try:
            logger.debug("Starting event generator")
            event_count = 0
            async for event in processor.process_zip(
                file=file,
                organization_id=organization_id,
                is_mock=is_mock,
                status=status
            ):
                event_count += 1
                event_json = event.json()
                logger.debug(f"Sending event {event_count}: {event_json}")
                yield f"data: {event_json}\n\n"
            logger.debug(f"Event generator completed. Total events: {event_count}")
        except Exception as e:
            logger.error(f"Error during event generation: {str(e)}", exc_info=True)
            raise

    logger.debug("Creating streaming response")
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    ) 