Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$BackendPort = 3004
$FrontendPort = 5173
$BackendHealthUrl = "http://localhost:$BackendPort/health"
$FrontendUrl = "http://localhost:$FrontendPort"

$startedJobs = @()

function Test-TcpPortReady {
	param(
		[int]$Port
	)

	$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
	return [bool]$connection
}

function Wait-TcpPortReady {
	param(
		[int]$Port,
		[int]$TimeoutSeconds,
		[string]$Label
	)

	$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		if (Test-TcpPortReady -Port $Port) {
			Write-Output "[OK] $Label is listening on port $Port"
			return
		}
		Start-Sleep -Seconds 1
	}

	throw "$Label did not start listening on port $Port within $TimeoutSeconds seconds."
}

function Wait-HttpReady {
	param(
		[string]$Url,
		[int]$TimeoutSeconds,
		[string]$Label
	)

	$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		try {
			$response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
			if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
				Write-Output "[OK] $Label responded at $Url"
				return
			}
		}
		catch {
			Start-Sleep -Seconds 1
			continue
		}

		Start-Sleep -Seconds 1
	}

	throw "$Label did not respond at $Url within $TimeoutSeconds seconds."
}

function Start-BackgroundCommand {
	param(
		[string]$Name,
		[string]$WorkingDirectory,
		[string]$Command
	)

	Write-Output "[+] Starting $Name..."
	$job = Start-Job -Name $Name -ScriptBlock {
		param($dir, $cmd)
		Set-Location $dir
		cmd /c $cmd
	} -ArgumentList $WorkingDirectory, $Command
	$script:startedJobs += $job
	$jobId = $job.Id
	Write-Output "[OK] $Name started in background job $jobId"
}

function Ensure-DockerMySql {
	Write-Output "[+] Checking Docker status..."
	docker info > $null 2>&1
	if ($LASTEXITCODE -ne 0) {
		throw "Docker is not running. Start Docker Desktop and retry."
	}

	Write-Output "[+] Checking MySQL container status..."
	$mysqlRunning = docker ps --format "{{.Names}}" | Select-String "lovey-record-mysql"
	if ($mysqlRunning) {
		Write-Output "[OK] MySQL container already running"
		return
	}

	Write-Output "[+] Starting MySQL container..."
	Set-Location $BackendDir
	docker-compose up -d db | Out-Host

	$deadline = (Get-Date).AddSeconds(45)
	while ((Get-Date) -lt $deadline) {
		$ping = docker exec lovey-record-mysql mysqladmin ping -h localhost -u root -ppassword 2>&1
		if ($ping -match "alive") {
			Write-Output "[OK] MySQL is healthy"
			return
		}
		Start-Sleep -Seconds 1
	}

	throw "MySQL container did not become healthy within 45 seconds."
}

try {
	Write-Output "[+] Preparing menstrual live regression prerequisites..."

	Ensure-DockerMySql

	if (-not (Test-TcpPortReady -Port $FrontendPort)) {
		Start-BackgroundCommand -Name "lovey-frontend-h5" -WorkingDirectory $FrontendDir -Command "npm.cmd run dev:h5"
	}
	else {
		Write-Output "[OK] Frontend dev server already listening on port $FrontendPort"
	}

	if (-not (Test-TcpPortReady -Port $BackendPort)) {
		Start-BackgroundCommand -Name "lovey-backend-dev" -WorkingDirectory $BackendDir -Command "npm.cmd run dev"
	}
	else {
		Write-Output "[OK] Backend dev server already listening on port $BackendPort"
	}

	Wait-TcpPortReady -Port $FrontendPort -TimeoutSeconds 30 -Label "Frontend dev server"
	Wait-HttpReady -Url $FrontendUrl -TimeoutSeconds 45 -Label "Frontend dev server"
	Wait-TcpPortReady -Port $BackendPort -TimeoutSeconds 30 -Label "Backend dev server"
	Wait-HttpReady -Url $BackendHealthUrl -TimeoutSeconds 45 -Label "Backend health endpoint"

	Write-Output "[+] Running Playwright menstrual live regression..."
	Set-Location $RepoRoot
	cmd /c npm.cmd run test:menstrual:live
	if ($LASTEXITCODE -ne 0) {
		throw "Playwright live regression failed with exit code $LASTEXITCODE."
	}
}
finally {
	foreach ($job in $startedJobs) {
		if ($job.State -eq "Running") {
			$jobId = $job.Id
			$jobName = $job.Name
			Write-Output "[+] Stopping background job $jobName ($jobId)..."
			Stop-Job -Id $jobId -ErrorAction SilentlyContinue
		}
		Receive-Job -Id $job.Id -Keep -ErrorAction SilentlyContinue | Out-Null
		Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue
	}
}
