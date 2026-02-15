"""
Job routes for the Job Bot API.
Contains endpoints for job CRUD operations.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import JobFilter, JobUpdate
from services.job_service import JobService

logger = logging.getLogger("job-agent")

router = APIRouter(prefix="", tags=["jobs"])


@router.post("/jobs/search")
def jobs_search(f: JobFilter, db: Session = Depends(get_db)):
    """
    Search jobs with filters.
    
    Args:
        f: Job filter parameters
        db: Database session
        
    Returns:
        Dictionary with jobs list, total count, limit, and offset
    """
    try:
        return JobService.search_jobs(
            db,
            status=f.status,
            batch_id=f.batch_id,
            source_site=f.source_site,
            location=f.location,
            limit=f.limit,
            offset=f.offset
        )
    except Exception as e:
        logger.error(f"Failed to search jobs: {e}")
        raise HTTPException(500, "Failed to search jobs")


@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    """
    Get a single job by ID.
    
    Args:
        job_id: Job ID to retrieve
        db: Database session
        
    Returns:
        Job details dictionary
    """
    try:
        j = JobService.get_job_by_id(db, job_id)
        if not j:
            raise HTTPException(404, "Job not found")
        return {
            "id": j.id,
            "title": j.title or "",
            "company": j.company or "",
            "location": j.location or "",
            "job_url": j.job_url or "",
            "description": j.description or "",
            "is_remote": bool(j.is_remote),
            "date_posted": j.date_posted or "",
            "source_site": j.source_site or "",
            "status": j.status or "new",
            "batch_id": j.batch_id or "",
            "fetched_at": str(j.fetched_at) if j.fetched_at else "",
            "is_duplicate": bool(j.is_duplicate) if hasattr(j, 'is_duplicate') else False,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job {job_id}: {e}")
        raise HTTPException(500, "Failed to retrieve job")


@router.patch("/jobs/{job_id}")
def update_job(job_id: str, update: JobUpdate, db: Session = Depends(get_db)):
    """
    Update a job's status.
    
    Args:
        job_id: Job ID to update
        update: Update payload with new status
        db: Database session
        
    Returns:
        Success message
    """
    try:
        if update.status:
            JobService.update_job_status(db, job_id, update.status)
        return {"ok": True, "message": "Job updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to update job")


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    """
    Delete a job.
    
    Args:
        job_id: Job ID to delete
        db: Database session
        
    Returns:
        Success message
    """
    try:
        JobService.delete_job(db, job_id)
        return {"ok": True, "message": "Job deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete job {job_id}: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to delete job")


@router.delete("/jobs/clear-all")
def clear_all_jobs(reset_settings: bool = False, db: Session = Depends(get_db)):
    """
    Delete all jobs from the database.
    Optionally reset settings to defaults.
    
    Args:
        reset_settings: Whether to reset settings to defaults
        db: Database session
        
    Returns:
        Success message with count of deleted jobs
    """
    try:
        from services.job_service import SettingsService
        
        count = JobService.clear_all_jobs(db)
        
        settings_reset = False
        if reset_settings:
            SettingsService.reset_settings(db)
            settings_reset = True
        
        logger.info(f"Cleared all {count} jobs from database" + (" and reset settings" if settings_reset else ""))
        return {
            "ok": True, 
            "message": f"Cleared {count} jobs successfully" + (" and reset settings" if settings_reset else ""), 
            "count": count,
            "settings_reset": settings_reset
        }
    except Exception as e:
        logger.error(f"Failed to clear all jobs: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to clear all jobs")


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Get job statistics.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with total, new, saved, rejected counts
    """
    try:
        return JobService.get_stats(db)
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(500, "Failed to retrieve statistics")
