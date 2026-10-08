@echo off
setlocal
echo ========================================================
echo  Connexion au compte Expo (EAS)
echo ========================================================
call npx --yes eas-cli login
echo.
pause

