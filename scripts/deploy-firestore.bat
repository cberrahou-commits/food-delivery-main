@echo off
setlocal
echo ========================================================
echo  Deploiement des Regles et Index Firestore
echo ========================================================

cd /d "%~dp0.."
echo Dossier de deploiement : %CD%

if not exist "firebase.json" (
    echo.
    echo [ERREUR] Le fichier firebase.json est introuvable dans %CD%
    echo Assurez-vous d'executer ce script depuis le projet food-delivery.
    echo.
    pause
    exit /b 1
)

echo.
echo Lancement du deploiement vers Firebase...
call npx --yes firebase-tools deploy --only firestore:rules,firestore:indexes
echo.
pause
