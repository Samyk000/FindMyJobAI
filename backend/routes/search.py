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

logger = logging.getLogger("job-agent")

router = APIRouter(prefix="", tags=["search"])


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
        
        # Apply ephemeral overrides
        titles = payload.titles or cfg.titles
        locations = payload.locations or cfg.locations
        country = payload.country or cfg.country
        hours_old = payload.hours_old or cfg.hours_old
        
        # Validate required fields
        if not titles or not titles.strip():
            raise HTTPException(400, "Job titles are required")
        if not locations or not locations.strip():
            raise HTTPException(400, "Locations are required")
        
        # Update settings with ephemeral values
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
    except HTTPException:
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
            raise HTTPException(404, "Pipeline not found or expired")
        return pipeline
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get logs for {job_id}: {e}")
        raise HTTPException(500, "Failed to retrieve logs")
