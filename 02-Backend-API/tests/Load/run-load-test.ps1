# ==============================================================================
# Script: run-load-test.ps1
# Purpose: Execute k6 performance and load test against staging or local API
# ==============================================================================
[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1",
    [string]$Vus = "50",
    [string]$Duration = "1m"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AIN PLATFORM - MARKETPLACE LOAD TEST RUNNER        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target URL: $BaseUrl"
Write-Host "Virtual Users: $Vus"
Write-Host "Duration: $Duration"

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Warning "k6 is not detected on PATH. Installing via winget or downloading..."
    Write-Host "Run: winget install k6 --source winget" -ForegroundColor Yellow
    Write-Host "Or install via: choco install k6" -ForegroundColor Yellow
    Write-Host "Or download standalone binary from: https://github.com/grafana/k6/releases" -ForegroundColor Yellow
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TestScript = "$ScriptDir\k6-marketplace-load-test.js"

& k6 run --env "BASE_URL=$BaseUrl" "$TestScript"
