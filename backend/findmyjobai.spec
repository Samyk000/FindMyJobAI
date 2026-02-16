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

# tls_client — required by jobspy, has DLL dependencies
tls_client_datas, tls_client_binaries, tls_client_hiddenimports = collect_all('tls_client')

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

    # --- Rate Limiting (slowapi) ---
    'slowapi',
    'slowapi.errors',
    'slowapi.extension',
    'slowapi.middleware',
    'slowapi.util',
    'limits',
    'limits.storage',
    'limits.strategies',
    'prison',

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
    + tls_client_hiddenimports
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
    binaries=jobspy_binaries + certifi_binaries + tls_client_binaries,
    datas=backend_datas + jobspy_datas + certifi_datas + tls_client_datas,
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
