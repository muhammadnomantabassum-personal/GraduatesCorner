<#
.SYNOPSIS
Non-interactive helper to set Supabase environment variables in Vercel using the Vercel CLI.

DESCRIPTION
This script reads environment variables from the current shell and adds them to the
Vercel project linked in the current working directory.

USAGE
1. Install Vercel CLI: npm i -g vercel or use corepack vercel.
2. Log in: vercel login
3. Link the local folder to the Vercel project if needed: vercel link
4. Set the values in your PowerShell session or system environment:
   $env:NEXT_PUBLIC_SUPABASE_URL = "https://..."
   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "..."
   $env:SUPABASE_SERVICE_ROLE_KEY = "..."  # optional
5. Run: powershell -ExecutionPolicy Bypass -File .\scripts\set-vercel-env-noninteractive.ps1

OPTIONS
  -Preview      Add the variables to Vercel Preview as well.
  -Development  Add the variables to Vercel Development as well.
  -ServiceRole  Include SUPABASE_SERVICE_ROLE_KEY in production only.
#>

param(
    [switch]$Preview,
    [switch]$Development,
    [switch]$ServiceRole
)

function Ensure-Command {
    param([string]$Cmd)
    $which = Get-Command $Cmd -ErrorAction SilentlyContinue
    if (-not $which) {
        Write-Host "Command '$Cmd' not found. Please install it and re-run this script." -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Add-Env {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Target
    )

    Write-Host "Adding $Name to $Target..." -ForegroundColor Green
    $Value | & vercel env add $Name $Target --yes --force

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to add $Name to $Target." -ForegroundColor Red
        throw "Vercel CLI returned exit code $LASTEXITCODE"
    }
}

function Get-EnvValue {
    param([string]$Name)
    return [Environment]::GetEnvironmentVariable($Name, 'Process')
}

if (-not (Ensure-Command 'vercel')) {
    exit 1
}

$required = @('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
$missing = @()
foreach ($name in $required) {
    if (-not [string]::IsNullOrEmpty((Get-EnvValue $name))) { continue }
    $missing += $name
}
if ($missing.Count -gt 0) {
    Write-Host "Missing required environment variables: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Set them in your PowerShell session and rerun the script." -ForegroundColor Yellow
    exit 1
}

$supabaseUrl = Get-EnvValue 'NEXT_PUBLIC_SUPABASE_URL'
$supabaseAnonKey = Get-EnvValue 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
$supabaseServiceRoleKey = Get-EnvValue 'SUPABASE_SERVICE_ROLE_KEY'

Add-Env 'NEXT_PUBLIC_SUPABASE_URL' $supabaseUrl 'production'
Add-Env 'NEXT_PUBLIC_SUPABASE_ANON_KEY' $supabaseAnonKey 'production'

if ($ServiceRole) {
    if (-not [string]::IsNullOrEmpty($supabaseServiceRoleKey)) {
        Add-Env 'SUPABASE_SERVICE_ROLE_KEY' $supabaseServiceRoleKey 'production'
    } else {
        Write-Host "SUPABASE_SERVICE_ROLE_KEY is not set, skipping service role key." -ForegroundColor Yellow
    }
}

if ($Preview) {
    Add-Env 'NEXT_PUBLIC_SUPABASE_URL' $supabaseUrl 'preview'
    Add-Env 'NEXT_PUBLIC_SUPABASE_ANON_KEY' $supabaseAnonKey 'preview'
    if ($ServiceRole -and -not [string]::IsNullOrEmpty($supabaseServiceRoleKey)) {
        Add-Env 'SUPABASE_SERVICE_ROLE_KEY' $supabaseServiceRoleKey 'preview'
    }
}

if ($Development) {
    Add-Env 'NEXT_PUBLIC_SUPABASE_URL' $supabaseUrl 'development'
    Add-Env 'NEXT_PUBLIC_SUPABASE_ANON_KEY' $supabaseAnonKey 'development'
    if ($ServiceRole -and -not [string]::IsNullOrEmpty($supabaseServiceRoleKey)) {
        Add-Env 'SUPABASE_SERVICE_ROLE_KEY' $supabaseServiceRoleKey 'development'
    }
}

Write-Host "Environment variables configured successfully." -ForegroundColor Cyan
Write-Host "If you need to trigger a new Vercel deployment, push a new commit or create an empty commit." -ForegroundColor Cyan
