#!/usr/bin/env node

/**
 * 🔍 RENDER DEBUG SCRIPT
 * 
 * Simple script to test if environment variables are properly set on Render
 */

console.log('🔍 RENDER ENVIRONMENT DEBUG\n');

// Check NODE_ENV
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');

// Check critical variables
const criticalVars = [
  'SLACK_BOT_TOKEN',
  'ENCRYPTION_KEY', 
  'JWT_SECRET',
  'API_KEY',
  'REPORT_HOUR',
  'REPORT_MINUTE'
];

console.log('\n🔑 ENVIRONMENT VARIABLES:');
criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: SET (${value.length} chars)`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Test if we can start without .env
console.log('\n🚀 Testing bot startup without .env file...');

try {
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Elon bot debug - environment variables loaded successfully!',
      nodeEnv: process.env.NODE_ENV,
      hasSlackToken: !!process.env.SLACK_BOT_TOKEN,
      timestamp: new Date().toISOString()
    });
  });
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`✅ Debug server running on port ${port}`);
    console.log('🎯 Environment variables loaded successfully!');
    console.log('🚀 Bot should be able to start normally');
  });
  
} catch (error) {
  console.error('❌ Error starting debug server:', error.message);
  process.exit(1);
} 