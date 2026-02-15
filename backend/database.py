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
    Adds missing columns to existing tables.
    """
    try:
        with engine.connect() as conn:
            # Check and add created_at/updated_at columns to jobs table
            result = conn.execute(text("PRAGMA table_info(jobs)"))
            jobs_columns = [row[1] for row in result.fetchall()]
            
            if 'created_at' not in jobs_columns:
                logger.info("Adding created_at column to jobs table...")
                conn.execute(text("ALTER TABLE jobs ADD COLUMN created_at TEXT"))
                conn.commit()
                logger.info("Migration complete: created_at column added to jobs")
            
            if 'updated_at' not in jobs_columns:
                logger.info("Adding updated_at column to jobs table...")
                conn.execute(text("ALTER TABLE jobs ADD COLUMN updated_at TEXT"))
                conn.commit()
                logger.info("Migration complete: updated_at column added to jobs")
            
            # Check and add created_at/updated_at columns to settings table
            result = conn.execute(text("PRAGMA table_info(settings)"))
            settings_columns = [row[1] for row in result.fetchall()]
            
            if 'created_at' not in settings_columns:
                logger.info("Adding created_at column to settings table...")
                conn.execute(text("ALTER TABLE settings ADD COLUMN created_at TEXT"))
                conn.commit()
                logger.info("Migration complete: created_at column added to settings")
            
            if 'updated_at' not in settings_columns:
                logger.info("Adding updated_at column to settings table...")
                conn.execute(text("ALTER TABLE settings ADD COLUMN updated_at TEXT"))
                conn.commit()
                logger.info("Migration complete: updated_at column added to settings")
                
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
