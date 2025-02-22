"""
Metrics service for monitoring and tracking batch job processing performance.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import statistics
from dataclasses import dataclass, field
import json
import asyncio
import psutil
import os

@dataclass
class ProcessingMetrics:
    """Metrics for a single processing run"""
    start_time: datetime
    total_files: int = 0
    processed_files: int = 0
    failed_files: int = 0
    processing_times: List[float] = field(default_factory=list)
    memory_samples: List[Dict[str, float]] = field(default_factory=list)
    batch_sizes: List[int] = field(default_factory=list)
    cache_hits: int = 0
    cache_misses: int = 0
    errors: List[str] = field(default_factory=list)
    end_time: Optional[datetime] = None
    
    def __post_init__(self):
        """Ensure total_files is set properly"""
        if not isinstance(self.total_files, int):
            self.total_files = 0
    
    @property
    def duration(self) -> float:
        """Get total duration in seconds"""
        if not self.end_time:
            return (datetime.now() - self.start_time).total_seconds()
        return (self.end_time - self.start_time).total_seconds()
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage"""
        if self.total_files == 0:
            return 0.0
        return (self.processed_files / self.total_files) * 100
    
    @property
    def average_processing_time(self) -> float:
        """Calculate average processing time per file"""
        if not self.processing_times:
            return 0.0
        return statistics.mean(self.processing_times)
    
    @property
    def peak_memory_usage(self) -> float:
        """Get peak memory usage in MB"""
        if not self.memory_samples:
            return 0.0
        return max(sample['memory_rss'] for sample in self.memory_samples)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary format"""
        return {
            'duration': self.duration,
            'total_files': self.total_files,
            'processed_files': self.processed_files,
            'failed_files': self.failed_files,
            'success_rate': self.success_rate,
            'average_processing_time': self.average_processing_time,
            'peak_memory_usage': self.peak_memory_usage,
            'cache_performance': {
                'hits': self.cache_hits,
                'misses': self.cache_misses,
                'hit_rate': (self.cache_hits / (self.cache_hits + self.cache_misses)) * 100 if (self.cache_hits + self.cache_misses) > 0 else 0
            },
            'batch_performance': {
                'average_size': statistics.mean(self.batch_sizes) if self.batch_sizes else 0,
                'min_size': min(self.batch_sizes) if self.batch_sizes else 0,
                'max_size': max(self.batch_sizes) if self.batch_sizes else 0
            },
            'error_summary': {
                'count': len(self.errors),
                'types': list(set(self.errors))
            }
        }

class MetricsService:
    """Service for collecting and managing processing metrics"""
    
    def __init__(self, metrics_retention_days: int = 7):
        self.metrics_retention_days = metrics_retention_days
        self._current_metrics: Optional[ProcessingMetrics] = None
        self._historical_metrics: List[ProcessingMetrics] = []
        self._lock = asyncio.Lock()
    
    def start_processing(self, total_files: int) -> None:
        """Start tracking metrics for a new processing run"""
        if self._current_metrics:
            self.end_processing()  # End any existing run
        self._current_metrics = ProcessingMetrics(
            start_time=datetime.now(),
            total_files=total_files
        )
        # Initialize with first memory sample
        self._current_metrics.memory_samples.append(self._get_memory_metrics())
    
    def end_processing(self) -> None:
        """End current processing run and save metrics"""
        if self._current_metrics:
            self._current_metrics.end_time = datetime.now()
            # Take final memory sample
            self._current_metrics.memory_samples.append(self._get_memory_metrics())
            # Save metrics to history
            self._historical_metrics.append(self._current_metrics)
            self._cleanup_old_metrics()
            # Reset current metrics but preserve all counters
            total_files = self._current_metrics.total_files
            processed_files = self._current_metrics.processed_files
            failed_files = self._current_metrics.failed_files
            cache_hits = self._current_metrics.cache_hits
            cache_misses = self._current_metrics.cache_misses
            self._current_metrics = ProcessingMetrics(
                start_time=datetime.now(),
                total_files=total_files,
                processed_files=processed_files,
                failed_files=failed_files
            )
            self._current_metrics.cache_hits = cache_hits
            self._current_metrics.cache_misses = cache_misses
    
    def update_metrics(self, metric_type: str, value: Any) -> None:
        """Update current processing metrics"""
        if not self._current_metrics:
            return
            
        if metric_type == 'total_files':
            if isinstance(value, int) and value >= 0:
                self._current_metrics.total_files = value
        elif metric_type == 'processed_file':
            self._current_metrics.processed_files += 1
        elif metric_type == 'failed_file':
            self._current_metrics.failed_files += 1
        elif metric_type == 'processing_time':
            if isinstance(value, (int, float)) and value > 0:
                self._current_metrics.processing_times.append(value)
        elif metric_type == 'memory_usage':
            self._current_metrics.memory_samples.append(self._get_memory_metrics())
        elif metric_type == 'batch_size':
            if isinstance(value, int) and value > 0:
                self._current_metrics.batch_sizes.append(value)
        elif metric_type == 'cache_hit':
            self._current_metrics.cache_hits += 1
        elif metric_type == 'cache_miss':
            self._current_metrics.cache_misses += 1
        elif metric_type == 'error':
            if value:
                self._current_metrics.errors.append(str(value))
    
    def _get_memory_metrics(self) -> Dict[str, float]:
        """Get current memory metrics"""
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return {
            'memory_percent': process.memory_percent(),
            'memory_rss': memory_info.rss / 1024 / 1024,  # MB
            'cpu_percent': process.cpu_percent()
        }
    
    def _cleanup_old_metrics(self) -> None:
        """Remove metrics older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=self.metrics_retention_days)
        self._historical_metrics = [
            m for m in self._historical_metrics
            if m.start_time >= cutoff_date
        ]
    
    @property
    def current_metrics(self) -> Optional[Dict[str, Any]]:
        """Get current processing metrics"""
        if not self._current_metrics:
            return None
        return self._current_metrics.to_dict()
    
    def get_historical_metrics(
        self,
        days: Optional[int] = None,
        include_current: bool = False
    ) -> List[Dict[str, Any]]:
        """Get historical metrics for specified period"""
        cutoff_date = datetime.now() - timedelta(days=days if days else self.metrics_retention_days)
        metrics = [
            m.to_dict() for m in self._historical_metrics
            if m.start_time >= cutoff_date
        ]
        if include_current and self._current_metrics:
            metrics.append(self._current_metrics.to_dict())
        return metrics
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get summary of processing performance"""
        metrics = self.get_historical_metrics(include_current=True)
        if not metrics:
            return {}
            
        total_files = sum(m['total_files'] for m in metrics)
        total_processed = sum(m['processed_files'] for m in metrics)
        total_failed = sum(m['failed_files'] for m in metrics)
        processing_times = [m['average_processing_time'] for m in metrics if m['average_processing_time'] > 0]
        
        return {
            'total_runs': len(metrics),
            'total_files_processed': total_files,
            'overall_success_rate': (total_processed / total_files * 100) if total_files > 0 else 0,
            'average_processing_time': statistics.mean(processing_times) if processing_times else 0,
            'performance_trends': {
                'success_rates': [m['success_rate'] for m in metrics],
                'processing_times': [m['average_processing_time'] for m in metrics],
                'memory_usage': [m['peak_memory_usage'] for m in metrics]
            }
        }

# Global metrics service instance
metrics_service = MetricsService() 