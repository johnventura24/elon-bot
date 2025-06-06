// 🤖 ELON BOT - COMPREHENSIVE AI INTEGRATION
// Features: AI-powered EOD questions, intelligent replies, deadline tracking & follow-up

// Load environment first
function loadEnv() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('📁 Loading local .env file...');
      require('dotenv').config();
    } else {
      console.log('☁️ Running in production mode - using environment variables');
    }
  } catch (error) {
    console.log('⚠️ .env file not found, using environment variables only');
  }
}

loadEnv();

// Required imports
const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const cron = require('node-cron');
const fs = require('fs');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// 🔐 ENCRYPTION & SECURITY SETUP
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '4d8e08621590fc5ba4d510dffb487d5236a6e45548c4b236288440122119942e';
const JWT_SECRET = process.env.JWT_SECRET || 'c786cb69e47f5ea5aa7c97b502478024b1efe5417d18005eb4a7b045bd4ffffaa9c6c2fa1819529f700940e3967392052eabf6189cd76aab65abe975bdfab469';
const API_KEY = process.env.API_KEY || '5aaa564632ec7c58de60d36affff6cafebb974f91cd48bcdeb4363f4a5d0d49c';

// Enhanced encryption class
class ElonCrypto {
  static encrypt(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  static decrypt(ciphertext) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null;
    }
  }

  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static decryptSlackToken(encryptedToken) {
    try {
      if (!encryptedToken || encryptedToken === 'undefined') {
        console.error('❌ No encrypted Slack token provided');
        return null;
      }

      console.log('🔓 Decrypting Slack bot token...');
      const decrypted = this.decrypt(encryptedToken);
      
      if (!decrypted) {
        console.error('❌ Failed to decrypt Slack token');
        return null;
      }

      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting Slack token:', error);
      return null;
    }
  }

  static decryptOpenAIKey(encryptedKey) {
    try {
      if (!encryptedKey || encryptedKey === 'undefined') {
        console.error('❌ No encrypted OpenAI key provided');
        return null;
      }

      console.log('🔓 Decrypting OpenAI API key...');
      const decrypted = this.decrypt(encryptedKey);
      
      if (!decrypted) {
        console.error('❌ Failed to decrypt OpenAI key');
        return null;
      }

      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting OpenAI key:', error);
      return null;
    }
  }
}

// Initialize Slack clients
function getDecryptedSlackToken() {
  const encryptedToken = process.env.ENCRYPTED_SLACK_BOT_TOKEN;
  
  if (!encryptedToken) {
    console.error('❌ ENCRYPTED_SLACK_BOT_TOKEN environment variable not set!');
    return null;
  }

  return ElonCrypto.decryptSlackToken(encryptedToken);
}

const slackToken = getDecryptedSlackToken();
let slack = null;
let slackEvents = null;

if (slackToken) {
  console.log('🚀 Initializing Slack clients with decrypted token...');
  slack = new WebClient(slackToken);
  
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret) {
    slackEvents = createEventAdapter(signingSecret);
    console.log('✅ Slack Event Adapter initialized');
  }
} else {
  console.error('❌ Cannot initialize Slack clients - token decryption failed');
}

// Initialize OpenAI
function getDecryptedOpenAIKey() {
  const encryptedKey = process.env.ENCRYPTED_OPENAI_API_KEY;
  
  if (!encryptedKey) {
    console.error('❌ ENCRYPTED_OPENAI_API_KEY environment variable not set!');
    return null;
  }

  return ElonCrypto.decryptOpenAIKey(encryptedKey);
}

let openai = null;
const openaiKey = getDecryptedOpenAIKey();

if (openaiKey) {
  console.log('🤖 Initializing OpenAI client with decrypted key...');
  openai = new OpenAI({
    apiKey: openaiKey
  });
  console.log('✅ OpenAI client initialized successfully');
} else {
  console.error('❌ Cannot initialize OpenAI client - key decryption failed');
}

// 🎯 GOAL & DEADLINE TRACKING SYSTEM
class DeadlineTracker {
  constructor() {
    this.goals = new Map();
    this.loadGoals();
  }

