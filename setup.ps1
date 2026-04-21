# Worktree environment setup script
# Copy untracked configuration files from the main repository that owns the shared .git directory

param(
    [string]$ParentPath = ""
)

$ErrorActionPreference = "Continue"

Write-Host "🔧 Setting up worktree environment..." -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($ParentPath)) {
    $gitCommonDir = git rev-parse --git-common-dir 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($gitCommonDir)) {
        $resolvedGitCommonDir = [System.IO.Path]::GetFullPath($gitCommonDir, (Get-Location).Path)
        $ParentPath = Split-Path -Parent $resolvedGitCommonDir
    } else {
        $ParentPath = "../../../"
    }
}

$resolvedParentPath = [System.IO.Path]::GetFullPath($ParentPath, (Get-Location).Path)
Write-Host "Using parent repo: $resolvedParentPath" -ForegroundColor DarkGray

# Copy backend .env
$backendEnvSource = Join-Path $resolvedParentPath "backend/.env"
$backendEnvDest = "backend/.env"
if (Test-Path $backendEnvSource) {
    Copy-Item $backendEnvSource $backendEnvDest -Force
    Write-Host "✓ Copied backend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠ backend/.env not found in parent repo" -ForegroundColor Yellow
}

# Copy frontend .env files
$frontendEnvSource = Join-Path $resolvedParentPath "frontend"
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
