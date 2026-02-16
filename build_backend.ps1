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
