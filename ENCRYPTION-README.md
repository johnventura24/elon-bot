# 🔐 ELON BOT - ENCRYPTED API

**Mars-Level Security for Your Slack Bot!** 🚀

This is the encrypted version of the Elon Musk-themed Slack motivation bot with comprehensive API security features.

## 🛡️ Security Features

### 🔐 Data Encryption
- **AES-256 encryption** for all sensitive data (user responses, names)
- **Automatic key generation** if not provided
- **Encrypted file storage** as backup
- **Database encryption** for MongoDB storage

### 🎫 Authentication
- **JWT tokens** with 24-hour expiry
- **API key authentication** for simpler access
- **Dual authentication** - use either JWT or API key
- **Secure token generation** with crypto-random secrets

### 🛡️ API Security
- **Rate limiting** (100 requests per 15 minutes by default)
- **Security headers** via Helmet.js
- **CORS protection** with configurable origins
- **Input validation** and sanitization
- **Error handling** without information leakage

### 🔒 Network Security
- **HTTPS ready** (configure with SSL certificates)
- **Secure cookie settings** for sessions
- **XSS protection** headers
- **Content Security Policy** enforcement

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Encrypted Server
```bash
node elon-encrypted.js
```

### 3. Check Security Status
Visit: `http://localhost:3000/` to see the security overview

## 🔑 Authentication Methods

