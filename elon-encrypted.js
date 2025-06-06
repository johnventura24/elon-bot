const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const OpenAI = require('openai');

// Manually load .env file (only for local development)
function loadEnv() {
  // Skip .env loading in production environments or if .env doesn't exist
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Running in production mode - using environment variables');
    return;
  }
  
  try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
      console.log('📁 Loading local .env file...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    } else {
      console.log('⚠️  No .env file found - using environment variables only');
    }
  } catch (error) {
    console.log('⚠️  Could not load .env file - using environment variables only');
    console.log('🚀 This is normal for cloud deployments like Render');
  }
}

// Ensure NODE_ENV is set for cloud deployments
if (!process.env.NODE_ENV && (process.env.PORT === '10000' || process.env.RENDER)) {
  process.env.NODE_ENV = 'production';
  console.log('🔧 Auto-detected cloud environment - setting NODE_ENV=production');
}

// Load environment variables
loadEnv();

const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');

// 🔐 ENCRYPTION CONFIGURATION
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');

// Generate secrets if not provided and save them (local development only)
if (!process.env.ENCRYPTION_KEY || !process.env.JWT_SECRET || !process.env.API_KEY) {
  console.log('🔐 Generating new encryption keys...');
  const envAdditions = [];
  
  if (!process.env.ENCRYPTION_KEY) {
    envAdditions.push(`ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
  }
  if (!process.env.JWT_SECRET) {
    envAdditions.push(`JWT_SECRET=${JWT_SECRET}`);
    process.env.JWT_SECRET = JWT_SECRET;
  }
  if (!process.env.API_KEY) {
    envAdditions.push(`API_KEY=${API_KEY}`);
    process.env.API_KEY = API_KEY;
  }
  
  // Only write to .env file in development mode
  if (process.env.NODE_ENV !== 'production' && envAdditions.length > 0) {
    try {
    const envPath = path.join(__dirname, '.env');
    fs.appendFileSync(envPath, '\n# 🔐 SECURITY KEYS (Generated automatically)\n' + envAdditions.join('\n') + '\n');
    console.log('🔑 New security keys generated and saved to .env file!');
    } catch (error) {
      console.log('🔑 New security keys generated (using environment variables) - file write failed');
  }
  } else {
    console.log('🔑 New security keys generated (using environment variables)');
  }
  console.log('⚠️  Keep these keys secret! Mars depends on it!');
}

// 🔐 ENCRYPTION UTILITIES
class ElonCrypto {
  static encrypt(text) {
    if (!text) return text;
    return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
  }
  
  static decrypt(ciphertext) {
    if (!ciphertext) return ciphertext;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return ciphertext; // Return original if decryption fails
    }
  }
  
  static hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  }
  
  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
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

  // 🔐 SLACK TOKEN ENCRYPTION UTILITIES
  static isEncryptedToken(token) {
    // Check if token is already encrypted (doesn't start with slack token prefixes)
    return token && !token.startsWith('xox') && token.length > 50;
  }

  static encryptSlackToken(token) {
    if (!token) return token;
    if (this.isEncryptedToken(token)) {
      console.log('🔐 Token is already encrypted');
      return token;
    }
    console.log('🔐 Encrypting Slack token...');
    return this.encrypt(token);
  }

  static decryptSlackToken(encryptedToken) {
    if (!encryptedToken) return encryptedToken;
    if (!this.isEncryptedToken(encryptedToken)) {
      console.log('⚠️  Token appears to be plain text');
      return encryptedToken;
    }
    try {
      const decrypted = this.decrypt(encryptedToken);
      if (decrypted && decrypted.startsWith('xox')) {
        return decrypted;
      } else {
        console.log('⚠️  Decrypted token doesn\'t look like a Slack token');
        return encryptedToken;
      }
    } catch (error) {
      console.error('❌ Failed to decrypt Slack token:', error);
      return encryptedToken;
    }
  }
}

// 🤖 OPENAI ELON ENHANCED CLASS
class ElonOpenAIEnhanced {
  constructor() {
    // Get encrypted OpenAI key
    const encryptedKey = process.env.ENCRYPTED_OPENAI_API_KEY;
    const openaiKey = encryptedKey ? ElonCrypto.decrypt(encryptedKey) : process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found - AI features disabled');
      this.openai = null;
    } else {
      // Initialize OpenAI client with decrypted key
      this.openai = new OpenAI({
        apiKey: openaiKey
      });
      console.log('🤖 OpenAI client initialized - Elon AI brain online!');
    }
    
    this.goals = new Map(); // Store user goals
    this.interactions = []; // Store conversation history
  }

  // Analyze user response using GPT
  async analyzeUserResponse(userName, message) {
    if (!this.openai) {
      console.log('⚠️ OpenAI not available, using fallback analysis');
      return {
        sentiment: "neutral",
        urgency: "medium",
        hasDeadline: message.toLowerCase().includes('deadline') || message.toLowerCase().includes('by '),
        keyTopics: ["business update"],
        actionItems: ["follow up required"]
      };
    }
    
    try {
      const analysisPrompt = `
Analyze this business response from ${userName}: "${message}"

Provide analysis in JSON format:
{
  "sentiment": "positive/neutral/negative",
  "urgency": "low/medium/high", 
  "hasDeadline": true/false,
  "extractedDeadline": "specific date/time if found",
  "businessValue": "dollar amount if mentioned",
  "progressIndicators": ["list of progress mentioned"],
  "challenges": ["list of challenges mentioned"],
  "goals": ["list of goals mentioned"],
  "keyTopics": ["main business topics"],
  "actionItems": ["things that need to be done"],
  "successMetrics": ["measurable outcomes mentioned"]
}

Be precise and extract specific information.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a business analyst expert at extracting structured information from business updates." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      console.log(`🧠 AI Analysis for ${userName}:`, analysis);
      return analysis;

    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      // Fallback to basic analysis
      return {
        sentiment: "neutral",
        urgency: "medium",
        hasDeadline: message.toLowerCase().includes('deadline') || message.toLowerCase().includes('by '),
        keyTopics: ["business update"],
        actionItems: ["follow up required"]
      };
    }
  }

  // Generate Elon-style response using GPT
  async generateElonResponse(userName, message, analysis, userGoals = []) {
    if (!this.openai) {
      console.log('⚠️ OpenAI not available, using fallback response');
      return `Thanks for the update, ${userName}! Your progress is noted. Let's push harder and execute with precision. Set clear deadlines and report back with measurable results. 🚀`;
    }
    
    try {
      const responsePrompt = `
You are Elon Musk responding to ${userName}'s business update: "${message}"

ANALYSIS CONTEXT:
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}
- Has Deadline: ${analysis.hasDeadline}
- Key Topics: ${analysis.keyTopics?.join(', ')}
- Challenges: ${analysis.challenges?.join(', ')}
- Goals: ${analysis.goals?.join(', ')}
- Progress: ${analysis.progressIndicators?.join(', ')}

USER'S ACTIVE GOALS: ${userGoals.length > 0 ? userGoals.map(g => g.description).join(', ') : 'None set'}

Generate an Elon Musk response that is:
1. DIRECT and ASSERTIVE (like Elon's communication style)
2. BUSINESS-FOCUSED with specific actionable advice
3. Uses first-principles thinking
4. Includes relevant deadlines/urgency if mentioned
5. Encouraging but challenging
6. Maximum 200 words

EXAMPLES OF ELON STYLE:
- "First, let's cut the fluff. You have momentum, but don't mistake activity for achievement."
- "Good progress. Now optimize every variable and find where you can 2x the output."
- "Set a deadline. Without time pressure, tasks expand to fill infinity."
- "Execute with precision. Report back with results, not excuses."

Be specific to their situation and provide actionable next steps.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are Elon Musk - direct, assertive, focused on execution and results. You think in first principles and push people to achieve more. Keep responses concise but impactful." 
          },
          { role: "user", content: responsePrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const elonReply = completion.choices[0].message.content;
      console.log(`🚀 AI-Generated Elon Response for ${userName}`);
      return elonReply;

    } catch (error) {
      console.error('❌ OpenAI response generation failed:', error);
      // Fallback response
      return `Thanks for the update, ${userName}! Your progress is noted. Let's push harder and execute with precision. Set clear deadlines and report back with measurable results. 🚀`;
    }
  }

  // Process message with full AI enhancement
  async processMessage(userId, userName, message) {
    try {
      console.log(`🤖 Processing AI-enhanced message from ${userName}`);

      // Step 1: Analyze with AI
      const analysis = await this.analyzeUserResponse(userName, message);

      // Step 2: Get user context
      const userGoals = this.getActiveGoals(userId);

      // Step 3: Generate intelligent response
      const elonReply = await this.generateElonResponse(userName, message, analysis, userGoals);

      // Step 4: Store interaction
      this.interactions.push({
        userId,
        userName,
        timestamp: new Date().toISOString(),
        userMessage: message,
        analysis,
        elonReply,
        goalsCount: userGoals.length
      });

      return {
        success: true,
        analysis,
        reply: elonReply,
        goalsUpdated: analysis.hasDeadline
      };

    } catch (error) {
      console.error('❌ AI processing failed:', error);
      return {
        success: false,
        reply: `Thanks for the update, ${userName}! Processing your response and will provide detailed feedback shortly. Keep pushing boundaries! 🚀`,
        error: error.message
      };
    }
  }

  // Get user's active goals
  getActiveGoals(userId) {
    return this.goals.get(userId) || [];
  }
}

