# ⚡ Vercel Environment Variables Update Required

## 🔧 **Update Required in Vercel Dashboard**

You need to update one environment variable in your Vercel deployment:

### **Current Configuration (Update This)**
```env
❌ VITE_WS_BASE_URL=wss://salon.run.place:8090  # Old URL with port
```

### **Correct Configuration (Use This)**
```env
✅ VITE_WS_BASE_URL=wss://salon.run.place        # Payment WebSocket base URL
```

### **Complete Vercel Environment Variables**
```env
VITE_API_BASE_URL=https://salon.run.place/api/v1
VITE_WS_BASE_URL=wss://salon.run.place
VITE_ENVIRONMENT=production
```

## 🔍 **What Changed?**

### **WebSocket URL Pattern for Payments**
- **Old**: `wss://salon.run.place:8090/ws/appointments/{salonId}`
- **New**: `wss://salon.run.place/ws/payments/salon/{salonId}`

### **Why the Change?**
1. **Payment-Specific**: Dedicated WebSocket namespace for payment events
2. **No Port Required**: Uses standard HTTPS port (443) for WSS
3. **Salon-Specific**: Each salon gets isolated payment notifications

### **How URLs Are Built**
```typescript
// Base URL from environment
const WS_BASE = 'wss://salon.run.place';

// Final URL with salon ID for payments
const wsUrl = `${WS_BASE}/ws/payments/salon/${salonId}`;
// Results in: wss://salon.run.place/ws/payments/salon/12
```

## 🚀 **Steps to Update Vercel**

1. **Go to Vercel Dashboard**
   - Navigate to your project settings
   - Go to Environment Variables section

2. **Update WebSocket URL**
   - Find `VITE_WS_BASE_URL`
   - Change value to: `wss://salon.run.place`

3. **Redeploy**
   - Save the environment variable
   - Trigger a new deployment
   - WebSocket connections should now work

## 🧪 **Testing After Update**

### **Expected Behavior**
- WebSocket will try to connect to: `wss://salon.run.place/ws/payments/salon/{salonId}`
- Should see in console: `🔌 [WEBSOCKET] Connecting to: wss://salon.run.place/ws/payments/salon/12`
- If backend is not ready: Connection will fail gracefully with fallback

### **Console Logs to Look For**
```
✅ Success:
🔌 [WEBSOCKET] Connecting to: wss://salon.run.place/ws/payments/salon/12 Environment: production
✅ [WEBSOCKET] Connected to payment notification service

❌ Expected Error (until backend is deployed):
❌ [WEBSOCKET] Connection error: websocket error
⚠️ [PAYMENT] Real-time notifications unavailable - You may need to refresh manually
```

## 📋 **Summary**

**Problem**: WebSocket URL was using appointments namespace instead of payments namespace
**Solution**: Update `VITE_WS_BASE_URL` to `wss://salon.run.place` and use `/ws/payments/salon/{salonId}` pattern
**Result**: WebSocket will connect to payment-specific endpoint once your backend is deployed

The payment system will work without real-time notifications until your backend WebSocket server is implemented. Users will need to manually refresh to see payment updates.

---

**Next Step**: Update the environment variable in Vercel and redeploy! 🚀