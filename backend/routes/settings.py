"""
Settings routes for the Job Bot API.
Contains endpoints for application settings and configuration.
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from config import SUPPORTED_COUNTRIES, SUPPORTED_SITES
from schemas import SettingsIn, ConnectIn
from services.job_service import SettingsService
from utils.helpers import mask_api_key, sanitize_csv_input, sanitize_input

logger = logging.getLogger("job-agent")

router = APIRouter(prefix="", tags=["settings"])


@router.get("/health")
def health_check():
    """
    Health check endpoint.
    
    Returns:
        Status dictionary with timestamp
    """
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/api/countries")
def api_countries():
    """
    Get list of supported countries.
    
    Returns:
        Dictionary with countries list
    """
    try:
        return {"countries": SUPPORTED_COUNTRIES}
    except Exception as e:
        logger.error(f"Failed to get countries: {e}")
        raise HTTPException(500, "Failed to retrieve countries")


@router.get("/api/sites")
def api_sites():
    """
    Get list of supported job sites.
    
    Returns:
        Dictionary with sites list
    """
    try:
        return {"sites": SUPPORTED_SITES}
    except Exception as e:
        logger.error(f"Failed to get sites: {e}")
        raise HTTPException(500, "Failed to retrieve sites")


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """
    Get current settings.
    
    Args:
        db: Database session
        
    Returns:
        Settings dictionary
    """
    try:
        cfg = SettingsService.get_or_create_settings(db)
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


@router.post("/settings")
def save_settings(payload: SettingsIn, db: Session = Depends(get_db)):
    """
    Save settings.
    
    Args:
        payload: Settings to save
        db: Database session
        
    Returns:
        Success message
    """
    try:
        # Sanitize all text inputs
        sanitized_titles = sanitize_csv_input(payload.titles) if payload.titles else ""
        sanitized_locations = sanitize_csv_input(payload.locations) if payload.locations else ""
        sanitized_country = sanitize_input(payload.country, max_length=100) if payload.country else "india"
        sanitized_include_kw = sanitize_csv_input(payload.include_keywords) if payload.include_keywords else ""
        sanitized_exclude_kw = sanitize_csv_input(payload.exclude_keywords) if payload.exclude_keywords else ""
        
        # Sanitize site names (they come as a list)
        sanitized_sites = ",".join(sanitize_input(s, max_length=50) for s in payload.sites if s)
        
        SettingsService.update_settings(
            db,
            titles=sanitized_titles,
            locations=sanitized_locations,
            country=sanitized_country,
            include_keywords=sanitized_include_kw,
            exclude_keywords=sanitized_exclude_kw,
            sites=sanitized_sites,
            results_per_site=payload.results_per_site,
            hours_old=payload.hours_old
        )
        return {"ok": True, "message": "Settings saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to save settings")


@router.post("/connect")
def connect(payload: ConnectIn, db: Session = Depends(get_db)):
    """
    Connect API key.
    
    Args:
        payload: API key payload
        db: Database session
        
    Returns:
        Connection status
    """
    try:
        cfg = SettingsService.update_settings(
            db,
            api_key=payload.api_key,
            api_key_last5=mask_api_key(payload.api_key),
            connected=True
        )
        return {"connected": True, "message": "API key connected successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Failed to connect API key: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to connect API key")


@router.post("/disconnect")
def disconnect(db: Session = Depends(get_db)):
    """
    Disconnect API key.
    
    Args:
        db: Database session
        
    Returns:
        Disconnection status
    """
    try:
        SettingsService.update_settings(
            db,
            api_key="",
            api_key_last5="",
            connected=False
        )
        return {"connected": False, "message": "API key disconnected"}
    except Exception as e:
        logger.error(f"Failed to disconnect API key: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to disconnect API key")
