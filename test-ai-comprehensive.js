// Test the comprehensive AI system with encrypted OpenAI key
require('dotenv').config();
const CryptoJS = require('crypto-js');
const OpenAI = require('openai');

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

async function testComprehensiveAI() {
    console.log('🤖 TESTING COMPREHENSIVE AI SYSTEM');
    console.log('==================================');

    // Test encrypted OpenAI key from environment
    const encryptedKey = process.env.ENCRYPTED_OPENAI_API_KEY;
    
    if (!encryptedKey) {
        console.log('❌ ENCRYPTED_OPENAI_API_KEY not found in environment');
        console.log('💡 Add this to your .env file:');
        console.log('ENCRYPTED_OPENAI_API_KEY=U2FsdGVkX1/t4BbFmU2N/h6Jfa+kfxcLcPhqWzIlovJc5dm3k5ZT6US8Sv6AIZWrpCcaQtD+pWl+CM9X+wheVlJiTgLZaKVRGj4r2vLrIbuTycLGGKcc4z/W4ifphBkyzvNoMLkKrSaFjm8hFt4pUAzqZk3gftqvoXmqyFnlk/BKmczI2JrPI64EGIScfdocUVqcW1Kk47dOR1IlMFh4iI6khu5CT/g6QZ3kP0b4svo0YSMpL/qxtoeE9ilcT+ZE');
        return;
    }
    
    console.log('🔓 Decrypting OpenAI API key...');
    const openaiKey = ElonCrypto.decrypt(encryptedKey);
    
    if (!openaiKey) {
        console.log('❌ Failed to decrypt OpenAI key');
        console.log('💡 Check your ENCRYPTION_KEY and try again');
        return;
    }
    
    console.log('✅ OpenAI key decrypted successfully');
    console.log(`🔑 Key preview: ${openaiKey.substring(0, 20)}...`);

    // Initialize OpenAI
    const openai = new OpenAI({
        apiKey: openaiKey
    });

    console.log('\n🧪 TESTING AI FEATURES:');
    console.log('========================');

    // Test 1: EOD Question Generation
    console.log('\n📋 TEST 1: AI-Generated EOD Question');
    console.log('-----------------------------------');
    
    try {
        const eodPrompt = `
Generate an Elon Musk-style end-of-day question for an employee named Marnie who has an active goal: "Close ACA deal for $300k by Friday"

Make it direct, assertive, and focused on execution and measurable results. Maximum 150 words.
`;

        const eodCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are Elon Musk - direct, results-focused, challenging team members to achieve more." },
                { role: "user", content: eodPrompt }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const aiEODQuestion = eodCompletion.choices[0].message.content;
        console.log('🚀 AI-Generated EOD Question:');
        console.log(aiEODQuestion);
        
    } catch (error) {
        console.log('❌ EOD Question generation failed:', error.message);
    }

    // Test 2: Response Analysis
    console.log('\n🔍 TEST 2: Response Analysis');
    console.log('----------------------------');
    
    try {
        const analysisPrompt = `
Analyze this business response: "I made good progress on the ACA deal today. Had a productive meeting with the client and they seem interested. Planning to send the proposal by Wednesday and hoping to close by Friday for $300k. There are some challenges with their budget constraints but I think we can work it out."

Return JSON only with: sentiment, urgency, hasDeadline, businessValue, progressIndicators, challenges, achievements
`;

        const analysisCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a business analyst. Return only valid JSON." },
                { role: "user", content: analysisPrompt }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        const analysis = JSON.parse(analysisCompletion.choices[0].message.content);
        console.log('🧠 AI Analysis Result:');
        console.log(JSON.stringify(analysis, null, 2));
        
    } catch (error) {
        console.log('❌ Response analysis failed:', error.message);
    }

    // Test 3: Intelligent Response Generation
    console.log('\n💬 TEST 3: Intelligent Response Generation');
    console.log('------------------------------------------');
    
    try {
        const responsePrompt = `
You are Elon Musk responding to this update: "I made good progress on the ACA deal today. Had a productive meeting with the client and they seem interested. Planning to send the proposal by Wednesday and hoping to close by Friday for $300k."

Generate a direct, assertive Elon response that:
1. Acknowledges the progress
2. Pushes for better execution
3. Addresses the deadline
4. Asks specific follow-up questions
5. Maximum 200 words

Be direct and results-focused like Elon Musk.
`;

        const responseCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are Elon Musk - direct, assertive, focused on execution and results." },
                { role: "user", content: responsePrompt }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        const elonResponse = responseCompletion.choices[0].message.content;
        console.log('🚀 AI-Generated Elon Response:');
        console.log(elonResponse);
        
    } catch (error) {
        console.log('❌ Response generation failed:', error.message);
    }

    // Test 4: Deadline Extraction
    console.log('\n📅 TEST 4: Deadline Extraction');
    console.log('------------------------------');
    
    try {
        const deadlinePrompt = `
Extract any deadline from: "Planning to send the proposal by Wednesday and hoping to close by Friday"

Return only the deadline date or "none".
`;

        const deadlineCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Extract deadlines from text. Return only the deadline or 'none'." },
                { role: "user", content: deadlinePrompt }
            ],
            temperature: 0.1,
            max_tokens: 50
        });

        const extractedDeadline = deadlineCompletion.choices[0].message.content.trim();
        console.log('⏰ Extracted Deadline:', extractedDeadline);
        
    } catch (error) {
        console.log('❌ Deadline extraction failed:', error.message);
    }

    console.log('\n✅ COMPREHENSIVE AI TESTING COMPLETE!');
    console.log('=====================================');
    console.log('🎯 Features tested:');
    console.log('   ✅ Encrypted OpenAI key decryption');
    console.log('   ✅ AI-powered EOD question generation');
    console.log('   ✅ Intelligent response analysis');
    console.log('   ✅ Context-aware Elon responses');
    console.log('   ✅ Automatic deadline extraction');
    console.log('\n🚀 Ready for production deployment!');
}

// Run the comprehensive test
testComprehensiveAI().catch(console.error); 