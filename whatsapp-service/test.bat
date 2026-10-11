@echo off
cd /d "%~dp0"
title Test WhatsApp - Food Delivery
echo ========================================================
echo   TEST D'ENVOI WHATSAPP
echo ========================================================
echo.
set /p phone="Entrez votre numero de telephone (ex: 0555123456) : "
echo.
node test-whatsapp.js %phone%
echo.
pause
