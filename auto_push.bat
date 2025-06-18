@echo off
cd /d %~dp0

:: Verifica si hay cambios
git diff --quiet >nul 2>&1
IF ERRORLEVEL 1 (
    echo >>> Cambios detectados, haciendo commit y push...
    git add .
    git commit -m "Auto update on save"
    git push origin main
) ELSE (
    echo >>> No hay cambios, no se hace nada.
)
