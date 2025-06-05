# 🚀 Elon Bot Server Management Guide

## 🏆 Current Setup: PM2 Process Manager

Your Elon bot is now running under PM2, which provides:
- ✅ **Automatic restart** if the app crashes
- ✅ **Memory monitoring** and restart on memory leaks
- ✅ **Process monitoring** and health checks
- ✅ **Log management** with rotation
- ✅ **Zero-downtime restarts**

## 📊 Monitoring Commands

### Check Status
```bash
pm2 status
pm2 monit          # Real-time monitoring dashboard
```

### View Logs
```bash
pm2 logs elon-bot           # Live logs
pm2 logs elon-bot --lines 50 # Last 50 lines
```

### Performance Info
```bash
pm2 info elon-bot
pm2 describe elon-bot
```

## 🎮 Control Commands

### Basic Controls
```bash
pm2 start elon-bot      # Start the bot
pm2 stop elon-bot       # Stop the bot
pm2 restart elon-bot    # Restart the bot
pm2 reload elon-bot     # Zero-downtime reload
```

### Or use the batch files:
- Double-click `start-elon-bot.bat`
- Double-click `stop-elon-bot.bat`
- Double-click `restart-elon-bot.bat`

## 🔄 Windows Startup Options

### Option 1: Task Scheduler (Recommended)
1. Open **Task Scheduler** (Windows + R, type `taskschd.msc`)
2. Click **Create Basic Task**
3. Name: "Elon Bot Startup"
4. Trigger: **When the computer starts**
5. Action: **Start a program**
6. Program: `C:\Users\marni\OneDrive\Desktop\Elon\start-elon-bot.bat`
7. ✅ Check "Run with highest privileges"

### Option 2: Startup Folder
1. Press **Windows + R**, type `shell:startup`
2. Copy `start-elon-bot.bat` to this folder
3. The bot will start when you log in

### Option 3: Windows Service (Advanced)
```bash
npm install -g pm2-windows-service
pm2-service-install
```

## 📈 Health Monitoring

### Daily Checks
```bash
# Quick health check
curl http://localhost:3000/api/diagnostic

# Test Slack connection
curl http://localhost:3000/api/test-permissions
```

### Weekly Maintenance
```bash
pm2 restart elon-bot    # Fresh restart
pm2 flush elon-bot      # Clear old logs
```

## 🚨 Troubleshooting

### If Bot Stops Working:
1. **Check PM2 status**: `pm2 status`
2. **Check logs**: `pm2 logs elon-bot --lines 20`
3. **Restart**: `pm2 restart elon-bot`
4. **Test API**: `curl http://localhost:3000/api/test-permissions`

### Common Issues:
- **Port 3000 in use**: `pm2 restart elon-bot`
- **Slack token expired**: Update `.env` file and restart
- **Memory issues**: PM2 auto-restarts at 200MB limit
- **Cron not firing**: Check system time and timezone

## 📁 Important Files

- `ecosystem.config.js` - PM2 configuration
- `.env` - Slack bot token (keep secure!)
- `logs/` - Application logs
- `*-elon-bot.bat` - Windows management scripts

## 🎯 Delivery Schedule Verification

The bot automatically sends at **4:30 PM EST, Monday-Friday**.

To verify:
```bash
node verify-schedule.js
```

## 🔐 Security Notes

- Keep `.env` file secure (contains Slack token)
- Logs may contain sensitive data - rotate regularly
- PM2 runs with your user permissions
- Consider running as a Windows Service for production

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Check if running | `pm2 status` |
| View live logs | `pm2 logs elon-bot` |
| Restart bot | `pm2 restart elon-bot` |
| Test API | `curl http://localhost:3000/api/diagnostic` |
| Manual send | `curl http://localhost:3000/api/send-elon` |

## ✅ Success Indicators

Your bot is healthy when:
- PM2 status shows "online" 
- Memory usage is reasonable (< 200MB)
- API endpoints respond correctly
- Logs show cron job executions at 4:30 PM EST
- Daily messages are being sent to Slack

---

**🚀 "The future is going to be wild!" - Elon Musk** 