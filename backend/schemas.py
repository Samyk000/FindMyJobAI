"""
Pydantic schemas for the Job Bot API.
Contains request and response models for all endpoints.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from config import (
    SUPPORTED_SITES,
    MIN_RESULTS_PER_SITE,
    MAX_RESULTS_PER_SITE,
    MIN_HOURS_OLD,
    MAX_HOURS_OLD,
    MIN_API_KEY_LENGTH,
    MAX_PAGINATION_LIMIT,
)


# --- REQUEST SCHEMAS ---

class SettingsIn(BaseModel):
    """Schema for saving application settings."""
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
        """Validate that all sites are supported."""
        valid_sites = [s for s in v if s in SUPPORTED_SITES]
        return valid_sites if valid_sites else ["linkedin"]

    @field_validator('results_per_site')
    @classmethod
    def validate_results(cls, v):
        """Validate results per site is within bounds."""
        return max(MIN_RESULTS_PER_SITE, min(v, MAX_RESULTS_PER_SITE))

    @field_validator('hours_old')
    @classmethod
    def validate_hours(cls, v):
        """Validate hours old is within bounds."""
        return max(MIN_HOURS_OLD, min(v, MAX_HOURS_OLD))


class ConnectIn(BaseModel):
    """Schema for connecting an API key."""
    api_key: str

    @field_validator('api_key')
    @classmethod
    def validate_api_key(cls, v):
        """Validate API key length."""
        key = (v or "").strip()
        if len(key) < MIN_API_KEY_LENGTH:
            raise ValueError(f"API key must be at least {MIN_API_KEY_LENGTH} characters")
        return key


class RunScrapeIn(BaseModel):
    """Schema for starting a scrape job."""
    titles: Optional[str] = None
    locations: Optional[str] = None
    country: Optional[str] = None
    hours_old: Optional[int] = None


class JobFilter(BaseModel):
    """Schema for filtering jobs in search."""
    status: str = "active"
    limit: int = 50
    offset: int = 0
    batch_id: Optional[str] = None
    source_site: Optional[str] = None
    location: Optional[str] = None

    @field_validator('limit')
    @classmethod
    def validate_limit(cls, v):
        """Validate pagination limit."""
        return max(1, min(v, MAX_PAGINATION_LIMIT))

    @field_validator('offset')
    @classmethod
    def validate_offset(cls, v):
        """Validate pagination offset is non-negative."""
        return max(0, v)


class JobUpdate(BaseModel):
    """Schema for updating a job's status."""
    status: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate status is one of the allowed values."""
        if v and v not in ["new", "saved", "rejected"]:
            raise ValueError("Status must be 'new', 'saved', or 'rejected'")
        return v


# --- RESPONSE SCHEMAS ---

class JobOut(BaseModel):
    """Schema for job output in API responses."""
    id: str
    title: str
    company: str
    location: str
    job_url: str
    is_remote: bool
    date_posted: str
    source_site: str
    status: str
    batch_id: str
    fetched_at: str


class JobDetailOut(BaseModel):
    """Schema for detailed job output including description."""
    id: str
    title: str
    company: str
    location: str
    job_url: str
    description: str
    is_remote: bool
    date_posted: str
    source_site: str
    status: str
    batch_id: str
    fetched_at: str


class SettingsOut(BaseModel):
    """Schema for settings output."""
    connected: bool
    api_key_last5: str
    titles: str
    locations: str
    country: str
    include_keywords: str
    exclude_keywords: str
    sites: List[str]
    results_per_site: int
    hours_old: int


class StatsOut(BaseModel):
    """Schema for job statistics output."""
    total: int
    new: int
    saved: int
    rejected: int


class ScrapeJobOut(BaseModel):
    """Schema for scrape job start response."""
    job_id: str
    batch_id: str
    message: str


class SuccessResponse(BaseModel):
    """Generic success response schema."""
    ok: bool = True
    message: str


class ClearAllResponse(BaseModel):
    """Schema for clear all jobs response."""
    ok: bool = True
    message: str
    count: int
    settings_reset: bool
