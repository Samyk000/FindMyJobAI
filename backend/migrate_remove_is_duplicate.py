"""
Database migration script to remove the is_duplicate column.
Run this script once to migrate existing databases.

Usage:
    cd backend
    python migrate_remove_is_duplicate.py
"""
import sqlite3
import os
import shutil
from datetime import datetime


def migrate_database():
    """Remove is_duplicate column from jobs table."""
    db_path = "jobs.db"
    
    if not os.path.exists(db_path):
        print("No database file found. Nothing to migrate.")
        return
    
    # Create backup
    backup_path = f"jobs_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2(db_path, backup_path)
    print(f"Created backup: {backup_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if is_duplicate column exists
    cursor.execute("PRAGMA table_info(jobs)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'is_duplicate' not in columns:
        print("Column 'is_duplicate' does not exist. No migration needed.")
        conn.close()
        return
    
    print(f"Current columns: {columns}")
    print("Starting migration...")
    
    # Get list of columns without is_duplicate
    new_columns = [col for col in columns if col != 'is_duplicate']
    
    # Create new table without is_duplicate
    create_sql = f"""
    CREATE TABLE jobs_new (
        id TEXT PRIMARY KEY,
        title TEXT DEFAULT '',
        company TEXT DEFAULT '',
        location TEXT DEFAULT '',
        job_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        is_remote INTEGER DEFAULT 0,
        date_posted TEXT DEFAULT '',
        source_site TEXT DEFAULT '',
        search_title TEXT DEFAULT '',
        search_location TEXT DEFAULT '',
        status TEXT DEFAULT 'new',
        batch_id TEXT DEFAULT '',
        fetched_at TEXT
    )
    """
    
    cursor.execute(create_sql)
    
    # Copy data from old table to new table
    cols_str = ', '.join(new_columns)
    cursor.execute(f"INSERT INTO jobs_new ({cols_str}) SELECT {cols_str} FROM jobs")
    
    # Drop old table
    cursor.execute("DROP TABLE jobs")
    
    # Rename new table
    cursor.execute("ALTER TABLE jobs_new RENAME TO jobs")
    
    # Commit changes
    conn.commit()
    
    # Verify
    cursor.execute("PRAGMA table_info(jobs)")
    new_table_columns = [col[1] for col in cursor.fetchall()]
    print(f"New columns: {new_table_columns}")
    
    # Get row count
    cursor.execute("SELECT COUNT(*) FROM jobs")
    count = cursor.fetchone()[0]
    
    conn.close()
    
    print(f"Migration complete! {count} jobs preserved.")
    print(f"Backup saved at: {backup_path}")


if __name__ == "__main__":
    migrate_database()
