#!/usr/bin/env node

/**
 * 🔐 SLACK TOKEN ENCRYPTION UTILITY
 * 
 * This script helps you encrypt your existing Slack tokens quickly and easily.
 * Run this script to secure your Slack bot credentials with AES-256 encryption.
 * 
 * Usage: node encrypt-slack-tokens.js
 */

const fs = require('fs');
const path = require('path');
const ElonApiClient = require('./api-client');

console.log('🚀 SLACK TOKEN ENCRYPTION UTILITY 🔐\n');
console.log('This tool will help you encrypt your Slack API tokens for maximum security.');
console.log('💫 "Security is not a product, but a process!" - Elon (probably)\n');

async function encryptSlackTokens() {
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ No .env file found!');
      console.log('💡 Create a .env file with your Slack tokens first:');
      console.log('');
      console.log('   SLACK_BOT_TOKEN=your-slack-bot-token-here');
      console.log('   SLACK_SIGNING_SECRET=your-signing-secret');
      console.log('');
      return;
    }

    console.log('📁 Found .env file - checking tokens...\n');

    // Check if encrypted server is running
    const client = new ElonApiClient();
    
    try {
      await client.getElonWisdom(); // Test if server is responding
    } catch (error) {
      console.log('❌ Encrypted server is not running!');
      console.log('💡 Start the server first:');
      console.log('   npm run encrypted');
      console.log('   # or');
      console.log('   node elon-encrypted.js');
      console.log('');
      return;
    }

    console.log('✅ Encrypted server is running!\n');

    // Step 1: Login
    console.log('🔐 Step 1: Authenticating...');
    await client.login('elon', 'mars2024');
    console.log('');

    // Step 2: Check current token status
    console.log('🔍 Step 2: Checking current token status...');
    const statusBefore = await client.getTokenStatus();
    console.log('');

    // Step 3: Encrypt tokens
    console.log('🔑 Step 3: Encrypting Slack tokens...');
    const encryptionResult = await client.encryptSlackTokens();
    console.log('');

    // Step 4: Display results and instructions
    console.log('📋 Step 4: Results and next steps:\n');
    
    const results = encryptionResult.results;
    let hasNewEncryption = false;
    let instructions = [];

    if (results.slackBotToken) {
      if (results.slackBotToken.status === 'encrypted') {
        hasNewEncryption = true;
        console.log('✅ Slack Bot Token: Successfully encrypted!');
        instructions.push(results.slackBotToken.instructions);
      } else if (results.slackBotToken.status === 'already_encrypted') {
        console.log('ℹ️  Slack Bot Token: Already encrypted');
      } else {
        console.log('⚠️  Slack Bot Token: ' + results.slackBotToken.message);
      }
    }

    if (results.slackSigningSecret) {
      if (results.slackSigningSecret.status === 'encrypted') {
        hasNewEncryption = true;
        console.log('✅ Slack Signing Secret: Successfully encrypted!');
        instructions.push(results.slackSigningSecret.instructions);
      } else if (results.slackSigningSecret.status === 'already_encrypted') {
        console.log('ℹ️  Slack Signing Secret: Already encrypted');
      } else {
        console.log('⚠️  Slack Signing Secret: ' + results.slackSigningSecret.message);
      }
    }

    console.log('');

    if (hasNewEncryption) {
      console.log('🎯 NEXT STEPS:\n');
      console.log('1. 📝 Update your .env file with the encrypted tokens:');
      console.log('');
      instructions.forEach(instruction => {
        console.log('   ' + instruction);
      });
      console.log('');
      console.log('2. 🔄 Restart the encrypted server:');
      console.log('   # Stop current server (Ctrl+C) then:');
      console.log('   node elon-encrypted.js');
      console.log('');
      console.log('3. ✅ Verify encryption worked:');
      console.log('   node encrypt-slack-tokens.js');
      console.log('');
      console.log('⚠️  IMPORTANT: Backup your original .env file before making changes!');
      console.log('   cp .env .env.backup');
      console.log('');
    } else {
      console.log('🎉 All tokens are already properly encrypted!');
      console.log('🚀 Your Slack bot is secured with Mars-level encryption! 🔐');
      console.log('');
    }

    // Step 5: Final verification
    console.log('🛡️  Step 5: Security verification...');
    await client.getSecurityStatus();
    console.log('');

    console.log('🎯 ENCRYPTION COMPLETE! 🚀');
    console.log('💫 "The future is going to be wild, and secure!" - Elon');

  } catch (error) {
    console.error('\n❌ Encryption failed:', error.message);
    console.log('\n🛠️  Troubleshooting tips:');
    console.log('• Make sure the encrypted server is running');
    console.log('• Check that your .env file has valid Slack tokens');
    console.log('• Verify your network connection');
    console.log('• Try restarting the server and running this script again');
  }
}

// Helper function to create a sample .env file
function createSampleEnv() {
  const sampleEnv = `# 🚀 ELON BOT CONFIGURATION

# 📡 SLACK CREDENTIALS (Replace with your actual tokens)
SLACK_BOT_TOKEN=your-slack-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# ⏰ SCHEDULING
REPORT_HOUR=16
REPORT_MINUTE=30
TIMEZONE=America/New_York

# 👤 AUTHENTICATION (Optional)
ADMIN_PASSWORD=spacex123

# 🌐 SECURITY SETTINGS (Optional)
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT=100

# 🗄️ DATABASE (Optional)
MONGODB_URI=mongodb://localhost:27017/elon-bot

# 🔐 SECURITY KEYS (Auto-generated when you start the encrypted server)
# ENCRYPTION_KEY=auto-generated
# JWT_SECRET=auto-generated  
# API_KEY=auto-generated
`;

  fs.writeFileSync('.env.sample', sampleEnv);
  console.log('📋 Created .env.sample file with template');
}

// Main execution
if (require.main === module) {
  encryptSlackTokens().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
} 