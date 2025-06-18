# auto_push.ps1
Set-Location -Path $PSScriptRoot

# Verifica si hay cambios
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host ">>> Cambios detectados, haciendo commit y push..."
    git add .
    git commit -m "Auto update on save"
    git push origin main
} else {
    Write-Host ">>> No hay cambios, no se hace nada."
}