// 🚀 ELON - ENHANCED WITH DEADLINE TRACKING & ASSERTIVE RESPONSES
// This enhancement adds deadline setting, progress tracking, and business-focused replies

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');

// Load environment from elon-encrypted.js setup
function loadEnv() {
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

if (!process.env.NODE_ENV && (process.env.PORT === '10000' || process.env.RENDER)) {
  process.env.NODE_ENV = 'production';
  console.log('🔧 Auto-detected cloud environment - setting NODE_ENV=production');
}

loadEnv();

// Security setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '4d8e08621590fc5ba4d510dffb487d5236a6e45548c4b236288440122119942e';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');

// Encryption utilities
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
      return ciphertext;
    }
  }
  
  static isEncryptedToken(token) {
    return token && !token.startsWith('xox') && token.length > 50;
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

// Initialize Slack
function getDecryptedSlackToken() {
  const rawToken = process.env.SLACK_BOT_TOKEN;
  if (!rawToken) {
    console.log('⚠️  No Slack bot token found in environment');
    return null;
  }
  return ElonCrypto.decryptSlackToken(rawToken);
}

const decryptedSlackToken = getDecryptedSlackToken();
const slack = decryptedSlackToken ? new WebClient(decryptedSlackToken) : null;

// Enhanced Goal and Deadline Management
class GoalTracker {
  constructor() {
    this.goalsFile = 'user-goals.json';
    this.deadlinesFile = 'user-deadlines.json';
    this.goals = this.loadGoals();
    this.deadlines = this.loadDeadlines();
  }

  loadGoals() {
    try {
      if (fs.existsSync(this.goalsFile)) {
        return JSON.parse(fs.readFileSync(this.goalsFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
    return {};
  }

  loadDeadlines() {
    try {
      if (fs.existsSync(this.deadlinesFile)) {
        return JSON.parse(fs.readFileSync(this.deadlinesFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading deadlines:', error);
    }
    return {};
  }

  saveGoals() {
    fs.writeFileSync(this.goalsFile, JSON.stringify(this.goals, null, 2));
  }

  saveDeadlines() {
    fs.writeFileSync(this.deadlinesFile, JSON.stringify(this.deadlines, null, 2));
  }

  setGoal(userId, goal, deadline) {
    if (!this.goals[userId]) this.goals[userId] = [];
    if (!this.deadlines[userId]) this.deadlines[userId] = [];

    const goalData = {
      id: Date.now(),
      goal: ElonCrypto.encrypt(goal),
      deadline: deadline,
      created: new Date().toISOString(),
      status: 'active',
      updates: []
    };

    this.goals[userId].push(goalData);
    this.deadlines[userId].push({
      goalId: goalData.id,
      deadline: deadline,
      goal: ElonCrypto.encrypt(goal),
      status: 'pending'
    });

    this.saveGoals();
    this.saveDeadlines();
    return goalData.id;
  }

  updateGoal(userId, goalId, update) {
    if (this.goals[userId]) {
      const goal = this.goals[userId].find(g => g.id === goalId);
      if (goal) {
        goal.updates.push({
          update: ElonCrypto.encrypt(update),
          timestamp: new Date().toISOString()
        });
        goal.lastUpdate = new Date().toISOString();
        this.saveGoals();
        return true;
      }
    }
    return false;
  }

  getActiveGoals(userId) {
    if (!this.goals[userId]) return [];
    return this.goals[userId]
      .filter(g => g.status === 'active')
      .map(g => ({
        ...g,
        goal: ElonCrypto.decrypt(g.goal),
        updates: g.updates.map(u => ({
          ...u,
          update: ElonCrypto.decrypt(u.update)
        }))
      }));
  }

  getUpcomingDeadlines(userId) {
    if (!this.deadlines[userId]) return [];
    const now = new Date();
    return this.deadlines[userId]
      .filter(d => d.status === 'pending' && new Date(d.deadline) > now)
      .map(d => ({
        ...d,
        goal: ElonCrypto.decrypt(d.goal)
      }));
  }
}

const goalTracker = new GoalTracker();

// Enhanced Response Analysis
class ResponseAnalyzer {
  static analyzeResponse(message) {
    const analysis = {
      hasNumbers: /\d+/.test(message),
      hasCurrency: /\$|revenue|profit|deal|sale/i.test(message),
      hasDeadline: /deadline|due|by|until|before/i.test(message),
      hasProgress: /completed|finished|done|progress|started/i.test(message),
      hasChallenges: /issue|problem|challenge|difficult|stuck/i.test(message),
      hasGoals: /goal|target|aim|objective/i.test(message),
      sentiment: this.getSentiment(message),
      urgency: this.getUrgency(message),
      businessTerms: this.extractBusinessTerms(message)
    };

    return analysis;
  }

  static getSentiment(message) {
    const positive = /great|excellent|successful|achieved|completed|good|progress/i.test(message);
    const negative = /problem|issue|failed|behind|difficult|stuck|challenge/i.test(message);
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    return 'neutral';
  }

  static getUrgency(message) {
    if (/urgent|asap|emergency|critical|immediate/i.test(message)) return 'high';
    if (/soon|quickly|fast|rush/i.test(message)) return 'medium';
    return 'normal';
  }

  static extractBusinessTerms(message) {
    const terms = [];
    const businessRegex = /(\$[\d,]+|[\d]+%|[\d]+k|[\d]+m|deal|contract|client|revenue|profit|target|goal)/gi;
    const matches = message.match(businessRegex);
    return matches || [];
  }

  static extractDeadline(message) {
    const deadlineRegex = /(by|until|before)\s+([\w\s,]+)/i;
    const match = message.match(deadlineRegex);
    if (match) {
      return match[2].trim();
    }
    
    // Look for date patterns
    const dateRegex = /(\d{1,2}\/\d{1,2}\/?\d{0,4}|january|february|march|april|may|june|july|august|september|october|november|december)/i;
    const dateMatch = message.match(dateRegex);
    return dateMatch ? dateMatch[0] : null;
  }
}

// Enhanced Elon Response Generator
class ElonResponseGenerator {
  static generateResponse(userName, message, analysis, userGoals) {
    const responses = [];
    
    // Opening - always direct and assertive
    responses.push(this.getOpeningLine(analysis.sentiment));
    
    // Business-focused analysis
    if (analysis.hasCurrency || analysis.businessTerms.length > 0) {
      responses.push(this.getBusinessAdvice(message, analysis));
    }
    
    // Progress assessment
    if (analysis.hasProgress) {
      responses.push(this.getProgressFeedback(message, analysis));
    }
    
    // Challenge handling
    if (analysis.hasChallenges) {
      responses.push(this.getChallengeAdvice(message, analysis));
    }
    
    // Goal setting
    if (analysis.hasGoals || !userGoals.length) {
      responses.push(this.getGoalSetting(message, analysis));
    }
    
    // Deadline enforcement
    responses.push(this.getDeadlineEnforcement(message, analysis));
    
    // Closing with specific action
    responses.push(this.getActionableClosing(analysis));
    
    return responses.join('\n\n');
  }

  static getOpeningLine(sentiment) {
    const openings = {
      positive: [
        "Good. Momentum is building, but don't get comfortable.",
        "Progress noted. Now let's talk about acceleration.",
        "Solid work. Time to raise the bar."
      ],
      negative: [
        "First, let's cut the fluff. You have challenges, but challenges create opportunities.",
        "Problems are just unoptimized systems. Let's fix this.",
        "Every setback is data. Use it."
      ],
      neutral: [
        "Let's focus on execution. No more excuses.",
        "Time for first-principles thinking. Strip away the noise.",
        "Progress requires precision. Let's get specific."
      ]
    };
    
    const options = openings[sentiment] || openings.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  static getBusinessAdvice(message, analysis) {
    if (analysis.businessTerms.includes('deal') || /deal/i.test(message)) {
      return "Deal identified. Now negotiate like your future depends on it. Push for 30% better terms minimum. Present data that shows value, frame urgency, and don't accept the first offer.";
    }
    
    if (analysis.hasCurrency) {
      return "Numbers matter, but growth rate matters more. If you're not growing 10x year-over-year, you're thinking too small. Scale the operation.";
    }
    
    return "Good work. Now optimize every variable in that process and find where you can 2x the output with the same input.";
  }

  static getProgressFeedback(message, analysis) {
    if (analysis.sentiment === 'positive') {
      return "Completion is the start, not the finish. What's the next level? Push beyond what's comfortable.";
    }
    return "Progress without iteration is just motion. What did you learn? How do you improve the process?";
  }

  static getChallengeAdvice(message, analysis) {
    return "Every problem has a solution if you think from first principles. Break it down to fundamentals, question every assumption, and rebuild the approach. What's the physics of this problem?";
  }

  static getGoalSetting(message, analysis) {
    return "Set specific targets with deadlines. Vague goals create vague results. I need numbers, dates, and measurable outcomes.";
  }

  static getDeadlineEnforcement(message, analysis) {
    const deadline = ResponseAnalyzer.extractDeadline(message);
    if (deadline) {
      return `Deadline noted: ${deadline}. I'll check back. No extensions unless physics prevents it.`;
    }
    return "Set a deadline for this work. Without time pressure, tasks expand to fill infinity. When will this be complete?";
  }

  static getActionableClosing(analysis) {
    const closings = [
      "Execute with precision. Report back with results, not excuses.",
      "Make it happen. The future is built by those who refuse to accept limitations.",
      "Think bigger, move faster, deliver results. Mars doesn't wait for perfect.",
      "Relentless execution beats perfect planning. Go build something."
    ];
    
    return closings[Math.floor(Math.random() * closings.length)];
  }
}

// Enhanced message handling with replies
async function handleUserReply(event) {
  try {
    const userId = event.user;
    const message = event.text;
    
    // Get user info
    const userInfo = await slack.users.info({ user: userId });
    const userName = userInfo.user.real_name || userInfo.user.name;
    
    console.log(`📨 Enhanced reply from ${userName}: ${message.substring(0, 100)}...`);
    
    // Analyze the response
    const analysis = ResponseAnalyzer.analyzeResponse(message);
    
    // Get user's goals
    const userGoals = goalTracker.getActiveGoals(userId);
    
    // Extract and set deadlines if mentioned
    const extractedDeadline = ResponseAnalyzer.extractDeadline(message);
    if (extractedDeadline && analysis.hasGoals) {
      const goalId = goalTracker.setGoal(userId, message, extractedDeadline);
      console.log(`🎯 New goal set for ${userName} with deadline: ${extractedDeadline}`);
    }
    
    // Generate enhanced response
    const elonReply = ElonResponseGenerator.generateResponse(userName, message, analysis, userGoals);
    
    // Send the reply
    await slack.chat.postMessage({
      channel: userId,
      text: elonReply,
      as_user: false,
      username: 'Elon',
      icon_emoji: ':rocket:'
    });
    
    console.log(`🚀 Enhanced Elon reply sent to ${userName}`);
    
    // Store the interaction
    const interactionData = {
      userId,
      userName,
      userMessage: ElonCrypto.encrypt(message),
      elonReply: ElonCrypto.encrypt(elonReply),
      analysis: analysis,
      timestamp: new Date().toISOString(),
      deadline: extractedDeadline
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
    console.error('❌ Error handling enhanced user reply:', error);
  }
}

// Export the enhanced functionality
module.exports = {
  ElonCrypto,
  GoalTracker,
  ResponseAnalyzer,
  ElonResponseGenerator,
  handleUserReply,
  goalTracker
};

console.log('🚀 ELON ENHANCED REPLIES MODULE LOADED');
console.log('💡 Features: Deadline tracking, progress monitoring, assertive responses');
console.log('🎯 Ready for intelligent goal-oriented conversations!'); 