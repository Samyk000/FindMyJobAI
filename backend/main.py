import os
import uuid
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from job_bot import scrape_jobs_incremental

# --- LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("job-agent")

# --- DATABASE SETUP ---
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "jobs.db")
DB_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# --- DB MODELS ---
class JobDB(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    title = Column(String, default="")
    company = Column(String, default="")
    location = Column(String, default="")
    job_url = Column(String, default="")
    description = Column(Text, default="")
    is_remote = Column(Boolean, default=False)
    date_posted = Column(String, default="")
    source_site = Column(String, default="")
    search_title = Column(String, default="")
    search_location = Column(String, default="")
    status = Column(String, default="new")
    batch_id = Column(String, default="")
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SettingsDB(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, default="config")
    api_key = Column(String, default="")
    api_key_last5 = Column(String, default="")
    connected = Column(Boolean, default=False)
    titles = Column(String, default="")
    locations = Column(String, default="")
    country = Column(String, default="india")
    include_keywords = Column(String, default="")
    exclude_keywords = Column(String, default="")
    sites = Column(String, default="linkedin,indeed,glassdoor,zip_recruiter")
    results_per_site = Column(Integer, default=20)
    hours_old = Column(Integer, default=72)
    data_mode = Column(String, default="compact")


Base.metadata.create_all(bind=engine)


# --- CONSTANTS ---
SUPPORTED_COUNTRIES = [
    {"code": "india", "name": "India"},
    {"code": "usa", "name": "United States"},
    {"code": "uk", "name": "United Kingdom"},
    {"code": "canada", "name": "Canada"},
    {"code": "australia", "name": "Australia"},
]

SUPPORTED_SITES = ["linkedin", "indeed", "glassdoor", "zip_recruiter"]

# Pipeline expiration time in seconds (1 hour)
PIPELINE_EXPIRY_SECONDS = 3600


# --- APP SETUP ---
app = FastAPI(
    title="Job Bot Pro API",
    description="Job search and aggregation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    """Database session dependency with proper cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- REQUEST/RESPONSE SCHEMAS ---
class SettingsIn(BaseModel):
    titles: str = ""
    locations: str = ""
    country: str = "india"
    include_keywords: str = ""
    exclude_keywords: str = ""
    sites: List[str] = Field(default_factory=lambda: ["linkedin"])
    results_per_site: int = 20
    hours_old: int = 72
    data_mode: str = "compact"

    @field_validator('sites')
    @classmethod
    def validate_sites(cls, v):
        valid_sites = [s for s in v if s in SUPPORTED_SITES]
        return valid_sites if valid_sites else ["linkedin"]

    @field_validator('results_per_site')
    @classmethod
    def validate_results(cls, v):
        return max(5, min(v, 100))

    @field_validator('hours_old')
    @classmethod
    def validate_hours(cls, v):
        return max(1, min(v, 720))  # 1 hour to 30 days


class ConnectIn(BaseModel):
    api_key: str

    @field_validator('api_key')
    @classmethod
    def validate_api_key(cls, v):
        key = (v or "").strip()
        if len(key) < 10:
            raise ValueError("API key must be at least 10 characters")
        return key


class RunScrapeIn(BaseModel):
    titles: Optional[str] = None
    locations: Optional[str] = None
    country: Optional[str] = None
    hours_old: Optional[int] = None


class JobFilter(BaseModel):
    status: str = "active"
    limit: int = 50
    offset: int = 0
    batch_id: Optional[str] = None
    source_site: Optional[str] = None
    location: Optional[str] = None

    @field_validator('limit')
    @classmethod
    def validate_limit(cls, v):
        return max(1, min(v, 1000))

    @field_validator('offset')
    @classmethod
    def validate_offset(cls, v):
        return max(0, v)


class JobUpdate(BaseModel):
    status: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v and v not in ["new", "saved", "rejected"]:
            raise ValueError("Status must be 'new', 'saved', or 'rejected'")
        return v


# --- THREAD-SAFE PIPELINE STATE ---
class PipelineManager:
    """Thread-safe pipeline state manager with automatic cleanup."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._pipelines: Dict[str, Dict[str, Any]] = {}
    
    def create(self, kind: str) -> str:
        """Create a new pipeline and return its ID."""
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
    
    def log(self, job_id: str, msg: str):
        """Add a log message to a pipeline."""
        with self._lock:
            if job_id in self._pipelines:
                self._pipelines[job_id]["logs"].append(msg)
                # Keep only last 100 log entries
                if len(self._pipelines[job_id]["logs"]) > 100:
                    self._pipelines[job_id]["logs"] = self._pipelines[job_id]["logs"][-100:]
    
    def update(self, job_id: str, state: str = None, stats: Dict = None):
        """Update pipeline state and/or stats."""
        with self._lock:
            if job_id in self._pipelines:
                if state:
                    self._pipelines[job_id]["state"] = state
                if stats:
                    self._pipelines[job_id]["stats"].update(stats)
    
    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get pipeline status by ID."""
        with self._lock:
            return self._pipelines.get(job_id)
    
    def _cleanup_expired(self):
        """Remove pipelines older than PIPELINE_EXPIRY_SECONDS."""
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


# Global pipeline manager (thread-safe)
pipeline_manager = PipelineManager()


# --- HELPERS ---
def _get_or_create_settings(db: Session) -> SettingsDB:
    """Get or create settings record."""
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


def _mask_last5(api_key: str) -> str:
    """Mask API key, showing only last 5 characters."""
    key = (api_key or "").strip()
    return f"***{key[-5:]}" if len(key) >= 5 else "***"


# --- API ROUTES ---

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/countries")
def api_countries():
    """Get list of supported countries."""
    try:
        return {"countries": SUPPORTED_COUNTRIES}
    except Exception as e:
        logger.error(f"Failed to get countries: {e}")
        raise HTTPException(500, "Failed to retrieve countries")


@app.get("/api/sites")
def api_sites():
    """Get list of supported job sites."""
    try:
        return {"sites": SUPPORTED_SITES}
    except Exception as e:
        logger.error(f"Failed to get sites: {e}")
        raise HTTPException(500, "Failed to retrieve sites")


@app.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """Get current settings."""
    try:
        cfg = _get_or_create_settings(db)
        return {
            "connected": bool(cfg.connected),
            "api_key_last5": cfg.api_key_last5 if cfg.connected else "",
            "titles": cfg.titles or "",
            "locations": cfg.locations or "",
            "country": cfg.country or "india",
            "include_keywords": cfg.include_keywords or "",
            "exclude_keywords": cfg.exclude_keywords or "",
            "sites": [s for s in (cfg.sites or "").split(",") if s],
            "results_per_site": cfg.results_per_site or 20,
            "hours_old": cfg.hours_old or 72,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise HTTPException(500, "Failed to retrieve settings")


@app.post("/settings")
def save_settings(payload: SettingsIn, db: Session = Depends(get_db)):
    """Save settings."""
    try:
        cfg = _get_or_create_settings(db)
        cfg.titles = payload.titles
        cfg.locations = payload.locations
        cfg.country = payload.country
        cfg.include_keywords = payload.include_keywords
        cfg.exclude_keywords = payload.exclude_keywords
        cfg.sites = ",".join(payload.sites)
        cfg.results_per_site = payload.results_per_site
        cfg.hours_old = payload.hours_old
        db.commit()
        return {"ok": True, "message": "Settings saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to save settings")


@app.post("/connect")
def connect(payload: ConnectIn, db: Session = Depends(get_db)):
    """Connect API key."""
    try:
        cfg = _get_or_create_settings(db)
        cfg.api_key = payload.api_key
        cfg.api_key_last5 = _mask_last5(payload.api_key)
        cfg.connected = True
        db.commit()
        return {"connected": True, "message": "API key connected successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Failed to connect API key: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to connect API key")


@app.post("/disconnect")
def disconnect(db: Session = Depends(get_db)):
    """Disconnect API key."""
    try:
        cfg = _get_or_create_settings(db)
        cfg.api_key = ""
        cfg.api_key_last5 = ""
        cfg.connected = False
        db.commit()
        return {"connected": False, "message": "API key disconnected"}
    except Exception as e:
        logger.error(f"Failed to disconnect API key: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to disconnect API key")


@app.post("/jobs/search")
def jobs_search(f: JobFilter, db: Session = Depends(get_db)):
    """Search jobs with filters."""
    try:
        q = db.query(JobDB)
        
        # Status filter
        if f.status == "rejected":
            q = q.filter(JobDB.status == "rejected")
        elif f.status == "saved":
            q = q.filter(JobDB.status == "saved")
        else:
            q = q.filter(JobDB.status == "new")
        
        # Additional filters
        if f.batch_id:
            q = q.filter(JobDB.batch_id == f.batch_id)
        if f.source_site:
            q = q.filter(JobDB.source_site == f.source_site)
        if f.location:
            q = q.filter(JobDB.location.ilike(f"%{f.location}%"))
        
        # Ordering and pagination
        q = q.order_by(JobDB.fetched_at.desc())
        total = q.count()
        rows = q.offset(f.offset).limit(f.limit).all()
        
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
            })
        
        return {"jobs": jobs, "total": total, "limit": f.limit, "offset": f.offset}
    except Exception as e:
        logger.error(f"Failed to search jobs: {e}")
        raise HTTPException(500, "Failed to search jobs")


@app.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get a single job by ID."""
    try:
        j = db.query(JobDB).filter(JobDB.id == job_id).first()
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
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job {job_id}: {e}")
        raise HTTPException(500, "Failed to retrieve job")


@app.patch("/jobs/{job_id}")
def update_job(job_id: str, update: JobUpdate, db: Session = Depends(get_db)):
    """Update a job's status."""
    try:
        j = db.query(JobDB).filter(JobDB.id == job_id).first()
        if not j:
            raise HTTPException(404, "Job not found")
        
        if update.status:
            j.status = update.status
        
        db.commit()
        return {"ok": True, "message": "Job updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to update job")


@app.delete("/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Delete a job."""
    try:
        j = db.query(JobDB).filter(JobDB.id == job_id).first()
        if not j:
            raise HTTPException(404, "Job not found")
        
        db.delete(j)
        db.commit()
        return {"ok": True, "message": "Job deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete job {job_id}: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to delete job")


@app.delete("/jobs/clear-all")
def clear_all_jobs(reset_settings: bool = False, db: Session = Depends(get_db)):
    """Delete all jobs from the database. Optionally reset settings to defaults."""
    try:
        count = db.query(JobDB).count()
        db.query(JobDB).delete()
        
        settings_reset = False
        if reset_settings:
            cfg = _get_or_create_settings(db)
            cfg.titles = ""
            cfg.locations = ""
            cfg.country = "india"
            cfg.include_keywords = ""
            cfg.exclude_keywords = ""
            cfg.sites = "linkedin"
            cfg.results_per_site = 20
            cfg.hours_old = 72
            settings_reset = True
        
        db.commit()
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


@app.get("/logs/{job_id}")
def get_logs(job_id: str):
    """Get pipeline logs by job ID."""
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


# --- BACKGROUND WORKERS ---

def _scrape_worker(job_id: str, cfg_snapshot: Dict[str, Any], batch_id: str):
    """Background worker for scraping jobs with incremental saving."""
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
            pipeline_manager.log(job_id, msg)
            logger.info(f"[{job_id}] {msg}")
        
        def save_job_callback(job_data: Dict[str, Any]) -> bool:
            """Callback to save a single job immediately. Returns True if new, False if duplicate."""
            nonlocal count, duplicates
            try:
                existing = db.query(JobDB).filter(JobDB.id == job_data["id"]).first()
                if not existing:
                    j = JobDB(
                        id=job_data["id"],
                        title=job_data["title"],
                        company=job_data["company"],
                        location=job_data["location"],
                        job_url=job_data["job_url"],
                        description=job_data["description"],
                        is_remote=job_data["is_remote"],
                        date_posted=job_data["date_posted"],
                        source_site=job_data["source_site"],
                        search_title=cfg_snapshot["titles"],
                        search_location=cfg_snapshot["locations"],
                        batch_id=batch_id
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
                else:
                    duplicates += 1
                    return False
            except Exception as e:
                logger.error(f"Failed to save job: {e}")
                db.rollback()
                return False
        
        def progress_callback(current_query: int, total_queries: int, current_site: str):
            """Callback to update progress stats."""
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


# --- PIPELINE ENDPOINTS ---

@app.post("/run/scrape")
def run_scrape(payload: RunScrapeIn, bg: BackgroundTasks, db: Session = Depends(get_db)):
    """Start a job scraping pipeline."""
    try:
        cfg = _get_or_create_settings(db)
        
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
        snapshot = {
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
        
        # Create pipeline and start worker
        job_id = pipeline_manager.create("scrape")
        batch_id = str(uuid.uuid4())
        bg.add_task(_scrape_worker, job_id, snapshot, batch_id)
        
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


# --- STATS ENDPOINT ---

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get job statistics."""
    try:
        total = db.query(JobDB).count()
        new_count = db.query(JobDB).filter(JobDB.status == "new").count()
        saved_count = db.query(JobDB).filter(JobDB.status == "saved").count()
        rejected_count = db.query(JobDB).filter(JobDB.status == "rejected").count()
        
        return {
            "total": total,
            "new": new_count,
            "saved": saved_count,
            "rejected": rejected_count,
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(500, "Failed to retrieve statistics")