  loadGoals() {
    try {
      if (fs.existsSync('encrypted-goals.json')) {
        const data = fs.readFileSync('encrypted-goals.json', 'utf8');
        const encryptedGoals = JSON.parse(data);
        
        encryptedGoals.forEach(goal => {
          const decryptedGoal = {
            id: goal.id,
            userId: goal.userId,
            description: ElonCrypto.decrypt(goal.description),
            deadline: goal.deadline,
            createdAt: goal.createdAt,
            status: goal.status,
            followUpSent: goal.followUpSent || false
          };
          
          if (!this.goals.has(goal.userId)) {
            this.goals.set(goal.userId, []);
          }
          this.goals.get(goal.userId).push(decryptedGoal);
        });
        
        console.log('📋 Loaded encrypted goals from storage');
      }
    } catch (error) {
      console.error('❌ Error loading goals:', error);
    }
  }

  saveGoals() {
    try {
      const allGoals = [];
      
      this.goals.forEach((userGoals, userId) => {
        userGoals.forEach(goal => {
          allGoals.push({
            id: goal.id,
            userId: goal.userId,
            description: ElonCrypto.encrypt(goal.description),
            deadline: goal.deadline,
            createdAt: goal.createdAt,
            status: goal.status,
            followUpSent: goal.followUpSent || false
          });
        });
      });
      
      fs.writeFileSync('encrypted-goals.json', JSON.stringify(allGoals, null, 2));
      console.log('💾 Goals saved with encryption');
    } catch (error) {
      console.error('❌ Error saving goals:', error);
    }
  }

  setGoal(userId, description, deadline) {
    const goalId = Date.now().toString();
    const goal = {
      id: goalId,
      userId,
      description,
      deadline,
      createdAt: new Date().toISOString(),
      status: 'active',
      followUpSent: false
    };

    if (!this.goals.has(userId)) {
      this.goals.set(userId, []);
    }
    
    this.goals.get(userId).push(goal);
    this.saveGoals();
    
    console.log(`🎯 Goal set for user ${userId}: ${description} (Deadline: ${deadline})`);
    return goalId;
  }

  getActiveGoals(userId) {
    return this.goals.get(userId)?.filter(goal => goal.status === 'active') || [];
  }

  getUpcomingDeadlines() {
    const upcoming = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    this.goals.forEach((userGoals, userId) => {
      userGoals.forEach(goal => {
        if (goal.status === 'active' && goal.deadline) {
          const deadlineDate = new Date(goal.deadline);
          if (deadlineDate <= tomorrow && !goal.followUpSent) {
            upcoming.push({ ...goal, userId });
          }
        }
      });
    });
    
    return upcoming;
  }

  markFollowUpSent(goalId) {
    this.goals.forEach((userGoals) => {
      const goal = userGoals.find(g => g.id === goalId);
      if (goal) {
        goal.followUpSent = true;
      }
    });
    this.saveGoals();
  }
}

const deadlineTracker = new DeadlineTracker();

