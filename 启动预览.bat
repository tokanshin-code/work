@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "npm_config_cache=%~dp0.npm-cache"
echo Starting preview server from %cd%
echo Open http://127.0.0.1:8787/preview.html
npm.cmd run preview
pause
