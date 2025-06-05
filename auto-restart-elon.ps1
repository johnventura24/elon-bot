# 🚀 ELON BOT AUTO-RESTART SCRIPT 🔐
# This script automatically restarts the bot if it crashes

Write-Host "🚀 ELON BOT AUTO-RESTART SERVICE 🔐" -ForegroundColor Cyan
Write-Host "💫 'Failure is an option here. If things are not failing, you are not innovating enough.' - Elon" -ForegroundColor Yellow

$botPath = "C:\Users\marni\OneDrive\Desktop\Elon"
$logFile = "$botPath\logs\auto-restart.log"

# Create logs directory if it doesn't exist
if (!(Test-Path "$botPath\logs")) {
    New-Item -ItemType Directory -Path "$botPath\logs"
}

# Function to log messages
function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

Set-Location $botPath
Write-Log "🚀 Starting Elon Bot Auto-Restart Service"

$restartCount = 0
$maxRestarts = 10

while ($restartCount -lt $maxRestarts) {
    try {
        Write-Log "🔋 Starting encrypted Elon bot (Attempt $($restartCount + 1))"
        
        # Start the bot process
        $process = Start-Process -FilePath "node" -ArgumentList "elon-encrypted.js" -PassThru -NoNewWindow
        
        Write-Log "✅ Bot started with PID: $($process.Id)"
        
        # Wait for the process to exit
        $process.WaitForExit()
        
        Write-Log "⚠️ Bot process exited with code: $($process.ExitCode)"
        
        if ($process.ExitCode -eq 0) {
            Write-Log "✅ Bot exited cleanly. Stopping auto-restart."
            break
        }
        
        $restartCount++
        
        if ($restartCount -lt $maxRestarts) {
            Write-Log "🔄 Restarting in 5 seconds... ($restartCount/$maxRestarts)"
            Start-Sleep -Seconds 5
        }
        
    } catch {
        Write-Log "❌ Error starting bot: $($_.Exception.Message)"
        $restartCount++
        
        if ($restartCount -lt $maxRestarts) {
            Write-Log "🔄 Retrying in 10 seconds... ($restartCount/$maxRestarts)"
            Start-Sleep -Seconds 10
        }
    }
}

if ($restartCount -ge $maxRestarts) {
    Write-Log "❌ Maximum restart attempts reached ($maxRestarts). Stopping service."
    Write-Host "❌ Bot failed to start after $maxRestarts attempts. Check logs: $logFile" -ForegroundColor Red
}

Write-Log "🏁 Auto-restart service ended"
Read-Host "Press Enter to exit" 