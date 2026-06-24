<#
.SYNOPSIS
Interactive helper to add Supabase environment variables to a Vercel project using the Vercel CLI.

USAGE
1. Install Vercel CLI: `npm i -g vercel` or use `corepack vercel`
2. Login: `vercel login`
3. Run this script: `powershell -ExecutionPolicy Bypass -File .\scripts\set-vercel-env.ps1`

This script calls `vercel env add` for Production/Preview/Development as you choose.
It does NOT store secrets in this repository — you will paste them interactively when prompted.
#>

function Ensure-Command {
    param([string]$Cmd)
    $which = Get-Command $Cmd -ErrorAction SilentlyContinue
    if (-not $which) {
        Write-Host "Command '$Cmd' not found. Please install it and re-run this script." -ForegroundColor Yellow
        return $false
    }
    return $true
}

if (-not (Ensure-Command 'vercel')) {
    Write-Host "Install Vercel CLI globally (npm i -g vercel) or run via corepack and retry." -ForegroundColor Red
    exit 1
}

Write-Host "This script will run 'vercel env add' for each variable and prompt you to paste the secret when required." -ForegroundColor Cyan
Write-Host "Make sure you are logged in: vercel login" -ForegroundColor Cyan

$null = Read-Host "Press Enter to continue (or Ctrl+C to cancel)"

function Add-EnvInteractive($name) {
    Write-Host "\nAdding $name to Production (you will be prompted to paste its value)..." -ForegroundColor Green
    vercel env add $name production

    $addPreview = Read-Host "Add $name to Preview environment as well? (y/N)"
    if ($addPreview -match '^[Yy]') {
        Write-Host "Adding $name to Preview (you will be prompted)..." -ForegroundColor Green
        vercel env add $name preview
    }

    $addDev = Read-Host "Add $name to Development (.env.local) as well? (y/N)"
    if ($addDev -match '^[Yy]') {
        Write-Host "Adding $name to Development (you will be prompted)..." -ForegroundColor Green
        vercel env add $name development
    }
}

Add-EnvInteractive 'NEXT_PUBLIC_SUPABASE_URL'
Add-EnvInteractive 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

$addService = Read-Host "Do you want to add the service role key (SUPABASE_SERVICE_ROLE_KEY)? This should be server-only. (y/N)"
if ($addService -match '^[Yy]') {
    Write-Host "Adding SUPABASE_SERVICE_ROLE_KEY to Production only (server key)." -ForegroundColor Yellow
    vercel env add SUPABASE_SERVICE_ROLE_KEY production
}

Write-Host "\nDone. Trigger a redeploy from the Vercel dashboard or push an empty commit:`n  git commit --allow-empty -m 'chore: trigger vercel redeploy'`" -ForegroundColor Cyan
