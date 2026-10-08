@echo off
setlocal EnableDelayedExpansion

set "PATH=C:\Program Files\nodejs;C:\Users\Bzbook\AppData\Roaming\npm;%PATH%"
set EAS_NO_VCS=1

echo ========================================================
echo  Generation de l'APK Livreur (Android) via Expo EAS
echo ========================================================

cd /d "%~dp0..\driver-app"
echo Dossier : %CD%

if not exist "package.json" (
    echo [ERREUR] Impossible de trouver le dossier driver-app.
    pause
    exit /b 1
)

echo.
echo [1/3] Verification de la connexion Expo...
call npx --yes eas-cli whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo Connexion requise a votre compte Expo sur expo.dev...
    call npx --yes eas-cli login
)

echo.
echo [2/3] Verification des dependances locales...
if not exist "node_modules" (
    echo Installation des dependances yarn...
    call yarn install
)

echo.
echo [3/3] Lancement du build de l'APK Android via Expo Cloud...
echo (Mode sans Git active via EAS_NO_VCS=1)
echo.
call npx --yes eas-cli build -p android --profile preview

echo.
pause
