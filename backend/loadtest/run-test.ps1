# WastePH Load Test Runner (PowerShell)
# Runs load test against the hosted Render.com backend

$ErrorActionPreference = "Stop"

# Colors
function Write-Color {
    param([string]$Color, [string]$Text)
    Write-Host $Text -ForegroundColor $Color
}

Write-Color Blue "========================================"
Write-Color Blue "  WastePH Load Test Runner"
Write-Color Blue "========================================"
Write-Host ""

# Check if k6 is installed
try {
    $null = Get-Command k6 -ErrorAction Stop
    Write-Color Green "✅ k6 is installed"
    Write-Host ""
} catch {
    Write-Color Red "❌ Error: k6 is not installed"
    Write-Host ""
    Write-Host "Install k6:"
    Write-Host "  - Windows: choco install k6"
    Write-Host "  - Or download from: https://k6.io/docs/getting-started/installation/"
    Write-Host ""
    exit 1
}

# Get backend URL
$BASE_URL = $env:BASE_URL
if (-not $BASE_URL) {
    Write-Color Yellow "⚠️  BASE_URL not set in environment"
    Write-Host ""
    Write-Host "Please set your Render.com backend URL:"
    $BASE_URL = Read-Host "Enter backend URL (e.g., https://wasteph-backend.onrender.com/api)"
    Write-Host ""
}

if (-not $BASE_URL) {
    Write-Color Red "❌ No backend URL provided. Exiting."
    exit 1
}

Write-Color Blue "Target: $BASE_URL"
Write-Host ""

# Ask if user wants to seed data
Write-Color Yellow "Do you want to seed test users and data first?"
Write-Host "  This requires your database connection to be configured."
$seedChoice = Read-Host "Seed data? (y/n)"
Write-Host ""

if ($seedChoice -match "^[Yy]$") {
    Write-Color Blue "📦 Seeding test users..."
    Push-Location ..
    
    try {
        npm run seed:loadtest-users
        if ($LASTEXITCODE -ne 0) { throw "Seed users failed" }
    } catch {
        Write-Color Red "❌ Failed to seed users"
        Pop-Location
        exit 1
    }
    
    Write-Host ""
    Write-Color Blue "📦 Seeding test data..."
    
    try {
        npm run seed:loadtest-data
        if ($LASTEXITCODE -ne 0) { throw "Seed data failed" }
    } catch {
        Write-Color Red "❌ Failed to seed data"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host ""
}

# Run the load test
Write-Color Blue "========================================"
Write-Color Blue "🚀 Starting Load Test"
Write-Color Blue "========================================"
Write-Host ""
Write-Host "Configuration:"
Write-Host "  - Virtual Users: 6 concurrent staff"
Write-Host "  - Duration: 6 minutes"
Write-Host "  - Backend: $BASE_URL"
Write-Host ""
Write-Color Yellow "Press Ctrl+C to stop the test"
Write-Host ""

# Create results directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "results" | Out-Null

# Generate timestamp for results file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsFile = "results/results_$timestamp.json"

# Run k6 with JSON output
$env:BASE_URL = $BASE_URL
k6 run --out "json=$resultsFile" staff-workflow.js

Write-Host ""
Write-Color Blue "========================================"
Write-Color Green "✅ Load Test Complete"
Write-Color Blue "========================================"
Write-Host ""
Write-Host "Results saved to: $resultsFile"
Write-Host ""
Write-Color Yellow "Next steps:"
Write-Host "  1. Review the summary above"
Write-Host "  2. Check if all thresholds passed (✓)"
Write-Host "  3. Document results in RESULTS.md"
Write-Host ""
Write-Host "Key metrics to check:"
Write-Host "  - http_req_duration p95 < 2000ms"
Write-Host "  - http_req_failed rate < 5%"
Write-Host "  - checks rate > 95%"
Write-Host ""
