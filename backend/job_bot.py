import json
import re
import time
import uuid
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple
import pandas as pd
from openai import OpenAI

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
) -> Dict[str, int]:
    """
    Scrapes jobs and calls on_job_found callback for each discovered job.
    Enables incremental saving for real-time UI updates.
    
    Args:
        on_job_found: Callback function that receives a job dict and returns True if new, False if duplicate
    
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
            log(f"Query {t_i}/{len(titles)} · {l_i}/{len(locations)} → '{title}' in '{loc}'")
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


def score_jobs(
    *,
    api_key: str,
    model: str,
    candidate_profile: str,
    jobs: List[Dict[str, Any]],
    batch_size: int,
    log: LogFn,
) -> Tuple[List[Tuple[str, int]], int]:
    """
    Scores jobs with AI. Returns list of (job_id, score) and number of API requests used.
    """
    if not api_key:
        raise ValueError("API key missing.")
    if not model:
        raise ValueError("Model missing.")
    if not candidate_profile.strip():
        raise ValueError("Candidate profile is empty. Add profile before AI Match.")
    if not jobs:
        return [], 0

    batch_size = max(3, min(int(batch_size or 8), 12))

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)

    scored: List[Tuple[str, int]] = []
    requests_used = 0

    log(f"AI Match starting... jobs={len(jobs)}, batch_size={batch_size}, model={model}")

    for start in range(0, len(jobs), batch_size):
        batch = jobs[start:start + batch_size]
        log(f"Scoring {start + 1}-{min(start + batch_size, len(jobs))}...")

        items = []
        id_map: List[str] = []
        for idx, j in enumerate(batch):
            id_map.append(j["id"])
            items.append({
                "idx": idx,
                "title": j.get("title", ""),
                "company": j.get("company", ""),
                "location": j.get("location", ""),
                "remote": bool(j.get("is_remote", False)),
                "snippet": (j.get("description", "") or "")[:600],
            })

        prompt = (
            "You are a strict job-matching engine.\n"
            "Score each job from 0 to 100 for this candidate profile.\n"
            "Return only JSON array of objects: [{\"idx\":0,\"score\":85}, ...].\n"
            "No markdown, no extra keys.\n\n"
            f"Candidate profile:\n{candidate_profile}\n\n"
            f"Jobs:\n{json.dumps(items)}\n"
        )

        resp_text = None
        try:
            requests_used += 1
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=600,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "JobScores",
                        "strict": True,
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "idx": {"type": "integer"},
                                    "score": {"type": "integer"},
                                },
                                "required": ["idx", "score"],
                                "additionalProperties": False,
                            },
                        },
                    },
                },
            )
            resp_text = (resp.choices[0].message.content or "").strip()
        except TypeError:
            pass
        except Exception as e:
            log(f"Warning: structured output failed, fallback mode: {e}")

        if not resp_text:
            try:
                requests_used += 1
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0,
                    max_tokens=600,
                )
                resp_text = (resp.choices[0].message.content or "").strip()
            except Exception as e:
                log(f"AI request failed: {e}")
                for jid in id_map:
                    scored.append((jid, 0))
                time.sleep(1)
                continue

        text = re.sub(r"```json\s*", "", resp_text)
        text = re.sub(r"```\s*$", "", text)
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if not m:
            log("Warning: AI did not return JSON. Scores=0 for this batch.")
            for jid in id_map:
                scored.append((jid, 0))
            time.sleep(1)
            continue

        try:
            arr = json.loads(m.group(0))
            scores_map = {}
            for row in arr:
                idx = int(row.get("idx"))
                score = int(row.get("score"))
                score = max(0, min(score, 100))
                scores_map[idx] = score
            for idx, jid in enumerate(id_map):
                scored.append((jid, scores_map.get(idx, 0)))
        except Exception:
            log("Warning: JSON parse failed. Scores=0 for this batch.")
            for jid in id_map:
                scored.append((jid, 0))

        time.sleep(1)

    log(f"AI Match done. requests_used={requests_used}")
    return scored, requests_used