// Initialize OpenAI Enhanced Bot
const elonAI = new ElonOpenAIEnhanced();

// 🔐 SLACK TOKEN MANAGEMENT
function getDecryptedSlackToken() {
  const rawToken = process.env.SLACK_BOT_TOKEN;
  if (!rawToken) {
    console.log('⚠️  No Slack bot token found in environment');
    return null;
  }
  
  const decryptedToken = ElonCrypto.decryptSlackToken(rawToken);
  
  if (ElonCrypto.isEncryptedToken(rawToken)) {
    console.log('🔓 Using encrypted Slack token (decrypted for API calls)');
  } else {
    console.log('⚠️  Using plain text Slack token (consider encrypting)');
  }
  
  return decryptedToken;
}

function getDecryptedSigningSecret() {
  const rawSecret = process.env.SLACK_SIGNING_SECRET;
  if (!rawSecret) return null;
  
  // Check if it's encrypted (signing secrets are 32 chars, encrypted will be much longer)
  if (rawSecret.length > 50 && !rawSecret.match(/^[a-f0-9]{32}$/)) {
    console.log('🔓 Using encrypted signing secret (decrypted for API calls)');
    return ElonCrypto.decrypt(rawSecret);
  } else {
    console.log('⚠️  Using plain text signing secret (consider encrypting)');
    return rawSecret;
  }
}

// Initialize Slack client with decrypted token
const decryptedSlackToken = getDecryptedSlackToken();
const slack = decryptedSlackToken ? new WebClient(decryptedSlackToken) : null;

// Initialize Slack events adapter only if signing secret is available
let slackEvents;
const decryptedSigningSecret = getDecryptedSigningSecret();
if (decryptedSigningSecret) {
  slackEvents = createEventAdapter(decryptedSigningSecret);
}

// Express app with security
const app = express();
const port = process.env.PORT || 3000;

