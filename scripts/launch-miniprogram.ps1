param(
    [ValidateSet('launch', 'publish')]
    [string]$Action = 'launch',

    [string]$Project = 'frontend',

    [string]$AppId = 'wxb2138aeebaa94c85',

    [switch]$RuntimeLog = $true
)

$ErrorActionPreference = "Stop"

$HBuilderXPath = "D:\Program Files\HBuilderX\HBuilderX.exe"
$HBuilderXCliPath = "D:\Program Files\HBuilderX\cli.exe"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ProjectPath = Join-Path $RepoRoot $Project

Write-Output "[+] HBuilderX Mini Program Launcher"
Write-Output "    Repository: $RepoRoot"
Write-Output "    Project: $ProjectPath"
Write-Output "    Action: $Action"
Write-Output ""

# 验证项目路径
if (-not (Test-Path $ProjectPath)) {
    throw "Project path not found: $ProjectPath"
}

# 验证 manifest.json
$ManifestPath = Join-Path $ProjectPath "manifest.json"
if (-not (Test-Path $ManifestPath)) {
    throw "manifest.json not found in project: $ManifestPath"
}

Write-Output "[+] Verified project structure"
Write-Output "    manifest.json: $ManifestPath"
Write-Output ""

# 确定使用的 CLI 工具
$CLIExecutable = if (Test-Path $HBuilderXCliPath) { $HBuilderXCliPath } else { $HBuilderXPath }
$IsExternalCLI = ($CLIExecutable -eq $HBuilderXCliPath)

Write-Output "[+] Using HBuilderX CLI: $CLIExecutable"
Write-Output "    External CLI: $IsExternalCLI"
Write-Output ""

# 构建命令参数
$CLIArgs = @()

if ($Action -eq 'launch') {
    Write-Output "[+] Launching mini program for debugging..."
    Write-Output "    This will open HBuilderX and start debugging in WeChat Developer Tools"
    Write-Output ""

    if ($IsExternalCLI) {
        # 使用外部 CLI
        $CLIArgs = @(
            'launch',
            'mp-weixin',
            '--project', $ProjectPath,
            '--runtime-log', 'true'
        )
        if ($AppId) {
            $CLIArgs += @('--appid', $AppId)
        }
    } else {
        # 使用 HBuilderX 主程序
        $CLIArgs = @(
            '--cli',
            'launch',
            'mp-weixin',
            '--project', $ProjectPath,
            '--runtime-log', 'true'
        )
        if ($AppId) {
            $CLIArgs += @('--appid', $AppId)
        }
    }
}
elseif ($Action -eq 'publish') {
    Write-Output "[+] Publishing mini program..."
    if (-not $AppId) {
        throw "AppId is required for publish action"
    }

    if ($IsExternalCLI) {
        $CLIArgs = @(
            'publish',
            '--platform', 'mp-weixin',
            '--project', $ProjectPath,
            '--appid', $AppId
        )
    } else {
        $CLIArgs = @(
            '--cli',
            'publish',
            '--platform', 'mp-weixin',
            '--project', $ProjectPath,
            '--appid', $AppId
        )
    }
}

Write-Output "[+] Executing command..."
Write-Output "    Executable: $CLIExecutable"
Write-Output "    Arguments: $($CLIArgs -join ' ')"
Write-Output ""

# 执行命令
try {
    & $CLIExecutable @CLIArgs

    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
        Write-Output ""
        Write-Output "[OK] $Action completed successfully"
        if ($Action -eq 'launch') {
            Write-Output "     Mini program is now running in WeChat Developer Tools"
            Write-Output "     Check HBuilderX and the WeChat Developer Tools windows"
        }
        elseif ($Action -eq 'publish') {
            Write-Output "     Project has been compiled and opened in WeChat Developer Tools"
            Write-Output "     Review the build and upload when ready"
        }
    }
    else {
        Write-Output "[!] HBuilderX CLI exited with code: $LASTEXITCODE"
        Write-Output "    This may be normal if the operation completed successfully"
        Write-Output "    Check HBuilderX and WeChat Developer Tools for the results"
    }
}
catch {
    Write-Error "Error executing HBuilderX CLI: $_"
    Write-Output ""
    Write-Output "[*] Troubleshooting tips:"
    Write-Output "    1. Ensure HBuilderX is installed at: D:\Program Files\HBuilderX\"
    Write-Output "    2. Ensure WeChat Developer Tools is installed"
    Write-Output "    3. Check project path: $ProjectPath"
    Write-Output "    4. Verify manifest.json has mp-weixin configuration"
    exit 1
}
