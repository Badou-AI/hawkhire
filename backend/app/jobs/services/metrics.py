import logging
import time
import os
import psutil
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MetricsService:
    """Service for tracking and reporting metrics"""
    
    def __init__(self, metrics_file: Optional[str] = None):
        """Initialize the metrics service
        
        Args:
            metrics_file: Optional path to metrics file
        """
        self._metrics = {
            "processing_count": 0,
            "success_count": 0,
            "failure_count": 0,
            "total_processing_time": 0,
            "avg_processing_time": 0,
            "last_updated": datetime.now().isoformat()
        }
        self._historical_metrics = []
        self.metrics_file = metrics_file
    
    def update_metrics(self, metric_type: str, value: Any):
        """Update metrics with new data
        
        Args:
            metric_type: Type of metric to update
            value: Value to update with
        """
        if metric_type == "processing":
            self._metrics["processing_count"] += 1
            self._metrics["total_processing_time"] += value.get("processing_time", 0)
            self._metrics["avg_processing_time"] = (
                self._metrics["total_processing_time"] / self._metrics["processing_count"]
                if self._metrics["processing_count"] > 0 else 0
            )
            
            if value.get("success", False):
                self._metrics["success_count"] += 1
            else:
                self._metrics["failure_count"] += 1
        
        elif metric_type == "system":
            self._metrics["system"] = value
        
        elif metric_type == "llm_extraction":
            if "llm_extraction" not in self._metrics:
                self._metrics["llm_extraction"] = {
                    "total_count": 0,
                    "success_count": 0,
                    "failure_count": 0,
                    "avg_text_length": 0,
                    "total_text_length": 0
                }
            
            self._metrics["llm_extraction"]["total_count"] += 1
            self._metrics["llm_extraction"]["total_text_length"] += value.get("text_length", 0)
            self._metrics["llm_extraction"]["avg_text_length"] = (
                self._metrics["llm_extraction"]["total_text_length"] / 
                self._metrics["llm_extraction"]["total_count"]
            )
            
            if value.get("success", False):
                self._metrics["llm_extraction"]["success_count"] += 1
            else:
                self._metrics["llm_extraction"]["failure_count"] += 1
                
        elif metric_type == "bulk_creation":
            if "bulk_creation" not in self._metrics:
                self._metrics["bulk_creation"] = {
                    "total_jobs": 0,
                    "successful_jobs": 0,
                    "failed_jobs": 0,
                    "total_time": 0,
                    "avg_time_per_job": 0
                }
            
            self._metrics["bulk_creation"]["total_jobs"] += value.get("total_jobs", 0)
            self._metrics["bulk_creation"]["successful_jobs"] += value.get("successful_jobs", 0)
            self._metrics["bulk_creation"]["failed_jobs"] += value.get("failed_jobs", 0)
            self._metrics["bulk_creation"]["total_time"] += value.get("total_time", 0)
            
            if self._metrics["bulk_creation"]["total_jobs"] > 0:
                self._metrics["bulk_creation"]["avg_time_per_job"] = (
                    self._metrics["bulk_creation"]["total_time"] / 
                    self._metrics["bulk_creation"]["total_jobs"]
                )
        
        # Update timestamp
        self._metrics["last_updated"] = datetime.now().isoformat()
        
        # Save historical snapshot every hour
        self._save_historical_snapshot()
    
    def _save_historical_snapshot(self):
        """Save a snapshot of current metrics to historical data"""
        last_snapshot = None
        if self._historical_metrics:
            last_snapshot = self._historical_metrics[-1]
            last_snapshot_time = datetime.fromisoformat(last_snapshot["timestamp"])
            
            # Only save a new snapshot if it's been at least an hour
            if datetime.now() - last_snapshot_time < timedelta(hours=1):
                return
        
        # Create a snapshot
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "metrics": self._metrics.copy()
        }
        
        # Add system metrics
        snapshot["metrics"]["system"] = self._get_system_metrics()
        
        # Add to historical data
        self._historical_metrics.append(snapshot)
        
        # Limit historical data to last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        self._historical_metrics = [
            m for m in self._historical_metrics 
            if datetime.fromisoformat(m["timestamp"]) > thirty_days_ago
        ]
        
        # Save to file if configured
        if self.metrics_file:
            try:
                import json
                with open(self.metrics_file, 'w') as f:
                    json.dump({
                        "current": self._metrics,
                        "historical": self._historical_metrics
                    }, f, indent=2)
            except Exception as e:
                logger.error(f"Error saving metrics to file: {str(e)}")
    
    def _get_system_metrics(self) -> Dict[str, float]:
        """Get current system metrics
        
        Returns:
            Dictionary of system metrics
        """
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return {
            'memory_percent': process.memory_percent(),
            'memory_rss': memory_info.rss / 1024 / 1024,  # MB
            'cpu_percent': process.cpu_percent(),
            'open_files': len(process.open_files()),
            'threads': process.num_threads()
        }
    
    def get_historical_metrics(self, days: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get historical metrics for specified period
        
        Args:
            days: Number of days to retrieve (None for all)
            
        Returns:
            List of historical metrics
        """
        if days is None:
            return self._historical_metrics
        
        cutoff_date = datetime.now() - timedelta(days=days)
        return [
            m for m in self._historical_metrics 
            if datetime.fromisoformat(m["timestamp"]) > cutoff_date
        ]
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get summary of processing performance
        
        Returns:
            Dictionary with performance summary
        """
        return {
            "processing": {
                "total": self._metrics["processing_count"],
                "success_rate": (
                    self._metrics["success_count"] / self._metrics["processing_count"] * 100
                    if self._metrics["processing_count"] > 0 else 0
                ),
                "avg_time": self._metrics["avg_processing_time"]
            },
            "system": self._get_system_metrics(),
            "llm_extraction": self._metrics.get("llm_extraction", {}),
            "bulk_creation": self._metrics.get("bulk_creation", {})
        }
    
    @property
    def metrics(self) -> Dict[str, Any]:
        """Get current metrics
        
        Returns:
            Dictionary of current metrics
        """
        return self._metrics.copy() 