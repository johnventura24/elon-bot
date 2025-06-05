const axios = require('axios');

class ElonApiClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.apiKey = null;
  }

  // 🔐 LOGIN AND GET JWT TOKEN
  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        username,
        password
      });
      
      if (response.data.success) {
        this.token = response.data.token;
        console.log('🚀 Successfully logged in!');
        console.log('💫 Elon says:', response.data.elonQuote);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🗝️ GET API KEY (requires JWT token)
  async getApiKey() {
    if (!this.token) {
      throw new Error('Must login first to get API key!');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/api-key`, {}, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success) {
        this.apiKey = response.data.apiKey;
        console.log('🔑 API Key retrieved successfully!');
        console.log('💫 Elon says:', response.data.elonQuote);
        return response.data.apiKey;
      }
    } catch (error) {
      console.error('❌ Failed to get API key:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🔐 ENCRYPT API CREDENTIALS
  async encryptApiCredentials() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/encrypt-tokens`, {}, { headers });
      console.log('🔐 Credential encryption completed!');
      console.log('💫 Elon says:', response.data.elonQuote);
      
      // Display results
      const results = response.data.results;
      if (results.botCredential) {
        console.log('🔑 Bot Credential:', results.botCredential.message);
        if (results.botCredential.success) {
          console.log('📋 Credential encryption completed successfully');
        }
      }
      if (results.signingCredential) {
        console.log('🔒 Signing Credential:', results.signingCredential.message);
        if (results.signingCredential.success) {
          console.log('📋 Secret encryption completed successfully');
        }
      }
      
      if (response.data.warning) {
        console.log('⚠️ Warning:', response.data.warning);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to encrypt credentials:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🔍 CHECK TOKEN STATUS
  async getTokenStatus() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/token-status`, { headers });
      console.log('🔍 Token Status Check Completed!');
      
      const status = response.data.credentialStatus;
      console.log('🔑 Bot Credential:', status.botCredential.status);
      console.log('🔒 Signing Credential:', status.signingCredential.status);
      console.log('💡 Recommendation:', response.data.recommendation);
      console.log('💫 Elon says:', response.data.elonQuote);
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get token status:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🚀 SEND ELON MESSAGES (using JWT or API key)
  async sendElonMessages() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/send-elon`, { headers });
      console.log('🚀 Messages sent successfully!');
      console.log('💫 Elon says:', response.data.elonQuote);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send messages:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🧪 TEST ELON MESSAGES
  async testElonMessages() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/test-elon`, { headers });
      console.log('🧪 Test messages sent successfully!');
      console.log('💫 Elon says:', response.data.elonQuote);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send test messages:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 📝 GET ALL RESPONSES (decrypted)
  async getResponses() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/responses`, { headers });
      console.log(`📝 Retrieved ${response.data.count} responses (decrypted)`);
      console.log('💫 Elon says:', response.data.elonQuote);
      return response.data.responses;
    } catch (error) {
      console.error('❌ Failed to get responses:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 📅 GET TODAY'S RESPONSES
  async getTodayResponses() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/responses/today`, { headers });
      console.log(`📅 Retrieved ${response.data.count} responses for today (decrypted)`);
      console.log('💫 Elon says:', response.data.elonQuote);
      return response.data.responses;
    } catch (error) {
      console.error('❌ Failed to get today\'s responses:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 💫 GET ELON WISDOM (public endpoint)
  async getElonWisdom() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/elon-wisdom`);
      console.log('💫 Elon wisdom:', response.data.quote);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get Elon wisdom:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // 🛡️ GET SECURITY STATUS
  async getSecurityStatus() {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/security-status`, { headers });
      console.log('🛡️ Security Status:', response.data.overall);
      
      // Display detailed security info
      const data = response.data;
      console.log('🔐 Encryption:', data.encryption.status);
      console.log('🎫 JWT:', data.jwt.status);
      console.log('🗝️  API Key:', data.apiKey.status);
      
      if (data.apiCredentials) {
        console.log('🔑 Bot Credential:', data.apiCredentials.botCredential.status);
        console.log('🔒 Signing Credential:', data.apiCredentials.signingCredential.status);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get security status:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  // Helper method to get authentication headers
  getAuthHeaders() {
    if (this.apiKey) {
      return { 'x-api-key': this.apiKey };
    } else if (this.token) {
      return { 'Authorization': `Bearer ${this.token}` };
    } else {
      throw new Error('No authentication method available! Login first or set API key.');
    }
  }

  // Set API key directly (if you have it)
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    console.log('🔑 API Key set directly');
  }
}

// Export for use in other scripts
module.exports = ElonApiClient; 