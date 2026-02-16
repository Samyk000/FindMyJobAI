"""
Migration script to add indexes to the jobs table.
Run this once to improve query performance.

Usage:
    cd backend
    python add_indexes.py
"""
from sqlalchemy import create_engine, text
from database_config import get_database_url

def add_indexes():
    """Add indexes to the jobs table for better query performance."""
    engine = create_engine(get_database_url())
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS ix_jobs_job_url ON jobs(job_url)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_source_site ON jobs(source_site)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_status ON jobs(status)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_batch_id ON jobs(batch_id)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_fetched_at ON jobs(fetched_at)",
    ]
    
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                print(f"Created: {index_sql.split('ix_jobs_')[1].split(' ')[0]}")
            except Exception as e:
                print(f"Error creating index: {e}")
        conn.commit()
    
    print("\nIndexes created successfully!")
    
    # Verify indexes
    result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='jobs'"))
    indexes = [row[0] for row in result]
    print(f"Current indexes on jobs table: {indexes}")

if __name__ == "__main__":
    add_indexes()