// 🤖 AI-POWERED EOD QUESTION GENERATOR
class AIEODGenerator {
  static async generatePersonalizedEODQuestion(userName, userGoals, recentInteractions) {
    if (!openai) {
      return this.getFallbackEODQuestion(userName);
    }

    try {
      const prompt = `
You are Elon Musk sending a personalized end-of-day progress check to ${userName}.

USER'S ACTIVE GOALS: ${userGoals.length > 0 ? userGoals.map(g => `${g.description} (Deadline: ${g.deadline})`).join(', ') : 'No specific goals set yet'}

RECENT CONTEXT: ${recentInteractions.length > 0 ? recentInteractions.slice(-2).map(i => i.summary).join(', ') : 'First interaction'}

Generate a DIRECT, ASSERTIVE Elon Musk-style EOD message that:
1. References their specific goals/deadlines if any
2. Asks for measurable progress updates
3. Pushes for accountability and results
4. Sets expectation for specific metrics
5. Includes urgency and deadline focus
6. Maximum 200 words
7. Uses first-principles thinking approach

STYLE: Direct, challenging, results-focused, no fluff, specific questions about execution and numbers.

EXAMPLES OF ELON APPROACH:
- "What specifically did you execute today?"
- "Show me the numbers and measurable outcomes"
- "What's blocking faster progress?"
- "When exactly will this be complete?"
- "Don't mistake activity for achievement"
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are Elon Musk - direct, results-focused, challenging team members to achieve more. Focus on execution and measurable outcomes." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const aiQuestion = completion.choices[0].message.content;
      console.log(`🤖 AI-generated EOD question for ${userName}`);
      return aiQuestion;

    } catch (error) {
      console.error('❌ AI EOD generation failed:', error);
      return this.getFallbackEODQuestion(userName);
    }
  }

  static getFallbackEODQuestion(userName) {
    const fallbackQuestions = [
      `🚀 **MISSION BRIEFING FOR ${userName.toUpperCase()}** 🚀

*SpaceX Mission Commander Elon here...*

What breakthrough did you achieve today? I want the full mission report:

• What did you build, create, or optimize?
• What problems did you solve with first-principles thinking?
• How did you push the boundaries of what's possible?

Reply with EVERYTHING - no detail is too small when we're building the future!

*"The best part is no part, the best process is no process"* - Elon`,

      `⚡ **TESLA ENERGY UPDATE - ${userName.toUpperCase()}** ⚡

*Chief Engineer Musk requesting status report...*

Time for your daily energy audit! Tell me:

• What innovations did you deliver today?
• Which inefficiencies did you eliminate?
• How did you accelerate progress toward our mission?

Think like we're designing the Model S - every detail matters for the revolution!

*"Failure is an option here. If things are not failing, you are not innovating enough."* - Elon`
    ];

    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

// 🧠 AI-POWERED RESPONSE ANALYZER & GENERATOR
class AIResponseSystem {
  static async processUserResponse(userId, userName, message) {
    if (!openai) {
      return this.getFallbackResponse(userName, message);
    }

    try {
      // Step 1: Analyze the response
      const analysis = await this.analyzeResponse(userName, message);
      
      // Step 2: Extract deadlines
      const deadline = await this.extractDeadline(message);
      
      // Step 3: Set goals if deadline found
      if (deadline && (analysis.hasGoals || analysis.hasDeadline)) {
        deadlineTracker.setGoal(userId, message, deadline);
      }
      
      // Step 4: Get user context
      const userGoals = deadlineTracker.getActiveGoals(userId);
      
      // Step 5: Generate intelligent response
      const elonReply = await this.generateElonResponse(userName, message, analysis, userGoals);
      
      return {
        success: true,
        analysis,
        reply: elonReply,
        deadline,
        goalsUpdated: !!deadline
      };
      
    } catch (error) {
      console.error('❌ AI response processing failed:', error);
      return this.getFallbackResponse(userName, message);
    }
  }

  static async analyzeResponse(userName, message) {
    try {
      const analysisPrompt = `
Analyze this business response from ${userName}: "${message}"

Return JSON only:
{
  "sentiment": "positive/neutral/negative",
  "urgency": "low/medium/high",
  "hasDeadline": true/false,
  "businessValue": "dollar amount if mentioned or null",
  "progressIndicators": ["specific progress mentioned"],
  "challenges": ["challenges or obstacles mentioned"],
  "achievements": ["completed items or successes"],
  "nextSteps": ["action items mentioned"],
  "keyMetrics": ["numbers, percentages, quantities mentioned"]
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a business analyst. Return only valid JSON." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return { sentiment: "neutral", urgency: "medium", hasDeadline: false };
    }
  }

  static async extractDeadline(message) {
    try {
      const deadlinePrompt = `
Extract any deadline or time commitment from: "${message}"

Return only the deadline in format "YYYY-MM-DD" if specific date, or "Friday", "next week", "end of month" for relative dates, or "none" if no deadline.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Extract deadlines from text. Return only the deadline or 'none'." },
          { role: "user", content: deadlinePrompt }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const deadline = completion.choices[0].message.content.trim();
      return deadline === "none" ? null : deadline;
    } catch (error) {
      console.error('❌ Deadline extraction failed:', error);
      return null;
    }
  }

  static async generateElonResponse(userName, message, analysis, userGoals) {
    try {
      const responsePrompt = `
You are Elon Musk responding to ${userName}'s update: "${message}"

ANALYSIS:
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency} 
- Business Value: ${analysis.businessValue || 'Not specified'}
- Progress: ${analysis.progressIndicators?.join(', ') || 'General update'}
- Challenges: ${analysis.challenges?.join(', ') || 'None mentioned'}
- Achievements: ${analysis.achievements?.join(', ') || 'None specified'}

ACTIVE GOALS: ${userGoals.length > 0 ? userGoals.map(g => `${g.description} (Deadline: ${g.deadline})`).join(', ') : 'None set'}

Generate an Elon Musk response that:
1. ACKNOWLEDGES specific progress/achievements mentioned
2. ADDRESSES challenges with first-principles solutions
3. PUSHES for better execution and results
4. SETS OR REINFORCES deadlines
5. ASKS specific follow-up questions about metrics/progress
6. Uses direct, assertive communication style
7. Maximum 250 words

ELON'S STYLE EXAMPLES:
- "First, let's cut the fluff. You have momentum, but don't mistake activity for achievement."
- "Good progress. Now optimize every variable and find where you can 2x the output."
- "Set a hard deadline. Without time pressure, tasks expand to fill infinity."
- "Execute with precision. Report back with results, not excuses."

Be specific to their situation and provide actionable next steps with accountability.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are Elon Musk - direct, assertive, focused on execution and results. Push people to achieve more while being specific and actionable." 
          },
          { role: "user", content: responsePrompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Response generation failed:', error);
      return `Thanks for the update, ${userName}! Your progress is noted. Let's push harder and execute with precision. Set clear deadlines and report back with measurable results. 🚀`;
    }
  }

