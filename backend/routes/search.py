"""
Search routes for the Job Bot API.
Contains endpoints for job scraping and pipeline management.
"""
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import RunScrapeIn
from services.pipeline import pipeline_manager
from services.scraper import ScraperService
from services.job_service import SettingsService
from utils.exceptions import ValidationError, NotFoundError
from utils.helpers import sanitize_csv_input

logger = logging.getLogger("job-agent")

router = APIRouter(prefix="", tags=["search"])

# Constants for validation
MAX_TITLE_LENGTH = 200
MAX_LOCATION_LENGTH = 200


@router.post("/run/scrape")
def run_scrape(payload: RunScrapeIn, bg: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Start a job scraping pipeline.
    
    Args:
        payload: Scrape parameters (optional overrides)
        bg: FastAPI background tasks
        db: Database session
        
    Returns:
        Dictionary with job_id, batch_id, and message
    """
    try:
        cfg = SettingsService.get_or_create_settings(db)
        
        # Apply ephemeral overrides with sanitization
        titles = sanitize_csv_input(payload.titles, max_length=MAX_TITLE_LENGTH) if payload.titles else cfg.titles
        locations = sanitize_csv_input(payload.locations, max_length=MAX_LOCATION_LENGTH) if payload.locations else cfg.locations
        country = sanitize_csv_input(payload.country, max_length=100) if payload.country else cfg.country
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
        
        # Check if a scrape is already running
        running_jobs = pipeline_manager.get_all_running()
        if running_jobs:
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
        
        # Create pipeline and start worker
        job_id = pipeline_manager.create("scrape")
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
        raise HTTPException(500, f"Failed to start scrape: {str(e)}")


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
