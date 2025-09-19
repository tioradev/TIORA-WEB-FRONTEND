# Payable IPG Webhook Configuration Guide

## 🚀 Production Deployment Configuration

### **Webhook Endpoint URL**
```
https://salon.run.place/api/payments/webhook
```

## 📋 Payable Dashboard Configuration Steps

### 1. Login to Payable Merchant Dashboard
- Navigate to your Payable IPG merchant dashboard
- Go to **Settings** → **Webhook Configuration**

### 2. Configure Webhook URL
- **Webhook URL**: `https://salon.run.place/api/payments/webhook`
- **Method**: `POST`
- **Content Type**: `application/json`
- **Authentication**: None (webhook verification handled via checkValue)

### 3. Enable Required Events
Enable webhooks for these payment events:
- ✅ **Payment Success** (statusCode: 1)
- ✅ **Payment Failed** (statusCode: 0)
- ✅ **Tokenization Success** (paymentType: 3)
- ✅ **Tokenization Failed** (paymentType: 3)

### 4. Test Webhook Endpoint
Use Payable's webhook testing feature to verify:
- Endpoint is accessible
- Returns HTTP 200 status
- Processes webhook data correctly

## 🔧 Environment Configuration

### Frontend Environment Variables
```env
VITE_API_BASE_URL=https://salon.run.place/api/v1
VITE_WS_BASE_URL=wss://salon.run.place/ws
VITE_ENVIRONMENT=production
```

### Backend Environment Variables
```env
# API Configuration
API_BASE_URL=https://salon.run.place/api/v1
FRONTEND_URL=https://salon.run.place
PORT=8080

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret

# Payable Configuration (same as frontend)
PAYABLE_MERCHANT_ID=your_merchant_id
PAYABLE_SECRET_KEY=your_secret_key
PAYABLE_ENVIRONMENT=production
```

## 📡 Webhook Data Flow

### 1. Payment Initiated (Frontend)
```
Frontend → Payable IPG → Payment Gateway → User Payment
```

### 2. Webhook Notification (Backend)
```
Payable IPG → https://salon.run.place/api/payments/webhook → Backend Processing
```

### 3. Real-time Notification (WebSocket)
```
Backend → Redis Streams → WebSocket Server → Frontend (Real-time Update)
```

## 🧪 Testing Your Setup

### 1. Test Webhook Endpoint
```bash
curl -X POST https://salon.run.place/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo": "TEST123",
    "statusCode": 1,
    "statusMessage": "SUCCESS",
    "payableAmount": "100.00",
    "payableCurrency": "LKR",
    "customerRefNo": "SALON123",
    "paymentType": 1
  }'
```

### 2. Test WebSocket Connection
```javascript
// Browser console test
const testWS = io('wss://salon.run.place/ws', {
  auth: { token: localStorage.getItem('authToken') }
});

testWS.on('connect', () => {
  console.log('✅ WebSocket connected');
});

testWS.on('payment:status-update', (data) => {
  console.log('📡 Payment update:', data);
});
```

### 3. End-to-End Payment Test
1. **Add Payment Card**:
   - Use your frontend to add a new payment card
   - Monitor browser network tab for Payable redirect
   - Check webhook logs for tokenization success
   - Verify WebSocket notification received
   - Confirm card appears in saved cards list

2. **Process Payment**:
   - Create a test payment from frontend
   - Monitor payment gateway flow
   - Check webhook logs for payment success
   - Verify WebSocket notification received
   - Confirm UI updates automatically

## 🔍 Monitoring & Debugging

### Webhook Logs
Monitor your backend logs for webhook processing:
```
🔔 [WEBHOOK] Received Payable notification: {...}
📡 [REDIS STREAMS] Published event PAYMENT_SUCCESS: 1634567890123-0
✅ [REDIS STREAMS] Acknowledged message: 1634567890123-0
📡 [WEBSOCKET] Processing payment event: {...}
```

### WebSocket Connection Logs
Monitor WebSocket connections:
```
🔌 [WEBSOCKET] User connected: user123, Salon: salon456
🏢 [WEBSOCKET] User joined salon room: salon:456
💳 [WEBSOCKET] User subscribed to payment: INV789
📡 [WEBSOCKET] Payment status update via WebSocket: {...}
```

### Redis Streams Monitoring
```bash
# Check stream length
redis-cli XLEN payment:events

# View recent messages
redis-cli XREAD COUNT 5 STREAMS payment:events $

# Check consumer group status
redis-cli XINFO GROUPS payment:events
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Webhook Not Received
- **Check URL**: Ensure `https://salon.run.place/api/payments/webhook` is accessible
- **Check Firewall**: Ensure port 8080 is open for incoming connections
- **Check SSL**: Ensure SSL certificate is valid for `salon.run.place`
- **Check Payable Dashboard**: Verify webhook URL is correctly configured

#### 2. WebSocket Connection Failed
- **Check WSS URL**: Ensure `wss://salon.run.place/ws` is accessible
- **Check Authentication**: Verify JWT token is valid
- **Check CORS**: Ensure WebSocket CORS is configured for your frontend domain

#### 3. Redis Streams Issues
- **Check Redis Connection**: Ensure Redis is running and accessible
- **Check Consumer Group**: Verify consumer group is initialized
- **Check Stream Backlog**: Monitor for message processing delays

### Error Codes
- **Webhook 404**: Backend not receiving webhook calls - check URL configuration
- **WebSocket Auth Error**: Invalid JWT token - user needs to re-login
- **Redis Connection Error**: Redis server unavailable - check Redis configuration

## 📈 Performance Optimization

### 1. Redis Configuration
```redis
# Optimize for streams
maxmemory-policy allkeys-lru
maxmemory 256mb
tcp-keepalive 60
```

### 2. WebSocket Optimization
- Use connection pooling for high traffic
- Implement heartbeat/ping for connection health
- Configure proper timeouts

### 3. Webhook Optimization
- Return HTTP 200 quickly to avoid retries
- Process webhook data asynchronously
- Implement idempotency for duplicate webhooks

## 🔐 Security Considerations

### 1. Webhook Security
- Validate webhook signature using Payable's checkValue
- Implement rate limiting for webhook endpoint
- Log all webhook attempts for monitoring

### 2. WebSocket Security
- Use WSS (secure WebSocket) only
- Validate JWT tokens on every connection
- Implement proper CORS policies

### 3. Environment Security
- Never expose secret keys in frontend
- Use environment variables for all sensitive data
- Implement proper access controls

## 📞 Support & Maintenance

### Log Monitoring
Monitor these log patterns:
- `❌ [WEBHOOK] Error processing webhook`
- `❌ [WEBSOCKET] Connection error`
- `❌ [REDIS STREAMS] Error reading from stream`

### Health Checks
Implement health check endpoints:
- `/health/webhook` - Test webhook processing
- `/health/websocket` - Test WebSocket server
- `/health/redis` - Test Redis connection

### Backup & Recovery
- Regular Redis backups for payment events
- Webhook replay capability for failed processing
- Connection recovery for WebSocket clients

---

Your production environment is now fully configured! 🎉

**Next Steps:**
1. Configure Payable dashboard with webhook URL: `https://salon.run.place/api/payments/webhook`
2. Deploy your backend with Redis Streams and WebSocket support
3. Test end-to-end payment flows
4. Monitor logs for successful webhook processing and real-time notifications