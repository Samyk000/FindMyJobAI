"""
Job Bot API - Main Application Entry Point

This is the main entry point for the Job Bot API.
It sets up the FastAPI application, configures middleware, and includes routers.
"""
import logging
import traceback
from contextlib import asynccontextmanager

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
from utils.exceptions import JobBotError, ValidationError, NotFoundError, RateLimitError
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from middleware.rate_limit import limiter


# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    logger.info("Starting Job Bot API...")
    init_db()
    logger.info("Job Bot API started successfully")
    yield
    logger.info("Shutting down Job Bot API...")


# --- APP SETUP ---
app = FastAPI(
    title="Job Bot Pro API",
    description="Job search and aggregation API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter

# Configure CORS
from config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)


# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded exceptions."""
    logger.warning(f"RateLimitExceeded: {exc.detail}")
    err = RateLimitError(message="Too many requests. Please wait before trying again.", retry_after=None)
    return JSONResponse(
        status_code=429,
        content=err.to_dict()
    )


@app.exception_handler(JobBotError)
async def jobbot_error_handler(request: Request, exc: JobBotError):

    """Handle all custom Job Bot errors."""
    logger.error(f"JobBotError: {exc.message} - {exc.detail}")
    if isinstance(exc, RateLimitError):
        status_code = 429
    elif isinstance(exc, ValidationError):
        status_code = 400
    elif isinstance(exc, NotFoundError):
        status_code = 404
    else:
        status_code = 500
    return JSONResponse(
        status_code=status_code,
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
