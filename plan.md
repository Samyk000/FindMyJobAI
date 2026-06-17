# KlodJobs — Product & Technical Plan

> **Date:** 2026-06-05
> **Version:** 2.0
> **Design System:** [designsystem.md](./designsystem.md)

---

## Table of Contents

1. [Product](#1-product)
2. [Technical Architecture](#2-technical-architecture)
3. [User Flows](#3-user-flows)
4. [API Design](#4-api-design)
5. [Database](#5-database)
6. [Backend](#6-backend)
7. [Frontend](#7-frontend)
8. [Features](#8-features)
9. [Codebase Rules](#9-codebase-rules)

---

## 1. Product

### 1.1 What It Is

KlodJobs is a **local job search aggregator** that scrapes LinkedIn, Indeed, and Glassdoor in one search, deduplicates results, and lets you triage (save/reject) jobs from a single interface. Runs as a desktop app (Tauri) or web app (browser).

### 1.2 Who It's For

- Job seekers who search multiple platforms daily
- People who want to avoid paying for LinkedIn Premium
- Users who want a clean, fast interface to triage job listings

### 1.3 What It Does (Core Loop)

```
1. Enter job title + location
2. KlodJobs scrapes LinkedIn, Indeed, Glassdoor simultaneously
3. Deduplicates by URL (same job posted on multiple sites = 1 result)
4. Shows results in real-time as they're found
5. You save what's interesting, reject what's not
6. Saved jobs are yours — export, compare, track
```

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Time to first result | < 10s |
| Duplicate rate | < 15% |
| Save rate | ≥ 20% of results |
| Scrape success rate | ≥ 95% |
| App startup | < 3s |
| Memory usage (idle) | < 150MB |

---

## 2. Technical Architecture

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    KlodJobs Desktop                       │
│                                                           │
│  ┌─────────────────┐         ┌──────────────────────┐    │
│  │  Rust Core       │◄──IPC──►│  WebView (SPA)       │    │
│  │  - Sidecar mgmt  │         │  - React 19          │    │
│  │  - Health polling │         │  - Tailwind CSS 4    │    │
│  │  - Process cleanup│         │  - Zustand           │    │
│  └────────┬─────────┘         └──────────┬───────────┘    │
│           │                               │                │
│           │ spawns                       │ HTTP            │
│           ▼                               ▼                │
│  ┌──────────────────────────────────────────────────┐     │
│  │              FastAPI Backend                       │     │
│  │                                                    │     │
│  │  Routes: /jobs, /scrape, /pipelines, /settings    │     │
│  │  Services: ScraperService, JobService              │     │
│  │  Scraper: python-jobspy → DataFrame → filter → DB  │     │
│  │  DB: SQLite (WAL mode)                             │     │
│  │  Real-time: SSE (Server-Sent Events)               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop | Tauri v2 | Native wrapper (Windows/Mac/Linux) |
| Frontend | React 19 + TypeScript 5 | SPA |
| Styling | Tailwind CSS 4 | Utility-first CSS (dark-only) |
| State | Zustand | Global state management |
| Icons | Lucide React | Icon set |
| Backend | FastAPI + Python 3.10+ | REST API |
| ORM | SQLAlchemy 2.0 | Database layer |
| DB | SQLite 3.x | Embedded database |
| Scraping | python-jobspy | Multi-platform job scraping |
| Data | Pandas | Required by jobspy |
| Bundler | PyInstaller | Python → executable |
| Real-time | SSE (EventSource) | Server push for live updates |

### 2.3 Deployment

- **Dev:** `npm run dev` (port 3000) + `uvicorn main:app --reload` (port 8000)
- **Prod:** Tauri bundles backend executable + static frontend into installers
- **Data:** `%LOCALAPPDATA%\KlodJobs\` (SQLite DB)
- **No cloud** — everything local

### 2.4 Performance Targets

| Metric | Target |
|--------|--------|
| App launch → UI ready | < 3s |
| Backend start | < 5s |
| First result | < 10s |
| Full scrape (60 jobs, 3 sites) | < 30s |
| Render 500 jobs | < 300ms (virtual scroll) |
| DB query (50 jobs) | < 50ms |
| Memory (idle) | < 150MB |
| Memory (scraping) | < 300MB |

---

## 3. User Flows

### 3.1 First Launch

```
App opens
  → Backend health check (polls /health every 500ms, max 45s)
  → Shows loading screen (dark canvas, green spinner, "Connecting to backend...")
  → Backend responds → renders main UI
  → Empty state: "Start your first search" with keyboard shortcut hint

  ERROR PATHS:
  → Port occupied → "Port 8000 in use. Close the other app or restart KlodJobs."
  → Backend failed → "Backend failed to start." + Retry button
  → 45s timeout → "Could not connect to backend." + Retry button
```

### 3.2 Job Search

```
1. Type job title (e.g., "Software Engineer")
2. Type location (e.g., "Bangalore")
3. Select country + platforms
4. Press Enter or click "Search"
   → Settings saved
   → POST /scrape → returns pipeline_id
   → SSE connection opens: GET /pipelines/{id}/stream

5. SSE pushes events:
   → job_found: { job data } → add to list in real-time
   → progress: { current_query, total_queries, site } → update progress bar
   → done: { stats } → final state
   → error: { message } → show error toast

6. Pipeline completes:
   → Tab created/updated with batch ID
   → Toast: "Found 47 new jobs"

  ERROR PATHS:
  → Pipeline already running → "Search in progress. Wait or cancel."
  → No results → "No jobs found. Try broader terms."
  → Jobspy failure → "Scraping failed for {site}. Retrying..." (auto-retry 2x)
```

### 3.3 Job Triage

```
New Jobs:
  → Click card → quick-view panel opens (side panel, not modal)
  → Read description (safe HTML rendering)
  → Actions: Save ✓ | Reject ✗ | Open Original ↗ | Delete 🗑

Saved:
  → Review saved jobs
  → Can reject, delete, or open original
  → Can export selection to CSV

Rejected:
  → Review rejected jobs
  → Can restore to "new" or delete permanently

KEYBOARD SHORTCUTS:
  → J/K: Navigate up/down
  → S: Save
  → R: Reject
  → D: Delete (with confirmation)
  → O: Open original
  → Esc: Close quick-view
  → Cmd+K: Command palette
```

### 3.4 Batch Operations

```
1. Click "Select" in toolbar (or press Shift+A)
2. Checkboxes appear on job cards
3. Click jobs to select (or Shift+click for range)
4. Toolbar shows: "X selected" + Save All | Reject All | Delete All | Export
5. Click action → confirmation → applied to all selected
6. Press Escape to exit selection mode
```

### 3.5 Command Palette (Cmd+K)

```
Press Cmd+K (or Ctrl+K)
  → Modal opens with search input
  → Type to filter commands:
     "search software engineer" → starts search
     "save all" → saves all new jobs
     "export" → exports saved jobs
     "clear search" → clears new jobs
     "dark mode" → already dark, no-op
     "settings" → opens settings
  → Arrow keys to navigate, Enter to execute
  → Escape to close
```

### 3.6 Quick-View Panel

```
Instead of a modal, use a slide-in panel from the right:
  → 40% width on desktop, full-width on mobile
  → Shows job title, company, location, source, date
  → Full description with safe HTML rendering
  → Action buttons at bottom (Save, Reject, Open Original)
  → Click outside or press Esc to close
  → Smooth slide-in/out animation (200ms)
```

---

## 4. API Design

### 4.1 Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| `GET` | `/health` | — | `{ status, database, version }` | Health check |
| `GET` | `/api/countries` | — | `{ countries[] }` | Static data |
| `GET` | `/api/sites` | — | `{ sites[] }` | Static data |
| `GET` | `/settings` | — | `SettingsOut` | Get settings |
| `PUT` | `/settings` | `SettingsIn` | `{ ok }` | Update settings |
| `GET` | `/jobs` | query: `status, limit, offset, batch_id, source, location, q` | `{ jobs[], total }` | **GET, not POST** |
| `GET` | `/jobs/:id` | — | `JobOut` | Get job detail |
| `PATCH` | `/jobs/:id` | `{ status }` | `{ ok }` | Update status |
| `DELETE` | `/jobs/:id` | — | `{ ok }` | Delete job |
| `DELETE` | `/jobs` | query: `status?` | `{ ok, count }` | Bulk delete (by status or all) |
| `POST` | `/scrape` | `ScrapeIn` | `{ pipeline_id }` | Start scrape |
| `GET` | `/pipelines/:id` | — | `PipelineOut` | Get pipeline state |
| `GET` | `/pipelines/:id/stream` | — | `text/event-stream` | **SSE** — live updates |
| `POST` | `/pipelines/:id/cancel` | — | `{ ok }` | Cancel pipeline |
| `GET` | `/stats` | — | `{ total, new, saved, rejected }` | Job counts |
| `POST` | `/export` | `{ format, job_ids? }` | File download | Export CSV/JSON |

### 4.2 SSE Event Format

```
event: job_found
data: {"id":"...","title":"Software Engineer","company":"Google",...}

event: progress
data: {"current_query":2,"total_queries":6,"site":"linkedin"}

event: done
data: {"new_jobs":47,"duplicates":3,"filtered":12}

event: error
data: {"message":"Scraping failed for glassdoor","recoverable":true}
```

### 4.3 Key Design Decisions

| Decision | Why |
|----------|-----|
| `GET /jobs` instead of `POST /jobs/search` | RESTful — search is a read operation, cacheable |
| `PUT /settings` instead of `POST` | Settings is a singleton resource — PUT replaces |
| `DELETE /jobs?status=new` instead of `/jobs/clear-search` | RESTful — filter by query param |
| SSE instead of polling | No wasted requests — server pushes when data changes |
| Quick-view panel instead of modal | Less disruption — user stays in context |
| `/scrape` instead of `/run/scrape` | Cleaner URL hierarchy |

### 4.4 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title"
  }
}
```

### 4.5 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /scrape` | 5 | 60s |
| `DELETE /jobs` | 5 | 60s |
| `POST /export` | 10 | 60s |

---

## 5. Database

### 5.1 Schema

```sql
CREATE TABLE jobs (
  id            TEXT PRIMARY KEY,          -- UUID4
  title         TEXT NOT NULL DEFAULT '',
  company       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  job_url       TEXT NOT NULL UNIQUE,      -- Dedup key
  description   TEXT NOT NULL DEFAULT '',
  is_remote     BOOLEAN NOT NULL DEFAULT FALSE,
  date_posted   TEXT NOT NULL DEFAULT '',
  source_site   TEXT NOT NULL DEFAULT '',  -- linkedin, indeed, glassdoor
  search_title  TEXT NOT NULL DEFAULT '',
  search_location TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'new',  -- new, saved, rejected
  batch_id      TEXT NOT NULL DEFAULT '',
  fetched_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_source ON jobs(source_site);
CREATE INDEX idx_jobs_batch ON jobs(batch_id);
CREATE INDEX idx_jobs_fetched ON jobs(fetched_at);
CREATE INDEX idx_jobs_status_fetched ON jobs(status, fetched_at);
CREATE INDEX idx_jobs_company ON jobs(company);

CREATE TABLE settings (
  key             TEXT PRIMARY KEY DEFAULT 'config',
  titles          TEXT NOT NULL DEFAULT '',
  locations       TEXT NOT NULL DEFAULT '',
  country         TEXT NOT NULL DEFAULT 'india',
  include_keywords TEXT NOT NULL DEFAULT '',
  exclude_keywords TEXT NOT NULL DEFAULT '',
  sites           TEXT NOT NULL DEFAULT 'linkedin,indeed,glassdoor',
  results_per_site INTEGER NOT NULL DEFAULT 20,
  hours_old       INTEGER NOT NULL DEFAULT 72,
  data_mode       TEXT NOT NULL DEFAULT 'compact',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `jobs` | `status` | Filter by new/saved/rejected |
| `jobs` | `source_site` | Filter by platform |
| `jobs` | `batch_id` | Filter by search session |
| `jobs` | `fetched_at` | Sort by date |
| `jobs` | `status, fetched_at` | Composite: "new jobs sorted by date" |
| `jobs` | `company` | Filter by company name |
| `jobs` | `job_url` (UNIQUE) | Dedup constraint |

### 5.3 Migrations

Use **Alembic** for schema versioning. Every schema change gets a migration file.

```
alembic/
  versions/
    001_initial_schema.py
    002_add_company_index.py
alembic.ini
```

### 5.4 SQLite Configuration

```python
# On every connection:
PRAGMA journal_mode = WAL;      # Concurrent reads during writes
PRAGMA busy_timeout = 5000;     # Wait 5s on lock before failing
PRAGMA synchronous = NORMAL;    # Balanced safety/performance
PRAGMA foreign_keys = ON;       # Enforce referential integrity
```

---

## 6. Backend

### 6.1 File Structure

```
backend/
  main.py                    # App factory, lifespan, middleware
  config.py                  # Settings, constants
  database.py                # Engine, sessions, migrations
  models.py                  # SQLAlchemy models
  schemas.py                 # Pydantic request/response
  routes/
    __init__.py
    jobs.py                  # /jobs CRUD
    scrape.py                # /scrape, /pipelines
    settings.py              # /settings, /health
    export.py                # /export (CSV/JSON)
  services/
    __init__.py
    job_service.py           # Job CRUD logic
    scraper.py               # Scraping worker
    pipeline.py              # Pipeline state management
    title_expander.py        # Title synonym expansion
  utils/
    __init__.py
    exceptions.py            # Custom exception hierarchy
    helpers.py               # URL normalization, location matching
    sse.py                   # SSE response helper
  middleware/
    __init__.py
    rate_limit.py            # SlowAPI limiter
  migrations/                # Alembic migrations
```

### 6.2 Scraping Pipeline

```python
class ScraperService:
    """Background worker that scrapes jobs and saves them incrementally."""
    
    def run(self, pipeline_id: str, config: dict):
        db = SessionLocal()
        pipeline = PipelineManager()
        
        try:
            titles = expand_titles(config["titles"])  # max 3 variants per title
            locations = parse_locations(config["locations"])
            
            total = len(titles) * len(locations)
            current = 0
            
            for title in titles:
                for location in locations:
                    if pipeline.is_cancelled(pipeline_id):
                        break
                    
                    current += 1
                    pipeline.update_progress(pipeline_id, current, total, site)
                    
                    try:
                        jobs = jobspy.scrape_jobs(
                            search_term=title,
                            location=format_location(location, config["country"]),
                            site_name=config["sites"],
                            results_wanted=config["results_per_site"],
                            hours_old=config["hours_old"],
                        )
                        
                        for _, row in jobs.iterrows():
                            if pipeline.is_cancelled(pipeline_id):
                                break
                            
                            job = filter_and_normalize(row, config)
                            if job:
                                result = save_job(db, job, config)
                                pipeline.emit_job(pipeline_id, job, result)
                    
                    except ScrapingError as e:
                        pipeline.log(pipeline_id, f"Failed: {e}")
                        # Continue to next query — don't abort entire scrape
            
            pipeline.complete(pipeline_id, stats)
        
        except Exception as e:
            pipeline.fail(pipeline_id, str(e))
        
        finally:
            db.close()
```

### 6.3 Title Expansion

- 74 title families with up to 3 variants each
- Expansion is optional — can be disabled in settings
- Relevance scoring threshold: 0.25 (configurable)

### 6.4 SSE Implementation

```python
from fastapi.responses import StreamingResponse

@app.get("/pipelines/{pipeline_id}/stream")
async def stream_pipeline(pipeline_id: str):
    async def event_generator():
        while True:
            state = pipeline_manager.get(pipeline_id)
            
            if state["state"] == "done":
                yield f"event: done\ndata: {json.dumps(state['stats'])}\n\n"
                break
            
            if state["state"] == "failed":
                yield f"event: error\ndata: {json.dumps({'message': state['error']})}\n\n"
                break
            
            if state["state"] == "cancelled":
                yield f"event: cancelled\ndata: {{}}\n\n"
                break
            
            # Emit new jobs since last check
            new_jobs = get_new_jobs_since(pipeline_id, last_check)
            for job in new_jobs:
                yield f"event: job_found\ndata: {json.dumps(job)}\n\n"
            
            # Emit progress
            yield f"event: progress\ndata: {json.dumps(state['stats'])}\n\n"
            
            await asyncio.sleep(0.5)  # Check every 500ms
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### 6.5 Exception Hierarchy

```python
class KlodJobsError(Exception):
    """Base exception with to_dict() for JSON serialization."""
    code: str = "UNKNOWN_ERROR"
    status: int = 500

class ValidationError(KlodJobsError):    # 400
class NotFoundError(KlodJobsError):      # 404
class DatabaseError(KlodJobsError):      # 500
class ScrapingError(KlodJobsError):      # 400 (with retry flag)
class PipelineError(KlodJobsError):      # 400
class RateLimitError(KlodJobsError):     # 429
```

### 6.6 Worker Pattern (Class-Based)

```python
class ScrapeWorker:
    def __init__(self, pipeline_id: str):
        self.db = SessionLocal()
        self.pipeline_id = pipeline_id
        self.count = 0
        self.duplicates = 0
    
    def save_job(self, job_data: dict) -> bool:
        """Returns True if new, False if duplicate."""
        # Uses self.db, self.count — no nonlocal needed
        ...
    
    def close(self):
        self.db.close()
```

---

## 7. Frontend

### 7.1 File Structure

```
frontend/
  app/
    page.tsx                 # Main page (thin — orchestrates stores)
    layout.tsx               # Root layout, fonts
    globals.css              # Design system tokens (from designsystem.md)
  components/
    layout/
      AppShell.tsx           # Main layout wrapper
      Sidebar.tsx            # Desktop search sidebar
      MobileDrawer.tsx       # Mobile slide-out drawer
      TabsBar.tsx            # Tab bar
    search/
      SearchForm.tsx         # Shared search form (used by Sidebar + MobileDrawer)
      FilterBar.tsx          # Status tabs + filters
      StatusTabs.tsx         # New | Saved | Rejected
      PlatformFilter.tsx     # Platform multi-select
      LocationFilter.tsx     # Location multi-select
    jobs/
      JobList.tsx            # Virtual-scrolling job list
      JobCard.tsx            # Individual job row
      JobQuickView.tsx       # Slide-in detail panel (replaces modal)
      JobSelectCheckbox.tsx  # Multi-select checkbox
      SkeletonRow.tsx        # Loading skeleton
      EmptyState.tsx         # Contextual empty states
    pipeline/
      ProgressBar.tsx        # Scrape progress
      PipelineToast.tsx      # Completion notification
    shared/
      CommandPalette.tsx     # Cmd+K command palette
      ConfirmDialog.tsx      # Reusable confirmation dialog
      ErrorToast.tsx         # Error notification
      LoadingScreen.tsx      # Initial loading
      ExportButton.tsx       # CSV/JSON export
    settings/
      SettingsPanel.tsx      # Settings (theme, data, about)
  hooks/
    useFocusTrap.ts          # Modal focus management
    useKeyboardShortcuts.ts  # Global keyboard handler
    useSSE.ts                # Server-Sent Events hook
  stores/
    useJobStore.ts           # Job list, selection, filters
    usePipelineStore.ts      # Pipeline state, progress
    useSettingsStore.ts      # App settings
    useTabStore.ts           # Tabs, active tab
    useUIStore.ts            # Modals, panels, theme
  lib/
    api.ts                   # HTTP + SSE client
    constants.ts             # Config, storage keys
    tauri.ts                 # Tauri detection
    validation.ts            # Runtime type guards (USED this time)
  types/
    index.ts                 # TypeScript interfaces
  src-tauri/
    lib.rs                   # Sidecar management
    tauri.conf.json          # Tauri config
```

### 7.2 State Management (Zustand)

```typescript
// stores/useJobStore.ts
interface JobStore {
  jobs: Job[]
  selectedIds: Set<string>
  viewStatus: 'new' | 'saved' | 'rejected'
  isLoading: boolean
  
  // Actions
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  mergeJobs: (jobs: Job[]) => { added: number; duplicates: number }
  updateJobStatus: (id: string, status: string) => void
  removeJob: (id: string) => void
  removeJobs: (ids: string[]) => void
  setSelected: (ids: Set<string>) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setViewStatus: (status: string) => void
  
  // Computed (via selectors)
  filteredJobs: () => Job[]
  jobCount: () => { total: number; new: number; saved: number; rejected: number }
}
```

### 7.3 SSE Hook

```typescript
// hooks/useSSE.ts
export function useSSE(pipelineId: string | null) {
  const { addJob, setProgress, setComplete, setError } = usePipelineStore()
  
  useEffect(() => {
    if (!pipelineId) return
    
    const es = new EventSource(`${API_BASE}/pipelines/${pipelineId}/stream`)
    
    es.addEventListener('job_found', (e) => {
      addJob(JSON.parse(e.data))
    })
    
    es.addEventListener('progress', (e) => {
      setProgress(JSON.parse(e.data))
    })
    
    es.addEventListener('done', (e) => {
      setComplete(JSON.parse(e.data))
      es.close()
    })
    
    es.addEventListener('error', (e) => {
      setError(JSON.parse(e.data))
      es.close()
    })
    
    return () => es.close()
  }, [pipelineId])
}
```

### 7.4 Virtual Scrolling

Use `react-window` for lists with 100+ items:

```typescript
import { FixedSizeList } from 'react-window'

// Only activates when jobs.length > 100
// Below 100, renders normally (no virtualization overhead)
```

### 7.5 Keyboard Shortcuts

```typescript
// hooks/useKeyboardShortcuts.ts
const SHORTCUTS = {
  'cmd+k': () => toggleCommandPalette(),
  'j': () => selectNextJob(),        // Navigate down
  'k': () => selectPrevJob(),        // Navigate up
  's': () => saveSelectedJob(),      // Save
  'r': () => rejectSelectedJob(),    // Reject
  'd': () => deleteSelectedJob(),    // Delete (with confirm)
  'o': () => openOriginal(),         // Open in browser
  'escape': () => closePanel(),      // Close quick-view
  'shift+a': () => toggleSelectMode(), // Enter selection mode
  'a': () => selectAll(),            // Select all (in select mode)
}
```

### 7.6 Component Size Limits

| Type | Max LOC |
|------|---------|
| Component | 200 |
| Hook | 100 |
| Store | 150 |
| Utility | 100 |

---

## 8. Features

### 8.1 Core Features (P0)

| Feature | Description |
|---------|-------------|
| Multi-platform scraping | LinkedIn, Indeed, Glassdoor in one search |
| Real-time results | Jobs appear as found via SSE |
| Save/Reject triage | One-click status change |
| URL deduplication | Same job across sites = 1 result |
| Job detail view | Slide-in panel with full description |
| Cancel scrape | Stop running pipeline |
| Multi-select batch actions | Select multiple → save/reject/delete/export |
| Command palette | Cmd+K for power users |
| Keyboard navigation | J/K/S/R/D/O keys |
| Undo | 5-second undo window for destructive actions |
| Dark-only theme | Voltagent design system |

### 8.2 Important Features (P1)

| Feature | Description |
|---------|-------------|
| Export CSV/JSON | Export saved jobs |
| Search within results | Filter by keyword in loaded jobs |
| Company filter | Filter by company name |
| Saved searches | Save search params as templates |
| Search history | View past searches |
| Smart title expansion | 74 families, 3 variants each |
| OS notifications | Notify on scrape complete |

### 8.3 Nice-to-Have (P2)

| Feature | Description |
|---------|-------------|
| Job comparison | Side-by-side view of 2-3 jobs |
| Keyboard shortcuts overlay | Help modal showing all shortcuts |
| Custom title expansion | User-defined synonym families |
| Tags | Custom labels on saved jobs (e.g., "urgent", "remote") |
| Job notes | Attach notes to saved jobs |
| Bulk import | Import jobs from CSV |

### 8.4 Explicitly Excluded

- User authentication / accounts
- Cloud sync / multi-device
- Auto-apply / resume tailoring
- Email notifications
- Browser extension
- Mobile native apps (iOS/Android)
- LinkedIn automation (ToS risk)
- Salary comparison
- Cover letter generation
- Application tracking (interview stages)
- Light mode

---

## 9. Codebase Rules

### 9.1 File Size Limits

| Type | Max LOC | Action |
|------|---------|--------|
| Component | 200 | Extract to hooks, split sub-components |
| Hook | 100 | Split into smaller hooks |
| Store | 150 | Split by domain |
| Service | 150 | Split by responsibility |
| Route handler | 80 | Extract to services |
| Utility | 100 | Split by domain |

### 9.2 Naming

```
Components:    PascalCase (JobCard.tsx)
Hooks:         camelCase + "use" (useKeyboardShortcuts.ts)
Stores:        camelCase + "use" + "Store" (useJobStore.ts)
Services:      PascalCase class (JobService, ScraperService)
Routes:        kebab-case (/jobs/search, /scrape)
DB tables:     snake_case (jobs, settings)
DB columns:    snake_case (job_url, source_site)
API response:  snake_case (matches DB — no transformation)
```

### 9.3 Imports

```
1. No relative imports (../../) — use path aliases
2. No imports from components/ inside lib/
3. Named exports only (no default exports)
4. Import order: React → third-party → local → types
5. No barrel files (index.ts re-exports)
```

### 9.4 State Rules

```
1. Global (Zustand): jobs, settings, tabs, UI state
2. Local (useState): component-specific (dropdown open, hover)
3. Derived (useMemo): filtered jobs, computed stats
4. Side effects (useEffect): API calls, subscriptions
5. Never store derived data in state
```

### 9.5 Error Rules

```
1. Every API call has error handling
2. Errors shown to user (not silently swallowed)
3. Destructive actions have confirmation
4. Network errors show retry button
5. 5-second undo window for delete/reject
```

### 9.6 Testing Rules

```
1. Every utility function: unit test
2. Every custom hook: renderHook test
3. Every API method: mock test
4. Critical flows: E2E test (Playwright)
5. Test files next to source (JobCard.test.tsx)
6. Coverage target: 80% lib/, 60% components/
```

### 9.7 Design System Rules

```
1. Dark canvas only — no light mode
2. Primary green (#00d992) for CTAs only — not body text
3. Hairline borders on cards — no shadows
4. Inter weight 400 for headlines — calm, not loud
5. SF Mono for data/code only
6. sm (6px) radius for buttons, md (8px) for cards
7. No decorative animations
8. All animations: 150-200ms ease-out
9. Respect prefers-reduced-motion
```

---

## Appendix A: Environment Variables

```env
# Backend
DB_URL=sqlite:///jobs.db
CORS_ORIGINS=http://localhost:3000
PIPELINE_EXPIRY_SECONDS=3600
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=60
LOG_LEVEL=INFO

# Frontend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Appendix B: Dependencies

### Backend
```
fastapi>=0.100.0
uvicorn>=0.22.0
python-dotenv>=1.0.0
pandas>=2.0.0
python-jobspy>=1.1.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
slowapi>=0.1.9
alembic>=1.13.0
pyinstaller>=6.0.0
```

### Frontend
```
next: 16.x
react: 19.x
zustand: 5.x
react-window: 1.8.x
@tauri-apps/cli: 2.10.0
@tauri-apps/api: 2.10.0
lucide-react: latest
tailwindcss: 4.x
```

## Appendix C: API Client

```typescript
// lib/api.ts
api.health()                    // GET /health
api.getCountries()              // GET /api/countries
api.getSites()                  // GET /api/sites
api.getSettings()               // GET /settings
api.updateSettings(settings)    // PUT /settings
api.getJobs(params)             // GET /jobs
api.getJob(id)                  // GET /jobs/:id
api.updateJobStatus(id, status) // PATCH /jobs/:id
api.deleteJob(id)               // DELETE /jobs/:id
api.deleteJobs(status?)         // DELETE /jobs
api.startScrape(params)         // POST /scrape
api.getPipeline(id)             // GET /pipelines/:id
api.cancelPipeline(id)          // POST /pipelines/:id/cancel
api.getStats()                  // GET /stats
api.exportJobs(format, ids?)    // POST /export
```
