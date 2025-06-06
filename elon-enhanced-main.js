// 🚀 ELON - ENHANCED WITH INTELLIGENT REPLIES & DEADLINE TRACKING
// Copy this enhanced reply section to replace the simple acknowledgments in elon-encrypted.js

const { GoalTracker, ResponseAnalyzer, ElonResponseGenerator } = require('./elon-enhanced-replies');

// Initialize goal tracking
const goalTracker = new GoalTracker();

// Enhanced message handler with intelligent responses
if (slackEvents && slack) {
  slackEvents.on('message', async (event) => {
    // Only process direct messages to the bot
    if (event.channel_type === 'im' && !event.bot_id && event.text) {
      try {
        // Get user info
        const userInfo = await slack.users.info({ user: event.user });
        const userName = userInfo.user.real_name || userInfo.user.name;
        const userId = event.user;
        const message = event.text;
        
        console.log(`📨 Enhanced reply from ${userName}: ${message.substring(0, 100)}...`);
        
        // Store the encrypted response (existing functionality)
        await storeResponse(userId, userName, message);
        
        // ENHANCED PROCESSING: Analyze the response
        const analysis = ResponseAnalyzer.analyzeResponse(message);
        console.log(`🔍 Analysis for ${userName}:`, analysis);
        
        // Get user's current goals
        const userGoals = goalTracker.getActiveGoals(userId);
        
        // Extract and set deadlines if mentioned
        const extractedDeadline = ResponseAnalyzer.extractDeadline(message);
        if (extractedDeadline && (analysis.hasGoals || analysis.hasDeadline)) {
          const goalId = goalTracker.setGoal(userId, message, extractedDeadline);
          console.log(`🎯 New goal set for ${userName} with deadline: ${extractedDeadline} (ID: ${goalId})`);
        }
        
        // Generate intelligent, assertive response
        const elonReply = ElonResponseGenerator.generateResponse(userName, message, analysis, userGoals);
        
        // Send the enhanced reply
        await slack.chat.postMessage({
          channel: event.channel,
          text: elonReply,
          as_user: false,
          username: 'Elon Musk',
          icon_emoji: ':rocket:'
        });
        
        console.log(`🚀 Enhanced Elon reply sent to ${userName}`);
        
        // Store the interaction for future reference
        const interactionData = {
          userId,
          userName: ElonCrypto.encrypt(userName),
          userMessage: ElonCrypto.encrypt(message),
          elonReply: ElonCrypto.encrypt(elonReply),
          analysis: analysis,
          extractedDeadline: extractedDeadline,
          timestamp: new Date().toISOString(),
          goalCount: userGoals.length
        };
        
        // Store encrypted interaction
        let interactions = [];
        try {
          if (fs.existsSync('interactions.json')) {
            interactions = JSON.parse(fs.readFileSync('interactions.json', 'utf8'));
          }
        } catch (error) {
          console.error('Error loading interactions:', error);
        }
        
        interactions.push(interactionData);
        fs.writeFileSync('interactions.json', JSON.stringify(interactions, null, 2));
        
      } catch (error) {
        console.error('❌ Error processing enhanced message:', error);
        
        // Fallback to simple acknowledgment if enhanced processing fails
        const fallbackAck = `Thanks for the update, ${userName}! I'm processing your response and will provide detailed feedback shortly. Keep pushing boundaries! 🚀`;
        
        try {
          await slack.chat.postMessage({
            channel: event.channel,
            text: fallbackAck
          });
        } catch (fallbackError) {
          console.error('❌ Even fallback failed:', fallbackError);
        }
      }
    }
  });
}

// Enhanced deadline checking system
function checkUpcomingDeadlines() {
  console.log('⏰ Checking upcoming deadlines...');
  
  // This would run daily to check for approaching deadlines
  // Implementation would involve sending reminder messages
}

// Schedule deadline checks
cron.schedule('0 9 * * 1-5', () => {
  console.log('📅 Daily deadline check initiated...');
  checkUpcomingDeadlines();
}, {
  timezone: process.env.TIMEZONE || 'America/New_York'
});

console.log('🧠 ENHANCED ELON INTELLIGENCE LOADED');
console.log('💡 Features: Smart analysis, deadline tracking, assertive responses');
console.log('🎯 Ready for high-performance business conversations!'); 