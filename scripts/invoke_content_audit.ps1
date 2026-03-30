<#
.SYNOPSIS
    Document Defect Audit — Codex Agent Launcher
.DESCRIPTION
    Called by Windows Task Scheduler at 09:15 daily.
    Launches the Codex agent which handles both audit layers internally:
      Layer 1 (structural): runs python scripts/run_doc_audit.py
      Layer 2 (content):    verifies doc claims using code/Playwright/Pencil/tools

    Windows Task Scheduler setup:
      Trigger:   Daily at 09:15
      Action:    powershell.exe -ExecutionPolicy Bypass -File "scripts\invoke_content_audit.ps1"
      Start in:  D:\CodeSpace\hbuilder-projects\lovey-record-backend
#>

param(
    [string]$RepoRoot = "D:\CodeSpace\hbuilder-projects\lovey-record-backend"
)

Set-Location $RepoRoot

$Today     = Get-Date -Format "yyyy-MM-dd"
$AuditDir  = "docs\generated\doc-audit\$Today"
$ReportOut = "$AuditDir\full-audit-report.md"

Write-Host "[$Today] Starting document defect audit..."
New-Item -ItemType Directory -Force -Path $AuditDir | Out-Null

$Prompt = @"
Read scripts/content_audit/AGENTS.md for your full role and instructions.

Today's date is $Today.
Today's audit directory is: $AuditDir

Execute the full two-layer document defect audit and write the report to:
$ReportOut
"@

codex $Prompt

$ExitCode = $LASTEXITCODE

if ($ExitCode -eq 0) {
    Write-Host "Done. Report: $ReportOut"
    New-BurntToastNotification `
        -Text "文档审核完成", "查看: $ReportOut" `
        -ErrorAction SilentlyContinue
} else {
    Write-Warning "Codex agent failed (exit $ExitCode)."
    New-BurntToastNotification `
        -Text "文档审核失败", "请检查日志" `
        -ErrorAction SilentlyContinue
    exit 1
}
