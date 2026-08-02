# ============================================================
# EARTH — tools/index-images.ps1
# Repli PowerShell si Node.js n'est pas disponible.
# Fait exactement la meme chose que tools/index-images.mjs :
# ecrit images/manifest.json ET images/manifest.js
#
#     powershell -ExecutionPolicy Bypass -File tools\index-images.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $PSScriptRoot
$imgDir = Join-Path $root 'images'

$imageExt = @('.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif')
$videoExt = @('.mp4', '.webm', '.mov')

function Encode-Path([string]$rel) {
  ($rel -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
}

$items = Get-ChildItem -Path $imgDir -Recurse -File |
  Where-Object {
    $_.Extension.ToLower() -in ($imageExt + $videoExt) -and
    $_.FullName -notmatch '\\[._]'
  } |
  ForEach-Object {
    $rel   = $_.FullName.Substring($imgDir.Length + 1).Replace('\', '/')
    $place = if ($rel.Contains('/')) { $rel.Substring(0, $rel.LastIndexOf('/')) } else { 'RACINE' }
    [pscustomobject]@{
      src   = 'images/' + (Encode-Path $rel)
      path  = $rel
      place = $place
      name  = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
      type  = if ($_.Extension.ToLower() -in $videoExt) { 'video' } else { 'image' }
    }
  } | Sort-Object path

$items  = @($items)
$places = @($items | Select-Object -ExpandProperty place -Unique | Sort-Object)

$byPlace = [ordered]@{}
foreach ($p in $places) { $byPlace[$p] = @($items | Where-Object place -eq $p).Count }

$manifest = [ordered]@{
  generated = (Get-Date).ToString('o')
  count     = $items.Count
  places    = $places
  byPlace   = $byPlace
  items     = $items
}

$json = $manifest | ConvertTo-Json -Depth 6

# UTF8 sans BOM (le BOM casse certains parseurs JSON)
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $imgDir 'manifest.json'), $json, $utf8)
[System.IO.File]::WriteAllText(
  (Join-Path $imgDir 'manifest.js'),
  "/* genere par tools/index-images.ps1 — ne pas editer a la main */`nwindow.EARTH_MANIFEST = $json;`n",
  $utf8
)

Write-Host "archive indexee : $($items.Count) fichier(s) — $($places.Count) lieu(x)"
foreach ($p in $places) { Write-Host ("   {0,4}  {1}" -f $byPlace[$p], $p) }
