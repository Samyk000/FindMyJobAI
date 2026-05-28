"""
Title Expander for Jobify.
Maps job titles to their equivalent variants across industries and companies.

This module provides intelligent title expansion so that searching for "Recruiter"
also finds "Talent Acquisition Specialist", "HR Recruiter", etc.

Design Principles:
- Only include titles that are GENUINELY the same role
- Keep expansions within the same role family (no cross-family contamination)
- Include industry-specific abbreviations and variants
- Avoid false positives (e.g., "Marketing Manager" ≠ "Engineering Manager")
"""

from typing import List, Dict, Set, Optional
import re


# =============================================================================
# SYNONYM MAPPING — Organized by Role Family
# =============================================================================
# Each family contains titles that are the SAME role with different names.
# Keys are lowercase canonical forms. Values are equivalent titles.

TITLE_FAMILIES: Dict[str, List[str]] = {
    # ---------------------------------------------------------------------------
    # RECRUITING & TALENT ACQUISITION
    # ---------------------------------------------------------------------------
    "recruiter": [
        "recruiter", "talent acquisition specialist", "talent acquisition consultant",
        "hr recruiter", "technical recruiter", "sourcer", "talent sourcer",
        "hiring specialist", "talent acquisition manager", "recruitment specialist",
        "recruitment consultant", "people recruiter", "campus recruiter",
        "executive recruiter", "staffing specialist", "talent acquisition lead",
    ],
    "talent acquisition": [
        "talent acquisition", "talent acquisition specialist", "talent acquisition manager",
        "talent acquisition lead", "talent acquisition director", "head of talent acquisition",
        "recruiting manager", "recruitment manager", "talent lead",
    ],

    # ---------------------------------------------------------------------------
    # SOFTWARE ENGINEERING
    # ---------------------------------------------------------------------------
    "software engineer": [
        "software engineer", "software developer", "applications developer",
        "systems developer", "programmer", "computer programmer", "developer",
        "swe", "full stack engineer", "full stack developer",
    ],
    "backend engineer": [
        "backend engineer", "backend developer", "server side developer",
        "server engineer", "api engineer", "api developer", "platform engineer",
        "infrastructure developer", "systems programmer",
    ],
    "frontend engineer": [
        "frontend engineer", "frontend developer", "front end engineer",
        "front end developer", "ui engineer", "ui developer", "web developer",
        "client side developer", "javascript engineer", "react developer",
    ],
    "full stack developer": [
        "full stack developer", "full stack engineer", "fullstack developer",
        "fullstack engineer", "full stack web developer", "generalist developer",
    ],
    "mobile developer": [
        "mobile developer", "mobile engineer", "ios developer", "android developer",
        "mobile app developer", "react native developer", "flutter developer",
        "cross platform developer", "mobile application developer",
    ],
    "devops engineer": [
        "devops engineer", "devops", "infrastructure engineer", "platform engineer",
        "site reliability engineer", "sre", "cloud engineer", "cloud infrastructure engineer",
        "release engineer", "deployment engineer", "build engineer", "systems engineer",
        "infrastructure developer", "cloud platform engineer",
    ],
    "security engineer": [
        "security engineer", "cyber security engineer", "information security engineer",
        "application security engineer", "security developer", "appsec engineer",
        "security analyst", "infosec engineer", "cybersecurity engineer",
    ],
    "data engineer": [
        "data engineer", "data platform engineer", "etl developer", "etl engineer",
        "data pipeline engineer", "data infrastructure engineer",
        "big data engineer", "analytics engineer", "data ops engineer",
    ],
    "machine learning engineer": [
        "machine learning engineer", "ml engineer", "ai engineer",
        "artificial intelligence engineer", "machine learning developer",
        "deep learning engineer", "nlp engineer", "ml ops engineer",
    ],
    "qa engineer": [
        "qa engineer", "quality assurance engineer", "test engineer",
        "software test engineer", "sdet", "automation test engineer",
        "quality engineer", "software quality engineer", "qa analyst",
        "test automation engineer", "quality assurance analyst",
    ],
    "embedded engineer": [
        "embedded engineer", "embedded software engineer", "firmware engineer",
        "embedded systems engineer", "embedded developer", "firmware developer",
        "iot engineer", "embedded firmware engineer", "real time engineer",
    ],

    # ---------------------------------------------------------------------------
    # DATA & ANALYTICS
    # ---------------------------------------------------------------------------
    "data analyst": [
        "data analyst", "business intelligence analyst", "bi analyst",
        "analytics analyst", "reporting analyst", "data reporting analyst",
        "business analyst data", "metrics analyst", "insights analyst",
        "decision support analyst", "data science analyst",
    ],
    "data scientist": [
        "data scientist", "machine learning scientist", "ai scientist",
        "data science specialist", "research scientist data",
        "applied scientist", "quantitative analyst", "quant analyst",
        "statistical analyst", "data science engineer",
    ],
    "business analyst": [
        "business analyst", "ba", "business systems analyst",
        "requirements analyst", "functional analyst", "process analyst",
        "business intelligence analyst", "business data analyst",
        "systems analyst", "it business analyst",
    ],

    # ---------------------------------------------------------------------------
    # PRODUCT & DESIGN
    # ---------------------------------------------------------------------------
    "product manager": [
        "product manager", "product owner", "product lead",
        "product head", "group product manager", "senior product manager",
        "technical product manager", "tpm", "product director",
    ],
    "product designer": [
        "product designer", "ux designer", "ui ux designer",
        "user experience designer", "user interface designer",
        "ux ui designer", "interaction designer", "digital product designer",
        "experience designer", "designer",
    ],
    "ui ux designer": [
        "ui ux designer", "ux ui designer", "ux designer", "ui designer",
        "user experience designer", "user interface designer",
        "interaction designer", "product designer", "experience designer",
        "digital designer", "web designer",
    ],
    "graphic designer": [
        "graphic designer", "visual designer", "creative designer",
        "digital designer", "brand designer", "production artist",
        "layout designer", "print designer",
    ],
    "ux researcher": [
        "ux researcher", "user experience researcher", "usability researcher",
        "user researcher", "ux research analyst", "experience researcher",
    ],
    "design lead": [
        "design lead", "design manager", "head of design",
        "creative lead", "design director", "lead designer",
    ],

    # ---------------------------------------------------------------------------
    # MARKETING & CONTENT
    # ---------------------------------------------------------------------------
    "marketing manager": [
        "marketing manager", "marketing lead", "marketing head",
        "digital marketing manager", "marketing specialist",
        "marketing coordinator", "brand manager", "growth manager",
    ],
    "content writer": [
        "content writer", "content creator", "copywriter", "copy writer",
        "content specialist", "content strategist", "blog writer",
        "content developer", "digital content writer", "web content writer",
    ],
    "technical writer": [
        "technical writer", "technical content writer", "documentation specialist",
        "technical documentation writer", "api writer", "technical author",
        "science writer", "medical writer", "technical communicator",
    ],
    "seo specialist": [
        "seo specialist", "seo analyst", "search engine optimization specialist",
        "seo manager", "seo expert", "organic search specialist",
        "seo consultant", "search marketing specialist",
    ],
    "social media manager": [
        "social media manager", "social media specialist", "social media coordinator",
        "social media strategist", "community manager", "social media lead",
        "digital community manager", "social media analyst",
    ],
    "content marketing": [
        "content marketing manager", "content marketing specialist",
        "content marketing strategist", "content marketing lead",
        "content lead", "editorial manager",
    ],
    "digital marketing": [
        "digital marketing specialist", "digital marketing executive",
        "digital marketing manager", "online marketing specialist",
        "internet marketing specialist", "digital campaign manager",
    ],
    "public relations": [
        "public relations specialist", "pr specialist", "pr manager",
        "communications specialist", "communications manager",
        "media relations specialist", "public affairs specialist",
    ],

    # ---------------------------------------------------------------------------
    # SALES & BUSINESS DEVELOPMENT
    # ---------------------------------------------------------------------------
    "sales executive": [
        "sales executive", "sales representative", "sales rep",
        "business development executive", "account executive",
        "client executive", "sales associate", "business development representative",
        "bdr", "sdr", "sales development representative",
    ],
    "sales manager": [
        "sales manager", "sales lead", "sales director",
        "business development manager", "account manager",
        "regional sales manager", "territory manager",
    ],
    "business development": [
        "business development manager", "business development executive",
        "business development specialist", "partnership manager",
        "strategic partnerships manager", "alliance manager",
    ],
    "account manager": [
        "account manager", "client manager", "key account manager",
        "customer success manager", "relationship manager",
        "strategic account manager", "enterprise account manager",
    ],

    # ---------------------------------------------------------------------------
    # FINANCE & ACCOUNTING
    # ---------------------------------------------------------------------------
    "accountant": [
        "accountant", "chartered accountant", "ca",
        "financial accountant", "senior accountant", "accounts executive",
        "accounts officer", "accounts assistant", "bookkeeper",
    ],
    "financial analyst": [
        "financial analyst", "finance analyst", "business financial analyst",
        "corporate financial analyst", "fp&a analyst", "financial planning analyst",
        "investment analyst", "budget analyst",
    ],
    "auditor": [
        "auditor", "internal auditor", "external auditor",
        "audit associate", "audit manager", "compliance auditor",
        "financial auditor", "quality auditor",
    ],
    "tax specialist": [
        "tax specialist", "tax analyst", "tax consultant",
        "tax manager", "tax advisor", "tax accountant",
        "indirect tax specialist", "direct tax specialist",
    ],
    "finance manager": [
        "finance manager", "finance head", "finance director",
        "financial controller", "controller", "chief accountant",
        "head of finance", "finance business partner",
    ],

    # ---------------------------------------------------------------------------
    # HUMAN RESOURCES
    # ---------------------------------------------------------------------------
    "hr manager": [
        "hr manager", "human resources manager", "people manager",
        "hr business partner", "hrbp", "people business partner",
        "hr head", "hr director", "head of people",
    ],
    "hr executive": [
        "hr executive", "hr officer", "hr coordinator",
        "hr specialist", "human resources executive", "hr generalist",
        "people operations specialist", "people operations coordinator",
    ],
    "recruitment coordinator": [
        "recruitment coordinator", "recruiting coordinator",
        "talent acquisition coordinator", "hiring coordinator",
        "recruitment assistant", "recruiting assistant",
    ],
    "compensation analyst": [
        "compensation analyst", "compensation specialist", "total rewards analyst",
        "compensation and benefits analyst", "remuneration analyst",
        "rewards analyst", "c&b analyst",
    ],
    "training specialist": [
        "training specialist", "learning and development specialist",
        "l&d specialist", "training coordinator", "learning specialist",
        "corporate trainer", "training manager", "l&d manager",
    ],

    # ---------------------------------------------------------------------------
    # OPERATIONS & PROJECT MANAGEMENT
    # ---------------------------------------------------------------------------
    "project manager": [
        "project manager", "project lead", "program manager",
        "delivery manager", "project coordinator", "project executive",
        "engagement manager", "scrum master", "agile project manager",
    ],
    "operations manager": [
        "operations manager", "ops manager", "operations lead",
        "business operations manager", "operations head",
        "director of operations", "chief operating officer",
    ],
    "operations analyst": [
        "operations analyst", "business operations analyst",
        "process analyst", "operations specialist",
        "workflow analyst", "efficiency analyst",
    ],
    "supply chain": [
        "supply chain manager", "supply chain analyst", "supply chain specialist",
        "procurement manager", "procurement specialist", "purchasing manager",
        "logistics manager", "logistics coordinator", "warehouse manager",
    ],

    # ---------------------------------------------------------------------------
    # CUSTOMER SUPPORT & SUCCESS
    # ---------------------------------------------------------------------------
    "customer support": [
        "customer support specialist", "customer service representative",
        "customer service agent", "client support specialist",
        "help desk analyst", "technical support specialist",
        "support engineer", "customer care executive",
    ],
    "customer success": [
        "customer success manager", "customer success specialist",
        "client success manager", "account success manager",
        "customer experience manager", "client relations manager",
    ],
    "technical support": [
        "technical support specialist", "technical support engineer",
        "it support specialist", "it help desk", "desktop support engineer",
        "field support engineer", "it support analyst",
    ],

    # ---------------------------------------------------------------------------
    # IT & SYSTEMS
    # ---------------------------------------------------------------------------
    "system administrator": [
        "system administrator", "sysadmin", "systems administrator",
        "it administrator", "server administrator", "network administrator",
        "it systems administrator", "infrastructure administrator",
    ],
    "network engineer": [
        "network engineer", "network administrator", "network specialist",
        "it network engineer", "network operations engineer",
        "network analyst", "infrastructure network engineer",
    ],
    "it manager": [
        "it manager", "information technology manager", "it director",
        "it head", "technology manager", "chief technology officer",
        "cto", "it operations manager",
    ],

    # ---------------------------------------------------------------------------
    # LEGAL
    # ---------------------------------------------------------------------------
    "lawyer": [
        "lawyer", "attorney", "legal counsel", "legal advisor",
        "legal officer", "advocate", "barrister", "solicitor",
    ],
    "paralegal": [
        "paralegal", "legal assistant", "legal executive",
        "legal clerk", "litigation assistant", "law clerk",
    ],
    "compliance officer": [
        "compliance officer", "compliance manager", "regulatory compliance officer",
        "compliance specialist", "compliance analyst", "risk and compliance officer",
    ],

    # ---------------------------------------------------------------------------
    # HEALTHCARE
    # ---------------------------------------------------------------------------
    "nurse": [
        "nurse", "registered nurse", "rn", "staff nurse",
        "clinical nurse", "nurse practitioner", "np",
        "medical nurse", "ward nurse", "theater nurse",
    ],
    "pharmacist": [
        "pharmacist", "clinical pharmacist", "hospital pharmacist",
        "community pharmacist", "pharmacy specialist", "dispensing pharmacist",
    ],

    # ---------------------------------------------------------------------------
    # EDUCATION
    # ---------------------------------------------------------------------------
    "teacher": [
        "teacher", "educator", "instructor", "lecturer",
        "faculty", "professor", "tutor", "academic instructor",
    ],
    "training manager": [
        "training manager", "learning and development manager",
        "l&d manager", "corporate training manager", "academy manager",
    ],

    # ---------------------------------------------------------------------------
    # ARCHITECTURE & ENGINEERING (NON-SOFTWARE)
    # ---------------------------------------------------------------------------
    "civil engineer": [
        "civil engineer", "structural engineer", "geotechnical engineer",
        "transportation engineer", "construction engineer",
        "site engineer", "project engineer civil",
    ],
    "mechanical engineer": [
        "mechanical engineer", "design engineer", "manufacturing engineer",
        "production engineer", "automation engineer", "thermal engineer",
    ],
    "electrical engineer": [
        "electrical engineer", "electronics engineer", "power engineer",
        "control systems engineer", "instrumentation engineer",
    ],

    # ---------------------------------------------------------------------------
    # CREATIVE & MEDIA
    # ---------------------------------------------------------------------------
    "video editor": [
        "video editor", "multimedia editor", "film editor",
        "digital video editor", "post production editor",
        "youtube editor", "content editor video",
    ],
    "photographer": [
        "photographer", "visual content creator", "digital photographer",
        "commercial photographer", "product photographer",
    ],
    "animation artist": [
        "animator", "animation artist", "motion graphics artist",
        "motion designer", "2d animator", "3d animator",
    ],

    # ---------------------------------------------------------------------------
    # REAL ESTATE
    # ---------------------------------------------------------------------------
    "real estate agent": [
        "real estate agent", "realtor", "property consultant",
        "real estate consultant", "property advisor", "real estate broker",
    ],

    # ---------------------------------------------------------------------------
    # CONSULTING
    # ---------------------------------------------------------------------------
    "management consultant": [
        "management consultant", "strategy consultant", "business consultant",
        "advisory consultant", "consulting analyst", "consultant",
    ],

    # ---------------------------------------------------------------------------
    # ADMINISTRATION
    # ---------------------------------------------------------------------------
    "office administrator": [
        "office administrator", "office manager", "administrative assistant",
        "admin assistant", "office coordinator", "front office executive",
        "receptionist", "office executive",
    ],
    "executive assistant": [
        "executive assistant", "ea", "personal assistant", "pa",
        "senior executive assistant", "c suite assistant",
    ],

    # ---------------------------------------------------------------------------
    # QUALITY & COMPLIANCE
    # ---------------------------------------------------------------------------
    "quality analyst": [
        "quality analyst", "quality assurance analyst", "qa analyst",
        "quality specialist", "quality control analyst",
        "quality engineer", "process quality analyst",
    ],

    # ---------------------------------------------------------------------------
    # SCIENTIFIC & RESEARCH
    # ---------------------------------------------------------------------------
    "research scientist": [
        "research scientist", "researcher", "research associate",
        "research fellow", "scientist", "r&d scientist",
    ],
    "lab technician": [
        "lab technician", "laboratory technician", "research technician",
        "laboratory assistant", "lab assistant", "science technician",
    ],
}


