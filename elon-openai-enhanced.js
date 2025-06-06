// 🤖 ELON BOT - OPENAI ENHANCED INTELLIGENT RESPONSES
// Uses GPT for accurate analysis and contextual Elon-style replies

const OpenAI = require('openai');
const CryptoJS = require('crypto-js');

// Encryption setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '4d8e08621590fc5ba4d510dffb487d5236a6e45548c4b236288440122119942e';

class ElonCrypto {
  static decrypt(ciphertext) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null;
    }
  }
}

class ElonOpenAIEnhanced {
  constructor() {
    // Get encrypted OpenAI key
    const encryptedKey = process.env.ENCRYPTED_OPENAI_API_KEY;
    const openaiKey = encryptedKey ? ElonCrypto.decrypt(encryptedKey) : null;
    
    if (!openaiKey) {
      console.error('❌ No valid OpenAI API key found - AI features disabled');
      this.openai = null;
    } else {
      // Initialize OpenAI client with decrypted key
      this.openai = new OpenAI({
        apiKey: openaiKey
      });
      console.log('🤖 OpenAI client initialized with encrypted key');
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

Be precise and extract specific information. If no deadline is mentioned, set hasDeadline to false.
`;

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

Be specific to their situation and provide actionable next steps.
`;

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

  // Store goal with AI-extracted deadline
  async setGoal(userId, description, deadline = null) {
    const goalId = Date.now().toString();
    
    // Use AI to better understand and format the goal
    if (!deadline && description && this.openai) {
      try {
        const deadlinePrompt = `Extract any deadline or time-based commitment from: "${description}"
        
        Return only the deadline in format: "YYYY-MM-DD" or "relative time like 'Friday', 'next week', 'end of month'" or "none" if no deadline found.`;

        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You extract deadlines and time commitments from text." },
            { role: "user", content: deadlinePrompt }
          ],
          temperature: 0.1,
          max_tokens: 50
        });

        deadline = completion.choices[0].message.content.trim();
        if (deadline === "none") deadline = null;
      } catch (error) {
        console.error('❌ AI deadline extraction failed:', error);
      }
    }

    const goal = {
      id: goalId,
      userId,
      description,
      deadline,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (!this.goals.has(userId)) {
      this.goals.set(userId, []);
    }
    this.goals.get(userId).push(goal);

    console.log(`🎯 Goal set for user ${userId}: ${description} (Deadline: ${deadline})`);
    return goalId;
  }

  // Get user's active goals
  getActiveGoals(userId) {
    return this.goals.get(userId) || [];
  }

  // Process message with full AI enhancement
  async processMessage(userId, userName, message) {
    try {
      console.log(`🤖 Processing AI-enhanced message from ${userName}`);

      // Step 1: Analyze with AI
      const analysis = await this.analyzeUserResponse(userName, message);

      // Step 2: Handle goal/deadline setting
      if (analysis.hasDeadline && analysis.extractedDeadline) {
        await this.setGoal(userId, message, analysis.extractedDeadline);
      }

      // Step 3: Get user context
      const userGoals = this.getActiveGoals(userId);

      // Step 4: Generate intelligent response
      const elonReply = await this.generateElonResponse(userName, message, analysis, userGoals);

      // Step 5: Store interaction
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

  // Generate daily progress check using AI
  async generateProgressCheck(userName, userGoals) {
    try {
      const checkPrompt = `
Generate an Elon Musk-style progress check message for ${userName}.

Their active goals: ${userGoals.map(g => `${g.description} (Deadline: ${g.deadline})`).join(', ')}

Create a brief, direct message that:
1. Checks on specific progress
2. Maintains urgency
3. Is encouraging but challenging
4. Asks for specific updates
5. Maximum 150 words

Style: Direct, assertive, focused on execution like Elon Musk.
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Elon Musk checking on team progress - direct and focused on results." },
          { role: "user", content: checkPrompt }
        ],
        temperature: 0.6,
        max_tokens: 200
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ AI progress check failed:', error);
      return `${userName}, progress check! How are we executing on our goals? Need specific updates and next steps. 🚀`;
    }
  }
}

module.exports = { ElonOpenAIEnhanced }; 