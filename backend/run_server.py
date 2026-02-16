"""
Standalone entry point for PyInstaller bundling.
This file starts the FastAPI server with Uvicorn.

Usage:
    python run_server.py          # Development
    findmyjobai-backend.exe       # Production (PyInstaller bundle)
"""

import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
