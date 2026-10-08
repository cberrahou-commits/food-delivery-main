@echo off
setlocal EnableDelayedExpansion

set "PATH=C:\Program Files\nodejs;C:\Users\Bzbook\AppData\Roaming\npm;%PATH%"

echo ========================================================
echo  Deploiement du Dashboard Restaurant sur Vercel
echo ========================================================

cd /d "%~dp0..\restaurant-dashboard"
echo Dossier de travail : %CD%

if not exist "package.json" (
    echo [ERREUR] Impossible de trouver le projet restaurant-dashboard.
    pause
    exit /b 1
)

echo.
echo Verification des identifiants Vercel...
call npx --yes vercel whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo  Connexion requise a votre compte Vercel
    echo ========================================================
    echo Choisissez votre methode de connexion ci-dessous:
    echo Exemple : Continue with GitHub ou Continue with Email
    echo Votre navigateur va s'ouvrir pour valider la connexion.
    echo ========================================================
    echo.
    call npx --yes vercel login
)

echo.
echo ========================================================
echo  Lancement du Deploiement de Production...
echo ========================================================
echo.
call npx --yes vercel --prod

echo.
pause
