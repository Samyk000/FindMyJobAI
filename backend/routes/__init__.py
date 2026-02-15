"""
Routes package for the Job Bot API.
"""
from routes.jobs import router as jobs_router
from routes.search import router as search_router
from routes.settings import router as settings_router

__all__ = ["jobs_router", "search_router", "settings_router"]
