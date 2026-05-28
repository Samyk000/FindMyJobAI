"""
Rate limiting middleware for the Job Bot API using slowapi.
Defines the Limiter instance to be imported by routes and registered in main.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from config import RATE_LIMIT_ENABLED

# Initialize Limiter using remote address (IP) as identifier
limiter = Limiter(key_func=get_remote_address, enabled=RATE_LIMIT_ENABLED)

