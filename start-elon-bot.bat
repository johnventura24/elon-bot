@echo off
echo Starting Elon Bot with PM2...
cd /d "C:\Users\marni\OneDrive\Desktop\Elon"
pm2 start ecosystem.config.js
echo Elon Bot started successfully!
pause 