# =============================================================================
# EXPANSION ENGINE
# =============================================================================

def _normalize(title: str) -> str:
    """Normalize a title for matching (lowercase, strip extra spaces)."""
    return re.sub(r'\s+', ' ', title.lower().strip())


def _get_family_key(title: str) -> Optional[str]:
    """
    Find the canonical family key for a given title.
    Returns the key if the title is found in any family, else None.
    """
    normalized = _normalize(title)
    for key, variants in TITLE_FAMILIES.items():
        for variant in variants:
            if _normalize(variant) == normalized:
                return key
    return None


def _fuzzy_contains(query: str, text: str) -> bool:
    """
    Check if query tokens are contained in text.
    Handles partial matches like "recruit" matching "recruiter".
    """
    query_tokens = set(_normalize(query).split())
    text_tokens = set(_normalize(text).split())
    
    # Exact token match
    if query_tokens & text_tokens:
        return True
    
    # Partial match: check if any query token is a prefix of a text token
    for qt in query_tokens:
        for tt in text_tokens:
            if tt.startswith(qt) or qt.startswith(tt):
                return True
    return False


def expand_titles(
    titles_csv: str,
    max_expansions: int = 6,
    include_original: bool = True,
) -> str:
    """
    Expand a comma-separated list of job titles into their variants.
    
    Args:
        titles_csv: Comma-separated job titles (e.g., "Recruiter, Software Engineer")
        max_expansions: Maximum number of total titles after expansion (prevents explosion)
        include_original: Whether to include the original title in output
        
    Returns:
        Comma-separated expanded titles string
        
    Example:
        expand_titles("Recruiter") 
        → "Recruiter, Talent Acquisition Specialist, HR Recruiter, Technical Recruiter, Talent Sourcer"
    """
    if not titles_csv or not titles_csv.strip():
        return titles_csv
    
    original_titles = [t.strip() for t in titles_csv.split(",") if t.strip()]
    expanded_set: Set[str] = set()
    
    for title in original_titles:
        normalized = _normalize(title)
        family_key = _get_family_key(normalized)
        
        if family_key:
            # Found in mapping — expand
            variants = TITLE_FAMILIES[family_key]
            for variant in variants:
                if len(expanded_set) < max_expansions:
                    expanded_set.add(variant)
        else:
            # Not in mapping — try fuzzy match
            matched = False
            for key, variants in TITLE_FAMILIES.items():
                if _fuzzy_contains(normalized, key) or _fuzzy_contains(key, normalized):
                    for variant in variants:
                        if len(expanded_set) < max_expansions:
                            expanded_set.add(variant)
                    matched = True
                    break
            
            if not matched:
                # No match found — keep original
                expanded_set.add(normalized)
        
        # Always include original if requested
        if include_original and normalized not in expanded_set:
            expanded_set.add(normalized)
    
    # Convert back to comma-separated, prioritizing original titles
    result = []
    for title in original_titles:
        normalized = _normalize(title)
        if normalized not in expanded_set:
            result.append(normalized)
    
    # Add expanded titles
    for variant in expanded_set:
        if variant not in [r for r in result]:
            result.append(variant)
    
    # Trim to max
    result = result[:max_expansions]
    
    return ", ".join(result)


