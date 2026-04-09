#!/usr/bin/env pwsh
# restart.ps1 — 快速杀掉当前后端进程并重启
# 用法: ./restart.ps1  （在 backend/ 目录下运行）

$PORT = 3004
$BACKEND_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── 1. 杀掉占用端口的进程 ──────────────────────────────────────
$conn = Get-NetTcpConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pid_ = $conn.OwningProcess
    $proc = Get-Process -Id $pid_ -ErrorAction SilentlyContinue
    Write-Host "⚡ 杀掉进程 PID $pid_ ($($proc.ProcessName)) 占用 :$PORT ..." -ForegroundColor Yellow
    Stop-Process -Id $pid_ -Force
    # 等端口真正释放
    $waited = 0
    while ((Get-NetTcpConnection -LocalPort $PORT -ErrorAction SilentlyContinue) -and $waited -lt 10) {
        Start-Sleep -Milliseconds 300
        $waited++
    }
} else {
    Write-Host "✓ 端口 :$PORT 空闲" -ForegroundColor Green
}

# ── 2. 启动后端 ────────────────────────────────────────────────
Write-Host "🚀 启动后端 (npm run dev) ..." -ForegroundColor Cyan
Set-Location $BACKEND_DIR
npm run dev