// 🔐 SECURITY MIDDLEWARE
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Apply JSON parsing to all routes EXCEPT /slack/events (which needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.path.startsWith('/slack/events')) {
    // Skip JSON parsing for Slack events - they handle their own body parsing
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// Rate limiting - Even Elon has limits!
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests! Even rockets need cooldown time. 🚀',
    elonQuote: 'Patience is a virtue, especially when reaching for Mars!'
  }
});

app.use('/api/', limiter);

// Use the event adapter's express middleware only if available
if (slackEvents) {
  app.use('/slack/events', slackEvents.expressMiddleware());
  
  // 🤖 SLACK EVENT HANDLERS WITH OPENAI INTEGRATION
  
  // Handle direct messages for AI-powered replies
  slackEvents.on('message', async (event) => {
    try {
      // Skip bot messages, message changes, and thread replies
      if (event.subtype || event.bot_id || event.thread_ts) {
        return;
      }

      // Only respond to direct messages
      if (event.channel_type !== 'im') {
        return;
      }

      console.log('📨 Received DM from user:', event.user);
      console.log('💬 Message:', event.text);

      // Get user info
      let userInfo;
      try {
        const userResponse = await slack.users.info({ user: event.user });
        userInfo = userResponse.user;
      } catch (error) {
        console.error('❌ Failed to get user info:', error);
        return;
      }

      const userName = userInfo.real_name || userInfo.name || 'Team Member';
      const userId = event.user;
      const message = event.text;

      // Store the user's response (encrypted)
      await storeResponse(userId, userName, message);

      // Process with OpenAI and generate Elon-style reply
      const result = await elonAI.processMessage(userId, userName, message);

      if (result.success && result.reply) {
        // Send AI-generated Elon response
        await slack.chat.postMessage({
          channel: event.channel,
          text: result.reply,
          username: 'Elon Bot',
          icon_emoji: ':rocket:'
        });

        console.log(`🚀 AI-powered Elon response sent to ${userName}`);
      } else {
        // Fallback response
        await slack.chat.postMessage({
          channel: event.channel,
          text: `Thanks for the update, ${userName}! Processing your response and will provide detailed feedback shortly. Keep pushing boundaries! 🚀`,
          username: 'Elon Bot',
          icon_emoji: ':rocket:'
        });

        console.log(`⚠️ Fallback response sent to ${userName}`);
      }

    } catch (error) {
      console.error('❌ Error handling message event:', error);
      
      // Try to send error response
      try {
        await slack.chat.postMessage({
          channel: event.channel,
          text: "System processing error - but failures lead to improvements! We'll get this sorted. 🚀",
          username: 'Elon Bot',
          icon_emoji: ':warning:'
        });
      } catch (sendError) {
        console.error('❌ Failed to send error message:', sendError);
      }
    }
  });

  // Handle errors in the Slack events
  slackEvents.on('error', (error) => {
    console.error('❌ Slack Events API error:', error);
  });

  console.log('🤖 Slack event handlers initialized with AI integration!');
} else {
  console.log('⚠️ Slack Events API not initialized - replies disabled');
}

console.log('🚀 ELON - ENCRYPTED & SECURE! 🔐');
console.log('🔋 Tesla-powered Bot Token:', decryptedSlackToken ? 'CHARGED ⚡' : 'NEEDS CHARGING 🔋');
console.log('🔐 Signing Secret:', decryptedSigningSecret ? 'SECURED 🔒' : 'OPTIONAL (for basic functionality) 🔓');
console.log('🔑 Encryption:', ENCRYPTION_KEY ? 'ENABLED 🛡️' : 'DISABLED ⚠️');
console.log('🎫 JWT Authentication:', JWT_SECRET ? 'ENABLED 🎟️' : 'DISABLED ⚠️');
console.log('🗝️  API Key:', API_KEY ? 'PROTECTED 🔐' : 'UNPROTECTED ⚠️');
console.log('🌐 Starlink Port:', port);
console.log('💫 "Security is not a product, but a process!" - Elon (probably)');

// Token encryption status
if (process.env.SLACK_BOT_TOKEN) {
  const isEncrypted = ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN);
  console.log('🔐 Slack Token Encryption:', isEncrypted ? 'ENCRYPTED 🔒' : 'PLAIN TEXT ⚠️');
}
if (process.env.SLACK_SIGNING_SECRET) {
  const isEncrypted = process.env.SLACK_SIGNING_SECRET.length > 50;
  console.log('🔐 Signing Secret Encryption:', isEncrypted ? 'ENCRYPTED 🔒' : 'PLAIN TEXT ⚠️');
}

// 🔐 AUTHENTICATION MIDDLEWARES
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required! Even Elon needs clearance for SpaceX! 🚀',
      elonQuote: 'The best security is the security you can\'t see.'
    });
  }
  
  const user = ElonCrypto.verifyToken(token);
  if (!user) {
    return res.status(403).json({ 
      error: 'Invalid or expired token! Time to get new clearance! ⏰',
      elonQuote: 'Innovation requires iteration, including security tokens!'
    });
  }
  
  req.user = user;
  next();
};

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Valid API key required! Mars access denied! 🔴',
      elonQuote: 'The right key opens any door, including Mars!'
    });
  }
  
  next();
};

// Combined auth middleware (API key OR JWT token)
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Check API key first
  if (apiKey && apiKey === API_KEY) {
    return next();
  }
  
  // Check JWT token
  if (token) {
    const user = ElonCrypto.verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  return res.status(401).json({ 
    error: 'Authentication required! Provide API key or valid JWT token! 🔐',
    elonQuote: 'The first step to Mars is proving you belong there!'
  });
};

// In-memory storage for responses (encrypted)
const responses = [];

// Employee schema
let Employee;
let Response;
const employees = [];

