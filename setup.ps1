# Worktree environment setup script
# Copy untracked configuration files from parent repository

param(
    [string]$ParentPath = "../../../"
)

$ErrorActionPreference = "Continue"

Write-Host "🔧 Setting up worktree environment..." -ForegroundColor Cyan

# Copy backend .env
$backendEnvSource = Join-Path $ParentPath "backend/.env"
$backendEnvDest = "backend/.env"
if (Test-Path $backendEnvSource) {
    Copy-Item $backendEnvSource $backendEnvDest -Force
    Write-Host "✓ Copied backend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠ backend/.env not found in parent repo" -ForegroundColor Yellow
}

# Copy frontend .env files
$frontendEnvSource = Join-Path $ParentPath "frontend"
$frontendEnvDest = "frontend"
if (Test-Path $frontendEnvSource) {
    Get-ChildItem "$frontendEnvSource/.env*" -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName "$frontendEnvDest/$($_.Name)" -Force
        Write-Host "✓ Copied frontend/$($_.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ frontend directory not found" -ForegroundColor Yellow
}

Write-Host "`n✅ Worktree setup complete!" -ForegroundColor Green
