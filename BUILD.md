# Building FindMyJobAI Desktop Application

This document provides detailed instructions for building the FindMyJobAI Windows desktop application from source.

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose | Download |
|----------|----------------|---------|----------|
| Python | 3.10+ | Backend runtime | https://python.org |
| Node.js | 18+ | Frontend build | https://nodejs.org |
| Rust | 1.70+ | Tauri compilation | https://rustup.rs |
| Cargo | 1.70+ | Rust package manager | Included with Rust |

### Verifying Prerequisites

```bash
# Check Python
python --version  # Should be 3.10 or higher

# Check Node.js
node --version    # Should be v18 or higher
npm --version

# Check Rust and Cargo
rustc --version
cargo --version
```

## Build Process

### Step 1: Build the Backend Executable

The backend is bundled using PyInstaller into a standalone executable.

```bash
# Navigate to project root
cd linkedin-job-bot

# Run the build script
.\build_backend.ps1
```

**What this does:**
1. Activates Python environment
2. Runs PyInstaller with the spec file `backend/findmyjobai.spec`
3. Bundles all Python dependencies including tls_client, jobspy, certifi
4. Creates `backend/dist/backend.exe`
5. Copies the executable to `frontend/src-tauri/binaries/backend-x86_64-pc-windows-msvc.exe`

**Expected output:**
- Binary size: ~98-103 MB
- Location: `frontend\src-tauri\binaries\backend-x86_64-pc-windows-msvc.exe`

**Troubleshooting:**
- If you get `PermissionError: [WinError 5] Access is denied`, kill any running `backend.exe` processes:
  ```bash
  taskkill /f /im backend.exe
  ```
- If PyInstaller is not found:
  ```bash
  pip install pyinstaller>=6.0.0
  ```

### Step 2: Build the Tauri Application

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Build the Tauri application
npx tauri build
```

**What this does:**
1. Runs `npm run build` to create Next.js static export
2. Compiles Rust code in release mode
3. Bundles everything into Windows installers

**Build time:** ~4-5 minutes for Rust compilation

**Expected output:**
```
Finished 2 bundles at:
    frontend\src-tauri\target\release\bundle\msi\FindMyJobAI_1.0.0_x64_en-US.msi
    frontend\src-tauri\target\release\bundle\nsis\FindMyJobAI_1.0.0_x64-setup.exe
```

## Output Files

| File | Size | Description |
|------|------|-------------|
| `FindMyJobAI_1.0.0_x64-setup.exe` | ~100 MB | NSIS installer (recommended) |
| `FindMyJobAI_1.0.0_x64_en-US.msi` | ~102 MB | MSI installer |

## Development Mode

For development, you can run the app without building:

```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Start Tauri dev mode
cd frontend
npm run tauri:dev
```

## Project Structure (Desktop App Files)

```
linkedin-job-bot/
├── build_backend.ps1           # Backend build script
├── backend/
│   ├── run_server.py           # Standalone entry point
│   ├── database_config.py      # OS-aware database path
│   ├── findmyjobai.spec        # PyInstaller configuration
│   └── dist/
│       └── backend.exe         # Built backend executable
└── frontend/
    ├── lib/
    │   ├── config.ts           # Centralized API URL
    │   └── tauri.ts            # Tauri detection utility
    ├── components/
    │   └── BackendStatus.tsx   # Loading screen with backend health check
    ├── src-tauri/
    │   ├── src/
    │   │   └── lib.rs          # Rust sidecar management
    │   ├── binaries/
    │   │   └── backend-x86_64-pc-windows-msvc.exe  # Sidecar binary
    │   ├── tauri.conf.json     # Tauri configuration
    │   ├── capabilities/
    │   │   └── default.json    # Shell permissions
    │   └── target/
    │       └── release/
    │           └── bundle/
    │               ├── msi/    # MSI installer
    │               └── nsis/   # NSIS installer
    └── next.config.ts          # Static export config
```

## Key Technical Details

### Frozen Mode Detection

The backend detects when it's running as a bundled executable:

```python
# backend/database_config.py
def is_frozen() -> bool:
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')
```

### Database Path

- **Development**: `backend/jobs.db`
- **Production (Desktop)**: `%LOCALAPPDATA%\FindMyJobAI\jobs.db`

### Sidecar Communication

1. Tauri spawns `backend.exe` as a hidden process
2. Backend starts on `http://127.0.0.1:8000`
3. Frontend polls `/health` endpoint until ready
4. On window close, Tauri kills the backend process

### Health Check

The backend exposes a health endpoint at `/health`:

```bash
curl http://127.0.0.1:8000/health
# Response: {"status": "healthy"}
```

## Common Issues

### 1. "backend.exe is locked"

**Cause:** Previous instance still running

**Solution:**
```bash
taskkill /f /im backend.exe
```

### 2. "tls-client-64.dll not found"

**Cause:** PyInstaller didn't bundle tls_client properly

**Solution:** The spec file includes `collect_all('tls_client')`. Rebuild with:
```bash
pyinstaller backend/findmyjobai.spec
```

### 3. "WebView2 not found"

**Cause:** Windows doesn't have WebView2 runtime

**Solution:** Install WebView2 from Microsoft:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 4. Hydration Mismatch Error

**Cause:** `isTauri()` returns different values on server vs client

**Solution:** Use `mounted` state pattern in React components:
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <LoadingScreen />;
```

### 5. Port 8000 Already in Use

**Cause:** Another service using port 8000

**Solution:** Kill the process or change the port in:
- `backend/run_server.py`
- `frontend/lib/config.ts`
- `frontend/src-tauri/src/lib.rs`

## Updating the Application

### Version Number

Update in `frontend/src-tauri/tauri.conf.json`:
```json
{
  "version": "1.0.1"
}
```

### After Code Changes

1. Rebuild backend if backend code changed:
   ```bash
   .\build_backend.ps1
   ```

2. Rebuild Tauri:
   ```bash
   cd frontend && npx tauri build
   ```

## Distribution

The installers are self-contained and include:
- The entire backend (Python runtime + dependencies)
- The frontend (static HTML/CSS/JS)
- WebView2 loader (uses system WebView2 runtime)

Users only need:
- Windows 10/11
- WebView2 runtime (usually pre-installed on Windows 11)
