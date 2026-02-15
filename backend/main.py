"""
Job Bot API - Main Application Entry Point

This is the main entry point for the Job Bot API.
It sets up the FastAPI application, configures middleware, and includes routers.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("job-agent")

# Import database initialization
from database import init_db

# Import routers
from routes import jobs_router, search_router, settings_router

# --- APP SETUP ---
app = FastAPI(
    title="Job Bot Pro API",
    description="Job search and aggregation API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- STARTUP EVENT ---
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting Job Bot API...")
    init_db()
    logger.info("Job Bot API started successfully")


# --- INCLUDE ROUTERS ---
app.include_router(settings_router)
app.include_router(jobs_router)
app.include_router(search_router)


# --- ROOT ENDPOINT ---
@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "name": "Job Bot Pro API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
