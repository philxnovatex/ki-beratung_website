# Start-dev helper for Windows PowerShell
# Usage: Open PowerShell in the project root and run: .\scripts\start-dev.ps1
# This script will:
# - check for node and npm
# - run `npm install` if needed
# - run `npm run dev` to start the local dev server

n$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
n$projectRoot = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $projectRoot

nWrite-Host "Project root: $projectRoot"

# Check node & npm availability
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install Node.js from https://nodejs.org/ (LTS recommended) and re-run this script." -ForegroundColor Yellow
    exit 1
}
if (-not $npmCmd) {
    Write-Host "npm is not available. It usually comes with Node.js." -ForegroundColor Red
    Write-Host "Install Node.js (which includes npm) and re-run this script." -ForegroundColor Yellow
    exit 1
}

nWrite-Host "Node: $(node -v)    npm: $(npm -v)" -ForegroundColor Green

n# Install deps
Write-Host "Running npm install... (this may take a moment)" -NoNewline
$install = Start-Process npm -ArgumentList 'install' -NoNewWindow -Wait -PassThru
nif ($install.ExitCode -ne 0) { Write-Host "\n'npm install' failed with exit code $($install.ExitCode)" -ForegroundColor Red; exit $install.ExitCode }
Write-Host " Done." -ForegroundColor Green

n# Start dev server
nWrite-Host "Starting dev server (npm run dev). Press Ctrl+C to stop." -ForegroundColor Cyan
# Use Start-Process without -NoNewWindow so logs are visible in this terminal session
n$proc = Start-Process npm -ArgumentList 'run','dev' -NoNewWindow -Wait -PassThru
nexit $proc.ExitCode
