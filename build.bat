@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   EPUB Cleaner - Build Standalone Application (.exe)
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Checking and installing required dependencies...
python -m pip install --quiet pyinstaller pywebview pillow beautifulsoup4 lxml

echo.
echo [2/3] Building standalone executable with PyInstaller...

python -m PyInstaller ^
    --noconfirm ^
    --onefile ^
    --windowed ^
    --name="EPUB Cleaner" ^
    --icon="app_icon.ico" ^
    --add-data="index.html;." ^
    --add-data="style.css;." ^
    --add-data="app.js;." ^
    --add-data="logo.png;." ^
    --add-data="app_icon.ico;." ^
    --add-data="favicon.ico;." ^
    --collect-all webview ^
    server.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed! Please check the PyInstaller output above.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] Single Portable .EXE Built Successfully!
echo ========================================================
echo   Executable File: dist\EPUB Cleaner.exe
echo ========================================================
echo.

pause
