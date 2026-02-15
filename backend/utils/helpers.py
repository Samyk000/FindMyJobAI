"""
Helper utilities for the Job Bot API.
"""


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
