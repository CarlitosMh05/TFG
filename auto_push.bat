@echo off
cd /d %~dp0
git add .
git commit -m "Auto update on save"
git push origin main