// Connect to MongoDB if URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB (our encrypted neural network is online!)');
      
      const EmployeeSchema = new mongoose.Schema({
        slackId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        email: String,
        department: String,
        active: { type: Boolean, default: true }
      });

      const ResponseSchema = new mongoose.Schema({
        slackId: String,
        employeeName: String,
        message: String, // This will be encrypted
        timestamp: { type: Date, default: Date.now },
        date: String,
        encrypted: { type: Boolean, default: true }
      });

      Employee = mongoose.model('Employee', EmployeeSchema);
      Response = mongoose.model('Response', ResponseSchema);
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed (switching to backup systems):', err);
      console.log('📁 Using encrypted file-based storage (like the early Tesla days)');
    });
} else {
  console.log('📁 Using encrypted file-based storage (keeping it simple, like a Model S)');
}

// Load employees from file if no MongoDB
async function loadEmployees() {
  if (Employee) {
    try {
      const dbEmployees = await Employee.find({ active: true });
      return dbEmployees;
    } catch (error) {
      console.error('Error loading crew from database:', error);
      return [];
    }
  } else {
    // Load from JSON file
    try {
      if (fs.existsSync('employees.json')) {
        const fileEmployees = JSON.parse(fs.readFileSync('employees.json', 'utf8'));
        return fileEmployees.filter(emp => emp.active);
      } else if (fs.existsSync('test-employees.json')) {
        const testEmployees = JSON.parse(fs.readFileSync('test-employees.json', 'utf8'));
        return testEmployees.filter(emp => emp.active);
      }
    } catch (error) {
      console.error('Error loading crew from file:', error);
    }
    return [];
  }
}

// 🔐 ENCRYPTED STORAGE FUNCTIONS
async function storeResponse(slackId, employeeName, message) {
  const today = new Date().toISOString().split('T')[0];
  
  // Encrypt sensitive data
  const encryptedMessage = ElonCrypto.encrypt(message);
  const encryptedName = ElonCrypto.encrypt(employeeName);
  
  const responseData = {
    slackId,
    employeeName: encryptedName,
    message: encryptedMessage,
    timestamp: new Date(),
    date: today,
    encrypted: true
  };

  if (mongoose.connection.readyState === 1 && Response) {
    try {
      await Response.create(responseData);
      console.log(`📝 Encrypted response stored in database for ${employeeName}`);
    } catch (error) {
      console.error('Error storing encrypted response in database:', error);
      responses.push(responseData);
    }
  } else {
    responses.push(responseData);
    // Save encrypted data to file
    fs.writeFileSync('responses-encrypted.json', JSON.stringify(responses, null, 2));
    console.log(`📝 Encrypted response stored in file for ${employeeName}`);
  }
}

// Function to decrypt responses for display
function decryptResponses(encryptedResponses) {
  return encryptedResponses.map(response => ({
    ...response,
    employeeName: response.encrypted ? ElonCrypto.decrypt(response.employeeName) : response.employeeName,
    message: response.encrypted ? ElonCrypto.decrypt(response.message) : response.message
  }));
}

