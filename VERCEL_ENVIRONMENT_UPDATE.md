# ⚡ Vercel Environment Variables Update Required

## 🔧 **Update Required in Vercel Dashboard**

You need to update one environment variable in your Vercel deployment:

### **Current Configuration (Update This)**
```env
❌ VITE_WS_BASE_URL=wss://salon.run.place/ws    # Old URL pattern
```

### **Correct Configuration (Use This)**
```env
✅ VITE_WS_BASE_URL=wss://salon.run.place:8090  # Correct URL pattern with port
```

### **Complete Vercel Environment Variables**
```env
VITE_API_BASE_URL=https://salon.run.place/api/v1
VITE_WS_BASE_URL=wss://salon.run.place:8090
VITE_ENVIRONMENT=production
```

## 🔍 **What Changed?**

### **WebSocket URL Pattern**
- **Old**: `wss://salon.run.place/ws`
- **New**: `wss://salon.run.place:8090/ws/appointments/{salonId}`

### **Why the Change?**
1. **Port Specification**: Your WebSocket server runs on port `8090`
2. **Salon-Specific Connections**: Each salon gets its own WebSocket namespace
3. **Appointment Context**: WebSocket is part of the appointments system

### **How URLs Are Built**
```typescript
// Base URL from environment
const WS_BASE = 'wss://salon.run.place:8090';

// Final URL with salon ID
const wsUrl = `${WS_BASE}/ws/appointments/${salonId}`;
// Results in: wss://salon.run.place:8090/ws/appointments/12
```

## 🚀 **Steps to Update Vercel**

1. **Go to Vercel Dashboard**
   - Navigate to your project settings
   - Go to Environment Variables section

2. **Update WebSocket URL**
   - Find `VITE_WS_BASE_URL`
   - Change value to: `wss://salon.run.place:8090`

3. **Redeploy**
   - Save the environment variable
   - Trigger a new deployment
   - WebSocket connections should now work

## 🧪 **Testing After Update**

### **Expected Behavior**
- WebSocket will try to connect to: `wss://salon.run.place:8090/ws/appointments/{salonId}`
- Should see in console: `🔌 [WEBSOCKET] Connecting to: wss://salon.run.place:8090/ws/appointments/12`
- If backend is not ready: Connection will fail gracefully with fallback

### **Console Logs to Look For**
```
✅ Success:
🔌 [WEBSOCKET] Connecting to: wss://salon.run.place:8090/ws/appointments/12 Environment: production
✅ [WEBSOCKET] Connected to payment notification service

❌ Expected Error (until backend is deployed):
❌ [WEBSOCKET] Connection error: websocket error
⚠️ [PAYMENT] Real-time notifications unavailable - You may need to refresh manually
```

## 📋 **Summary**

**Problem**: WebSocket URL was missing port number and using wrong path pattern
**Solution**: Update `VITE_WS_BASE_URL` to include port `8090` and use correct base URL
**Result**: WebSocket will connect to the correct endpoint once your backend is deployed

The payment system will work without real-time notifications until your backend WebSocket server is implemented. Users will need to manually refresh to see payment updates.

---

**Next Step**: Update the environment variable in Vercel and redeploy! 🚀