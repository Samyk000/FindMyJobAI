"""
Helper utilities for the Job Bot API.
"""
import re
from html import escape
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode


def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize user input for safe storage and display.
    
    Performs the following sanitization:
    - Strips leading/trailing whitespace
    - Escapes HTML entities to prevent XSS
    - Removes control characters (except newlines and tabs)
    - Limits maximum length
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length (default 500)
        
    Returns:
        Sanitized string, or empty string if input is None/empty
    """
    if not text:
        return ""
    
    # Strip whitespace
    text = text.strip()
    
    if not text:
        return ""
    
    # Escape HTML entities to prevent XSS
    text = escape(text)
    
    # Remove control characters except newlines (\n), tabs (\t), and carriage returns (\r)
    # Control chars are: \x00-\x08, \x0b, \x0c, \x0e-\x1f, \x7f-\x9f
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text


def sanitize_csv_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitize CSV-style input (titles, locations, keywords).
    
    Similar to sanitize_input but with higher length limit
    to accommodate comma-separated values.
    
    Args:
        text: CSV input text to sanitize
        max_length: Maximum allowed length (default 2000)
        
    Returns:
        Sanitized string
    """
    return sanitize_input(text, max_length=max_length)


def normalize_job_url(url: str) -> str:
    """
    Normalize a job URL for duplicate detection.
    
    Performs the following normalizations:
    - Strip leading/trailing whitespace
    - Convert to lowercase
    - Strip trailing slashes
    - Remove common tracking parameters (utm_*, ref, source, fbclid, gclid, etc.)
    - Remove fragment identifiers
    
    Args:
        url: Job URL to normalize
        
    Returns:
        Normalized URL string, or empty string if URL is invalid/empty
    """
    if not url or not url.strip():
        return ""
    
    url = url.strip()
    
    try:
        parsed = urlparse(url)
        
        # Tracking parameters to remove
        tracking_params = {
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'ref', 'source', 'fbclid', 'gclid', 'msclkid', 'ref_src', 'ref_url',
            'tracking_id', 'trackid', 'campaign', 'adgroup', 'keyword'
        }
        
        # Parse and filter query parameters
        query_params = parse_qs(parsed.query, keep_blank_values=True)
        filtered_params = {
            k: v for k, v in query_params.items()
            if k.lower() not in tracking_params
        }
        
        # Rebuild query string
        new_query = urlencode(filtered_params, doseq=True)
        
        # Rebuild URL without fragment, with lowercase netloc and path
        normalized = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip('/'),
            parsed.params,
            new_query,
            ''  # Remove fragment
        ))
        
        return normalized
    except Exception:
        # If URL parsing fails, return the stripped original
        return url.strip().rstrip('/')
