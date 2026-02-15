"""
Scraper service for the Job Bot API.
Wraps the job_bot scraping functionality with business logic.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Callable

from sqlalchemy.orm import Session

from database import SessionLocal
from models import JobDB
from services.pipeline import pipeline_manager
from utils.helpers import normalize_job_url

# Import scraping function from job_bot
from job_bot import scrape_jobs_incremental

logger = logging.getLogger("job-agent")


class ScraperService:
    """
    Service class for job scraping operations.
    Handles background scraping with incremental saving.
    """
    
    @staticmethod
    def run_scrape_worker(
        job_id: str,
        cfg_snapshot: Dict[str, Any],
        batch_id: str
    ) -> None:
        """
        Background worker for scraping jobs with incremental saving.
        
        Args:
            job_id: Pipeline job ID for tracking
            cfg_snapshot: Configuration snapshot for this scrape
            batch_id: Batch ID for grouping scraped jobs
        """
        db = SessionLocal()
        count = 0
        duplicates = 0
        
        # Calculate total queries for progress tracking
        titles = [t.strip() for t in (cfg_snapshot.get("titles") or "").split(",") if t.strip()]
        locations = [l.strip() for l in (cfg_snapshot.get("locations") or "").split(",") if l.strip()]
        total_queries = len(titles) * len(locations) if titles and locations else 1
        
        # Initialize stats with started_at timestamp and sites list
        sites_str = ",".join(cfg_snapshot.get("sites", []))
        pipeline_manager.update(job_id, stats={
            "batch_id": batch_id,
            "new_jobs": 0,
            "duplicates": 0,
            "filtered": 0,
            "total_queries": total_queries,
            "current_query": 0,
            "current_site": sites_str,
            "started_at": int(datetime.now(timezone.utc).timestamp() * 1000),
        })
        
        try:
            def log(msg: str):
                """Log message to pipeline and logger."""
                pipeline_manager.log(job_id, msg)
                logger.info(f"[{job_id}] {msg}")
            
            def save_job_callback(job_data: Dict[str, Any]) -> bool:
                """
                Callback to save a single job immediately.
                Skips duplicate jobs based on normalized URL.
                
                Args:
                    job_data: Dictionary containing job information
                    
                Returns:
                    True if saved successfully, False if skipped or failed
                """
                nonlocal count, duplicates
                try:
                    # Get and normalize the job URL
                    raw_url = job_data.get("job_url", "")
                    normalized_url = normalize_job_url(raw_url)
                    
                    # Skip if no valid URL (can't dedupe, but still save)
                    # Actually, if URL is empty, we should still save the job
                    if normalized_url:
                        # Check if a job with the same normalized URL already exists
                        existing = db.query(JobDB).filter(
                            JobDB.job_url == normalized_url
                        ).first()
                        
                        if existing:
                            # Skip this job - it's a duplicate
                            duplicates += 1
                            pipeline_manager.update(job_id, stats={
                                "batch_id": batch_id,
                                "new_jobs": count,
                                "duplicates": duplicates
                            })
                            return True  # Return True because we handled it (by skipping)
                    
                    # Generate a unique ID for this job entry
                    job_entry_id = str(uuid.uuid4())
                    
                    j = JobDB(
                        id=job_entry_id,
                        title=job_data.get("title", ""),
                        company=job_data.get("company", ""),
                        location=job_data.get("location", ""),
                        job_url=normalized_url or raw_url,  # Use normalized URL, or raw if empty
                        description=job_data.get("description", ""),
                        is_remote=job_data.get("is_remote", False),
                        date_posted=job_data.get("date_posted", ""),
                        source_site=job_data.get("source_site", ""),
                        search_title=cfg_snapshot["titles"],
                        search_location=cfg_snapshot["locations"],
                        batch_id=batch_id,
                    )
                    db.add(j)
                    db.commit()
                    count += 1
                    
                    # Update stats in real-time
                    pipeline_manager.update(job_id, stats={
                        "batch_id": batch_id,
                        "new_jobs": count,
                        "duplicates": duplicates
                    })
                    return True
                except Exception as e:
                    logger.error(f"Failed to save job: {e}")
                    db.rollback()
                    return False
            
            def progress_callback(current_query: int, total_queries: int, current_site: str):
                """
                Callback to update progress stats.
                
                Args:
                    current_query: Current query number
                    total_queries: Total number of queries
                    current_site: Current site being scraped
                """
                pipeline_manager.update(job_id, stats={
                    "current_query": current_query,
                    "total_queries": total_queries,
                    "current_site": current_site,
                })
            
            log("Starting job scrape...")
            
            # Use the incremental scraping function
            stats = scrape_jobs_incremental(
                sites=cfg_snapshot["sites"],
                titles_csv=cfg_snapshot["titles"],
                locations_csv=cfg_snapshot["locations"],
                country=cfg_snapshot["country"],
                include_keywords_csv=cfg_snapshot["include_keywords"],
                exclude_keywords_csv=cfg_snapshot["exclude_keywords"],
                results_per_site=cfg_snapshot["results_per_site"],
                hours_old=cfg_snapshot["hours_old"],
                data_mode=cfg_snapshot["data_mode"],
                log=log,
                on_job_found=save_job_callback,
                on_progress=progress_callback,
            )
            
            pipeline_manager.update(job_id, state="done", stats={
                "batch_id": batch_id,
                "new_jobs": count,
                "duplicates": duplicates,
                "total_scraped": stats.get("raw_total", 0)
            })
            log(f"Complete. Added {count} new jobs ({duplicates} duplicates skipped).")
            
        except Exception as e:
            logger.error(f"Scrape worker failed: {e}")
            pipeline_manager.log(job_id, f"ERROR: {str(e)}")
            pipeline_manager.update(job_id, state="failed")
        finally:
            db.close()
    
    @staticmethod
    def prepare_config_snapshot(
        cfg,
        titles: str,
        locations: str,
        country: str,
        hours_old: int
    ) -> Dict[str, Any]:
        """
        Prepare a configuration snapshot for scraping.
        
        Args:
            cfg: SettingsDB instance
            titles: Job titles to search
            locations: Locations to search
            country: Country code
            hours_old: Maximum age of jobs in hours
            
        Returns:
            Configuration dictionary
        """
        return {
            "titles": titles,
            "locations": locations,
            "country": country,
            "sites": [s for s in (cfg.sites or "").split(",") if s] or ["linkedin"],
            "include_keywords": cfg.include_keywords or "",
            "exclude_keywords": cfg.exclude_keywords or "",
            "results_per_site": cfg.results_per_site or 20,
            "hours_old": hours_old,
            "data_mode": cfg.data_mode or "compact"
        }
