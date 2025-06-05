#!/usr/bin/env node

/**
 * 🔐 PRODUCTION KEY GENERATOR
 * 
 * Generates secure encryption keys for production deployment on Render.
 * These keys should be different from your development keys.
 * 
 * Usage: node generate-production-keys.js
 */

const crypto = require('crypto');

console.log('🚀 PRODUCTION KEY GENERATOR FOR RENDER DEPLOYMENT 🔐\n');
console.log('Generating secure encryption keys for production...\n');

// Generate production keys
const encryptionKey = crypto.randomBytes(32).toString('hex');
const jwtSecret = crypto.randomBytes(64).toString('hex');
const apiKey = crypto.randomBytes(32).toString('hex');
const adminPassword = crypto.randomBytes(16).toString('hex');

console.log('🔑 ENCRYPTION KEYS FOR RENDER ENVIRONMENT VARIABLES:\n');
console.log('Copy these values to your Render dashboard:\n');

console.log('ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('');

console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

console.log('API_KEY:');
console.log(apiKey);
console.log('');

console.log('ADMIN_PASSWORD:');
console.log('spacex_' + adminPassword);
console.log('');

console.log('📋 RENDER ENVIRONMENT VARIABLE SETUP:\n');
console.log('1. Go to your Render dashboard');
console.log('2. Navigate to your service → Environment');
console.log('3. Add these environment variables:\n');

const envVars = [
  { key: 'ENCRYPTION_KEY', value: encryptionKey },
  { key: 'JWT_SECRET', value: jwtSecret },
  { key: 'API_KEY', value: apiKey },
  { key: 'ADMIN_PASSWORD', value: 'spacex_' + adminPassword },
  { key: 'NODE_ENV', value: 'production' },
  { key: 'PORT', value: '10000' },
  { key: 'RATE_LIMIT', value: '100' },
  { key: 'REPORT_HOUR', value: '16' },
  { key: 'REPORT_MINUTE', value: '30' },
  { key: 'TIMEZONE', value: 'America/New_York' }
];

envVars.forEach(env => {
  console.log(`${env.key}: ${env.value}`);
});

console.log('\n🔐 SLACK TOKEN ENCRYPTION:\n');
console.log('Before deploying, encrypt your Slack tokens:');
console.log('1. Set the ENCRYPTION_KEY in your local .env:');
console.log(`   ENCRYPTION_KEY=${encryptionKey}`);
console.log('2. Run: npm run encrypt-tokens');
console.log('3. Copy the encrypted SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET to Render\n');

console.log('⚠️  SECURITY NOTES:\n');
console.log('• These keys are for PRODUCTION use only');
console.log('• Never commit these keys to version control');
console.log('• Keep these keys secure and private');
console.log('• Use different keys for development and production');
console.log('• Rotate keys regularly for maximum security\n');

console.log('🚀 Ready for Mars-level deployment! 🔐');
console.log('💫 "Security is not a product, but a process!" - Elon');

// Optionally save to a secure file
const fs = require('fs');
const keyData = `# 🔐 PRODUCTION KEYS - KEEP SECURE!
# Generated: ${new Date().toISOString()}
# For: Render deployment

ENCRYPTION_KEY=${encryptionKey}
JWT_SECRET=${jwtSecret}
API_KEY=${apiKey}
ADMIN_PASSWORD=spacex_${adminPassword}

# Standard production config
NODE_ENV=production
PORT=10000
RATE_LIMIT=100
REPORT_HOUR=16
REPORT_MINUTE=30
TIMEZONE=America/New_York

# TODO: Add encrypted Slack tokens after running encrypt-tokens script
# SLACK_BOT_TOKEN=U2FsdGVkX1+your-encrypted-token...
# SLACK_SIGNING_SECRET=U2FsdGVkX1+your-encrypted-secret...
`;

fs.writeFileSync('.env.production', keyData);
console.log('\n📁 Keys saved to .env.production (DO NOT COMMIT THIS FILE!)');
console.log('🔒 Add .env.production to your .gitignore file'); 