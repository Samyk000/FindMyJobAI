"""
Database configuration for PyInstaller compatibility.

In development mode, the database is stored in the backend directory.
In production (frozen) mode, the database is stored in %LOCALAPPDATA%\\FindMyJobAI.
"""

import os
import sys


def is_frozen() -> bool:
    """
    Check if running in PyInstaller frozen mode.
    
    Returns:
        True if running as compiled executable, False otherwise
    """
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')


def get_database_path() -> str:
    """
    Get the appropriate database path based on execution mode.
    
    In development mode: backend/jobs.db (relative to this file)
    In frozen mode: %LOCALAPPDATA%\\FindMyJobAI\\jobs.db
    
    Returns:
        Absolute path to the database file
    """
    if is_frozen():
        # Production mode: use AppData
        appdata = os.environ.get('LOCALAPPDATA', os.environ.get('APPDATA', ''))
        if not appdata:
            # Fallback to user home if AppData not available
            appdata = os.path.expanduser('~')
        
        db_dir = os.path.join(appdata, 'FindMyJobAI')
        os.makedirs(db_dir, exist_ok=True)
        return os.path.join(db_dir, 'jobs.db')
    else:
        # Development mode: use backend directory
        backend_dir = os.path.dirname(__file__)
        return os.path.join(backend_dir, 'jobs.db')


def get_database_url() -> str:
    """
    Get the SQLite database URL.
    
    Returns:
        SQLite URL string (sqlite:///path/to/db)
    """
    db_path = get_database_path()
    return f'sqlite:///{db_path}'
