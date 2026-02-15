"""
Job service for the Job Bot API.
Contains business logic for job operations.
"""
import uuid
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import JobDB, SettingsDB

logger = logging.getLogger("job-agent")


class JobService:
    """
    Service class for job-related business logic.
    Handles job CRUD operations and duplicate detection.
    """
    
    @staticmethod
    def get_job_by_id(db: Session, job_id: str) -> Optional[JobDB]:
        """
        Get a job by its ID.
        
        Args:
            db: Database session
            job_id: Job ID to look up
            
        Returns:
            JobDB instance or None
        """
        return db.query(JobDB).filter(JobDB.id == job_id).first()
    
    @staticmethod
    def get_job_by_url(db: Session, job_url: str) -> Optional[JobDB]:
        """
        Get a job by its URL.
        
        Args:
            db: Database session
            job_url: Job URL to look up
            
        Returns:
            JobDB instance or None
        """
        return db.query(JobDB).filter(JobDB.job_url == job_url).first()
    
    @staticmethod
    def job_exists_by_url(db: Session, job_url: str) -> bool:
        """
        Check if a job with the given URL already exists.
        
        Args:
            db: Database session
            job_url: Job URL to check
            
        Returns:
            True if job exists, False otherwise
        """
        return db.query(JobDB).filter(JobDB.job_url == job_url).first() is not None
    
    @staticmethod
    def create_job(
        db: Session,
        job_data: Dict[str, Any],
        search_title: str,
        search_location: str,
        batch_id: str,
        check_duplicate: bool = True
    ) -> JobDB:
        """
        Create a new job entry.
        
        Args:
            db: Database session
            job_data: Dictionary containing job information
            search_title: Search query title used
            search_location: Search query location used
            batch_id: Batch ID for this scrape operation
            check_duplicate: Whether to check for duplicates (default True)
            
        Returns:
            Created JobDB instance
            
        Raises:
            ValueError: If job already exists and check_duplicate is True
        """
        job_url = job_data.get("job_url", "")
        
        # Check for duplicate if requested
        if check_duplicate and job_url and JobService.job_exists_by_url(db, job_url):
            raise ValueError(f"Job with URL {job_url} already exists")
        
        # Generate unique ID
        job_id = str(uuid.uuid4())
        
        # Create job instance
        job = JobDB(
            id=job_id,
            title=job_data.get("title", ""),
            company=job_data.get("company", ""),
            location=job_data.get("location", ""),
            job_url=job_url,
            description=job_data.get("description", ""),
            is_remote=job_data.get("is_remote", False),
            date_posted=job_data.get("date_posted", ""),
            source_site=job_data.get("source_site", ""),
            search_title=search_title,
            search_location=search_location,
            batch_id=batch_id,
            is_duplicate=False
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return job
    
    @staticmethod
    def save_job_with_duplicate_check(
        db: Session,
        job_data: Dict[str, Any],
        search_title: str,
        search_location: str,
        batch_id: str
    ) -> Dict[str, Any]:
        """
        Save a job, marking as duplicate if URL already exists.
        
        This is the current behavior that saves duplicates with a flag.
        Will be replaced in Phase 3 with skip behavior.
        
        Args:
            db: Database session
            job_data: Dictionary containing job information
            search_title: Search query title used
            search_location: Search query location used
            batch_id: Batch ID for this scrape operation
            
        Returns:
            Dictionary with 'job' and 'is_duplicate' keys
        """
        job_url = job_data.get("job_url", "")
        
        # Check if job already exists
        is_duplicate = JobService.job_exists_by_url(db, job_url) if job_url else False
        
        # Generate unique ID
        job_id = str(uuid.uuid4())
        
        # Create job instance
        job = JobDB(
            id=job_id,
            title=job_data.get("title", ""),
            company=job_data.get("company", ""),
            location=job_data.get("location", ""),
            job_url=job_url,
            description=job_data.get("description", ""),
            is_remote=job_data.get("is_remote", False),
            date_posted=job_data.get("date_posted", ""),
            source_site=job_data.get("source_site", ""),
            search_title=search_title,
            search_location=search_location,
            batch_id=batch_id,
            is_duplicate=is_duplicate
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return {"job": job, "is_duplicate": is_duplicate}
    
    @staticmethod
    def update_job_status(db: Session, job_id: str, status: str) -> JobDB:
        """
        Update a job's status.
        
        Args:
            db: Database session
            job_id: Job ID to update
            status: New status value
            
        Returns:
            Updated JobDB instance
            
        Raises:
            HTTPException: If job not found
        """
        job = db.query(JobDB).filter(JobDB.id == job_id).first()
        if not job:
            raise HTTPException(404, "Job not found")
        
        job.status = status
        db.commit()
        db.refresh(job)
        
        return job
    
    @staticmethod
    def delete_job(db: Session, job_id: str) -> bool:
        """
        Delete a job by ID.
        
        Args:
            db: Database session
            job_id: Job ID to delete
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If job not found
        """
        job = db.query(JobDB).filter(JobDB.id == job_id).first()
        if not job:
            raise HTTPException(404, "Job not found")
        
        db.delete(job)
        db.commit()
        
        return True
    
    @staticmethod
    def clear_all_jobs(db: Session) -> int:
        """
        Delete all jobs from the database.
        
        Args:
            db: Database session
            
        Returns:
            Number of jobs deleted
        """
        count = db.query(JobDB).count()
        db.query(JobDB).delete()
        db.commit()
        
        return count
    
    @staticmethod
    def search_jobs(
        db: Session,
        status: str = "active",
        batch_id: Optional[str] = None,
        source_site: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search jobs with filters.
        
        Args:
            db: Database session
            status: Status filter ("new", "saved", "rejected", "active")
            batch_id: Filter by batch ID
            source_site: Filter by source site
            location: Filter by location (partial match)
            limit: Maximum results to return
            offset: Offset for pagination
            
        Returns:
            Dictionary with 'jobs', 'total', 'limit', 'offset'
        """
        q = db.query(JobDB)
        
        # Status filter
        if status == "rejected":
            q = q.filter(JobDB.status == "rejected")
        elif status == "saved":
            q = q.filter(JobDB.status == "saved")
        else:
            q = q.filter(JobDB.status == "new")
        
        # Additional filters
        if batch_id:
            q = q.filter(JobDB.batch_id == batch_id)
        if source_site:
            q = q.filter(JobDB.source_site == source_site)
        if location:
            q = q.filter(JobDB.location.ilike(f"%{location}%"))
        
        # Ordering and pagination
        q = q.order_by(JobDB.fetched_at.desc())
        total = q.count()
        rows = q.offset(offset).limit(limit).all()
        
        # Convert to dict
        jobs = []
        for j in rows:
            jobs.append({
                "id": j.id,
                "title": j.title or "",
                "company": j.company or "",
                "location": j.location or "",
                "job_url": j.job_url or "",
                "is_remote": bool(j.is_remote),
                "date_posted": j.date_posted or "",
                "source_site": j.source_site or "",
                "status": j.status or "new",
                "batch_id": j.batch_id or "",
                "fetched_at": str(j.fetched_at) if j.fetched_at else "",
                "is_duplicate": bool(j.is_duplicate) if hasattr(j, 'is_duplicate') else False,
            })
        
        return {"jobs": jobs, "total": total, "limit": limit, "offset": offset}
    
    @staticmethod
    def get_stats(db: Session) -> Dict[str, int]:
        """
        Get job statistics.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with total, new, saved, rejected counts
        """
        return {
            "total": db.query(JobDB).count(),
            "new": db.query(JobDB).filter(JobDB.status == "new").count(),
            "saved": db.query(JobDB).filter(JobDB.status == "saved").count(),
            "rejected": db.query(JobDB).filter(JobDB.status == "rejected").count(),
        }


class SettingsService:
    """
    Service class for settings-related business logic.
    """
    
    @staticmethod
    def get_or_create_settings(db: Session) -> SettingsDB:
        """
        Get or create the settings record.
        
        Args:
            db: Database session
            
        Returns:
            SettingsDB instance
            
        Raises:
            HTTPException: If failed to access settings
        """
        try:
            cfg = db.query(SettingsDB).filter_by(key="config").first()
            if not cfg:
                cfg = SettingsDB(key="config")
                db.add(cfg)
                db.commit()
                db.refresh(cfg)
            return cfg
        except Exception as e:
            logger.error(f"Failed to get/create settings: {e}")
            db.rollback()
            raise HTTPException(500, "Failed to access settings")
    
    @staticmethod
    def update_settings(db: Session, **kwargs) -> SettingsDB:
        """
        Update settings with provided values.
        
        Args:
            db: Database session
            **kwargs: Settings fields to update
            
        Returns:
            Updated SettingsDB instance
        """
        cfg = SettingsService.get_or_create_settings(db)
        
        for key, value in kwargs.items():
            if hasattr(cfg, key):
                setattr(cfg, key, value)
        
        db.commit()
        db.refresh(cfg)
        
        return cfg
    
    @staticmethod
    def reset_settings(db: Session) -> SettingsDB:
        """
        Reset settings to default values.
        
        Args:
            db: Database session
            
        Returns:
            Reset SettingsDB instance
        """
        return SettingsService.update_settings(
            db,
            titles="",
            locations="",
            country="india",
            include_keywords="",
            exclude_keywords="",
            sites="linkedin",
            results_per_site=20,
            hours_old=72
        )
