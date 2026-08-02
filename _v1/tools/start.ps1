# ============================================================
# EARTH MEMORY — start.ps1
# Double-click (or : powershell -File tools\start.ps1)
# Starts a local server and opens the piece in your browser.
# The webcam and the archive need http — file:// won't work.
# Ctrl+C in this window stops the instrument.
# ============================================================

$port = 8642
$root = Split-Path -Parent $PSScriptRoot

$server = Start-Job -ScriptBlock {
  param($r, $p)
  Set-Location $r
  python -m http.server $p
} -ArgumentList $root, $port

Start-Sleep -Seconds 2
Start-Process "http://localhost:$port"

Write-Host ""
Write-Host "  EARTH MEMORY"
Write-Host "  http://localhost:$port"
Write-Host "  Ctrl+C to stop."
Write-Host ""

Wait-Job $server
