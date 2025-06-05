const fs = require('fs');

// Load environment variables manually (same method as working scripts)
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

// Set environment variables
process.env.SLACK_BOT_TOKEN = envVars.SLACK_BOT_TOKEN;
process.env.SLACK_SIGNING_SECRET = envVars.SLACK_SIGNING_SECRET;

const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const express = require('express');
const cron = require('node-cron');

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Initialize Slack events adapter
let slackEvents;
if (process.env.SLACK_SIGNING_SECRET) {
  slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
}

// Express app
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Use the event adapter's express middleware
if (slackEvents) {
  app.use('/slack/events', slackEvents.expressMiddleware());
}

console.log('🚀 ELON - MAKING WORK REPORTS GREAT AGAIN! 🚀');
console.log('🔋 Tesla-powered Bot Token:', process.env.SLACK_BOT_TOKEN ? 'CHARGED ⚡' : 'NEEDS CHARGING 🔋');
console.log('🔐 Signing Secret:', process.env.SLACK_SIGNING_SECRET ? 'SECURED 🔒' : 'OPTIONAL (for basic functionality) 🔓');
console.log('🌐 Starlink Port:', PORT);
console.log('💫 "The future is going to be wild!" - Elon Musk');

// In-memory storage for responses
const responses = [];

console.log('📁 Using file-based storage (keeping it simple, like a Model S)');

