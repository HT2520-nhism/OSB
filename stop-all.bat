@echo off
chcp 65001 >nul
title Electronic Logbook Stopper

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-services.ps1"

REM Fallback taskkill just in case
taskkill /fi "WINDOWTITLE eq Identity API :3041*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Logbook API :3043*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Gateway API :3030*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Web Admin :3000*" /f /t /im cmd.exe >nul 2>&1
taskkill /fi "WINDOWTITLE eq Mobile App :8081*" /f /t /im cmd.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

exit
