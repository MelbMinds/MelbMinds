#!/usr/bin/env pwsh
# Switch between local and remote backend environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "remote")]
    [string]$Environment
)

$ClientDir = Split-Path -Parent $MyInvocation.MyCommand.Path

switch ($Environment) {
    "local" {
        Write-Host "Switching to LOCAL development environment..."
        Write-Host "Backend: http://localhost:8000"
        Copy-Item "$ClientDir\.env.local" "$ClientDir\.env.local.bak" -Force -ErrorAction SilentlyContinue
        @"
# Local development environment variables
# This file is for local development - uses local Django server
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
"@ | Out-File "$ClientDir\.env.local" -Encoding utf8
        Write-Host "✅ Switched to local backend"
        Write-Host "Make sure your Django server is running: python manage.py runserver"
    }
    "remote" {
        Write-Host "Switching to REMOTE production environment..."
        if (Test-Path "$ClientDir\.env.production") {
            Copy-Item "$ClientDir\.env.production" "$ClientDir\.env.local" -Force
            Write-Host "✅ Switched to remote backend"
            Write-Host "⚠️  Make sure to update the URL in .env.production with your actual Railway URL"
        } else {
            Write-Host "❌ .env.production file not found!"
            Write-Host "Please create .env.production with your Railway backend URL"
        }
    }
}

Write-Host ""
Write-Host "Current configuration:"
if (Test-Path "$ClientDir\.env.local") {
    Get-Content "$ClientDir\.env.local"
} else {
    Write-Host "No .env.local file found"
}
