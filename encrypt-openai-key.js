// Encrypt OpenAI API Key using ElonCrypto system
require('dotenv').config();
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '4d8e08621590fc5ba4d510dffb487d5236a6e45548c4b236288440122119942e';

class ElonCrypto {
  static encrypt(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }
}

// Your OpenAI API Key (REMOVED FOR SECURITY)
const openaiApiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

console.log('🔐 ENCRYPTING OPENAI API KEY...');
console.log('==============================');

const encryptedKey = ElonCrypto.encrypt(openaiApiKey);

console.log('✅ Original Key:', openaiApiKey.substring(0, 20) + '...');
console.log('🔐 Encrypted Key:', encryptedKey);

console.log('\n📋 ADD TO YOUR .ENV FILE:');
console.log(`ENCRYPTED_OPENAI_API_KEY=${encryptedKey}`);

console.log('\n☁️ ADD TO RENDER ENVIRONMENT:');
console.log('Variable: ENCRYPTED_OPENAI_API_KEY');
console.log(`Value: ${encryptedKey}`);

console.log('\n🚀 OpenAI API key encrypted successfully!'); 