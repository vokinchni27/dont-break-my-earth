@echo off
REM ============================================================
REM EARTH — OUVRIR.cmd
REM Double-clic : reindexe l'archive puis ouvre la piece.
REM ============================================================
cd /d "%~dp0.."
where node >nul 2>nul
if %errorlevel%==0 (
  node tools\index-images.mjs
) else (
  powershell -ExecutionPolicy Bypass -File tools\index-images.ps1
)
start "" "index.html"
