const fs = require('fs');

// Load environment variables manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const { WebClient } = require('@slack/web-api');

// Initialize Slack client
const slack = new WebClient(envVars.SLACK_BOT_TOKEN);

// Load employees
function loadEmployees() {
  try {
    if (fs.existsSync('test-employees.json')) {
      const testEmployees = JSON.parse(fs.readFileSync('test-employees.json', 'utf8'));
      return testEmployees.filter(emp => emp.active);
    }
  } catch (error) {
    console.error('Error loading crew from file:', error);
  }
  return [];
}

async function sendClearInstructions() {
  try {
    const employees = loadEmployees();
    
    for (const employee of employees) {
      // Open DM channel
      const dmChannel = await slack.conversations.open({
        users: employee.slackId
      });
      
      if (dmChannel.ok) {
        const message = `🚀 **REPLY TEST - ELON MUSK** 🚀

Hey ${employee.name}! 

This is a test to make sure you can reply to me.

**HOW TO REPLY:**
1. Look at the bottom of this chat window
2. You'll see a text box that says "Message elon"
3. Simply type your message there (like "Hello Elon!")
4. Press Enter
5. I will respond back automatically!

**EXAMPLE:**
Just type: "I completed my tasks today!"

**NO SPECIAL BUTTONS NEEDED** - just type like a normal chat!

*"The future is going to be wild!"* - Elon

Try replying now! 🌟`;

        const result = await slack.chat.postMessage({
          channel: dmChannel.channel.id,
          text: message
        });
        
        if (result.ok) {
          console.log(`✅ Clear instructions sent to ${employee.name}`);
        } else {
          console.log(`❌ Failed to send to ${employee.name}: ${result.error}`);
        }
      }
    }
    
    console.log('🎯 Clear reply instructions sent!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendClearInstructions(); 