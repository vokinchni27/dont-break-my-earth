@echo off
REM ============================================================
REM EARTH — VEILLE.cmd
REM Laisse cette fenetre ouverte pendant que tu travailles :
REM chaque image deposee dans images/ est indexee toute seule.
REM Il suffit ensuite de rafraichir la page (F5).
REM ============================================================
cd /d "%~dp0.."
node tools\index-images.mjs --watch
pause
