## Who You Are
You are an expert developer working on the FindMyJobAI codebase. You have full access to all files and full context of the project.

It's installed in the system: stable-x86_64-pc-windows-msvc updated - rustc 1.93.1 (01f6ddf75 2026-02-11) (from rustc 1.93.0 (254b59607 2026-01-19))

## What This Project Is
FindMyJobAI is a job search aggregation app.

**Current Stack:**
- Backend: FastAPI + SQLite + python-jobspy library (`backend/` directory)
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS (`frontend/` directory)
- Communication: Frontend makes fetch() calls to backend API on localhost
- Real-time updates: Polling-based (1s interval via setInterval)
- State: Local useState hooks + localStorage for persistence
- Scraping: python-jobspy library (NOT Selenium)

**Current State:**
- The app works correctly as a web app (run backend + frontend separately)
- All features functional: search, save, reject, filter, settings, theme toggle
- Running on Windows

## What You Must Do
Convert this into a **distributable Windows desktop application** using Tauri v2 where:
- Anyone can download an `.msi` installer and use the app on Windows
- Users do NOT need Python, Node.js, or any dev tools installed
- The Python backend is bundled into a standalone `.exe` using PyInstaller
- The Next.js frontend is pre-built as static HTML/CSS/JS served in a Tauri webview (WebView2)
- The backend `.exe` is launched automatically as a Tauri "sidecar" when the app opens
- The backend is killed automatically when the app closes
- SQLite database is stored in `%LOCALAPPDATA%\FindMyJobAI\`

**Target Architecture:**
User downloads FindMyJobAI_1.0.0_x64-setup.msi
→ Installs to Program Files
→ Creates Start Menu shortcut

When user launches FindMyJobAI:
┌─────────────────────────────────────────┐
│ FindMyJobAI Window │
│ (WebView2 - built into Win10+) │
│ │
│ ┌───────────────────────────────────┐ │
│ │ Your Next.js frontend │ │
│ │ (pre-built static HTML/CSS/JS) │ │
│ └──────────────┬────────────────────┘ │
│ │ fetch("127.0.0.1:8000")│
│ ┌──────────────▼────────────────────┐ │
│ │ backend.exe (PyInstaller) │ │
│ │ FastAPI + python-jobspy + deps │ │
│ │ Runs as hidden background proc │ │
│ └───────────────────────────────────┘ │
│ │
│ Database: %LOCALAPPDATA%\FindMyJobAI\ │
└─────────────────────────────────────────┘

text


---

## ⛔ ABSOLUTE RULES — VIOLATING ANY OF THESE IS UNACCEPTABLE

### Rule 1: NO GITHUB PUSH
DO NOT run `git push`, `git commit`, or any git operation at ANY point during ANY phase or sub-phase. Not after any phase. Not after any sub-phase. Not at the end. NEVER. I will explicitly tell you when and what to push. Do not ask to push. Do not suggest pushing. Just don't.

### Rule 2: STOP AFTER EVERY SUB-PHASE
After completing each sub-phase (0.1, 0.2, 1.1, 1.2, etc.), you MUST:
1. Tell me exactly what you did
2. Show me the verification results
3. Say: "Sub-phase X.Y complete. May I proceed to sub-phase X.Z?"
4. WAIT for my explicit "yes" before continuing

DO NOT batch multiple sub-phases. DO NOT skip ahead. DO NOT proceed without my explicit permission. Even if everything looks perfect, STOP and ASK.

### Rule 3: DO NOT IMPROVE EXISTING CODE
- DO NOT refactor existing code
- DO NOT fix existing bugs (unless they directly block Tauri conversion)
- DO NOT improve code quality, patterns, or architecture
- DO NOT add error handling to existing code
- DO NOT rename existing files or functions
- DO NOT change existing UI/UX design or styling
- ONLY make changes strictly necessary for the Tauri conversion

### Rule 4: DO NOT BREAK WEB MODE
After ALL changes, the app MUST still work as a regular web app:
- `cd backend && python -m uvicorn main:app --reload` must still work
- `cd frontend && npm run dev` must still work
- Both running together in a regular browser must work exactly as before

### Rule 5: DO NOT ADD EXTRAS
- No tests
- No CI/CD
- No Docker
- No linting configurations
- No dependency upgrades (unless strictly required for Tauri)
- No new features
- No code formatting changes to existing files

---

## PHASE 0: AUDIT & PLAN

### Sub-phase 0.1: Frontend Audit

Scan EVERY file in `frontend/` and document in `plans/plan3.md`:

**Table 1: Static Export Compatibility**
| # | Check | Files Affected | Status | Fix Needed? |
|---|-------|---------------|--------|-------------|
| 1 | Server Components that fetch data at request time | | ✅/❌ | |
| 2 | `next/image` with optimization (no `unoptimized` prop) | | ✅/❌ | |
| 3 | API routes in `frontend/app/api/` directory | | ✅/❌ | |
| 4 | Middleware file (`frontend/middleware.ts`) | | ✅/❌ | |
| 5 | Usage of `next/headers` or `next/cookies` | | ✅/❌ | |
| 6 | Dynamic routes needing `generateStaticParams` | | ✅/❌ | |
| 7 | `useSearchParams` without Suspense boundary | | ✅/❌ | |
| 8 | External font/CDN/image URLs loaded in JSX | | ✅/❌ | List them |
| 9 | `rewrites` or `redirects` in next.config | | ✅/❌ | |

**Table 2: Backend URL References (EVERY occurrence)**
| # | File | Line # | Current Code Snippet | 
|---|------|--------|---------------------|
| 1 | | | |
| 2 | | | |
| ... | | | |

Search for ALL of these patterns across ALL `.ts`, `.tsx`, `.js`, `.jsx` files:
- `localhost:8000`
- `localhost:8080`  
- `127.0.0.1:8000`
- `127.0.0.1:8080`
- `fetch(` (check what URL it uses)
- `axios` (if used)
- Any URL string construction pointing to backend

Be EXHAUSTIVE. Missing even ONE will break the Tauri app silently.

**⏸️ STOP. Show me both tables. Wait for my permission to continue.**

---

### Sub-phase 0.2: Backend Audit

Scan EVERY file in `backend/` and document:

**Table 3: PyInstaller Compatibility**
| # | Check | File:Line | Details |
|---|-------|-----------|---------|
| 1 | Where is DATABASE_URL / db path defined? | | Exact code |
| 2 | Any hardcoded file paths? | | List them |
| 3 | Any `open()` calls reading local files? | | List them |
| 4 | Any environment variables used? | | List them |
| 5 | Any `os.path` or `pathlib.Path` operations? | | List them |
| 6 | Any dynamic imports (`importlib`, `__import__`)? | | List them |
| 7 | Any `.env` file reading? | | How? |

**Table 4: Complete Import Tree**
List EVERY third-party package imported across ALL backend `.py` files:
File: main.py

fastapi
sqlalchemy
pydantic
...
File: job_bot.py (if exists)

jobspy
...
File: ...

text


This is CRITICAL for PyInstaller. Every single import must be accounted for.

**⏸️ STOP. Show me both tables. Wait for my permission to continue.**

---

### Sub-phase 0.3: Write Complete Plan

Create `plans/plan3.md` with ALL audit findings and the phase-by-phase plan outline.

Structure:
```markdown
# Plan 3: Tauri Desktop App Conversion (Windows)

## Date: YYYY-MM-DD
## Platform: Windows (x86_64-pc-windows-msvc)
## Status: In Progress

## Audit Results

### Frontend — Static Export Issues
(Table 1 from sub-phase 0.1)

### Frontend — Backend URL References
(Table 2 from sub-phase 0.1)

### Backend — PyInstaller Concerns
(Table 3 from sub-phase 0.2)

### Backend — Import Tree
(Table 4 from sub-phase 0.2)

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PyInstaller misses hidden import | High | Build fails | Comprehensive hidden_imports list |
| Static export breaks feature | Medium | Feature broken | Audit all pages before export |
| CSP blocks API calls | Medium | App unusable | Proper CSP config |
| Port 8000 conflict | Low | App won't start | Port check + error message |

## Phase Outline
(list all phases and sub-phases)

## Progress Tracker
- [ ] Phase 0: Audit & Plan
- [ ] Phase 1: Backend preparation
- [ ] Phase 2: PyInstaller bundle
- [ ] Phase 3: Frontend static export
- [ ] Phase 4: Tauri setup
- [ ] Phase 5: Rust sidecar code
- [ ] Phase 6: Frontend Tauri integration
- [ ] Phase 7: Dev testing
- [ ] Phase 8: Production build
- [ ] Phase 9: Documentation
⏸️ STOP. Show me plan3.md. Wait for my permission to continue.

PHASE 1: BACKEND — PREPARE FOR DISTRIBUTION
Sub-phase 1.1: Create Server Entry Point
Create a NEW file backend/run_server.py:

Python

"""
Standalone entry point for the FindMyJobAI backend server.
Used by PyInstaller to create the distributable .exe.
Also works for normal development: python run_server.py
"""
import sys
import os


def get_base_path():
    """
    Returns the base path for the application.
    - Normal Python: directory containing this script
    - PyInstaller .exe: temporary extraction directory (sys._MEIPASS)
    """
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


def main():
    base_path = get_base_path()
    if base_path not in sys.path:
        sys.path.insert(0, base_path)

    import uvicorn
    from main import app

    host = "127.0.0.1"
    port = 8000

    print(f"[FindMyJobAI] Starting backend on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
Verify — run these commands in Command Prompt or PowerShell:

PowerShell

cd backend
venv\Scripts\activate
python run_server.py
# Must print: [FindMyJobAI] Starting backend on http://127.0.0.1:8000
Then in another terminal:

PowerShell

curl http://127.0.0.1:8000/settings
# Must return settings JSON
Then verify old way still works:

PowerShell

cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload
# Must still work
⏸️ STOP. Tell me verification results. Wait for permission.

Sub-phase 1.2: Add Health Check Endpoint
✅ ALREADY COMPLETE - Health endpoint already exists in backend/routes/settings.py (lines 21-29)

The existing implementation:
```python
@router.get("/health")
def health_check():
    """
    Health check endpoint.
    
    Returns:
        Status dictionary with timestamp
    """
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
```

No changes needed. Proceed to next sub-phase.

Verify:
```powershell
cd backend
venv\Scripts\activate
python run_server.py

# In another terminal:
curl http://127.0.0.1:8000/health
# Must return: {"status":"ok","timestamp":"..."}
```
⏸️ STOP. Confirm health endpoint works. Wait for permission.

Sub-phase 1.3: Create Database Path Configuration
Create a NEW file backend/database_config.py:

Python

"""
Database path configuration for FindMyJobAI.

Development mode:
    Database stored in backend/ directory (current behavior, nothing changes)

Production mode (PyInstaller .exe):
    Database stored in %LOCALAPPDATA%\\FindMyJobAI\\
    Example: C:\\Users\\JohnDoe\\AppData\\Local\\FindMyJobAI\\jobs.db
"""
import sys
import os
from pathlib import Path

APP_NAME = "FindMyJobAI"


def is_frozen() -> bool:
    """Check if running as a PyInstaller .exe bundle."""
    return getattr(sys, 'frozen', False)


def get_data_directory() -> Path:
    """
    Get the directory where the database should be stored.
    
    Development: backend/ directory (same as current behavior)
    Production:  %LOCALAPPDATA%\\FindMyJobAI\\
    """
    if is_frozen():
        # Running as .exe — use Windows AppData
        local_app_data = os.environ.get('LOCALAPPDATA')
        if local_app_data:
            data_dir = Path(local_app_data) / APP_NAME
        else:
            # Fallback if LOCALAPPDATA is somehow not set
            data_dir = Path.home() / 'AppData' / 'Local' / APP_NAME
    else:
        # Development — keep database in backend/ directory (unchanged)
        data_dir = Path(__file__).parent

    # Create directory if it doesn't exist
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_database_url() -> str:
    """Get the SQLite connection URL for SQLAlchemy."""
    db_path = get_data_directory() / "jobs.db"
    return f"sqlite:///{db_path}"


def get_database_path() -> Path:
    """Get the raw path to the database file."""
    return get_data_directory() / "jobs.db"
Now update the EXISTING database setup in the backend:

**CORRECTED:** The database URL is defined in `backend/config.py` (lines 33-36):

```python
# Current code in config.py:
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "jobs.db")
DB_URL = get_env_str("DB_URL", f"sqlite:///{DB_PATH}")
```

Replace these lines with:

```python
# Updated code in config.py:
from database_config import get_database_url
DB_URL = get_env_str("DB_URL", get_database_url())
```

**Note:** The `database.py` file imports `DB_URL` from `config.py` (line 9), so no change is needed there.

Verify:

PowerShell

cd backend
venv\Scripts\activate
python run_server.py

# In another terminal, test that the app still works:
# Start frontend: cd frontend && npm run dev
# Open browser at localhost:3000
# Do a job search → must work
# Save a job → must work
# Check that jobs.db is still in the backend/ directory (development mode)
⏸️ STOP. Show me the exact change made to the existing DB setup. Wait for permission.

Sub-phase 1.4: Full Backend Verification
Run the complete app end-to-end:

PowerShell

# Terminal 1:
cd backend
venv\Scripts\activate
python run_server.py

# Terminal 2:
cd frontend
npm run dev
Open browser at http://localhost:3000 and verify:

 App loads
 curl http://127.0.0.1:8000/health → responds OK
 Job search works (search for a real job title + location)
 Results appear in the list
 Save a job → works
 Reject a job → works
 Tab switching works
 Theme toggle works
 Settings work
Also verify the old startup still works:

PowerShell

python -m uvicorn main:app --reload
# Must work identically
⏸️ STOP. Report ALL checkbox results. Wait for permission.

PHASE 2: PYINSTALLER — BUNDLE BACKEND INTO .EXE
Sub-phase 2.1: Install PyInstaller
PowerShell

cd backend
venv\Scripts\activate
pip install pyinstaller
pip freeze > requirements.txt
Verify:

PowerShell

pyinstaller --version
# Must print version number
⏸️ STOP. Confirm version. Wait for permission.

Sub-phase 2.2: Create PyInstaller Spec File
Create backend/findmyjobai.spec.

CRITICAL: Before writing this file, cross-reference EVERY import from the audit in Sub-phase 0.2. Every single package must appear in hidden_imports or be collected via collect_all. This is the #1 cause of PyInstaller failures.

Python

# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for FindMyJobAI backend.
Builds a single .exe containing FastAPI + python-jobspy + all dependencies.
Target: Windows x86_64
"""
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules
import os

block_cipher = None

# ============================================================
# COLLECT PROBLEMATIC PACKAGES (data files + hidden imports)
# ============================================================

# python-jobspy — the scraping library and all its internal data
jobspy_datas, jobspy_binaries, jobspy_hiddenimports = collect_all('jobspy')

# SSL certificates — required for HTTPS requests during scraping
certifi_datas, certifi_binaries, certifi_hiddenimports = collect_all('certifi')

# ============================================================
# HIDDEN IMPORTS
# PyInstaller does static analysis and misses dynamic imports.
# This list MUST cover everything the app imports at runtime.
# ============================================================
hidden_imports = [
    # --- Uvicorn internals (dynamically loaded) ---
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',

    # --- FastAPI / Starlette ---
    'fastapi',
    'fastapi.responses',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'starlette',
    'starlette.routing',
    'starlette.responses',
    'starlette.requests',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.middleware.base',
    'starlette.staticfiles',
    'starlette.templating',

    # --- Pydantic ---
    'pydantic',
    'pydantic.deprecated',
    'pydantic.deprecated.decorator',
    'pydantic._internal',

    # --- SQLAlchemy ---
    'sqlalchemy',
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.sql.default_comparator',
    'sqlalchemy.pool',

    # --- HTTP / Networking ---
    'httptools',
    'httpcore',
    'httpx',
    'h11',
    'anyio',
    'anyio._backends',
    'anyio._backends._asyncio',
    'sniffio',
    'socksio',
    'hpack',
    'hyperframe',

    # --- Multipart (form data parsing) ---
    'multipart',
    'python_multipart',

    # --- Other common ---
    'dotenv',
    'encodings',
    'encodings.idna',
    'email.mime.multipart',
    'email.mime.text',

    # ==============================================
    # ADDITIONAL IMPORTS FROM CODEBASE AUDIT
    # These were found in the actual codebase
    # ==============================================
    
    # --- Scraping (job_bot.py) ---
    'jobspy',
    'python_jobspy',  # Alternative package name
    'pandas',
    'numpy',
    
    # --- Standard library ---
    'uuid',
    'threading',
    're',
    'json',
    'time',
    'urllib.parse',
]

# Merge all hidden imports (deduplicate)
hidden_imports = list(set(
    hidden_imports
    + jobspy_hiddenimports
    + certifi_hiddenimports
))

# ============================================================
# COLLECT BACKEND SOURCE FILES AS DATA
# (PyInstaller packages run_server.py as the entry point,
#  but main.py and other modules need to be available too)
# ============================================================
backend_datas = []

# All .py files in backend root directory
for f in os.listdir('.'):
    if f.endswith('.py') and f not in ('run_server.py', 'findmyjobai.spec'):
        backend_datas.append((f, '.'))

# All subdirectories containing .py files (routes/, services/, middleware/, etc.)
skip_dirs = {'venv', '__pycache__', 'build', 'dist', '.git'}
for dirpath, dirnames, filenames in os.walk('.'):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for f in filenames:
        if f.endswith('.py'):
            rel_path = os.path.relpath(os.path.join(dirpath, f), '.')
            dest_dir = os.path.dirname(rel_path)
            if dest_dir and dest_dir != '.':
                backend_datas.append((rel_path, dest_dir))

# Also include any .env or config files if they exist
if os.path.exists('.env'):
    backend_datas.append(('.env', '.'))

# ============================================================
# ANALYSIS
# ============================================================
a = Analysis(
    ['run_server.py'],
    pathex=['.'],
    binaries=jobspy_binaries + certifi_binaries,
    datas=backend_datas + jobspy_datas + certifi_datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 'matplotlib', 'numpy.testing',
        'pytest', 'setuptools', 'pip', 'wheel',
        '_tkinter', 'test',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# ============================================================
# CREATE SINGLE .EXE
# ============================================================
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend',            # Output: backend.exe
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,                  # Compress with UPX if available
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,              # Show console window (helps debug; will be hidden by Tauri)
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,                 # No icon needed — this exe runs in background
)
Before saving: Go through EVERY import found in Sub-phase 0.2 audit and verify it's in the hidden_imports list. If ANY package is missing, add it. Show me what you added.

⏸️ STOP. Show me the complete spec file with any additions from the audit. Wait for permission.

Sub-phase 2.3: Build the .exe
PowerShell

cd backend
venv\Scripts\activate
pyinstaller findmyjobai.spec --clean --noconfirm
Expected output: backend\dist\backend.exe

Check:

PowerShell

# File should exist
dir backend\dist\backend.exe

# Check file size (expected: 50-150 MB)
If build FAILS:

Read the FULL error output
Most common cause: missing module in hidden_imports
Add it to the spec file and rebuild
DO NOT proceed until the build succeeds
⏸️ STOP. Report: success/fail, file size of backend.exe. Wait for permission.

Sub-phase 2.4: Test the Standalone .exe
This is the MOST IMPORTANT test in the entire process. The .exe must work completely independently.

PowerShell

# Step 1: DEACTIVATE the virtual environment
deactivate

# Step 2: Kill any running backend
# (Close any terminal running the backend, or use Task Manager)

# Step 3: Run the .exe directly
backend\dist\backend.exe
Test checklist — ALL must pass:

 .exe starts without any ModuleNotFoundError
 Console shows: [FindMyJobAI] Starting backend on http://127.0.0.1:8000
 curl http://127.0.0.1:8000/health returns {"status":"ok",...}
 Start frontend in another terminal: cd frontend && npm run dev
 Open http://localhost:3000 in browser
 Job search works (actually search for a real job title and location)
 Results appear in the list
 Save a job → works
 Reject a job → works
 Tabs work
 Theme works
 Settings work
 Check: %LOCALAPPDATA%\FindMyJobAI\jobs.db exists (since .exe is "frozen", it should use AppData)
 Close the .exe (Ctrl+C in console)
 No leftover processes in Task Manager
If ANY test fails — common fixes:

Error	Fix
ModuleNotFoundError: No module named 'X'	Add 'X' to hidden_imports, rebuild
ModuleNotFoundError: No module named 'X.Y'	Add both 'X' and 'X.Y', rebuild
FileNotFoundError: ...cacert.pem	Verify collect_all('certifi') in spec
FileNotFoundError: ...jobspy...	Verify collect_all('jobspy') in spec
SSL errors during scraping	certifi not bundled properly, check spec
Search returns empty but no error	Check console stderr for hidden errors
OSError: Address already in use	Kill the other backend process first
.exe crashes silently	Run from cmd (not double-click) to see errors
Fix → rebuild → retest. Repeat until ALL checks pass.

⏸️ STOP. Report EVERY checkbox (pass/fail). Wait for permission.

Sub-phase 2.5: Prepare Sidecar for Tauri
Step 1: Get target triple

PowerShell

rustc -vV | Select-String "host"
# Expected output: host: x86_64-pc-windows-msvc
Step 2: Copy the .exe with the correct name

PowerShell

# Create the binaries directory
New-Item -ItemType Directory -Force -Path "frontend\src-tauri\binaries"

# Copy with target triple suffix
# The name MUST be: backend-x86_64-pc-windows-msvc.exe
Copy-Item "backend\dist\backend.exe" "frontend\src-tauri\binaries\backend-x86_64-pc-windows-msvc.exe"
Step 3: Add to .gitignore
Add this line to the project root .gitignore:

text

frontend/src-tauri/binaries/
Step 4: Create build helper script

Create build_backend.ps1 in project root:

PowerShell

<#
.SYNOPSIS
    Builds the FindMyJobAI backend into a standalone .exe and
    copies it to the Tauri sidecar binaries directory.
.DESCRIPTION
    Run this script before `npx tauri build` to ensure the
    backend .exe is fresh and correctly named.
#>

Write-Host "=== Building FindMyJobAI Backend ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location backend

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & venv\Scripts\Activate.ps1
} else {
    Write-Host "ERROR: Virtual environment not found at backend\venv\" -ForegroundColor Red
    Write-Host "Create it with: python -m venv venv" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

# Run PyInstaller
Write-Host "Running PyInstaller..." -ForegroundColor Yellow
pyinstaller findmyjobai.spec --clean --noconfirm

if (-not $?) {
    Write-Host "ERROR: PyInstaller build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Check output exists
if (-not (Test-Path "dist\backend.exe")) {
    Write-Host "ERROR: backend.exe not found in dist\" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Get target triple from Rust
$hostLine = rustc -vV | Select-String "host:"
$targetTriple = $hostLine.ToString().Trim().Split(" ")[1]
Write-Host "Target triple: $targetTriple" -ForegroundColor Gray

# Create binaries directory
New-Item -ItemType Directory -Force -Path "frontend\src-tauri\binaries" | Out-Null

# Copy with correct name
$destPath = "frontend\src-tauri\binaries\backend-$targetTriple.exe"
Copy-Item "backend\dist\backend.exe" $destPath -Force

$size = (Get-Item $destPath).Length / 1MB
Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host "Binary: $destPath" -ForegroundColor White
Write-Host "Size: $([math]::Round($size, 1)) MB" -ForegroundColor White
Verify:

PowerShell

# The binary must exist at this exact path:
dir frontend\src-tauri\binaries\
# Should show: backend-x86_64-pc-windows-msvc.exe
⏸️ STOP. Confirm binary name and location. Wait for permission.

PHASE 3: FRONTEND — STATIC EXPORT
Sub-phase 3.1: Centralize API Base URL
Create frontend/lib/config.ts:

```typescript
/**
 * Application configuration.
 * 
 * API_BASE_URL: Where the backend server runs.
 * In both development and Tauri desktop mode, this is localhost:8000.
 * The backend always runs locally (either manually or as a Tauri sidecar).
 */
export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
} as const;
```

**CORRECTED:** The backend URL is referenced in THREE locations in the actual codebase:

| File | Line | Current Code | Change Required |
|------|------|--------------|-----------------|
| `frontend/lib/constants.ts` | 4 | `export const DEFAULT_BACKEND = "http://localhost:8000";` | Import from config.ts |
| `frontend/lib/api.ts` | 7 | `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000';` | Import from config.ts |
| `frontend/app/page.tsx` | 39 | `const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL \|\| DEFAULT_BACKEND;` | Import from config.ts |

**Specific Changes:**

1. **Update `frontend/lib/constants.ts`:**
```typescript
// BEFORE
export const DEFAULT_BACKEND = "http://localhost:8000";

// AFTER
import { CONFIG } from './config';
export const DEFAULT_BACKEND = CONFIG.API_BASE_URL;
```

2. **Update `frontend/lib/api.ts`:**
```typescript
// BEFORE
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// AFTER
import { CONFIG } from './config';
const API_BASE_URL = CONFIG.API_BASE_URL;
```

3. **Update `frontend/app/page.tsx`:**
```typescript
// BEFORE (line 39)
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND;

// AFTER
import { CONFIG } from '@/lib/config';
const BACKEND = CONFIG.API_BASE_URL;
```

Verify — search must return ZERO results:

```powershell
# Run from frontend directory
Select-String -Path ".\**\*.ts",".\**\*.tsx" -Pattern "localhost:8000" -Recurse | Where-Object { $_.Path -notlike "*config.ts*" -and $_.Path -notlike "*node_modules*" }

Select-String -Path ".\**\*.ts",".\**\*.tsx" -Pattern "127.0.0.1:8000" -Recurse | Where-Object { $_.Path -notlike "*config.ts*" -and $_.Path -notlike "*node_modules*" }

# Both should return NOTHING
```

Then run the app and verify everything works:

```powershell
# Terminal 1: cd backend && venv\Scripts\activate && python run_server.py
# Terminal 2: cd frontend && npm run dev
# Browser: all features work
```
⏸️ STOP. Show me ALL replacements. Wait for permission.

Sub-phase 3.2: Configure Static Export
Edit the existing Next.js config file. Find which one exists:

frontend\next.config.js
frontend\next.config.mjs
frontend\next.config.ts
Add ONLY these two properties to the existing config object:

JavaScript

output: 'export',
images: {
  unoptimized: true,
},
If the config already has an images property, merge unoptimized: true into it.
Do NOT change or remove anything else in the config.

⏸️ STOP. Show me the complete updated config file. Wait for permission.

Sub-phase 3.3: Fix Static Export Incompatibilities
Try building:

PowerShell

cd frontend
npm run build
If it succeeds with no errors and creates frontend\out\ directory → skip to verification below.

If it fails → fix ONLY the specific errors. Common fixes:

Build Error	Minimal Fix
Page with dynamic route X doesn't have generateStaticParams	Add generateStaticParams or convert to client component
API routes are not supported with output: export	Delete frontend\app\api\ directory, update code to call backend directly
Middleware is not supported with output: export	Delete frontend\middleware.ts, move any critical logic to client
useSearchParams() should be wrapped in Suspense	Wrap the component using it with <Suspense>
Error: Image Optimization...	Already handled by unoptimized: true
For EACH fix:

Make the MINIMUM change needed
Document what you changed and why in plan3.md
Do NOT refactor surrounding code
After fixing, verify:

PowerShell

cd frontend
npm run build

# Must succeed
# Must create frontend\out\ directory
# Must contain frontend\out\index.html

dir frontend\out\index.html
# Must exist
Test the static build serves correctly:

PowerShell

npx serve frontend\out -p 3001
# Open http://localhost:3001 with backend running on 8000
# All features must work
Also verify dev mode still works:

PowerShell

cd frontend && npm run dev
# Must work as before at localhost:3000
⏸️ STOP. Report: build success/fail, what was fixed (if anything), test results. Wait for permission.

PHASE 4: TAURI PROJECT SETUP
Sub-phase 4.1: Install Tauri CLI
PowerShell

cd frontend
npm install --save-dev @tauri-apps/cli@latest
Add to frontend\package.json scripts section (ADD only, do NOT modify existing scripts):

JSON

"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build"
Verify:

PowerShell

cd frontend
npx tauri --version
# Must print version
⏸️ STOP. Confirm version number. Wait for permission.

Sub-phase 4.2: Initialize Tauri Project
PowerShell

cd frontend
npx tauri init
When prompted:

App name: FindMyJobAI
Window title: FindMyJobAI
Frontend dist directory: ../out
Frontend dev URL: http://localhost:3000
Frontend build command: npm run build
This creates frontend\src-tauri\.

DO NOT modify any generated files yet.

Verify directory exists:

PowerShell

dir frontend\src-tauri\
# Should contain: Cargo.toml, tauri.conf.json, src\, icons\, capabilities\, etc.
⏸️ STOP. Show me directory listing. Wait for permission.

Sub-phase 4.3: Configure tauri.conf.json
Replace the ENTIRE content of frontend\src-tauri\tauri.conf.json with:

JSON

{
  "productName": "FindMyJobAI",
  "version": "1.0.0",
  "identifier": "com.findmyjobai.app",
  "build": {
    "frontendDist": "../out",
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:3000"
  },
  "app": {
    "windows": [
      {
        "title": "FindMyJobAI - Job Search Assistant",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true,
        "fullscreen": false,
        "decorations": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https: http:; font-src 'self' data: https://fonts.gstatic.com;"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "externalBin": [
      "binaries/backend"
    ],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "shortDescription": "Intelligent Job Search Assistant",
    "longDescription": "Search jobs from LinkedIn, Indeed, and Glassdoor. Save, filter, and organize listings.",
    "category": "Productivity",
    "windows": {
      "nsis": {
        "installMode": "currentUser"
      }
    }
  }
}
CSP check — scan the frontend and verify:

**CORRECTED:** The frontend uses Google Fonts via `next/font/google` with preconnect hints in `layout.tsx`:
- `https://fonts.googleapis.com` → Added to style-src
- `https://fonts.gstatic.com` → Added to font-src

The CSP has been updated above to include these domains.

⏸️ STOP. Show me the config (with any CSP adjustments). Wait for permission.

Sub-phase 4.4: Configure Sidecar Permissions
Update frontend\src-tauri\capabilities\default.json:

JSON

{
  "identifier": "default",
  "description": "Default permissions for FindMyJobAI",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-spawn",
    "shell:allow-kill",
    "shell:allow-stdin-write",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "binaries/backend",
          "sidecar": true,
          "args": true
        }
      ]
    }
  ]
}
Note: If the exact permission format differs for your installed Tauri v2 version, adjust accordingly and document what you changed.

⏸️ STOP. Show me the file. Wait for permission.

Sub-phase 4.5: Update Cargo.toml
Edit frontend\src-tauri\Cargo.toml. In the [dependencies] section, ensure these are present:

toml

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["blocking"] }
Keep all other existing/auto-generated dependencies.

Verify:

PowerShell

cd frontend\src-tauri
cargo check
# Must compile (warnings OK, errors NOT OK)
⏸️ STOP. Report cargo check result. Wait for permission.

PHASE 5: RUST SIDECAR CODE
Sub-phase 5.1: Write main.rs
Replace the ENTIRE content of frontend\src-tauri\src\main.rs with:

Rust

// Hide console window in release builds on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::time::{Duration, Instant};
use std::thread;
use tauri::{Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

// ======================================================
// STATE
// ======================================================

/// Holds the backend child process handle for cleanup on exit.
struct BackendState {
    child: Mutex<Option<CommandChild>>,
}

// ======================================================
// HEALTH CHECK
// ======================================================

/// Check if the backend is responding on /health.
fn is_backend_healthy() -> bool {
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    matches!(
        client.get("http://127.0.0.1:8000/health").send(),
        Ok(resp) if resp.status().is_success()
    )
}

/// Wait up to `timeout_secs` for the backend to become healthy.
fn wait_for_backend(timeout_secs: u64) -> bool {
    let start = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    println!("[FindMyJobAI] Waiting for backend to start (timeout: {}s)...", timeout_secs);

    while start.elapsed() < timeout {
        if is_backend_healthy() {
            println!(
                "[FindMyJobAI] Backend ready in {:.1}s",
                start.elapsed().as_secs_f32()
            );
            return true;
        }
        thread::sleep(Duration::from_millis(500));
    }

    eprintln!("[FindMyJobAI] Backend did NOT start within {}s", timeout_secs);
    false
}

// ======================================================
// PORT CHECK
// ======================================================

/// Returns true if port 8000 is free (not in use).
fn is_port_available() -> bool {
    std::net::TcpListener::bind(("127.0.0.1", 8000)).is_ok()
}

// ======================================================
// MAIN
// ======================================================

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // ----- Case 1: Backend already running (dev mode or second instance) -----
            if is_backend_healthy() {
                println!("[FindMyJobAI] Backend already running — reusing");
                app.manage(BackendState {
                    child: Mutex::new(None),
                });
                let _ = handle.emit("backend-ready", true);
                return Ok(());
            }

            // ----- Case 2: Port occupied by something else -----
            if !is_port_available() {
                eprintln!("[FindMyJobAI] Port 8000 is in use by another application!");
                let _ = handle.emit(
                    "backend-error",
                    "Port 8000 is already in use by another application. Please close it and restart FindMyJobAI.",
                );
                app.manage(BackendState {
                    child: Mutex::new(None),
                });
                return Ok(());
            }

            // ----- Case 3: Launch the sidecar -----
            println!("[FindMyJobAI] Starting backend sidecar...");

            let sidecar_cmd = app
                .shell()
                .sidecar("backend")
                .map_err(|e| {
                    eprintln!("[FindMyJobAI] Failed to create sidecar command: {}", e);
                    e
                })?;

            let (mut rx, child) = sidecar_cmd.spawn().map_err(|e| {
                eprintln!("[FindMyJobAI] Failed to spawn sidecar: {}", e);
                e
            })?;

            app.manage(BackendState {
                child: Mutex::new(Some(child)),
            });

            // Read stdout/stderr in background (prevents pipe buffer deadlock)
            let handle_for_output = handle.clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let text = String::from_utf8_lossy(&line);
                            print!("[Backend] {}", text);
                        }
                        CommandEvent::Stderr(line) => {
                            let text = String::from_utf8_lossy(&line);
                            eprint!("[Backend] {}", text);
                        }
                        CommandEvent::Error(err) => {
                            eprintln!("[Backend Error] {}", err);
                            let _ = handle_for_output.emit(
                                "backend-error",
                                format!("Backend error: {}", err),
                            );
                        }
                        CommandEvent::Terminated(status) => {
                            eprintln!("[Backend] Process terminated: {:?}", status);
                            let _ = handle_for_output.emit(
                                "backend-error",
                                "Backend stopped unexpectedly. Please restart FindMyJobAI.",
                            );
                            break;
                        }
                        _ => {}
                    }
                }
            });

            // Wait for health check in a separate thread
            let handle_for_health = handle.clone();
            thread::spawn(move || {
                if wait_for_backend(45) {
                    let _ = handle_for_health.emit("backend-ready", true);
                } else {
                    let _ = handle_for_health.emit(
                        "backend-error",
                        "Backend failed to start within 45 seconds. Please restart FindMyJobAI.",
                    );
                }
            });

            Ok(())
        })
        // ----- Cleanup on window close -----
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                println!("[FindMyJobAI] Window closing — shutting down backend...");
                let state = window.app_handle().state::<BackendState>();

                if let Ok(mut guard) = state.child.lock() {
                    if let Some(child) = guard.take() {
                        match child.kill() {
                            Ok(_) => println!("[FindMyJobAI] Backend process killed"),
                            Err(e) => eprintln!("[FindMyJobAI] Failed to kill backend: {}", e),
                        }
                    } else {
                        println!("[FindMyJobAI] No sidecar to kill (was using external backend)");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("Fatal: failed to run FindMyJobAI");
}
Verify:

PowerShell

cd frontend\src-tauri
cargo check
# MUST compile without errors
If there are compilation errors:

Read the error message carefully
Most likely cause: API differences in your installed Tauri v2 version
Check the installed version in Cargo.toml/Cargo.lock
Consult Tauri v2 docs for the correct API
Fix and re-run cargo check
Document any changes you made vs. the template above
⏸️ STOP. Report cargo check result. Wait for permission.

Sub-phase 5.2: Generate App Icons
PowerShell

cd frontend

# Option A: If you have a logo PNG (ideally 1024x1024 or larger):
npx tauri icon path\to\your\logo.png

# Option B: If no logo exists, use the default generated icons (already in src-tauri\icons\)
# Skip this step
The icons are used for:

The .exe file icon
The Windows taskbar icon
The installer icon
The Start Menu shortcut icon
⏸️ STOP. Confirm icons are ready. Wait for permission.

PHASE 6: FRONTEND TAURI INTEGRATION
Sub-phase 6.1: Install Tauri API Package
PowerShell

cd frontend
npm install @tauri-apps/api@latest
⏸️ STOP. Confirm installed. Wait for permission.

Sub-phase 6.2: Create Tauri Detection Utility
Create frontend\lib\tauri.ts:

TypeScript

/**
 * Detect whether the app is running inside a Tauri desktop window.
 * Returns false in regular browser (web mode).
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
}
⏸️ STOP. Confirm created. Wait for permission.

Sub-phase 6.3: Create Backend Connection Screen
Create frontend\components\BackendStatus.tsx:

TypeScript

"use client";

import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/lib/config';
import { isTauri } from '@/lib/tauri';

type Status = 'connecting' | 'connected' | 'error';

interface Props {
  children: React.ReactNode;
}

export function BackendStatus({ children }: Props) {
  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${CONFIG.API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 90; // 45 seconds at 500ms interval

    const poll = async () => {
      if (cancelled) return;

      const healthy = await checkHealth();
      if (cancelled) return;

      if (healthy) {
        setStatus('connected');
        return;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        setStatus('error');
        setError(
          isTauri()
            ? 'The search engine failed to start. Please close and reopen FindMyJobAI.'
            : 'Cannot connect to the backend server. Please make sure it is running on port 8000.'
        );
        return;
      }

      setTimeout(poll, 500);
    };

    poll();

    // Listen for Tauri sidecar events (only if running in Tauri)
    if (isTauri()) {
      let unlisten1: (() => void) | undefined;
      let unlisten2: (() => void) | undefined;

      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<boolean>('backend-ready', () => {
          if (!cancelled) setStatus('connected');
        }).then(fn => { unlisten1 = fn; });

        listen<string>('backend-error', (event) => {
          if (!cancelled) {
            setStatus('error');
            setError(event.payload);
          }
        }).then(fn => { unlisten2 = fn; });
      }).catch(() => {
        // Not in Tauri — silently ignore
      });

      return () => {
        cancelled = true;
        unlisten1?.();
        unlisten2?.();
      };
    }

    return () => { cancelled = true; };
  }, [checkHealth, retryKey]);

  // ---- Connected → render the app ----
  if (status === 'connected') return <>{children}</>;

  // ---- Loading / Error screen ----
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-xl border border-gray-200 dark:border-gray-700">
        {status === 'connecting' ? (
          <>
            <div className="text-5xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              FindMyJobAI
            </h1>
            <div className="flex justify-center mb-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {isTauri() ? 'Starting the search engine...' : 'Connecting to server...'}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connection Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => {
                setStatus('connecting');
                setError('');
                setRetryKey(k => k + 1);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
⏸️ STOP. Show me the component. Wait for permission.

Sub-phase 6.4: Integrate BackendStatus into the App
Open frontend\app\layout.tsx.

Add <BackendStatus> wrapper around {children}:

TypeScript

import { BackendStatus } from '@/components/BackendStatus';

// Find where {children} is rendered in the return statement.
// Wrap it with BackendStatus:

// BEFORE (example — your actual structure may differ):
<body className={...}>
  {children}
</body>

// AFTER:
<body className={...}>
  <BackendStatus>
    {children}
  </BackendStatus>
</body>
Rules:

ONLY add the BackendStatus wrapper
Do NOT change anything else in layout.tsx
Keep ALL existing wrappers, providers, className, etc. intact
Verify (web mode):

PowerShell

# Step 1: Stop backend
# Step 2: Start frontend only
cd frontend && npm run dev
# Step 3: Open browser at localhost:3000
# Should show: "Connecting to server..." spinner, then error after ~45s

# Step 4: Start backend in another terminal
cd backend && venv\Scripts\activate && python run_server.py
# Step 5: Click "Try Again" in browser
# Should connect and show the app

# Step 6: Refresh page with backend running
# Should briefly show spinner then app loads
⏸️ STOP. Report verification results. Wait for permission.

PHASE 7: DEVELOPMENT MODE TESTING
Sub-phase 7.1: Test Tauri with External Backend
Start the backend manually, then launch Tauri:

PowerShell

# Terminal 1: Start backend normally
cd backend
venv\Scripts\activate
python run_server.py

# Terminal 2: Launch Tauri dev mode
cd frontend
npx tauri dev
Test checklist:

 Tauri compiles the Rust code without errors
 A native Windows window opens (titled "FindMyJobAI - Job Search Assistant")
 BackendStatus shows briefly, then connects (backend is already running)
 App loads fully inside the native window
 Job search works — enter a real job title and location, click search
 Progress updates appear during search
 Results display in the list
 Save a job → status changes to saved
 Reject a job → status changes to rejected
 Tab switching works (New / Saved / Rejected)
 Theme toggle works (light ↔ dark)
 Settings page works and persists
 Window resizes properly (responsive layout)
 Window can't go below 900x600
 Close the window → app exits
 Check Task Manager → no leftover FindMyJobAI or backend processes
 No errors in the console where you ran npx tauri dev
⏸️ STOP. Report EVERY checkbox result. Wait for permission.

Sub-phase 7.2: Test Tauri with Sidecar
Now test with the sidecar binary (no manual backend):

PowerShell

# Step 1: STOP any running backend (close that terminal)

# Step 2: Verify the sidecar binary exists
dir frontend\src-tauri\binaries\
# Must show backend-x86_64-pc-windows-msvc.exe

# Step 3: Launch Tauri dev mode
cd frontend
npx tauri dev
Test checklist:

 Window opens
 BackendStatus shows "Starting the search engine..."
 Console shows [Backend] [FindMyJobAI] Starting backend on http://127.0.0.1:8000
 After several seconds, app loads
 Job search works (actually search for something)
 Results appear
 Save/reject works
 Close the window
 Check Task Manager → backend.exe is NOT running (was killed)
 Reopen npx tauri dev → works again
If sidecar fails to start:

Check console output for error messages
Most common issue: binary filename doesn't match target triple
Verify: dir frontend\src-tauri\binaries\ filename matches rustc -vV | Select-String host
⏸️ STOP. Report ALL results. Wait for permission.

Sub-phase 7.3: Verify Web Mode Still Works
Confirm regular web mode is completely unaffected:

PowerShell

# Terminal 1
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload

# Terminal 2
cd frontend
npm run dev
Open http://localhost:3000 in Chrome/Edge:

 App loads (BackendStatus briefly appears, then connects)
 All features work exactly as before
 No visual differences
 No console errors in browser DevTools
⏸️ STOP. Report results. Wait for permission.

PHASE 8: PRODUCTION BUILD
Sub-phase 8.1: Fresh Backend Build
PowerShell

.\build_backend.ps1
 Script runs successfully
 Reports binary path and size
 Binary exists at frontend\src-tauri\binaries\backend-x86_64-pc-windows-msvc.exe
⏸️ STOP. Confirm. Wait for permission.

Sub-phase 8.2: Build the Windows Installer
PowerShell

cd frontend
npx tauri build
This will:

Run npm run build → creates out\ directory
Compile Rust code in release mode (takes a few minutes)
Bundle the sidecar .exe
Create Windows installers
Expected output locations:

text

frontend\src-tauri\target\release\bundle\
├── msi\
│   └── FindMyJobAI_1.0.0_x64_en-US.msi
└── nsis\
    └── FindMyJobAI_1.0.0_x64-setup.exe
If build fails — common issues:

Error	Fix
sidecar "backend" not found	Binary name doesn't match target triple in binaries\
icon not found	Run npx tauri icon or check icons exist in src-tauri\icons\
beforeBuildCommand failed	Next.js build has errors — fix them first
Cargo compilation error	Run cd src-tauri && cargo check to isolate
CSP error	Adjust CSP in tauri.conf.json
WiX/NSIS not found	Tauri should install these automatically; if not, check Tauri prerequisites
Verify:

PowerShell

# Check installer was created
dir frontend\src-tauri\target\release\bundle\nsis\
dir frontend\src-tauri\target\release\bundle\msi\

# Note file sizes
⏸️ STOP. Report: success/fail, installer file names and sizes. Wait for permission.

Sub-phase 8.3: Test the Installed Application
This is the FINAL and MOST IMPORTANT test.

text

Step 1: CLOSE everything — all terminals, all backends, all browsers with the app
Step 2: Install the app:
        - Double-click the .msi or the NSIS .exe installer
        - Follow the installation wizard
        - Install to default location
Step 3: Launch FindMyJobAI from the Start Menu
Step 4: Test everything
Test checklist — EVERY item must pass:

Startup:

 App launches from Start Menu (not from terminal)
 Native window appears
 Loading screen shows: "Starting the search engine..."
 After 5-15 seconds, app loads fully
 No console window visible (hidden by windows_subsystem = "windows")
 No error popups
Core Features:

 Job search works — search for "Software Engineer" in "New York"
 Progress updates appear during search
 Results display with job titles, companies, locations
 Save a job → moves to Saved tab
 Reject a job → moves to Rejected tab
 Switch to Saved tab → saved jobs appear
 Switch to Rejected tab → rejected jobs appear
 Switch back to New tab → remaining new jobs appear
UI:

 Theme toggle works (light → dark → light)
 Settings page loads and works
 Window resizes properly
 Scrolling works in job list
Data Persistence:

 Close the app completely
 Reopen from Start Menu
 Previously saved jobs are still there
 Settings persisted
 Theme persisted
 Check database location: open File Explorer, navigate to %LOCALAPPDATA%\FindMyJobAI\ → jobs.db exists
Cleanup:

 Close the app
 Open Task Manager (Ctrl+Shift+Esc)
 Search for "backend" in processes → should NOT be running
 Search for "FindMyJobAI" → should NOT be running
 No zombie processes
Edge Cases:

 Open the app → while loading screen shows, close the app → no zombie processes
 Open the app → start a search → close the app mid-search → no zombie processes → reopen works
 Open the app twice simultaneously → second instance should handle gracefully
SmartScreen (expected):

 Windows Defender SmartScreen may show "Windows protected your PC" — click "More info" → "Run anyway"
 This is NORMAL for unsigned apps and is expected behavior
⏸️ STOP. Report EVERY checkbox result. Wait for permission.

Sub-phase 8.4: Fix Production Issues
If ANY test in 8.3 failed:

Document the EXACT issue and any error messages
Identify the root cause
Propose the fix
WAIT for my approval before making the fix
After fixing:

If backend-related → run .\build_backend.ps1
Run cd frontend && npx tauri build
Uninstall the old app (Settings → Apps → FindMyJobAI → Uninstall)
Install the new build
Retest the failed items
⏸️ STOP after EACH fix attempt. Report results. Wait for permission.

PHASE 9: DOCUMENTATION & CLEANUP
Sub-phase 9.1: Update README.md
ADD these sections to the existing README. Do NOT rewrite existing content.

Add to the Tech Stack section:

Markdown

### Desktop
- **Tauri v2** - Native desktop app framework (Windows)
- **PyInstaller** - Python backend bundling
Add after the existing "Usage" section:

Markdown

## Desktop App (Windows)

FindMyJobAI is available as a standalone Windows desktop application. 
No Python, Node.js, or development tools required.

### Download & Install

1. Download `FindMyJobAI_1.0.0_x64-setup.exe` from the [Releases](link) page
2. Run the installer
3. Launch FindMyJobAI from the Start Menu

> **Note:** Windows Defender SmartScreen may show a warning on first launch because the app is not code-signed. Click "More info" → "Run anyway". This is safe.

### Your Data

Your jobs database and settings are stored at:
%LOCALAPPDATA%\FindMyJobAI\

text

(Usually `C:\Users\YourName\AppData\Local\FindMyJobAI\`)

### Building the Desktop App from Source

**Prerequisites:**
- Python 3.10+
- Node.js 18+
- Rust (install from [rustup.rs](https://rustup.rs))

**Steps:**
```powershell
# 1. Set up backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Build backend executable
cd ..
.\build_backend.ps1

# 3. Build the installer
cd frontend
npm install
npx tauri build

# 4. Find the installer at:
#    frontend\src-tauri\target\release\bundle\nsis\FindMyJobAI_1.0.0_x64-setup.exe
text


**Add to Project Structure:**
```markdown
├── frontend/
│   ├── src-tauri/               # Tauri desktop app
│   │   ├── src/main.rs          # Sidecar process management
│   │   ├── binaries/            # Backend .exe (not in git)
│   │   └── tauri.conf.json      # Window & bundle config
├── build_backend.ps1            # Backend build script
⏸️ STOP. Show me the README additions. Wait for permission.

Sub-phase 9.2: Complete plan3.md
Add the final summary to plans\plan3.md:

Markdown

## Final Summary

### Status: ✅ Complete

### Files Created
| File | Purpose |
|------|---------|
| `backend\run_server.py` | Standalone server entry point for PyInstaller |
| `backend\database_config.py` | OS-aware database path (AppData in production) |
| `backend\findmyjobai.spec` | PyInstaller build configuration |
| `frontend\lib\config.ts` | Centralized API URL |
| `frontend\lib\tauri.ts` | Tauri environment detection |
| `frontend\components\BackendStatus.tsx` | Startup loading screen |
| `frontend\src-tauri\*` | Entire Tauri project |
| `build_backend.ps1` | Backend build script |

### Files Modified
| File | Change |
|------|--------|
| `backend\main.py` | Added /health endpoint + updated DB URL import |
| `frontend\next.config.*` | Added output:'export' + images.unoptimized |
| `frontend\app\layout.tsx` | Wrapped children with BackendStatus |
| `frontend\package.json` | Added Tauri deps and scripts |
| `.gitignore` | Added src-tauri/binaries/ |
| `README.md` | Added Desktop App section |
| (all files where API URLs were centralized) | |

### Edge Cases Handled
| Edge Case | Solution |
|-----------|----------|
| Port 8000 in use | Detected → error message shown |
| Backend already running | Detected → reused without spawning |
| Backend fails to start | 45s timeout → error screen + retry |
| Backend crashes mid-use | Termination event → error shown |
| Window closed during search | Backend killed on close |
| App force-killed | Port check on next launch handles orphan |
| Two instances launched | Second reuses existing backend |
| No Python on user's PC | Not needed — PyInstaller bundles everything |
| Database folder missing | Created automatically |
| Windows SmartScreen | Documented in README |

### Build Artifacts
| Artifact | Size |
|----------|------|
| backend.exe | ~XX MB |
| NSIS installer | ~XX MB |
| MSI installer | ~XX MB |
⏸️ STOP. Show me the final plan3.md. Wait for permission.

EDGE CASES MASTER CHECKLIST
Verify ALL of these are handled before considering the conversion complete:

Sidecar Process Management
 Port 8000 free → sidecar starts normally
 Port 8000 occupied by our backend → reuse it
 Port 8000 occupied by unknown app → clear error message
 Sidecar binary missing → error message (won't crash silently)
 Sidecar crashes after starting → error event sent to frontend
 Backend takes 5-10s to start → loading screen keeps spinning
 Backend takes >45s → timeout error with retry button
 App closed normally → sidecar killed
 App force-killed → next launch detects via port check
 Two instances → second reuses existing backend
 Stdout/stderr from sidecar → piped to prevent buffer deadlock
Frontend
 Static export successful
 All API URLs use CONFIG.API_BASE_URL
 BackendStatus works in Tauri mode (shows "Starting...")
 BackendStatus works in web mode (shows "Connecting...")
 BackendStatus retry button works
 Tauri events (backend-ready, backend-error) received correctly
 isTauri() returns correct value in each mode
 No CSP violations (check browser DevTools console)
Database
 Development: DB in backend\ directory
 Production (.exe): DB in %LOCALAPPDATA%\FindMyJobAI\
 AppData directory created if missing
 DB file created if missing
 Data persists between app restarts
Web Mode Compatibility
 python run_server.py works
 python -m uvicorn main:app --reload works
 npm run dev works
 Browser at localhost:3000 works with backend on 8000
 No visual or functional differences from pre-conversion
Windows-Specific
 .exe sidecar named with -x86_64-pc-windows-msvc.exe suffix
 Console window hidden in release build (windows_subsystem = "windows")
 Installer created (.msi and/or NSIS .exe)
 App appears in Start Menu after installation
 App can be uninstalled from Settings → Apps
 SmartScreen warning documented in README