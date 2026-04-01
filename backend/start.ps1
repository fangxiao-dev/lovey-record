$ErrorActionPreference = "Continue"

$BACKEND_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Output "[+] Starting Lovey Record Backend..."

# Check if Docker is running
Write-Output "[+] Checking Docker status..."
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "[!] Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check if MySQL container is already running
Write-Output "[+] Checking MySQL container status..."
$mysqlRunning = docker ps --format "{{.Names}}" | Select-String "lovey-record-mysql"
if ($mysqlRunning) {
    Write-Output "[+] MySQL container is already running, skipping startup"
} else {
    Write-Output "[+] Starting MySQL container..."
    Set-Location $BACKEND_DIR
    docker-compose up -d db

    Write-Output "[...] Waiting for MySQL to be healthy..."
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        $ping = docker exec lovey-record-mysql mysqladmin ping -h localhost -u root -ppassword 2>&1
        if ($ping -match "alive") {
            Write-Output "[OK] MySQL is ready!"
            break
        }
        $attempt++
        if ($attempt -eq $maxAttempts) {
            Write-Output "[!] MySQL failed to start after $maxAttempts attempts"
            exit 1
        }
        Start-Sleep -Seconds 1
    }
}

# Kill existing server on port 3004 if running
Write-Output "[+] Checking if backend server is running on port 3004..."
$portInUse = Get-NetTcpConnection -LocalPort 3004 -ErrorAction SilentlyContinue
if ($portInUse) {
    $processPid = $portInUse.OwningProcess
    Write-Output "[+] Backend server already running (PID $processPid), killing and restarting..."
    Stop-Process -Id $processPid -Force
    Start-Sleep -Seconds 2
}

# Start frontend H5 dev server (background)
Write-Output "[+] Starting frontend H5 dev server on port 5173..."
$frontendDir = Join-Path $BACKEND_DIR "..\frontend"
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev:h5
} -ArgumentList $frontendDir
Write-Output "[OK] Frontend starting in background (job ID: $($frontendJob.Id))"

# Start backend server
Write-Output "[+] Starting backend server on port 3004..."
Set-Location $BACKEND_DIR
npm run dev
