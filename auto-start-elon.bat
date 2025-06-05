@echo off
echo 🚀 ELON BOT AUTO-LAUNCHER 🔐
echo Starting encrypted Elon bot...

cd /d "C:\Users\marni\OneDrive\Desktop\Elon"
echo Current directory: %CD%

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo Starting encrypted Elon bot...
node elon-encrypted.js

pause 