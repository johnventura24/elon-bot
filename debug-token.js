const fs = require('fs');
const path = require('path');

// Manually load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  console.log('📁 Looking for .env at:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found!');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env file contents:');
    console.log(envContent);
    
    const lines = envContent.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      console.log(`Line ${index + 1}: "${trimmed}"`);
      
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
          console.log(`✅ Set ${key.trim()} = ${value.substring(0, 20)}...`);
        }
      }
    });
  } else {
    console.log('❌ .env file NOT found!');
  }
}

console.log('🔍 DEBUGGING TOKEN LOADING...');
loadEnv();

console.log('\n🔍 ENVIRONMENT VARIABLES:');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? `${process.env.SLACK_BOT_TOKEN.substring(0, 30)}...` : 'NOT SET');
console.log('SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? `${process.env.SLACK_SIGNING_SECRET.substring(0, 20)}...` : 'NOT SET');

console.log('\n🔍 TOKEN ANALYSIS:');
if (process.env.SLACK_BOT_TOKEN) {
  const token = process.env.SLACK_BOT_TOKEN;
  console.log('Token length:', token.length);
  console.log('Starts with slack prefix:', token.startsWith('xox'));
  console.log('Full token (first 50 chars):', token.substring(0, 50));
  console.log('Token parts:', token.split('-').map((part, i) => `Part ${i}: ${part.substring(0, 10)}...`));
} else {
  console.log('❌ No token found!');
} 