  static getFallbackResponse(userName, message) {
    const fallbackResponses = [
      `Excellent work, ${userName}! 🚀 Your progress is helping us get to Mars faster. Keep pushing the boundaries!`,
      `${userName}, this is exactly the kind of first-principles thinking we need! 💫 Keep optimizing like a true engineer!`,
      `Outstanding, ${userName}! 🔥 Your accomplishments today would make even Tony Stark jealous. Tomorrow, let's think 10x bigger!`
    ];
    
    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return {
      success: false,
      reply: response,
      analysis: { sentiment: "positive", urgency: "medium" },
      deadline: null,
      goalsUpdated: false
    };
  }
}

// Employee management
async function loadEmployees() {
  try {
    const data = fs.readFileSync('test-employees.json', 'utf8');
    const employees = JSON.parse(data);
    console.log(`📋 Loaded ${employees.length} employees from database`);
    return employees;
  } catch (error) {
    console.error('❌ Error loading employees:', error);
    return [];
  }
}

// Store user responses with AI analysis
async function storeResponse(slackId, employeeName, message, analysis = null) {
  try {
    const encryptedResponse = {
      slackId: slackId,
      employeeName: ElonCrypto.encrypt(employeeName),
      message: ElonCrypto.encrypt(message),
      analysis: analysis,
      timestamp: new Date().toISOString(),
      aiProcessed: !!analysis
    };

    let responses = [];
    try {
      if (fs.existsSync('ai-responses.json')) {
        responses = JSON.parse(fs.readFileSync('ai-responses.json', 'utf8'));
      }
    } catch (error) {
      console.error('Error loading existing responses:', error);
    }

    responses.push(encryptedResponse);
    fs.writeFileSync('ai-responses.json', JSON.stringify(responses, null, 2));
    
    console.log(`💾 AI-processed response stored for ${employeeName}`);
  } catch (error) {
    console.error('❌ Error storing response:', error);
  }
}

// 🤖 AI-POWERED MESSAGE HANDLING
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
        
        console.log(`📨 Processing AI-enhanced message from ${userName}: ${message.substring(0, 100)}...`);
        
        // Process with AI system
        const result = await AIResponseSystem.processUserResponse(userId, userName, message);
        
        // Store the response with AI analysis
        await storeResponse(userId, userName, message, result.analysis);
        
        // Send the AI-generated reply
        await slack.chat.postMessage({
          channel: event.channel,
          text: result.reply,
          as_user: false,
          username: 'Elon Musk',
          icon_emoji: ':rocket:'
        });
        
        console.log(`🚀 AI-Enhanced Elon reply sent to ${userName}`);
        
        if (result.goalsUpdated) {
          console.log(`🎯 New goal/deadline set for ${userName}: ${result.deadline}`);
        }
        
      } catch (error) {
        console.error('❌ Error processing AI message:', error);
        
        // Final fallback
        try {
          await slack.chat.postMessage({
            channel: event.channel,
            text: `Thanks for the update! Processing your response and will provide detailed feedback shortly. Keep pushing boundaries! 🚀`
          });
        } catch (fallbackError) {
          console.error('❌ Even fallback failed:', fallbackError);
        }
      }
    }
  });
}

// 🕐 AI-ENHANCED DAILY MESSAGES
async function sendAIEnhancedElonMessage(employee) {
  if (!slack) {
    console.error('❌ Slack client not initialized - check your encrypted token!');
    return;
  }

  try {
    // Get user's goals and recent interactions
    const userGoals = deadlineTracker.getActiveGoals(employee.slackId);
    const recentInteractions = []; // Could load from ai-responses.json
    
    // Generate AI-powered personalized EOD question
    const message = await AIEODGenerator.generatePersonalizedEODQuestion(
      employee.name, 
      userGoals, 
      recentInteractions
    );

    const result = await slack.chat.postMessage({
      channel: employee.slackId,
      text: message
    });

    if (result.ok) {
      console.log(`✅ AI-Enhanced Elon message sent to ${employee.name} 🚀🤖`);
    } else {
      console.error(`❌ Failed to send to ${employee.name}:`, result.error);
    }
  } catch (error) {
    console.error(`❌ Error sending AI message to ${employee.name}:`, error.message);
  }
}

