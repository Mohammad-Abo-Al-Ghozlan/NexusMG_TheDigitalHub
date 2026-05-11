# Isolated environment for NexusMG — avoids conflicts with other projects (e.g. career-hub-backend) in global site-packages.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
Write-Host ""
Write-Host "NexusMG backend venv ready. Activate later with:"
Write-Host "  cd $PSScriptRoot; .\.venv\Scripts\Activate.ps1"
