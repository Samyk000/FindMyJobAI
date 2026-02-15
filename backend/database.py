"""
Database module for the Job Bot API.
Contains database engine, session management, and base declaration.
"""
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DB_URL

logger = logging.getLogger("job-agent")

# Create database engine
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Create declarative base for models
Base = declarative_base()


def get_db():
    """
    Database session dependency with proper cleanup.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """
    Run database migrations.
    Called on application startup.
    Note: SQLite doesn't support DROP COLUMN, so is_duplicate removal 
    is handled by migrate_remove_is_duplicate.py script.
    """
    pass


def init_db():
    """
    Initialize the database.
    Creates all tables and runs migrations.
    """
    # Import models to ensure they're registered with Base
    from models import JobDB, SettingsDB  # noqa: F401
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Run migrations
    run_migrations()
    
    logger.info("Database initialized successfully")