def get_related_titles(title: str, max_results: int = 5) -> List[str]:
    """
    Get related titles for a single job title.
    
    Args:
        title: Job title to expand
        max_results: Maximum number of related titles to return
        
    Returns:
        List of related job titles (including original)
        
    Example:
        get_related_titles("Recruiter")
        → ["Recruiter", "Talent Acquisition Specialist", "HR Recruiter", ...]
    """
    normalized = _normalize(title)
    family_key = _get_family_key(normalized)
    
    if family_key:
        variants = TITLE_FAMILIES[family_key][:max_results]
        if normalized not in variants:
            variants = [normalized] + variants
        return variants[:max_results]
    
    # Try fuzzy match
    for key, variants in TITLE_FAMILIES.items():
        if _fuzzy_contains(normalized, key) or _fuzzy_contains(key, normalized):
            result = variants[:max_results]
            if normalized not in result:
                result = [normalized] + result
            return result[:max_results]
    
    # No match — return original only
    return [normalized]


def is_title_relevant(
    job_title: str,
    original_query: str,
    expanded_titles: List[str],
    threshold: float = 0.3,
) -> bool:
    """
    Check if a scraped job title is relevant to the original search.
    
    Uses token overlap scoring to filter out irrelevant results.
    
    Args:
        job_title: The job title from the scraper
        original_query: What the user originally searched for
        expanded_titles: The list of expanded titles we searched for
        threshold: Minimum relevance score (0.0 to 1.0)
        
    Returns:
        True if the job title is relevant
        
    Example:
        is_title_relevant("Senior Technical Recruiter", "Recruiter", [...]) → True
        is_title_relevant("Marketing Manager", "Recruiter", [...]) → False
    """
    job_tokens = set(_normalize(job_title).split())
    
    # Remove common stop words that don't carry meaning
    stop_words = {
        "senior", "junior", "lead", "head", "chief", "vice", "assistant",
        "associate", "executive", "officer", "director", "manager",
        "specialist", "coordinator", "analyst", "engineer", "developer",
        "the", "a", "an", "and", "or", "of", "for", "in", "at", "to",
        "with", "by", "from", "is", "are", "was", "were", "be", "been",
    }
    job_tokens -= stop_words
    
    if not job_tokens:
        return True  # Can't filter, allow it
    
    # Score against original query
    original_tokens = set(_normalize(original_query).split()) - stop_words
    
    # Score against all expanded titles
    all_expanded_tokens = set()
    for title in expanded_titles:
        all_expanded_tokens.update(set(_normalize(title).split()) - stop_words)
    
    # Calculate relevance score
    # Higher score = more relevant
    score = 0.0
    
    # Direct token match with expanded titles
    if job_tokens & all_expanded_tokens:
        score += 0.7
    
    # Partial token match (prefix matching)
    for jt in job_tokens:
        for et in all_expanded_tokens:
            if jt.startswith(et[:4]) or et.startswith(jt[:4]):
                score += 0.2
                break
    
    # Original query match bonus
    if job_tokens & original_tokens:
        score += 0.3
    
    return score >= threshold


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_all_family_keys() -> List[str]:
    """Get all available role family keys."""
    return sorted(TITLE_FAMILIES.keys())


def get_family_variants(key: str) -> List[str]:
    """Get all variants for a role family key."""
    return TITLE_FAMILIES.get(key, [])


def get_mapping_stats() -> Dict[str, int]:
    """Get statistics about the title mapping."""
    total_families = len(TITLE_FAMILIES)
    total_variants = sum(len(v) for v in TITLE_FAMILIES.values())
    return {
        "total_families": total_families,
        "total_variants": total_variants,
        "avg_variants_per_family": round(total_variants / total_families, 1) if total_families > 0 else 0,
    }
