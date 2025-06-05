#!/usr/bin/env node

/**
 * 🔐 SECURE TOKEN REPLACEMENT SCRIPT
 * 
 * This script replaces all Slack token references with encrypted examples
 * to make all files safe for GitHub upload while maintaining documentation value.
 */

const fs = require('fs');
const crypto = require('crypto');

// Generate a sample encrypted token for documentation
function generateEncryptedExample() {
  // Create a realistic-looking encrypted token example
  const randomBytes = crypto.randomBytes(32);
  const base64 = randomBytes.toString('base64').substring(0, 40);
  return `U2FsdGVkX1+${base64}...Example`;
}

console.log('🔐 SECURE TOKEN REPLACEMENT TOOL\n');
console.log('Replacing all token references with encrypted examples...\n');

// Update LAUNCH-GUIDE.md
const launchGuide = 'LAUNCH-GUIDE.md';
if (fs.existsSync(launchGuide)) {
  let content = fs.readFileSync(launchGuide, 'utf8');
  const encryptedExample = generateEncryptedExample();
  content = content.replace(/SLACK_BOT_TOKEN=U2FsdGVkX1\+your-encrypted-token\.\.\./g, `SLACK_BOT_TOKEN=${encryptedExample}`);
  fs.writeFileSync(launchGuide, content, 'utf8');
  console.log('✅ Updated LAUNCH-GUIDE.md');
}

// Update other problematic files
const filesToFix = [
  'SLACK-TOKEN-ENCRYPTION.md',
  'RENDER-DEPLOYMENT.md', 
  'README.md',
  'DEPLOYMENT.md',
  'ENCRYPTION-README.md'
];

filesToFix.forEach(filename => {
  if (fs.existsSync(filename)) {
    let content = fs.readFileSync(filename, 'utf8');
    const encryptedExample = generateEncryptedExample();
    
    // Replace various token patterns
    content = content.replace(/HIDDEN-[0-9-]+/g, encryptedExample);
    content = content.replace(/HIDDEN-your-bot-token-here/g, encryptedExample);
    content = content.replace(/HIDDEN-your-bot-token/g, encryptedExample);
    content = content.replace(/U2FsdGVkX1\+your-encrypted-token\.\.\./g, encryptedExample);
    content = content.replace(/U2FsdGVkX1\+your-encrypted-secret\.\.\./g, encryptedExample);
    content = content.replace(/HIDDEN-/g, 'HIDDEN-');
    
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✅ Updated ${filename}`);
  } else {
    console.log(`⏭️  Skipping ${filename} (not found)`);
  }
});

console.log('\n🎯 All files have been secured!');
console.log('🚀 Ready for safe GitHub upload!'); 