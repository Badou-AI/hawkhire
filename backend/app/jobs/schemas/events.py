from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class JobProcessingEvent(BaseModel):
    """Event emitted during job processing"""
    
    event: str = Field(..., description="Event type")
    total_files: int = Field(..., description="Total number of files")
    processed_count: int = Field(..., description="Number of processed files")
    failed_count: int = Field(..., description="Number of failed files")
    file_name: Optional[str] = Field(None, description="Name of the current file")
    error: Optional[str] = Field(None, description="Error message if any")
    processing_details: Optional[Dict[str, Any]] = Field(None, description="Additional processing details")

class ProcessingEvent(BaseModel):
    """Base model for processing events"""
    event: str = Field(..., description="Event type")
    total_files: int = Field(..., description="Total number of files to process")
    processed_count: int = Field(0, description="Number of files processed so far")
    failed_count: int = Field(0, description="Number of files that failed processing")
    file_name: Optional[str] = Field(None, description="Name of the current file being processed")
    error: Optional[str] = Field(None, description="Error message if processing failed")
    processing_details: Optional[Dict[str, Any]] = Field(None, description="Additional processing details")
    
    @classmethod
    def processing_started(cls, total_files: int) -> "ProcessingEvent":
        """Create a processing started event"""
        return cls(
            event="processing_started",
            total_files=total_files,
            processed_count=0,
            failed_count=0
        )
    
    @classmethod
    def file_processed(cls, total_files: int, processed_count: int, failed_count: int, file_name: str) -> "ProcessingEvent":
        """Create a file processed event"""
        return cls(
            event="file_processed",
            total_files=total_files,
            processed_count=processed_count,
            failed_count=failed_count,
            file_name=file_name
        )
    
    @classmethod
    def file_failed(cls, total_files: int, processed_count: int, failed_count: int, file_name: str, error: str) -> "ProcessingEvent":
        """Create a file failed event"""
        return cls(
            event="file_failed",
            total_files=total_files,
            processed_count=processed_count,
            failed_count=failed_count,
            file_name=file_name,
            error=error
        )
    
    @classmethod
    def processing_completed(cls, total_files: int, processed_count: int, failed_count: int) -> "ProcessingEvent":
        """Create a processing completed event"""
        return cls(
            event="processing_completed",
            total_files=total_files,
            processed_count=processed_count,
            failed_count=failed_count
        )

class ProcessedJobData(BaseModel):
    """Model for processed job data"""
    original_file: str = Field(..., description="Original file name")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted job data")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors")
    processing_time: float = Field(0.0, description="Processing time in seconds")

class BatchProcessingResult(BaseModel):
    """Model for batch processing results"""
    successful_jobs: List[Dict[str, Any]] = Field(default_factory=list)
    failed_jobs: List[Dict[str, Any]] = Field(default_factory=list)
    total_time: float = Field(0.0, description="Total processing time in seconds")
    stats: Dict[str, int] = Field(default_factory=dict, description="Processing statistics") 