### Method 1: JWT Token (Recommended)
```javascript
// Login to get JWT token
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'elon',
    password: 'mars2024'
  })
});

const { token } = await response.json();

// Use token in subsequent requests
const secureResponse = await fetch('http://localhost:3000/api/responses', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Method 2: API Key
```javascript
// Get API key (requires JWT token first)
const apiKeyResponse = await fetch('http://localhost:3000/api/auth/api-key', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { apiKey } = await apiKeyResponse.json();

// Use API key in requests (simpler)
const secureResponse = await fetch('http://localhost:3000/api/responses', {
  headers: {
    'x-api-key': apiKey
  }
});
```

## 📍 API Endpoints

### 🔓 Public Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API overview and security status |
| `/api/elon-wisdom` | GET | Random Elon Musk quotes |

### 🔐 Secured Endpoints (Require Authentication)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Get JWT token |
| `/api/auth/api-key` | POST | Get API key (requires JWT) |
| `/api/send-elon` | GET | Send messages to all employees |
| `/api/test-elon` | GET | Send test messages |
| `/api/responses` | GET | Get all responses (decrypted) |
| `/api/responses/today` | GET | Get today's responses (decrypted) |
| `/api/security-status` | GET | Detailed security status |

## 🔧 Environment Variables

Add these to your `.env` file (they'll be auto-generated if missing):

```env
# 🔐 SECURITY KEYS (Auto-generated)
ENCRYPTION_KEY=your_32_byte_hex_key
JWT_SECRET=your_64_byte_hex_secret
API_KEY=your_32_byte_hex_api_key

# 👤 AUTHENTICATION
ADMIN_PASSWORD=your_secure_password

# 🌐 SECURITY SETTINGS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT=100

# ⏰ SCHEDULING
REPORT_HOUR=16
REPORT_MINUTE=30
TIMEZONE=America/New_York

# 📡 SLACK CREDENTIALS
SLACK_BOT_TOKEN=U2FsdGVkX1+W63Xf5y/aI9lIiRxaoIZ6guWeqaaIeWwEnOWaO4A...Example
SLACK_SIGNING_SECRET=your-signing-secret

# 🗄️ DATABASE (Optional)
MONGODB_URI=mongodb://localhost:27017/elon-bot
```

## 💻 Using the API Client

Use the provided `api-client.js` for easy interaction:

```javascript
const ElonApiClient = require('./api-client');

async function example() {
  const client = new ElonApiClient();
  
  // Login and get access
  await client.login('elon', 'mars2024');
  await client.getApiKey(); // Optional
  
  // Use secured endpoints
  await client.testElonMessages();
  const responses = await client.getResponses();
  const status = await client.getSecurityStatus();
}
```

### Demo the API Client
```bash
node api-client.js
```

## 🔐 Security Best Practices

### 1. **Keep Secrets Secret**
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate keys regularly

### 2. **Use HTTPS in Production**
```javascript
// Add SSL configuration
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 3. **Configure Rate Limiting**
```env
RATE_LIMIT=50  # Reduce for higher security
```

### 4. **Set Allowed Origins**
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

### 5. **Use Strong Passwords**
```env
ADMIN_PASSWORD=SuperSecure!Mars2024#SpaceX
```

## 📊 Data Encryption Details

### What Gets Encrypted
- ✅ User response messages
- ✅ Employee names in responses
- ✅ Any sensitive data stored
- ❌ Public data (quotes, status messages)
- ❌ Non-sensitive metadata (timestamps, IDs)

### Encryption Method
- **Algorithm**: AES-256-CBC
- **Key**: 256-bit randomly generated
- **Storage**: Encrypted data in database/files
- **Decryption**: Only on authorized API access

### File Storage
```
responses-encrypted.json  # Encrypted backup file
responses.json           # Legacy unencrypted (will be phased out)
```

## 🚨 Security Monitoring

### Check Security Status
```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/security-status
```

### Monitor Rate Limiting
The API automatically blocks excessive requests and logs attempts.

### Security Logs
All authentication attempts and security events are logged to console.

## 🔧 Troubleshooting

### Authentication Errors
```
Error: "Authentication required!"
Solution: Include JWT token or API key in headers
```

### Rate Limit Exceeded
```
Error: "Too many requests!"
Solution: Wait 15 minutes or increase RATE_LIMIT
```

### Decryption Errors
```
Error: "Decryption failed"
Solution: Check ENCRYPTION_KEY is consistent
```

### Token Expired
```
Error: "Invalid or expired token"
Solution: Login again to get new JWT token
```

## 🌟 Encryption Migration

### From Unencrypted Version
1. **Backup existing data**
   ```bash
   cp responses.json responses-backup.json
   ```

2. **Start encrypted version**
   ```bash
   node elon-encrypted.js
   ```

3. **New responses will be encrypted automatically**

4. **Old responses remain unencrypted but secure**

## 🚀 Production Deployment

### 1. **Generate Production Keys**
```bash
# Generate secure random keys
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. **Set Environment Variables**
```bash
export ENCRYPTION_KEY=your_production_key
export JWT_SECRET=your_production_jwt_secret
export API_KEY=your_production_api_key
export NODE_ENV=production
```

### 3. **Enable HTTPS**
- Get SSL certificate (Let's Encrypt recommended)
- Configure reverse proxy (nginx recommended)
- Set HTTPS redirect

### 4. **Configure Firewall**
- Block unnecessary ports
- Allow only HTTPS (443) and SSH (22)
- Set up fail2ban for additional protection

## 🔍 API Response Examples

### Successful Authentication
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Welcome to the SpaceX mission control! 🚀",
  "elonQuote": "The future is going to be wild!"
}
```

### Encrypted Responses (Decrypted for You)
```json
{
  "success": true,
  "responses": [
    {
      "slackId": "U123456789",
      "employeeName": "John Doe",
      "message": "Built 3 new features today!",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "date": "2024-01-15",
      "encrypted": true
    }
  ],
  "count": 1,
  "security": "Data decrypted for authorized access! 🔓"
}
```

### Security Status
```json
{
  "encryption": {
    "enabled": true,
    "algorithm": "AES-256",
    "status": "🔐 SECURED"
  },
  "jwt": {
    "enabled": true,
    "expiry": "24h",
    "status": "🎫 ACTIVE"
  },
  "overall": "🚀 MARS-LEVEL SECURITY ACHIEVED! 🔐"
}
```

## 🎯 Next Steps

1. **Test the encrypted API** with the demo client
2. **Generate production keys** for deployment
3. **Set up HTTPS** with SSL certificates
4. **Configure monitoring** and logging
5. **Train your team** on the new security features

## 💫 "Security is not a product, but a process!" - Elon (probably)

---

**Ready to make your Slack bot as secure as a SpaceX rocket? Let's encrypt our way to Mars! 🚀🔐** 