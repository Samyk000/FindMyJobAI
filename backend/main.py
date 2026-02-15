"""
Job Bot API - Main Application Entry Point

This is the main entry point for the Job Bot API.
It sets up the FastAPI application, configures middleware, and includes routers.
"""
import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("job-agent")

# Import database initialization
from database import init_db

# Import routers
from routes import jobs_router, search_router, settings_router

# Import custom exceptions
from utils.exceptions import JobBotError, ValidationError, NotFoundError

# --- APP SETUP ---
app = FastAPI(
    title="Job Bot Pro API",
    description="Job search and aggregation API",
    version="1.0.0"
)

# Configure CORS
from config import CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(JobBotError)
async def jobbot_error_handler(request: Request, exc: JobBotError):
    """Handle all custom Job Bot errors."""
    logger.error(f"JobBotError: {exc.message} - {exc.detail}")
    return JSONResponse(
        status_code=400 if isinstance(exc, ValidationError) else 404 if isinstance(exc, NotFoundError) else 500,
        content=exc.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "detail": str(exc) if logging.DEBUG >= logging.root.level else "An unexpected error occurred"
        }
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