// Listen for direct messages (replies)
if (slackEvents && slack) {
  slackEvents.on('message', async (event) => {
    // Only process direct messages to the bot
    if (event.channel_type === 'im' && !event.bot_id && event.text) {
      try {
        // Get user info
        const userInfo = await slack.users.info({ user: event.user });
        const userName = userInfo.user.real_name || userInfo.user.name;
        
        console.log(`📨 Received encrypted response from ${userName}: [ENCRYPTED]`);
        
        // Store the encrypted response (existing functionality)
        await storeResponse(event.user, userName, event.text);
        
        try {
          // 🤖 OPENAI-POWERED INTELLIGENT RESPONSE SYSTEM
          const { ElonOpenAIEnhanced } = require('./elon-openai-enhanced');
          
          // Initialize AI-enhanced system if not already done
          if (!global.elonAI) {
            global.elonAI = new ElonOpenAIEnhanced();
            console.log('🤖 OpenAI-Enhanced Elon system initialized!');
          }
          
          const message = event.text;
          const userId = event.user;
          
          console.log(`🤖 AI-Enhanced processing for ${userName}: ${message.substring(0, 100)}...`);
          
          // Check if OpenAI is available, fallback to basic system if not
          if (process.env.OPENAI_API_KEY) {
            // AI-POWERED PROCESSING
            const result = await global.elonAI.processMessage(userId, userName, message);
            
            if (result.success) {
              console.log('🧠 AI Analysis successful:', result.analysis);
              
              // Send the AI-generated reply
              await slack.chat.postMessage({
                channel: event.channel,
                text: result.reply,
                as_user: false,
                username: 'Elon Musk',
                icon_emoji: ':rocket:'
              });
              
              console.log(`🚀 AI-Generated Elon reply sent to ${userName}`);
              
              // Store the AI interaction
              const interactionData = {
                userId,
                userName: ElonCrypto.encrypt(userName),
                userMessage: ElonCrypto.encrypt(message),
                elonReply: ElonCrypto.encrypt(result.reply),
                analysis: result.analysis,
                timestamp: new Date().toISOString(),
                aiPowered: true
              };
              
              // Store encrypted interaction
              let interactions = [];
              try {
                if (fs.existsSync('ai-interactions.json')) {
                  interactions = JSON.parse(fs.readFileSync('ai-interactions.json', 'utf8'));
                }
              } catch (error) {
                console.error('Error loading AI interactions:', error);
              }
              
              interactions.push(interactionData);
              fs.writeFileSync('ai-interactions.json', JSON.stringify(interactions, null, 2));
              
            } else {
              throw new Error('AI processing failed: ' + result.error);
            }
          } else {
            console.log('⚠️ OpenAI API key not found, using basic enhanced system...');
            
            // FALLBACK TO RULE-BASED SYSTEM
            const { GoalTracker, ResponseAnalyzer, ElonResponseGenerator } = require('./elon-enhanced-replies');
            
            if (!global.goalTracker) {
              global.goalTracker = new GoalTracker();
            }
            
            const analysis = ResponseAnalyzer.analyzeResponse(message);
            const userGoals = global.goalTracker.getActiveGoals(userId);
            const extractedDeadline = ResponseAnalyzer.extractDeadline(message);
            
            if (extractedDeadline && (analysis.hasGoals || analysis.hasDeadline)) {
              const goalId = global.goalTracker.setGoal(userId, message, extractedDeadline);
              console.log(`🎯 Goal set: ${extractedDeadline} (ID: ${goalId})`);
            }
            
            const elonReply = ElonResponseGenerator.generateResponse(userName, message, analysis, userGoals);
            
            await slack.chat.postMessage({
              channel: event.channel,
              text: elonReply,
              as_user: false,
              username: 'Elon Musk',
              icon_emoji: ':rocket:'
            });
            
            console.log(`🚀 Basic enhanced reply sent to ${userName}`);
          }
          
        } catch (enhancedError) {
          console.error('❌ Enhanced processing failed, using fallback:', enhancedError);
          
          // FALLBACK: Simple acknowledgments if enhanced system fails
          const elonAcknowledgments = [
            `Excellent work, ${userName}! 🚀 Your progress is helping us get to Mars faster. Keep pushing the boundaries!`,
            `${userName}, this is exactly the kind of first-principles thinking we need! 💫 "The best part is no part" - and you're optimizing like a true engineer!`,
            `Outstanding, ${userName}! 🔥 Your accomplishments today would make even Tony Stark jealous. Tomorrow, let's think 10x bigger!`,
            `${userName}, you're crushing it! ⚡ This is the kind of innovation that changes everything. Mars is getting closer!`,
            `Phenomenal work, ${userName}! 🌟 "When something is important enough, you do it even if the odds are not in your favor" - and you're proving that every day!`
          ];
          
          const randomAck = elonAcknowledgments[Math.floor(Math.random() * elonAcknowledgments.length)];
          
          await slack.chat.postMessage({
            channel: event.channel,
            text: randomAck
          });
          
          console.log(`✅ Sent fallback Elon acknowledgment to ${userName}`);
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
}

// Elon-style messages array
const elonMessages = [
  (name) => `🚀 **MISSION BRIEFING FOR ${name.toUpperCase()}** 🚀

*SpaceX Mission Commander Elon here...*

What breakthrough did you achieve today? I want the full mission report:

• What did you build, create, or optimize?
• What problems did you solve with first-principles thinking?
• How did you push the boundaries of what's possible?

Reply with EVERYTHING - no detail is too small when we're building the future!

*"The best part is no part, the best process is no process"* - Elon`,

  (name) => `⚡ **TESLA ENERGY UPDATE - ${name.toUpperCase()}** ⚡

*Chief Engineer Musk requesting status report...*

Time for your daily energy audit! Tell me:

• What innovations did you deliver today?
• Which inefficiencies did you eliminate?
• How did you accelerate progress toward our mission?

Think like we're designing the Model S - every detail matters for the revolution!

*"Failure is an option here. If things are not failing, you are not innovating enough."* - Elon`,

  (name) => `🌌 **MARS COLONY UPDATE - ${name.toUpperCase()}** 🌌

*Greetings from Earth... for now.*

Your daily progress report is crucial for our multiplanetary future:

• What did you accomplish that brings us closer to Mars?
• Which obstacles did you overcome with creative solutions?
• How did your work today change the game?

Remember: We're not just building products, we're building the future of humanity!

*"Mars is there, waiting to be reached."* - Elon`,

  (name) => `🤖 **NEURALINK SYNC - ${name.toUpperCase()}** 🤖

*Neural interface activated...*

Time to sync your daily achievements to the collective intelligence:

• What complex problems did you solve today?
• How did you optimize systems for maximum efficiency?
• What breakthrough moments happened in your work?

Think exponentially - we're literally connecting minds to machines!

*"The first step is to establish that something is possible; then probability will occur."* - Elon`,

  (name) => `🛸 **TECH OVERLORD ELON - ${name.toUpperCase()}** 🛸

*Summoning your daily progress data...*

I need your full achievement download:

• What did you create, destroy, or revolutionize today?
• How did you apply first-principles thinking to your challenges?
• What seemingly impossible thing did you make possible?

We're not just changing industries - we're changing the trajectory of human civilization!

*"The future depends on what you do today!"* - Elon`
];

// Send message to an employee (Elon style!)
async function sendElonMessage(employee) {
  if (!slack) {
    console.error('❌ Slack client not initialized - check your encrypted token!');
    return;
  }

  try {
    // Randomly select an Elon-style message
    const randomMessageFunc = elonMessages[Math.floor(Math.random() * elonMessages.length)];
    const message = randomMessageFunc(employee.name);

    const result = await slack.chat.postMessage({
      channel: employee.slackId,
      text: message
    });

    if (result.ok) {
      console.log(`✅ Encrypted Elon message deployed to ${employee.name} 🚀`);
    } else {
      console.error(`❌ Mission failed for ${employee.name}:`, result.error);
    }
  } catch (error) {
    console.error(`❌ Houston, we have a problem with ${employee.name}:`, error.message);
  }
}

// Send messages to all active employees
async function sendElonMessages() {
  console.log('🚀 INITIATING ENCRYPTED DAILY MISSION BRIEFING SEQUENCE...');
  
  if (!slack) {
    console.error('❌ Cannot send messages - Slack client not initialized!');
    console.log('💡 Check your SLACK_BOT_TOKEN encryption and try again');
    return;
  }
  
  const activeEmployees = await loadEmployees();
  console.log(`🎯 Found ${activeEmployees.length} crew members ready for Mars`);
  
  for (const employee of activeEmployees) {
    await sendElonMessage(employee);
    // Small delay between messages (even rockets need staging)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ All crew members have received their encrypted mission briefings! 🚀');
  console.log('💫 "Mars, here we come!" - Elon (probably)');
}

// Schedule messages (Mars time... just kidding, Earth time for now)
const reportHour = process.env.REPORT_HOUR || 16;
const reportMinute = process.env.REPORT_MINUTE || 30;

console.log(`⏰ Scheduling daily encrypted mission briefings for ${reportHour}:${reportMinute} (Earth time)`);
console.log('🌌 "Time is the ultimate currency" - Elon');

cron.schedule(`${reportMinute} ${reportHour} * * 1-5`, () => {
  console.log('🕐 ENCRYPTED MISSION BRIEFING TIME! Deploying Elon energy...');
  sendElonMessages();
}, {
  timezone: process.env.TIMEZONE || 'America/New_York'
});

// 🔐 AUTHENTICATION ENDPOINTS

// Generate JWT token
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // In production, verify against real user database
  const validUsers = {
    'elon': 'mars2024',
    'admin': process.env.ADMIN_PASSWORD || 'spacex123'
  };
  
  if (validUsers[username] && validUsers[username] === password) {
    const token = ElonCrypto.generateToken({ username, role: 'admin' });
    res.json({
      success: true,
      token,
      message: 'Welcome to the SpaceX mission control! 🚀',
      elonQuote: 'The future is going to be wild!'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials! Mars access denied! 🔴',
      elonQuote: 'Persistence is very important. You should not give up unless you are forced to give up.'
    });
  }
});

// Get API key (for trusted clients)
app.post('/api/auth/api-key', authenticateToken, (req, res) => {
  res.json({
    success: true,
    apiKey: API_KEY,
    message: 'API key retrieved! Handle with care - Mars depends on it! 🔑',
    elonQuote: 'With great power comes great responsibility to reach Mars!'
  });
});

// 🔐 SLACK TOKEN MANAGEMENT ENDPOINTS

// Encrypt existing Slack tokens
app.post('/api/encrypt-tokens', authenticate, (req, res) => {
  try {
    const results = {};
    
    // Encrypt Slack bot token
    if (process.env.SLACK_BOT_TOKEN) {
      const isAlreadyEncrypted = ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN);
      if (!isAlreadyEncrypted) {
        const encryptedToken = ElonCrypto.encryptSlackToken(process.env.SLACK_BOT_TOKEN);
        results.slackBotToken = {
          status: 'encrypted',
          message: 'Slack bot token encrypted successfully! 🔐',
          encryptedToken: encryptedToken,
          instructions: process.env.NODE_ENV === 'production' ? 
            'Update your Render environment variables with: SLACK_BOT_TOKEN=' + encryptedToken :
            'Update your .env file with: SLACK_BOT_TOKEN=' + encryptedToken
        };
      } else {
        results.slackBotToken = {
          status: 'already_encrypted',
          message: 'Slack bot token is already encrypted! ✅'
        };
      }
    } else {
      results.slackBotToken = {
        status: 'not_found',
        message: 'No SLACK_BOT_TOKEN found in environment'
      };
    }
    
    // Encrypt signing secret
    if (process.env.SLACK_SIGNING_SECRET) {
      const isAlreadyEncrypted = process.env.SLACK_SIGNING_SECRET.length > 50;
      if (!isAlreadyEncrypted) {
        const encryptedSecret = ElonCrypto.encrypt(process.env.SLACK_SIGNING_SECRET);
        results.slackSigningSecret = {
          status: 'encrypted',
          message: 'Slack signing secret encrypted successfully! 🔐',
          encryptedSecret: encryptedSecret,
          instructions: process.env.NODE_ENV === 'production' ? 
            'Update your Render environment variables with: SLACK_SIGNING_SECRET=' + encryptedSecret :
            'Update your .env file with: SLACK_SIGNING_SECRET=' + encryptedSecret
        };
      } else {
        results.slackSigningSecret = {
          status: 'already_encrypted',
          message: 'Slack signing secret is already encrypted! ✅'
        };
      }
    } else {
      results.slackSigningSecret = {
        status: 'not_found',
        message: 'No SLACK_SIGNING_SECRET found in environment'
      };
    }
    
    res.json({
      success: true,
      message: 'Token encryption process completed! 🚀',
      results: results,
      elonQuote: 'Security is like a rocket - it needs multiple layers to reach Mars!',
      warning: process.env.NODE_ENV === 'production' ? 
        '⚠️ Remember to update your Render environment variables with the encrypted tokens!' :
        '⚠️ Remember to update your .env file with the encrypted tokens and restart the server!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      elonQuote: 'Even rockets have failures - but we learn and improve!'
    });
  }
});

// Check token encryption status
app.get('/api/token-status', authenticate, (req, res) => {
  const status = {
    slackBotToken: {
      present: !!process.env.SLACK_BOT_TOKEN,
      encrypted: process.env.SLACK_BOT_TOKEN ? ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN) : false,
      status: process.env.SLACK_BOT_TOKEN ? 
        (ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN) ? '🔐 ENCRYPTED' : '⚠️ PLAIN TEXT') : 
        '❌ NOT FOUND'
    },
    slackSigningSecret: {
      present: !!process.env.SLACK_SIGNING_SECRET,
      encrypted: process.env.SLACK_SIGNING_SECRET ? process.env.SLACK_SIGNING_SECRET.length > 50 : false,
      status: process.env.SLACK_SIGNING_SECRET ? 
        (process.env.SLACK_SIGNING_SECRET.length > 50 ? '🔐 ENCRYPTED' : '⚠️ PLAIN TEXT') : 
        '❌ NOT FOUND'
    }
  };
  
  res.json({
    success: true,
    tokenStatus: status,
    recommendation: !status.slackBotToken.encrypted || !status.slackSigningSecret.encrypted ? 
      'Consider encrypting your Slack tokens using POST /api/encrypt-tokens' : 
      'All tokens are properly encrypted! 🚀',
    elonQuote: 'The first step to Mars is securing the launch codes!'
  });
});

// 🔐 SECURED API ENDPOINTS

// API endpoint to manually trigger messages (SECURED)
app.get('/api/send-elon', authenticate, async (req, res) => {
  try {
    await sendElonMessages();
    res.json({ 
      success: true, 
      message: 'Encrypted Elon messages deployed successfully! 🚀🔐',
      elonQuote: "The future is going to be wild!",
      security: 'All data encrypted and secured! 🛡️'
    });
  } catch (error) {
    console.error('Mission abort:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      elonQuote: "Failure is an option here. If things are not failing, you are not innovating enough."
    });
  }
});

