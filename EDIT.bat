@echo off
cd /d C:Port
start "Portfolio Editor Server" /min py local_server.py
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8788/index.html"
