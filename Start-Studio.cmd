@echo off
cd /d "%~dp0"
node scripts\launch-studio.cjs
if errorlevel 1 pause
