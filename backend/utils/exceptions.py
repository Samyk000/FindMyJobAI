"""
Custom exceptions for the Job Bot API.
Provides structured error handling with consistent error formats.
"""
from typing import Optional, Any


class JobBotError(Exception):
    """Base exception for all Job Bot errors."""
    
    def __init__(
        self,
        message: str,
        detail: Optional[str] = None,
        code: Optional[str] = None
    ):
        self.message = message
        self.detail = detail
        self.code = code or "UNKNOWN_ERROR"
        super().__init__(message)
    
    def to_dict(self) -> dict:
        """Convert exception to dictionary for API response."""
        result = {
            "success": False,
            "error": self.message,
            "code": self.code
        }
        if self.detail:
            result["detail"] = self.detail
        return result


class ValidationError(JobBotError):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, detail: Optional[str] = None, field: Optional[str] = None):
        super().__init__(message, detail, "VALIDATION_ERROR")
        self.field = field


class NotFoundError(JobBotError):
    """Raised when a resource is not found."""
    
    def __init__(self, message: str, resource_type: Optional[str] = None, resource_id: Optional[str] = None):
        detail = None
        if resource_type and resource_id:
            detail = f"{resource_type} with id '{resource_id}' not found"
        super().__init__(message, detail, "NOT_FOUND")


class DatabaseError(JobBotError):
    """Raised when a database operation fails."""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message, detail, "DATABASE_ERROR")


class ScrapingError(JobBotError):
    """Raised when a scraping operation fails."""
    
    def __init__(self, message: str, detail: Optional[str] = None, platform: Optional[str] = None):
        if platform:
            detail = f"Platform: {platform}. {detail}" if detail else f"Platform: {platform}"
        super().__init__(message, detail, "SCRAPING_ERROR")


class ConfigurationError(JobBotError):
    """Raised when configuration is missing or invalid."""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message, detail, "CONFIGURATION_ERROR")


class RateLimitError(JobBotError):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        detail = f"Retry after {retry_after} seconds" if retry_after else None
        super().__init__(message, detail, "RATE_LIMIT_EXCEEDED")
        self.retry_after = retry_after