async function sendAIEnhancedElonMessages() {
  console.log('🤖 INITIATING AI-ENHANCED DAILY MISSION BRIEFING...');
  
  if (!slack) {
    console.error('❌ Cannot send messages - Slack client not initialized!');
    return;
  }
  
  const activeEmployees = await loadEmployees();
  console.log(`🎯 Found ${activeEmployees.length} crew members ready for AI-enhanced Mars mission`);
  
  for (const employee of activeEmployees) {
    await sendAIEnhancedElonMessage(employee);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay for AI processing
  }
  
  console.log('✅ All crew members have received their AI-enhanced mission briefings! 🚀🤖');
}

// 🔔 DEADLINE FOLLOW-UP SYSTEM
async function checkAndFollowUpDeadlines() {
  if (!slack) return;
  
  console.log('⏰ Checking for upcoming deadlines...');
  const upcomingDeadlines = deadlineTracker.getUpcomingDeadlines();
  
  for (const deadline of upcomingDeadlines) {
    try {
      const followUpMessage = await AIEODGenerator.generatePersonalizedEODQuestion(
        `User ${deadline.userId}`, 
        [deadline], 
        []
      );
      
      await slack.chat.postMessage({
        channel: deadline.userId,
        text: `🚨 **DEADLINE ALERT** 🚨\n\n${followUpMessage}`
      });
      
      deadlineTracker.markFollowUpSent(deadline.id);
      console.log(`⏰ Deadline follow-up sent for goal: ${deadline.description}`);
      
    } catch (error) {
      console.error(`❌ Error sending deadline follow-up:`, error);
    }
  }
}

// Schedule AI-enhanced messages
const reportHour = process.env.REPORT_HOUR || 16;
const reportMinute = process.env.REPORT_MINUTE || 30;

console.log(`⏰ Scheduling AI-enhanced daily briefings for ${reportHour}:${reportMinute}`);

cron.schedule(`${reportMinute} ${reportHour} * * 1-5`, () => {
  console.log('🕐 AI-ENHANCED MISSION BRIEFING TIME!');
  sendAIEnhancedElonMessages();
}, {
  timezone: process.env.TIMEZONE || 'America/New_York'
});

// Schedule deadline checks (every morning at 9 AM)
cron.schedule('0 9 * * 1-5', () => {
  console.log('⏰ DEADLINE FOLLOW-UP CHECK!');
  checkAndFollowUpDeadlines();
}, {
  timezone: process.env.TIMEZONE || 'America/New_York'
});

// Health check and API endpoints
app.get('/health', (req, res) => {
  const status = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    slackConnected: !!slack,
    aiEnabled: !!openai,
    version: '3.0.0-comprehensive-ai',
    features: [
      'AI-powered EOD questions',
      'Intelligent response analysis', 
      'Automatic deadline tracking',
      'Goal follow-up system',
      'Encrypted storage'
    ]
  };
  res.json(status);
});

app.get('/send-now', async (req, res) => {
  try {
    await sendAIEnhancedElonMessages();
    res.json({
      success: true,
      message: 'AI-Enhanced Elon messages sent successfully! 🚀🤖',
      aiEnabled: !!openai,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/check-deadlines', async (req, res) => {
  try {
    await checkAndFollowUpDeadlines();
    res.json({
      success: true,
      message: 'Deadline follow-ups processed! ⏰',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Slack events endpoint
if (slackEvents) {
  app.use('/slack/events', slackEvents.expressMiddleware());
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AI-COMPREHENSIVE Elon Bot server running on port ${PORT}`);
  console.log(`🤖 AI Features: ${openai ? 'FULLY ENABLED' : 'DISABLED'}`);
  console.log(`🎯 Deadline Tracking: ENABLED`);
  console.log(`📋 Goals Loaded: ${deadlineTracker.goals.size} users`);
  console.log('🌌 Ready to revolutionize business communication with comprehensive AI! 🚀');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🚀 AI-Comprehensive Elon Bot shutting down gracefully...');
  deadlineTracker.saveGoals();
  process.exit(0);
}); 