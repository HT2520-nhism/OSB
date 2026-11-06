@echo off
chcp 65001 >nul
title Electronic Logbook Stopper

echo ========================================================
echo   DANG DUNG VA DONG TAT CA CAC CUA SO DICH VU...
echo ========================================================
echo.

echo [1/2] Dong tat ca cac cua so CMD dich vu (kem tien trinh con)...
taskkill /fi "WINDOWTITLE eq Identity API :3041*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Logbook API :3043*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Gateway API :3030*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Web Admin :3000*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Mobile App :8081*" /f /t /im cmd.exe >nul 2>&1

echo [2/2] Don sach cac tien trinh Node.js con sot lai...
taskkill /f /im node.exe >nul 2>&1

echo.
echo ========================================================
echo   DA DUNG VA DONG TAT CA CAC CUA SO THANH CONG!
echo ========================================================
echo.
timeout /t 2 /nobreak >nul
exit
