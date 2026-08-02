# ============================================================
# EARTH MEMORY — update-manifest.ps1
# Scans the Images/ folder recursively (all subfolders = all
# the places you explored) and rewrites images/manifest.json.
#
# Run it after adding new captures :
#
#     powershell -File tools\update-manifest.ps1
#
# The archive is alive : drop files in Images/, run this, done.
# No code change is ever needed.
# ============================================================

$root   = Split-Path -Parent $PSScriptRoot
$imgDir = Join-Path $root 'images'
$extensions = '\.(jpg|jpeg|png|webp|gif|avif)$'

$files = Get-ChildItem -Path $imgDir -Recurse -File |
  Where-Object { $_.Extension -match $extensions } |
  ForEach-Object {
    $_.FullName.Substring($imgDir.Length + 1).Replace('\', '/')
  } |
  Sort-Object

$json = @($files) | ConvertTo-Json
if ($null -eq $files) { $json = '[]' }

Set-Content -Path (Join-Path $imgDir 'manifest.json') -Value $json -Encoding UTF8

Write-Host "images/manifest.json updated : $($files.Count) signal(s) found."
