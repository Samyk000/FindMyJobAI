"""
Helper utilities for the Job Bot API.
"""
import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode


def mask_api_key(api_key: str) -> str:
    """
    Mask API key, showing only last 5 characters.
    
    Args:
        api_key: API key to mask
        
    Returns:
        Masked API key string
    """
    key = (api_key or "").strip()
    return f"***{key[-5:]}" if len(key) >= 5 else "***"


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
