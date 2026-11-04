@echo off
setlocal EnableDelayedExpansion

set "PATH=C:\Program Files\nodejs;C:\Users\Bzbook\AppData\Roaming\npm;%PATH%"

echo ========================================================
echo  Lancement du Tableau de Bord Wajbati (Back-Office)
echo ========================================================

cd /d "%~dp0..\restaurant-dashboard"
echo Dossier : %CD%

if not exist "node_modules" (
    echo.
    echo Installation des dependances...
    call npm install
)

echo.
echo Ouverture du navigateur sur http://localhost:3000...
start http://localhost:3000

echo.
echo Demarrage du serveur Next.js...
call npm run dev

