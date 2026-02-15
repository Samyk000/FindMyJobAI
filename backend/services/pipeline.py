"""
Pipeline service for the Job Bot API.
Manages thread-safe pipeline state for background job processing.
"""
import uuid
import threading
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from config import PIPELINE_EXPIRY_SECONDS

logger = logging.getLogger("job-agent")


class PipelineManager:
    """
    Thread-safe pipeline state manager with automatic cleanup.
    
    Manages the state of background jobs like scraping operations,
    providing real-time progress tracking and log aggregation.
    """
    
    def __init__(self):
        self._lock = threading.Lock()
        self._pipelines: Dict[str, Dict[str, Any]] = {}
    
    def create(self, kind: str) -> str:
        """
        Create a new pipeline and return its ID.
        
        Args:
            kind: Type of pipeline (e.g., "scrape")
            
        Returns:
            Unique pipeline ID
        """
        job_id = str(uuid.uuid4())
        with self._lock:
            self._cleanup_expired()
            self._pipelines[job_id] = {
                "kind": kind,
                "state": "running",
                "logs": [],
                "stats": {},
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
        return job_id
    
    def log(self, job_id: str, msg: str) -> None:
        """
        Add a log message to a pipeline.
        
        Args:
            job_id: Pipeline ID
            msg: Log message to add
        """
        with self._lock:
            if job_id in self._pipelines:
                self._pipelines[job_id]["logs"].append(msg)
                # Keep only last 100 log entries
                if len(self._pipelines[job_id]["logs"]) > 100:
                    self._pipelines[job_id]["logs"] = self._pipelines[job_id]["logs"][-100:]
    
    def update(self, job_id: str, state: str = None, stats: Dict = None) -> None:
        """
        Update pipeline state and/or stats.
        
        Args:
            job_id: Pipeline ID
            state: New state (e.g., "running", "done", "failed")
            stats: Stats dictionary to merge with existing stats
        """
        with self._lock:
            if job_id in self._pipelines:
                if state:
                    self._pipelines[job_id]["state"] = state
                if stats:
                    self._pipelines[job_id]["stats"].update(stats)
    
    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get pipeline status by ID.
        
        Args:
            job_id: Pipeline ID
            
        Returns:
            Pipeline dictionary or None if not found
        """
        with self._lock:
            return self._pipelines.get(job_id)
    
    def _cleanup_expired(self) -> None:
        """
        Remove pipelines older than PIPELINE_EXPIRY_SECONDS.
        Called automatically when creating new pipelines.
        """
        now = datetime.now(timezone.utc)
        expired = []
        for job_id, pipeline in self._pipelines.items():
            try:
                started = datetime.fromisoformat(pipeline["started_at"].replace('Z', '+00:00'))
                if (now - started).total_seconds() > PIPELINE_EXPIRY_SECONDS:
                    expired.append(job_id)
            except (KeyError, ValueError):
                expired.append(job_id)
        for job_id in expired:
            del self._pipelines[job_id]
            logger.debug(f"Cleaned up expired pipeline: {job_id}")


# Global pipeline manager instance (thread-safe)
pipeline_manager = PipelineManager()
