"""
Database models for the Job Bot API.
Contains SQLAlchemy ORM model definitions.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean
from database import Base


class JobDB(Base):
    """
    Job listing database model.
    Stores scraped job information with status tracking.
    """
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
    status = Column(String, default="new")  # new, saved, rejected
    batch_id = Column(String, default="")
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<JobDB(id={self.id}, title={self.title}, company={self.company})>"


class SettingsDB(Base):
    """
    Application settings database model.
    Stores user preferences and API configuration.
    """
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
    sites = Column(String, default="linkedin,indeed,glassdoor")
    results_per_site = Column(Integer, default=20)
    hours_old = Column(Integer, default=72)
    data_mode = Column(String, default="compact")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<SettingsDB(key={self.key}, connected={self.connected})>"
