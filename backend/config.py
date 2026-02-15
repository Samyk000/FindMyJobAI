"""
Configuration module for the Job Bot API.
Contains all constants, environment variables, and settings.
"""
import os
from typing import List, Dict


# --- DATABASE CONFIGURATION ---
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "jobs.db")
DB_URL = f"sqlite:///{DB_PATH}"


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
