@echo off
setlocal
cd /d C:\Port

title Sofwan Portfolio - Update

echo ========================================
echo       Updating Sofwan Portfolio
echo ========================================
echo.

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes to upload.
    echo.
    pause
    exit /b 0
)

git commit -m "Update portfolio"
if errorlevel 1 (
    echo.
    echo Commit failed.
    pause
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo.
    echo Push failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo       Upload completed successfully
echo ========================================
echo.
echo GitHub Actions will deploy the website automatically.
echo.
pause
