# 🚀 WINDOWS TASK SCHEDULER SETUP FOR ELON BOT 🔐
# This script creates a Windows scheduled task to auto-start the bot

Write-Host "🚀 SETTING UP WINDOWS TASK SCHEDULER FOR ELON BOT 🔐" -ForegroundColor Cyan
Write-Host "💫 'The first step is to establish that something is possible; then probability will occur.' - Elon" -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "💡 Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$taskName = "ElonBotEncrypted"
$botPath = "C:\Users\marni\OneDrive\Desktop\Elon"
$scriptPath = "$botPath\auto-restart-elon.ps1"

try {
    # Delete existing task if it exists
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "🗑️ Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Create the action (what to run)
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

    # Create the trigger (when to run)
    $trigger = New-ScheduledTaskTrigger -AtStartup

    # Create additional triggers
    $triggerLogon = New-ScheduledTaskTrigger -AtLogOn

    # Create the principal (run as current user)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

    # Create the settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)

    # Register the task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger, $triggerLogon -Principal $principal -Settings $settings -Description "Auto-start encrypted Elon Slack bot with Mars-level security"

    Write-Host "✅ Task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host "🚀 Your Elon bot will now start automatically when:" -ForegroundColor Cyan
    Write-Host "   • Computer boots up" -ForegroundColor White
    Write-Host "   • You log in" -ForegroundColor White
    Write-Host "   • If it crashes (up to 3 restarts)" -ForegroundColor White

    Write-Host "`n🎯 MANUAL TASK MANAGEMENT:" -ForegroundColor Yellow
    Write-Host "Start now: schtasks /run /tn `"$taskName`"" -ForegroundColor White
    Write-Host "Stop task: schtasks /end /tn `"$taskName`"" -ForegroundColor White
    Write-Host "Delete task: schtasks /delete /tn `"$taskName`" /f" -ForegroundColor White

    # Ask if user wants to start the task now
    $startNow = Read-Host "`n🚀 Start the Elon bot now? (y/n)"
    if ($startNow -eq 'y' -or $startNow -eq 'Y') {
        Start-ScheduledTask -TaskName $taskName
        Write-Host "✅ Elon bot started!" -ForegroundColor Green
        Write-Host "🌐 Check status at: http://localhost:3000/" -ForegroundColor Cyan
    }

} catch {
    Write-Host "❌ Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n💫 'The future is going to be wild, and automated!' - Elon" -ForegroundColor Yellow
Read-Host "Press Enter to exit" 