// Load employees from file
async function loadEmployees() {
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

// Store user response
async function storeResponse(slackId, employeeName, message) {
  const today = new Date().toISOString().split('T')[0];
  
  const responseData = {
    slackId,
    employeeName,
    message,
    timestamp: new Date(),
    date: today
  };

  responses.push(responseData);
  // Save to file as backup
  fs.writeFileSync('responses.json', JSON.stringify(responses, null, 2));
  console.log(`📝 Response stored in file for ${employeeName}`);
}

// Listen for direct messages (replies)
if (slackEvents) {
  console.log('💬 Reply capability: ENABLED - Ready to receive responses! 🎯');
  
  slackEvents.on('message', async (event) => {
    // Only process direct messages to the bot
    if (event.channel_type === 'im' && !event.bot_id && event.text) {
      try {
        // Get user info
        const userInfo = await slack.users.info({ user: event.user });
        const userName = userInfo.user.real_name || userInfo.user.name;
        
        console.log(`📨 Received response from ${userName}: ${event.text}`);
        
        // Store the response
        await storeResponse(event.user, userName, event.text);
        
        // Send Elon-style acknowledgment
        const elonAcknowledgments = [
          `Excellent work, ${userName}! 🚀 Your progress is helping us get to Mars faster. Keep pushing the boundaries!\n\n*"The future is going to be wild!"* - Elon`,
          `${userName}, this is exactly the kind of first-principles thinking we need! 💫 "The best part is no part" - and you're optimizing like a true engineer!\n\n*"Think 10x bigger!"* - Elon`,
          `Outstanding, ${userName}! 🔥 Your accomplishments today would make even Tony Stark jealous. Tomorrow, let's think 10x bigger!\n\n*"Mars, here we come!"* - Elon`,
          `${userName}, you're crushing it! ⚡ This is the kind of innovation that changes everything. Mars is getting closer!\n\n*"When something is important enough, you do it even if the odds are not in your favor."* - Elon`,
          `Phenomenal work, ${userName}! 🌟 Your dedication to excellence is exactly what we need for a multiplanetary future!\n\n*"The future depends on what you do today!"* - Elon`
        ];
        
        const randomAck = elonAcknowledgments[Math.floor(Math.random() * elonAcknowledgments.length)];
        
        await slack.chat.postMessage({
          channel: event.channel,
          text: randomAck
        });
        
        console.log(`✅ Sent Elon acknowledgment to ${userName}`);
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
} else {
  console.log('💬 Reply capability: DISABLED - Add signing secret to enable replies');
}

// Elon-style messages array
const elonMessages = [
  (name) => `What did you get done today?

Take a moment to think about EVERYTHING you got done today. Give as much info as you can and reply here.

Some examples:
- I got 10 new software signups!
- I built 3 new features (x, y, and z)
- I set up a cold email system using Apollo
- I ran for 4 miles
- I drafted my newsletter for Sunday

*"The future is going to be wild!"* - Elon`,

  (name) => `What did you get done today?

Take a moment to think about EVERYTHING you got done today. Give as much info as you can and reply here.

Some examples:
- I got 10 new software signups!
- I built 3 new features (x, y, and z)
- I set up a cold email system using Apollo
- I ran for 4 miles
- I drafted my newsletter for Sunday

*"Think 10x bigger!"* - Elon`,

  (name) => `What did you get done today?

Take a moment to think about EVERYTHING you got done today. Give as much info as you can and reply here.

Some examples:
- I got 10 new software signups!
- I built 3 new features (x, y, and z)
- I set up a cold email system using Apollo
- I ran for 4 miles
- I drafted my newsletter for Sunday

*"Mars, here we come!"* - Elon`,

  (name) => `What did you get done today?

Take a moment to think about EVERYTHING you got done today. Give as much info as you can and reply here.

Some examples:
- I got 10 new software signups!
- I built 3 new features (x, y, and z)
- I set up a cold email system using Apollo
- I ran for 4 miles
- I drafted my newsletter for Sunday

*"When something is important enough, you do it even if the odds are not in your favor."* - Elon`,

  (name) => `What did you get done today?

Take a moment to think about EVERYTHING you got done today. Give as much info as you can and reply here.

Some examples:
- I got 10 new software signups!
- I built 3 new features (x, y, and z)
- I set up a cold email system using Apollo
- I ran for 4 miles
- I drafted my newsletter for Sunday

*"The future depends on what you do today!"* - Elon`
];

// Send Elon message to individual employee
async function sendElonMessage(employee) {
  try {
    const randomMessage = elonMessages[Math.floor(Math.random() * elonMessages.length)];
    const personalizedMessage = randomMessage(employee.name);
    
    const result = await slack.chat.postMessage({
      channel: employee.slackId,
      text: personalizedMessage,
      parse: 'full'
    });
    
    if (result.ok) {
      console.log(`✅ Mission briefing sent to ${employee.name}`);
    } else {
      console.log(`❌ Houston, we have a problem with ${employee.name}: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Houston, we have a problem with ${employee.name}: ${error.message}`);
  }
}

// Send messages to all employees
async function sendElonMessages() {
  console.log('🚀 INITIATING DAILY MISSION BRIEFING SEQUENCE...');
  
  const employees = await loadEmployees();
  console.log(`🎯 Found ${employees.length} crew members ready for Mars`);
  
  for (const employee of employees) {
    await sendElonMessage(employee);
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ All crew members have received their mission briefings! 🚀');
  console.log('💫 "Mars, here we come!" - Elon (probably)');
}

// Schedule daily messages at 4:30 PM
cron.schedule('30 16 * * *', () => {
  console.log('⏰ Daily mission briefing time!');
  sendElonMessages();
});

console.log('⏰ Scheduling daily mission briefings for 16:30 (Earth time)');
console.log('🌌 "Time is the ultimate currency" - Elon');

// Start server - Updated for cloud deployment
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Elon Bot is operational on port ${PORT}!`);
    console.log(`🌟 Ready to inspire greatness and track accomplishments`);
    console.log(`⚡ Scheduled daily messages at 4:30 PM EST`);
    console.log(`🔗 Webhook endpoint: /slack/events`);
});

// API Routes
app.get('/api/test-elon', async (req, res) => {
  try {
    const testMessage = `🧪 **ELON TEST TRANSMISSION** 🧪

This is a test of the Elon Motivation System! 

If you can see this message, our neural link is working perfectly!

🚀 **Test Parameters:**
• Bot connectivity: OPTIMAL
• Motivation levels: MAXIMUM  
• Mars readiness: 100%

*"The future is going to be wild!"* - Elon

Reply to this message to test the interactive system! 🌟`;

    const employees = await loadEmployees();
    for (const employee of employees) {
      await slack.chat.postMessage({
        channel: employee.slackId,
        text: testMessage
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Test transmission complete! 🧪',
      elonQuote: 'The future is going to be wild!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/send-elon', async (req, res) => {
  try {
    await sendElonMessages();
    res.json({ 
      success: true, 
      message: 'Elon messages deployed successfully! 🚀',
      elonQuote: 'The future is going to be wild!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/responses', (req, res) => {
  res.json({ 
    responses: responses,
    total: responses.length,
    elonQuote: 'Data is the new oil!'
  });
});

app.get('/api/responses/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayResponses = responses.filter(r => r.date === today);
  
  res.json({ 
    responses: todayResponses,
    total: todayResponses.length,
    date: today,
    elonQuote: 'Today\'s progress determines tomorrow\'s possibilities!'
  });
});

app.get('/api/elon-wisdom', (req, res) => {
  const elonQuotes = [
    'The future is going to be wild!',
    'Think 10x bigger!',
    'Mars, here we come!',
    'When something is important enough, you do it even if the odds are not in your favor.',
    'The best part is no part.',
    'Question everything!',
    'Failure is an option here. If you are not failing, you are not innovating enough.',
    'I think it is possible for ordinary people to choose to be extraordinary.',
    'The first step is to establish that something is possible; then probability will occur.'
  ];
  
  const randomQuote = elonQuotes[Math.floor(Math.random() * elonQuotes.length)];
  
  res.json({ 
    wisdom: randomQuote,
    author: 'Elon Musk',
    context: 'Transmitted from Mars (probably)'
  });
});

// Send initial message on startup
setTimeout(async () => {
  await sendElonMessages();
}, 3000); 