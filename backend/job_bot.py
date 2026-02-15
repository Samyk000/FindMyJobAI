import json
import re
import time
import uuid
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple
import pandas as pd

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
    country: str = "india",  # <--- FIXED: Added country argument here
    include_keywords_csv: str,
    exclude_keywords_csv: str,
    results_per_site: int,
    hours_old: int,
    data_mode: str,  # "compact" | "full"
    log: LogFn,
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Scrapes jobs and returns normalized job dicts + stats.
    No AI calls here.
    """
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

    log(f"Scrape plan: titles={len(titles)}, locations={len(locations)}, sites={len(sites)}, country={country}")
    log("Scraping...")

    raw_total = 0
    kept_total = 0
    filtered_out = 0

    out: List[Dict[str, Any]] = []
    seen_ids: set[str] = set()

    # Normalize country for JobSpy
    c_code = country.lower().strip()
    if c_code in ["us", "united states"]: c_code = "usa"
    if c_code in ["united kingdom"]: c_code = "uk"
    # 'india' and others usually work as-is

    for t_i, title in enumerate(titles, start=1):
        for l_i, loc in enumerate(locations, start=1):
            log(f"Query {t_i}/{len(titles)} · {l_i}/{len(locations)} → '{title}' in '{loc}'")
            try:
                df = scrape_jobs(
                    site_name=sites,
                    search_term=title,
                    location=loc,
                    results_wanted=results_per_site,
                    hours_old=hours_old,
                    linkedin_fetch_description=True,
                    country_indeed=c_code, # <--- PASSING IT HERE
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

                if data_mode == "compact":
                    job["description"] = (job["description"] or "")[:1200]

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
) -> Dict[str, int]:
    """
    Scrapes jobs and calls on_job_found callback for each discovered job.
    Enables incremental saving for real-time UI updates.
    
    Args:
        on_job_found: Callback function that receives a job dict and returns True if new, False if duplicate
        on_progress: Optional callback for progress updates: (current_query, total_queries, current_site)
    
    Returns:
        Stats dict with raw_total, kept_total, filtered_out
    """
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

    total_queries = len(titles) * len(locations)
    current_query = 0

    log(f"Scrape plan: titles={len(titles)}, locations={len(locations)}, sites={len(sites)}, country={country}")
    log("Scraping with real-time updates...")

    raw_total = 0
    kept_total = 0
    filtered_out = 0
    seen_ids: set[str] = set()

    # Normalize country for JobSpy
    c_code = country.lower().strip()
    if c_code in ["us", "united states"]: c_code = "usa"
    if c_code in ["united kingdom"]: c_code = "uk"

    for t_i, title in enumerate(titles, start=1):
        for l_i, loc in enumerate(locations, start=1):
            current_query += 1
            # Show all sites being scraped (JobSpy scrapes all sites simultaneously)
            current_site = ", ".join(sites) if sites else ""
            
            # Report progress before scraping
            if on_progress:
                on_progress(current_query, total_queries, current_site)
            
            log(f"Query {t_i}/{len(titles)} · {l_i}/{len(locations)} → '{title}' in '{loc}' via {current_site}")
            try:
                df = scrape_jobs(
                    site_name=sites,
                    search_term=title,
                    location=loc,
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

                if data_mode == "compact":
                    job["description"] = (job["description"] or "")[:1200]

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

    stats = {
        "raw_total": raw_total,
        "kept_total": kept_total,
        "filtered_out": filtered_out,
    }
    log(f"Scrape done. Raw={raw_total}, Kept={kept_total}, FilteredOut={filtered_out}")
    return stats
