<#
.SYNOPSIS
    Content Correctness Audit - Codex Agent Launcher
.DESCRIPTION
    Called by Windows Task Scheduler at 09:15 daily.
    Prepares context data, then invokes Codex with the audit prompt.

    Windows Task Scheduler setup:
      Trigger:   Daily at 09:15
      Action:    powershell.exe -ExecutionPolicy Bypass -File "scripts\invoke_content_audit.ps1"
      Start in:  D:\CodeSpace\hbuilder-projects\lovey-record-backend
#>

param(
    [string]$RepoRoot = "D:\CodeSpace\hbuilder-projects\lovey-record-backend"
)

Set-Location $RepoRoot

# ── Step 1: Run Document Audit ────────────────────────────────────────────────
Write-Host "[1/3] Running Document Audit..."
python scripts\run_doc_audit.py --mode daily
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Document Audit failed (exit $LASTEXITCODE). Continuing anyway."
}

# ── Step 2: Collect document metadata ─────────────────────────────────────────
Write-Host "[2/3] Collecting document metadata..."
python scripts\content_audit\data_collector.py `
    --repo-root . `
    --output docs\generated\metadata.json
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Metadata collection failed (exit $LASTEXITCODE). Continuing anyway."
}

# ── Step 3: Invoke Codex agent ────────────────────────────────────────────────
Write-Host "[3/3] Invoking Codex content audit agent..."

$Prompt = @"
Read scripts/content_audit/AGENTS.md for your full role and instructions.

Then execute the audit:
1. Read docs/generated/latest-report.md and docs/generated/metadata.json as starting context
2. For each governance/design/plan doc: find the corresponding code and compare
3. Document diffs between what docs claim and what code actually does
4. Write findings to: docs/generated/latest-recommendations.md

Do not modify any files other than the output report.
"@

codex $Prompt

$ExitCode = $LASTEXITCODE

# ── Notify ────────────────────────────────────────────────────────────────────
if ($ExitCode -eq 0) {
    Write-Host "Done. Report: docs\generated\latest-recommendations.md"
    New-BurntToastNotification `
        -Text "Codex任务完成", "内容审核报告已生成" `
        -ErrorAction SilentlyContinue
} else {
    Write-Warning "Codex agent failed (exit $ExitCode)."
    New-BurntToastNotification `
        -Text "Codex任务失败", "内容审核未完成，请检查日志" `
        -ErrorAction SilentlyContinue
    exit 1
}