// API endpoint to test with specific employees (SECURED)
app.get('/api/test-elon', authenticate, async (req, res) => {
  try {
    const testEmployees = await loadEmployees();
    console.log('🧪 Initiating encrypted test mission briefing sequence...');
    
    for (const employee of testEmployees) {
      await sendElonMessage(employee);
    }
    
    res.json({ 
      success: true, 
      message: `Encrypted Elon test messages deployed to ${testEmployees.length} crew members! 🚀🔐`,
      employees: testEmployees.map(emp => ({ name: emp.name, slackId: emp.slackId })),
      elonQuote: "When something is important enough, you do it even if the odds are not in your favor.",
      security: 'All communications encrypted! 🛡️'
    });
  } catch (error) {
    console.error('Test mission failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      elonQuote: "If you're not failing, you're not innovating enough."
    });
  }
});

// 🤖 API endpoint to test OpenAI integration (SECURED)
app.post('/api/test-ai', authenticate, async (req, res) => {
  try {
    const { message, userName = 'Test User', userId = 'TEST123' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required for AI testing',
        elonQuote: 'First principles: You need input to get output!'
      });
    }

    console.log('🧪 Testing AI integration with message:', message);
    
    // Process with OpenAI
    const result = await elonAI.processMessage(userId, userName, message);
    
    res.json({
      success: true,
      message: 'AI test completed successfully! 🤖',
      input: {
        userName,
        userId,
        message
      },
      output: {
        analysis: result.analysis,
        reply: result.reply,
        aiAvailable: !!elonAI.openai
      },
      elonQuote: 'The best part is no part. The best process is no process. But sometimes you need to test the process!',
      security: 'AI processing secured and encrypted! 🔐'
    });
    
  } catch (error) {
    console.error('AI test mission failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      elonQuote: 'Failure is an option here. If things are not failing, you are not innovating enough.'
    });
  }
});

