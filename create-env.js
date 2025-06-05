const fs = require('fs');

const envContent = `SLACK_BOT_TOKEN=your-slack-bot-token-here
SLACK_SIGNING_SECRET=your-slack-signing-secret-here`;
 
fs.writeFileSync('.env', envContent, 'utf8');
console.log('✅ .env file created with UTF-8 encoding!'); 