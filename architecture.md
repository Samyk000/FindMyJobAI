text

User downloads FindMyJobAI.msi (or .dmg / .AppImage)
↓ Installs
┌─────────────────────────────────────────┐
│          FindMyJobAI Desktop App        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   OS Webview (not Chromium)       │  │
│  │   Renders your Next.js frontend   │  │
│  │   (pre-built static HTML/CSS/JS)  │  │
│  └──────────────┬────────────────────┘  │
│                 │ fetch("127.0.0.1:8000")│
│  ┌──────────────▼────────────────────┐  │
│  │   backend.exe (PyInstaller)       │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │ FastAPI + python-jobspy │     │  │
│  │   │ SQLite + all Python deps│     │  │
│  │   │ Everything bundled      │     │  │
│  │   └─────────────────────────┘     │  │
│  │   Launched as "sidecar" process   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  User needs: NOTHING. No Python.        │
│  No Node. No terminal. Just install.    │
└─────────────────────────────────────────┘