import json
import re
import time
import uuid
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple
import pandas as pd

from utils.helpers import format_search_location, matches_target_country, matches_query_location
from services.title_expander import expand_titles, is_title_relevant

# JobSpy import compatibility
try:
    from jobspy import scrape_jobs
except Exception:
    from python_jobspy import scrape_jobs

LogFn = Callable[[str], None]

def _clean_csv_like_list(s: str) -> List[str]:
    if not s:
        return []
    parts = [p.strip() for p in s.split(",")]
    return [p for p in parts if p]

def _blob(job: Dict[str, Any]) -> str:
    return (
        f"{job.get('title','')} {job.get('company','')} {job.get('location','')} {job.get('description','')}"
    ).lower()

def _job_id_from_url(job_url: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, job_url))

def scrape_only(
    *,
    sites: List[str],
    titles_csv: str,
    locations_csv: str,
    country: str = "india",
    include_keywords_csv: str,
    exclude_keywords_csv: str,
    results_per_site: int,
    hours_old: int,
    data_mode: str,  # "compact" | "full"
    log: LogFn,
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Scrapes jobs and returns normalized job dicts + stats.
    Expands titles to cover related role variants.
    """
    original_titles_csv = titles_csv
    titles = _clean_csv_like_list(titles_csv)
    locations = _clean_csv_like_list(locations_csv)
    include_kw = [k.lower() for k in _clean_csv_like_list(include_keywords_csv)]
    exclude_kw = [k.lower() for k in _clean_csv_like_list(exclude_keywords_csv)]

    # Hard guardrails
    results_per_site = max(5, min(int(results_per_site or 20), 100))
    hours_old = max(1, min(int(hours_old or 72), 24 * 30))  # up to 30 days
    data_mode = "full" if data_mode == "full" else "compact"

    if not titles:
        raise ValueError("Titles are empty. Provide at least one title.")
    if not locations:
        raise ValueError("Locations are empty. Provide at least one location.")
    if not sites:
        sites = ["linkedin"]

    # --- TITLE EXPANSION ---
    expanded_titles_csv = expand_titles(original_titles_csv, max_expansions=8, include_original=True)
    expanded_titles = _clean_csv_like_list(expanded_titles_csv)
    log(f"Title expansion: '{original_titles_csv}' → {expanded_titles}")

    raw_total = 0
    kept_total = 0
    filtered_out = 0

    out: List[Dict[str, Any]] = []
    seen_ids: set[str] = set()

    # Normalize country for JobSpy
    c_code = country.lower().strip()
    if c_code in ["us", "united states"]: c_code = "usa"
    if c_code in ["united kingdom"]: c_code = "uk"

    for t_i, title in enumerate(expanded_titles, start=1):
        for l_i, loc in enumerate(locations, start=1):
            search_loc = format_search_location(loc, country)
            log(f"Query {t_i}/{len(expanded_titles)} · {l_i}/{len(locations)} → '{title}' in '{search_loc}' (original: '{loc}')")
            try:
                df = scrape_jobs(
                    site_name=sites,
                    search_term=title,
                    location=search_loc,
                    results_wanted=results_per_site,
                    hours_old=hours_old,
                    linkedin_fetch_description=True,
                    country_indeed=c_code,
                    verbose=0,
                )
            except Exception as e:
                log(f"Warning: scrape failed for '{title}' in '{loc}': {e}")
                continue

            if not isinstance(df, pd.DataFrame) or df.empty:
                continue

            raw_total += len(df)
            rows = df.to_dict(orient="records")

            for r in rows:
                job_url = str(r.get("job_url") or "").strip()
                title_r = str(r.get("title") or "").strip()
                if not job_url or not title_r:
                    filtered_out += 1
                    continue

                # --- RELEVANCE FILTERING ---
                if not is_title_relevant(title_r, original_titles_csv, expanded_titles, threshold=0.25):
                    filtered_out += 1
                    continue

                # Country validation
                if not matches_target_country(str(r.get("location") or ""), country):
                    filtered_out += 1
                    continue

                # Location validation
                if not matches_query_location(
                    str(r.get("location") or ""),
                    bool(r.get("is_remote") or False),
                    loc
                ):
                    filtered_out += 1
                    continue

                jid = _job_id_from_url(job_url)
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)

                # Normalize
                job = {
                    "id": jid,
                    "title": title_r,
                    "company": str(r.get("company") or "").strip(),
                    "location": str(r.get("location") or "").strip(),
                    "job_url": job_url,
                    "description": str(r.get("description") or ""),
                    "is_remote": bool(r.get("is_remote") or False),
                    "date_posted": str(r.get("date_posted") or "").strip(),
                    "source_site": str(r.get("site") or r.get("source") or "").strip() or "",
                    "search_title": title,
                    "search_location": loc,
                }

                blob = _blob(job)

                # Exclude keywords
                if exclude_kw and any(k in blob for k in exclude_kw):
                    filtered_out += 1
                    continue

                # Include keywords
                if include_kw and not any(k in blob for k in include_kw):
                    filtered_out += 1
                    continue

                kept_total += 1
                out.append(job)

    stats = {
        "raw_total": raw_total,
        "kept_total": kept_total,
        "filtered_out": filtered_out,
    }
    log(f"Scrape done. Raw={raw_total}, Kept={kept_total}, FilteredOut={filtered_out}")
    return out, stats

def scrape_jobs_incremental(
    *,
    sites: List[str],
    titles_csv: str,
    locations_csv: str,
    country: str = "india",
    include_keywords_csv: str,
    exclude_keywords_csv: str,
    results_per_site: int,
    hours_old: int,
    data_mode: str,
    log: LogFn,
    on_job_found: Callable[[Dict[str, Any]], bool],
    on_progress: Optional[Callable[[int, int, str], None]] = None,
    is_cancelled: Optional[Callable[[], bool]] = None,
) -> Dict[str, int]:
    """
    Scrapes jobs and calls on_job_found callback for each discovered job.
    Enables incremental saving for real-time UI updates.
    Expands titles to cover related role variants.
    
    Args:
        on_job_found: Callback function that receives a job dict and returns True if new, False if duplicate
        on_progress: Optional callback for progress updates: (current_query, total_queries, current_site)
    
    Returns:
        Stats dict with raw_total, kept_total, filtered_out
    """
    original_titles_csv = titles_csv
    titles = _clean_csv_like_list(titles_csv)
    locations = _clean_csv_like_list(locations_csv)
    include_kw = [k.lower() for k in _clean_csv_like_list(include_keywords_csv)]
    exclude_kw = [k.lower() for k in _clean_csv_like_list(exclude_keywords_csv)]

    # Hard guardrails
    results_per_site = max(5, min(int(results_per_site or 20), 100))
    hours_old = max(1, min(int(hours_old or 72), 24 * 30))
    data_mode = "full" if data_mode == "full" else "compact"

    if not titles:
        raise ValueError("Titles are empty. Provide at least one title.")
    if not locations:
        raise ValueError("Locations are empty. Provide at least one location.")
    if not sites:
        sites = ["linkedin"]

    # --- TITLE EXPANSION ---
    expanded_titles_csv = expand_titles(original_titles_csv, max_expansions=8, include_original=True)
    expanded_titles = _clean_csv_like_list(expanded_titles_csv)
    log(f"Title expansion: '{original_titles_csv}' → {expanded_titles}")

    total_queries = len(expanded_titles) * len(locations)
    current_query = 0

    log(f"Scrape plan: titles={len(expanded_titles)}, locations={len(locations)}, sites={len(sites)}, country={country}")
    log("Scraping with real-time updates...")

    raw_total = 0
    kept_total = 0
    filtered_out = 0
    seen_ids: set[str] = set()

    # Normalize country for JobSpy
    c_code = country.lower().strip()
    if c_code in ["us", "united states"]: c_code = "usa"
    if c_code in ["united kingdom"]: c_code = "uk"

    cancelled = False
    for t_i, title in enumerate(expanded_titles, start=1):
        if is_cancelled and is_cancelled():
            cancelled = True
            break
        for l_i, loc in enumerate(locations, start=1):
            if is_cancelled and is_cancelled():
                cancelled = True
                break
            current_query += 1
            current_site = ", ".join(sites) if sites else ""
            
            if on_progress:
                on_progress(current_query, total_queries, current_site)
            
            search_loc = format_search_location(loc, country)
            log(f"Query {t_i}/{len(expanded_titles)} · {l_i}/{len(locations)} → '{title}' in '{search_loc}' (original: '{loc}') via {current_site}")
            try:
                df = scrape_jobs(
                    site_name=sites,
                    search_term=title,
                    location=search_loc,
                    results_wanted=results_per_site,
                    hours_old=hours_old,
                    linkedin_fetch_description=True,
                    country_indeed=c_code,
                    verbose=0,
                )
            except Exception as e:
                log(f"Warning: scrape failed for '{title}' in '{loc}': {e}")
                continue

            # Stop immediately if cancellation was requested during the (potentially
            # long) network call above — don't process or save this query's results.
            if is_cancelled and is_cancelled():
                cancelled = True
                break

            if not isinstance(df, pd.DataFrame) or df.empty:
                continue

            raw_total += len(df)
            rows = df.to_dict(orient="records")

            for r in rows:
                # Check cancellation on every row so saving halts the moment the
                # user clicks cancel, even mid-result-set.
                if is_cancelled and is_cancelled():
                    cancelled = True
                    break

                job_url = str(r.get("job_url") or "").strip()
                title_r = str(r.get("title") or "").strip()
                if not job_url or not title_r:
                    filtered_out += 1
                    continue

                # --- RELEVANCE FILTERING ---
                if not is_title_relevant(title_r, original_titles_csv, expanded_titles, threshold=0.25):
                    filtered_out += 1
                    continue

                # Country validation
                if not matches_target_country(str(r.get("location") or ""), country):
                    filtered_out += 1
                    continue

                # Location validation
                if not matches_query_location(
                    str(r.get("location") or ""),
                    bool(r.get("is_remote") or False),
                    loc
                ):
                    filtered_out += 1
                    continue

                jid = _job_id_from_url(job_url)
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)

                # Normalize job data
                job = {
                    "id": jid,
                    "title": title_r,
                    "company": str(r.get("company") or "").strip(),
                    "location": str(r.get("location") or "").strip(),
                    "job_url": job_url,
                    "description": str(r.get("description") or ""),
                    "is_remote": bool(r.get("is_remote") or False),
                    "date_posted": str(r.get("date_posted") or "").strip(),
                    "source_site": str(r.get("site") or r.get("source") or "").strip() or "",
                    "search_title": title,
                    "search_location": loc,
                }

                blob = _blob(job)

                # Exclude keywords
                if exclude_kw and any(k in blob for k in exclude_kw):
                    filtered_out += 1
                    continue

                # Include keywords
                if include_kw and not any(k in blob for k in include_kw):
                    filtered_out += 1
                    continue

                # Call the callback to save immediately
                is_new = on_job_found(job)
                if is_new:
                    kept_total += 1

            # Break out of the location loop too if cancelled mid-result-set.
            if cancelled:
                break
        if cancelled:
            break

    stats = {
        "raw_total": raw_total,
        "kept_total": kept_total,
        "filtered_out": filtered_out,
    }
    log(f"Scrape done. Raw={raw_total}, Kept={kept_total}, FilteredOut={filtered_out}")
    return stats