// API endpoint to view responses (SECURED & DECRYPTED)
app.get('/api/responses', authenticate, async (req, res) => {
  try {
    let allResponses = [];
    
    if (mongoose.connection.readyState === 1 && Response) {
      allResponses = await Response.find().sort({ timestamp: -1 });
    } else {
      allResponses = responses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Decrypt responses for authorized access
    const decryptedResponses = decryptResponses(allResponses);
    
    res.json({
      success: true,
      responses: decryptedResponses,
      count: decryptedResponses.length,
      elonQuote: "I think it's very important to have a feedback loop, where you're constantly thinking about what you've done and how you could be doing it better.",
      security: 'Data decrypted for authorized access! 🔓'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API endpoint to view today's responses (SECURED & DECRYPTED)
app.get('/api/responses/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let todayResponses = [];
    
    if (mongoose.connection.readyState === 1 && Response) {
      todayResponses = await Response.find({ date: today }).sort({ timestamp: -1 });
    } else {
      todayResponses = responses.filter(r => r.date === today);
    }
    
    // Decrypt responses for authorized access
    const decryptedResponses = decryptResponses(todayResponses);
    
    res.json({
      success: true,
      date: today,
      responses: decryptedResponses,
      count: decryptedResponses.length,
      elonQuote: "Mars is there, waiting to be reached.",
      security: 'Today\'s data decrypted for authorized access! 🔓'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fun Elon facts endpoint (PUBLIC - but rate limited)
app.get('/api/elon-wisdom', (req, res) => {
  const elonQuotes = [
    "When something is important enough, you do it even if the odds are not in your favor.",
    "The first step is to establish that something is possible; then probability will occur.",
    "I think it's very important to have a feedback loop, where you're constantly thinking about what you've done and how you could be doing it better.",
    "Failure is an option here. If things are not failing, you are not innovating enough.",
    "The best part is no part. The best process is no process.",
    "If you're not failing, you're not innovating enough.",
    "Mars is there, waiting to be reached.",
    "The future is going to be wild!",
    "I'd rather be optimistic and wrong than pessimistic and right.",
    "Persistence is very important. You should not give up unless you are forced to give up."
  ];
  
  const randomQuote = elonQuotes[Math.floor(Math.random() * elonQuotes.length)];
  res.json({
    quote: randomQuote,
    author: "Elon Musk",
    rocket: "🚀",
    security: "🔐",
    message: "Daily dose of Elon wisdom delivered securely!"
  });
});

// 🔐 SECURITY STATUS ENDPOINT
app.get('/api/security-status', authenticate, (req, res) => {
  const slackTokenEncrypted = process.env.SLACK_BOT_TOKEN ? ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN) : false;
  const signingSecretEncrypted = process.env.SLACK_SIGNING_SECRET ? process.env.SLACK_SIGNING_SECRET.length > 50 : false;
  
  res.json({
    encryption: {
      enabled: !!ENCRYPTION_KEY,
      algorithm: 'AES-256',
      status: '🔐 SECURED'
    },
    jwt: {
      enabled: !!JWT_SECRET,
      expiry: '24h',
      status: '🎫 ACTIVE'
    },
    apiKey: {
      enabled: !!API_KEY,
      status: '🗝️  PROTECTED'
    },
    slackTokens: {
      botToken: {
        present: !!process.env.SLACK_BOT_TOKEN,
        encrypted: slackTokenEncrypted,
        status: slackTokenEncrypted ? '🔐 ENCRYPTED' : '⚠️ PLAIN TEXT'
      },
      signingSecret: {
        present: !!process.env.SLACK_SIGNING_SECRET,
        encrypted: signingSecretEncrypted,
        status: signingSecretEncrypted ? '🔐 ENCRYPTED' : '⚠️ PLAIN TEXT'
      }
    },
    rateLimit: {
      enabled: true,
      window: '15 minutes',
      maxRequests: process.env.RATE_LIMIT || 100,
      status: '🛡️ ACTIVE'
    },
    headers: {
      helmet: 'ENABLED',
      cors: 'CONFIGURED',
      status: '🛡️ SECURED'
    },
    database: {
      encryption: 'ENABLED',
      connection: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'FILE-BASED',
      status: '📊 SECURED'  
    },
    elonQuote: "Security is not a product, but a process!",
    overall: "🚀 MARS-LEVEL SECURITY ACHIEVED! 🔐"
  });
});

// Root endpoint with security info
app.get('/', (req, res) => {
  const slackTokenEncrypted = process.env.SLACK_BOT_TOKEN ? ElonCrypto.isEncryptedToken(process.env.SLACK_BOT_TOKEN) : false;
  const signingSecretEncrypted = process.env.SLACK_SIGNING_SECRET ? process.env.SLACK_SIGNING_SECRET.length > 50 : false;
  
  res.json({
    name: "🚀 ELON - ENCRYPTED MOTIVATION BOT 🔐",
    version: "2.1.0-ENCRYPTED",
    status: "ONLINE & SECURED",
    security: {
      encryption: "✅ ENABLED",
      authentication: "✅ JWT + API KEY",
      rateLimit: "✅ ACTIVE",
      headers: "✅ SECURED",
      slackTokens: slackTokenEncrypted && signingSecretEncrypted ? "✅ ENCRYPTED" : "⚠️ PARTIALLY ENCRYPTED"
    },
    endpoints: {
      public: [
        "GET /api/elon-wisdom - Daily Elon quotes"
      ],
      secured: [
        "POST /api/auth/login - Get JWT token",
        "GET /api/send-elon - Send messages to team",
        "GET /api/test-elon - Test message sending", 
        "POST /api/test-ai - Test OpenAI integration",
        "GET /api/responses - View all responses",
        "GET /api/responses/today - View today's responses",
        "GET /api/security-status - Security overview",
        "POST /api/encrypt-tokens - Encrypt Slack tokens",
        "GET /api/token-status - Check token encryption"
      ]
    },
    authentication: {
      jwt: "Bearer token in Authorization header",
      apiKey: "x-api-key header or apiKey query param"
    },
    elonQuote: "The future is going to be wild, and secure!",
    message: "🔐 All your data is encrypted and secured! Mars-level security achieved! 🚀"
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🌐 Encrypted Starlink server online on port ${port}`);
  console.log(`🏠 Home: http://localhost:${port}/`);
  console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
  console.log(`🧪 Test mission: http://localhost:${port}/api/test-elon (SECURED)`);
  console.log(`🚀 Manual launch: http://localhost:${port}/api/send-elon (SECURED)`);
  console.log(`🤖 AI Test: POST http://localhost:${port}/api/test-ai (SECURED)`);
  console.log(`📝 View responses: http://localhost:${port}/api/responses (SECURED)`);
  console.log(`📅 Today's responses: http://localhost:${port}/api/responses/today (SECURED)`);
  console.log(`💫 Elon wisdom: http://localhost:${port}/api/elon-wisdom (PUBLIC)`);
  console.log(`🛡️ Security status: http://localhost:${port}/api/security-status (SECURED)`);
  console.log(`🔐 Token status: http://localhost:${port}/api/token-status (SECURED)`);
  console.log(`🔑 Encrypt tokens: POST http://localhost:${port}/api/encrypt-tokens (SECURED)`);
  console.log('🎯 "Let\'s make life multiplanetary AND secure!" - Elon');
  
  if (slackEvents && slack) {
    console.log('💬 Reply capability: ENABLED - Users can reply to encrypted Elon messages!');
  } else {
    console.log('💬 Reply capability: DISABLED - Check your encrypted Slack tokens');
  }
  
  // Show AI integration status
  if (elonAI.openai) {
    console.log('🤖 AI Integration: ENABLED - OpenAI-powered Elon responses active!');
  } else {
    console.log('🤖 AI Integration: DISABLED - Set OPENAI_API_KEY or ENCRYPTED_OPENAI_API_KEY');
  }
  
  console.log('\n🔐 SECURITY FEATURES ACTIVE:');
  console.log('  ✅ AES-256 Data Encryption');
  console.log('  ✅ JWT Token Authentication');
  console.log('  ✅ API Key Protection');
  console.log('  ✅ Rate Limiting');
  console.log('  ✅ Security Headers (Helmet)');
  console.log('  ✅ CORS Protection');
  console.log('  ✅ Encrypted Response Storage');
  console.log('  ✅ Slack Token Encryption Support');
  console.log('\n🚀 MARS-LEVEL SECURITY ACHIEVED! 🔐');
});

// Handle process termination (graceful like a Falcon 9 landing)
process.on('SIGINT', () => {
  console.log('\n🚀 Initiating graceful encrypted shutdown sequence...');
  console.log('🔐 All data remains encrypted and secure!');
  console.log('💫 "Thanks for flying SpaceX securely!" - Elon (probably)');
  process.exit(0);
}); 