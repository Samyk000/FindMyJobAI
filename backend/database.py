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
    Run database migrations to add missing columns.
    Called on application startup.
    """
    try:
        with engine.connect() as conn:
            # Check if is_duplicate column exists
            result = conn.execute(text("PRAGMA table_info(jobs)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'is_duplicate' not in columns:
                logger.info("Adding is_duplicate column to jobs table...")
                conn.execute(text("ALTER TABLE jobs ADD COLUMN is_duplicate BOOLEAN DEFAULT 0"))
                conn.commit()
                logger.info("Migration complete: is_duplicate column added")
    except Exception as e:
        logger.error(f"Migration error: {e}")


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
