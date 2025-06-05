const { WebClient } = require('@slack/web-api');
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

const SLACK_BOT_TOKEN = envVars.SLACK_BOT_TOKEN;
const slack = new WebClient(SLACK_BOT_TOKEN);

// Load employees
const employees = JSON.parse(fs.readFileSync('test-employees.json', 'utf8'));

// Elon-style EOD request messages
const eodMessages = [
    `🚀 **MARS MISSION UPDATE REQUIRED** 🚀

Hey {name}! Time for your daily mission briefing! 

What epic accomplishments did you achieve today that brought us closer to making life multiplanetary? 

🎯 **Today's Mission Objectives:**
• What breakthrough did you achieve?
• What obstacles did you overcome with first-principles thinking?
• What's your next moonshot project?

*"The future is going to be wild!"* - Elon

Reply with your daily wins! 🌟`,

    `⚡ **TESLA-POWERED PRODUCTIVITY CHECK** ⚡

{name}, it's time to charge up your daily report! 

What did you build today that's 10x better than yesterday?

🔋 **Energy Report:**
• What did you accelerate today?
• What inefficiencies did you eliminate?
• What's your next sustainable innovation?

*"Think 10x bigger!"* - Elon

Send me your daily achievements! 🚗💨`,

    `🌌 **STARSHIP DAILY LOG** 🌌

Mission Commander {name}, 

Time for your end-of-day transmission from Earth! What progress did you make toward our interplanetary goals?

🚀 **Flight Report:**
• What did you launch today?
• What did you iterate and improve?
• What's your trajectory for tomorrow?

*"Mars, here we come!"* - Elon

Transmit your daily accomplishments! 🛸`,

    `🧠 **NEURALINK THOUGHT SYNC** 🧠

{name}, let's sync your daily neural pathways! 

What brilliant ideas did you execute today with first-principles thinking?

💭 **Brain Dump Required:**
• What problem did you solve from scratch?
• What conventional wisdom did you challenge?
• What's your next cognitive breakthrough?

*"Question everything!"* - Elon

Download your daily wins! 🤖`,

    `🌍 **BORING COMPANY TUNNEL VISION** 🌍

{name}, time to surface from today's deep work! 

What did you dig into and accomplish today?

⛏️ **Excavation Report:**
• What barriers did you tunnel through?
• What foundation did you build?
• What's your next underground mission?

*"When something is important enough, you do it even if the odds are not in your favor."* - Elon

Emerge with your daily victories! 🚇`
];

async function sendEODRequest() {
    try {
        console.log('🚀 INITIATING END-OF-DAY MISSION BRIEFING REQUEST...');
        
        for (const employee of employees) {
            const randomMessage = eodMessages[Math.floor(Math.random() * eodMessages.length)];
            const personalizedMessage = randomMessage.replace(/{name}/g, employee.name);
            
            console.log(`🎯 Sending EOD request to ${employee.name}...`);
            
            const result = await slack.chat.postMessage({
                channel: employee.slackId,
                text: personalizedMessage,
                parse: 'full'
            });
            
            if (result.ok) {
                console.log(`✅ EOD request sent successfully to ${employee.name}!`);
            } else {
                console.log(`❌ Failed to send to ${employee.name}:`, result.error);
            }
        }
        
        console.log('🚀 All EOD requests deployed successfully!');
        console.log('💫 "The future depends on what you do today!" - Elon');
        
    } catch (error) {
        console.error('❌ Houston, we have a problem:', error.message);
    }
}

sendEODRequest(); 