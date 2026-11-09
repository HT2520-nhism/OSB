@echo off
chcp 65001 >nul
title Electronic Logbook Launcher

echo ========================================================
echo   KHOI DONG HE THONG ELECTRONIC LOGBOOK
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-database.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [DUNG LAI] Vui long bat Docker Desktop truoc khi khoi dong cac dich vu!
    echo.
    pause
    exit /b 1
)

echo.
echo [1/5] Dang khoi dong Identity API (Port 3041)...
start "Identity API :3041" /D "C:\Code\OSB\Logbook-identity-api" cmd /k "npm run start:dev"
timeout /t 2 /nobreak >nul

echo [2/5] Dang khoi dong Logbook API (Port 3043)...
start "Logbook API :3043" /D "C:\Code\OSB\Electronic-logbook-api" cmd /k "npm run start:dev"
timeout /t 2 /nobreak >nul

echo [3/5] Dang khoi dong Gateway API (Port 3030)...
start "Gateway API :3030" /D "C:\Code\OSB\Gateway-api" cmd /k "npm run start:dev"
timeout /t 2 /nobreak >nul

echo [4/5] Dang khoi dong Web Admin (Port 3000)...
start "Web Admin :3000" /D "C:\Code\OSB\Electronic-Logbook-Admin" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo [5/5] Dang khoi dong Mobile App (Port 8081)...
start "Mobile App :8081" /D "C:\Code\OSB\Electronic-Logbook-Mobile" cmd /k "npx expo start -c"

echo.
echo ========================================================
echo   DA KHOI DONG XONG TAT CA CAC DICH VU!
echo.
echo   - Web Admin:   http://localhost:3000
echo   - Gateway API: http://localhost:3030
echo   - Mobile App:  http://localhost:8081
echo ========================================================
echo.
pause
