"""
Search routes for the Job Bot API.
Contains endpoints for job scraping and pipeline management.
"""
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from schemas import RunScrapeIn
from services.pipeline import pipeline_manager
from services.scraper import ScraperService
from services.job_service import SettingsService
from utils.exceptions import ValidationError, NotFoundError
from utils.helpers import sanitize_query_input
from middleware.rate_limit import limiter
from config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW


logger = logging.getLogger("job-agent")

router = APIRouter(prefix="", tags=["search"])

# Constants for validation
MAX_TITLE_LENGTH = 200
MAX_LOCATION_LENGTH = 200


@router.post("/run/scrape")
@limiter.limit(f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds")
def run_scrape(request: Request, payload: RunScrapeIn, bg: BackgroundTasks, db: Session = Depends(get_db)):

    """
    Start a job scraping pipeline.
    
    Args:
        request: FastAPI request object (required for slowapi)
        payload: Scrape parameters (optional overrides)
        bg: FastAPI background tasks
        db: Database session
        
    Returns:
        Dictionary with job_id, batch_id, and message
    """
    try:
        cfg = SettingsService.get_or_create_settings(db)
        
        # Apply ephemeral overrides with sanitization (no HTML-escaping)
        titles = sanitize_query_input(payload.titles, max_length=MAX_TITLE_LENGTH) if payload.titles else cfg.titles
        locations = sanitize_query_input(payload.locations, max_length=MAX_LOCATION_LENGTH) if payload.locations else cfg.locations
        country = sanitize_query_input(payload.country, max_length=100) if payload.country else cfg.country

        hours_old = payload.hours_old or cfg.hours_old
        
        # Validate required fields
        if not titles or not titles.strip():
            raise ValidationError("Job titles are required", field="titles")
        if not locations or not locations.strip():
            raise ValidationError("Locations are required", field="locations")
        
        # Validate field lengths
        if len(titles) > MAX_TITLE_LENGTH:
            raise ValidationError(
                f"Job titles must be less than {MAX_TITLE_LENGTH} characters",
                field="titles"
            )
        if len(locations) > MAX_LOCATION_LENGTH:
            raise ValidationError(
                f"Locations must be less than {MAX_LOCATION_LENGTH} characters",
                field="locations"
            )
        
        # Check if a scrape is already running (atomic check-and-create)
        job_id = pipeline_manager.create_if_none("scrape")
        if not job_id:
            raise ValidationError(
                "A scrape job is already running. Please wait for it to complete.",
                detail="Only one scrape job can run at a time"
            )
        
        # Update settings with sanitized values
        cfg.titles = titles
        cfg.locations = locations
        cfg.country = country
        cfg.hours_old = hours_old
        db.commit()
        
        # Prepare config snapshot
        snapshot = ScraperService.prepare_config_snapshot(
            cfg, titles, locations, country, hours_old
        )
        
        # Start worker (pipeline already created atomically above)
        batch_id = str(uuid.uuid4())
        bg.add_task(ScraperService.run_scrape_worker, job_id, snapshot, batch_id)
        
        return {
            "job_id": job_id,
            "batch_id": batch_id,
            "message": "Scrape job started"
        }
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Failed to start scrape: {e}")
        raise HTTPException(500, "Failed to start scrape")


@router.get("/logs/{job_id}")
def get_logs(job_id: str):
    """
    Get pipeline logs by job ID.
    
    Args:
        job_id: Pipeline job ID
        
    Returns:
        Pipeline status dictionary with logs and stats
    """
    try:
        pipeline = pipeline_manager.get(job_id)
        if not pipeline:
            raise NotFoundError(
                "Pipeline not found or expired",
                resource_type="Pipeline",
                resource_id=job_id
            )
        return pipeline
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Failed to get logs for {job_id}: {e}")
        raise HTTPException(500, "Failed to retrieve logs")


@router.post("/run/cancel/{job_id}")
def cancel_scrape(job_id: str):
    """
    Cancel a running scrape job.
    
    Args:
        job_id: Pipeline job ID to cancel
        
    Returns:
        Success message
    """
    try:
        pipeline = pipeline_manager.get(job_id)
        if not pipeline:
            raise NotFoundError(
                "Pipeline not found or expired",
                resource_type="Pipeline",
                resource_id=job_id
            )
            
        current_state = pipeline.get("state")
        if current_state == "cancelled":
            return {"ok": True, "message": "Scrape job already cancelled"}
            
        if current_state != "running":
            return {"ok": True, "message": f"Scrape job in state '{current_state}', marking as cancelled"}
            
        pipeline_manager.cancel(job_id)
        logger.info(f"Cancellation requested for job {job_id}")
        return {"ok": True, "message": "Scrape job cancellation requested"}
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job {job_id}: {e}")
        raise HTTPException(500, "Failed to cancel job")

