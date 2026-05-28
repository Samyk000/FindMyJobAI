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


def sanitize_query_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitize search queries and query overrides.
    
    Does NOT HTML-escape special characters (e.g. '&') to prevent breaking 
    scraped search queries, while maintaining control character removal and 
    whitespace stripping.
    
    Args:
        text: Search query string to sanitize
        max_length: Maximum allowed length (default 2000)
        
    Returns:
        Sanitized string, or empty string if input is None/empty
    """
    if not text:
        return ""
    
    # Strip whitespace
    text = text.strip()
    
    if not text:
        return ""
    
    # Remove control characters except newlines (\n), tabs (\t), and carriage returns (\r)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text


def format_search_location(location: str, country: str) -> str:
    """
    Append country to location if not already present.
    e.g. "Remote" + "India" -> "Remote, India"
    e.g. "Pune" + "India" -> "Pune, India"
    e.g. "Pune, India" + "India" -> "Pune, India"
    """
    if not location or not location.strip():
        return ""
        
    loc_clean = location.strip()
    country_clean = country.strip() if country else ""
    if not country_clean:
        return loc_clean
        
    # Check if country name is already in location
    loc_lower = loc_clean.lower()
    country_lower = country_clean.lower()
    
    if country_lower in loc_lower:
        return loc_clean
        
    # Add mapped abbreviation checks
    country_abbrevs = {
        "india": ["in"],
        "united states": ["us", "usa"],
        "usa": ["us", "united states"],
        "united kingdom": ["uk", "gb"],
        "uk": ["united kingdom", "gb"],
        "canada": ["ca"],
        "australia": ["au"]
    }
    
    abbrevs = country_abbrevs.get(country_lower, [])
    for abbrev in abbrevs:
        # Match word boundary to avoid false positives (e.g. "Pune, IN" vs "Indianapolis")
        if re.search(rf"\b{re.escape(abbrev)}\b", loc_lower):
            return loc_clean
            
    return f"{loc_clean}, {country_clean}"


def matches_target_country(job_location: str, target_country: str) -> bool:
    """
    Check if the job location is compatible with the target country.
    Rejects the job if the location explicitly mentions a different country.
    """
    if not job_location or not target_country:
        return True
        
    loc_lower = job_location.lower().strip()
    country_lower = target_country.lower().strip()
    
    # Map target country to its aliases/abbreviations, including states/provinces
    country_aliases = {
        "india": {"india", "in", "ind", "wb", "mh", "dl", "ka", "tn", "ts", "ap", "hr", "up"},
        "united states": {
            "united states", "usa", "us", "united states of america",
            "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "ia", 
            "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", 
            "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn", "tx", 
            "ut", "vt", "va", "wa", "wv", "wi", "wy"
        },
        "usa": {
            "united states", "usa", "us", "united states of america",
            "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "ia", 
            "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", 
            "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn", "tx", 
            "ut", "vt", "va", "wa", "wv", "wi", "wy"
        },
        "united kingdom": {"united kingdom", "uk", "gb", "england", "scotland", "wales", "great britain", "london"},
        "uk": {"united kingdom", "uk", "gb", "england", "scotland", "wales", "great britain", "london"},
        "canada": {"canada", "ca", "ab", "bc", "mb", "nb", "nl", "ns", "nt", "nu", "on", "pe", "qc", "sk", "yt"},
        "australia": {"australia", "au", "nsw", "qld", "sa", "tas", "vic", "wa"}
    }
    
    # Get aliases for target country
    target_aliases = country_aliases.get(country_lower, {country_lower})
    
    # Get all aliases for OTHER countries
    other_countries_aliases = set()
    for c_name, aliases in country_aliases.items():
        is_same = False
        if c_name == country_lower:
            is_same = True
        elif c_name in ("usa", "united states") and country_lower in ("usa", "united states"):
            is_same = True
        elif c_name in ("uk", "united kingdom") and country_lower in ("uk", "united kingdom"):
            is_same = True
            
        if not is_same:
            other_countries_aliases.update(aliases)
            
    # Add other common countries not in our primary map
    other_countries_aliases.update({
        "vietnam", "viet nam", "thailand", "bangkok", "germany", "france", "spain", 
        "singapore", "malaysia", "netherlands", "sweden", "japan", "china", 
        "brazil", "mexico", "ireland", "italy", "poland", "switzerland"
    })
    
    # If the location contains any other country's alias as a full word, reject it
    for alias in other_countries_aliases:
        if re.search(r'\b' + re.escape(alias) + r'\b', loc_lower):
            return False
            
    return True


def matches_query_location(job_location: str, is_remote: bool, queried_location: str) -> bool:
    """
    Check if the job location matches the queried location.
    If queried location is 'Remote', checks if the job is remote.
    Otherwise, checks if the city name is in the job location.
    """
    if not queried_location:
        return True
        
    q_loc = queried_location.strip().lower()
    job_loc = job_location.strip().lower()
    
    if q_loc == "remote":
        return is_remote or "remote" in job_loc
        
    if q_loc in job_loc:
        return True
        
    # Special city mappings (e.g. Kolkata / Calcutta)
    city_mappings = {
        "kolkata": {"kolkata", "calcutta"},
        "bengaluru": {"bengaluru", "bangalore"},
        "bangalore": {"bengaluru", "bangalore"},
        "delhi": {"delhi", "ncr", "new delhi"},
        "mumbai": {"mumbai", "bombay"}
    }
    
    if q_loc in city_mappings:
        for alias in city_mappings[q_loc]:
            if alias in job_loc:
                return True
                
    return False



