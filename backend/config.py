"""
Configuration module for the Job Bot API.
Contains all constants, environment variables, and settings.
"""
import os
from typing import List, Dict


# --- ENVIRONMENT VARIABLES ---
def get_env_str(key: str, default: str = "") -> str:
    """Get string environment variable."""
    return os.environ.get(key, default)


def get_env_bool(key: str, default: bool = False) -> bool:
    """Get boolean environment variable."""
    val = os.environ.get(key, "").lower()
    if val in ("true", "1", "yes", "on"):
        return True
    if val in ("false", "0", "no", "off"):
        return False
    return default


def get_env_int(key: str, default: int = 0) -> int:
    """Get integer environment variable."""
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default


# --- DATABASE CONFIGURATION ---
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "jobs.db")
DB_URL = get_env_str("DB_URL", f"sqlite:///{DB_PATH}")


# --- CORS CONFIGURATION ---
def get_cors_origins() -> List[str]:
    """Parse CORS origins from environment."""
    origins = get_env_str("CORS_ORIGINS", "*")
    if origins == "*":
        return ["*"]
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


CORS_ORIGINS = get_cors_origins()


# --- PIPELINE CONFIGURATION ---
PIPELINE_EXPIRY_SECONDS = 3600  # 1 hour


# --- SUPPORTED VALUES ---
SUPPORTED_COUNTRIES: List[Dict[str, str]] = [
    {"code": "india", "name": "India"},
    {"code": "usa", "name": "United States"},
    {"code": "uk", "name": "United Kingdom"},
    {"code": "canada", "name": "Canada"},
    {"code": "australia", "name": "Australia"},
]

SUPPORTED_SITES: List[str] = ["linkedin", "indeed", "glassdoor"]


# --- VALIDATION CONSTANTS ---
MIN_RESULTS_PER_SITE = 5
MAX_RESULTS_PER_SITE = 100
MIN_HOURS_OLD = 1
MAX_HOURS_OLD = 720  # 30 days
MIN_API_KEY_LENGTH = 10
MAX_PAGINATION_LIMIT = 1000


# --- RATE LIMITING ---
RATE_LIMIT_ENABLED = get_env_bool("RATE_LIMIT_ENABLED", True)
RATE_LIMIT_REQUESTS = get_env_int("RATE_LIMIT_REQUESTS", 5)
RATE_LIMIT_WINDOW = get_env_int("RATE_LIMIT_WINDOW", 60)  # seconds


# --- LOGGING ---
LOG_LEVEL = get_env_str("LOG_LEVEL", "INFO")
