# auto_push.ps1
Set-Location -Path $PSScriptRoot

Write-Host "--- Ejecutando auto_push.ps1 ---"

# Verifica si hay cambios
$gitStatus = git status --porcelain
if ($gitStatus) {
    git add .
    git commit -m "Auto update on save"
    git push origin main
} else {
    Write-Host ">>> No hay cambios, no se hace nada."
}
Write-Host "--- auto_push.ps1 finalizado ---"