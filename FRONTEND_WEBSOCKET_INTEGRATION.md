# Frontend WebSocket Integration for Real-time Payment Notifications

This document describes the frontend WebSocket integration to replace polling with real-time payment status updates.

## Overview

The frontend now uses WebSocket connections (Socket.IO) to receive real-time payment notifications instead of polling the backend API. This provides instant updates when payment statuses change via webhooks.

## Implementation Details

### 1. WebSocket Payment Service (`webSocketPaymentService.ts`)

**Purpose**: Manages WebSocket connections and payment event subscriptions

**Key Features**:
- Automatic connection management with authentication
- Subscription to payment-specific events by invoice ID
- Token saved event notifications for card list refresh
- Error handling and reconnection logic
- Connection status monitoring

**Usage**:
```typescript
// Connect to WebSocket
await webSocketPaymentService.connect();

// Subscribe to payment updates
webSocketPaymentService.subscribeToPayment(invoiceId, (status) => {
  if (status.status === 'SUCCESS') {
    // Handle successful payment
  }
});

// Subscribe to token events
webSocketPaymentService.subscribeToTokenEvents((event) => {
  // Refresh card list when new token saved
});

// Cleanup
webSocketPaymentService.disconnect();
```

### 2. Updated PaymentBilling Component

**Changes Made**:
- Replaced `paymentNotificationService` polling with WebSocket subscriptions
- Added WebSocket initialization in `useEffect`
- Updated payment functions to use WebSocket event subscriptions
- Added fallback event listeners for direct Payable IPG events

**WebSocket Integration Points**:
1. **Component Mount**: Initialize WebSocket connection
2. **Token Events**: Auto-refresh card list when tokens saved
3. **Payment Status**: Real-time updates for payment completion
4. **Component Unmount**: Cleanup WebSocket connections

### 3. Environment Configuration

**WebSocket URLs**:
- Development: `ws://localhost:8090/ws/payments/salon/{salonId}`
- Production: `wss://salon.run.place/ws/payments/salon/{salonId}` ✅ **Your Current Setup**

**API URLs**:
- Development: `http://localhost:8090/api/v1`
- Production: `https://salon.run.place/api/v1` ✅ **Currently configured**

**Current Environment**: `production` ✅

**Your Environment Variables**:
```env
VITE_API_BASE_URL=https://salon.run.place/api/v1
VITE_WS_BASE_URL=wss://salon.run.place
VITE_ENVIRONMENT=production
```

**Configuration Path**: `src/config/environment.ts`

## Event Types

### Payment Status Events
```typescript
interface PaymentStatusEvent {
  invoiceId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: number;
  data?: any;
}
```

### Token Saved Events
```typescript
interface TokenSavedEvent {
  tokenId: string;
  timestamp: number;
  data?: any;
}
```

## WebSocket Events

### Client → Server
- `subscribe:payment-events` - Subscribe to payment updates for specific invoice
- `unsubscribe:payment-events` - Unsubscribe from payment updates

### Server → Client
- `payment:status-update` - General payment status change
- `payment:completed` - Payment completion notification
- `payment:token-saved` - New payment token saved

## Authentication

WebSocket connections use JWT tokens from localStorage:
```typescript
const token = localStorage.getItem('authToken');
const socket = io(wsUrl, {
  auth: { token },
  // ... other options
});
```

## Benefits Over Polling

### Real-time Updates
- Instant notifications when payments complete
- No polling intervals or delays
- Reduced unnecessary API calls

### Better User Experience
- Immediate feedback on payment actions
- Automatic UI updates without page refresh
- Reduced waiting time for status updates

### Server Efficiency
- No repeated polling requests
- Server pushes updates only when needed
- Reduced bandwidth usage

## Error Handling

### Connection Failures
- Automatic reconnection attempts
- Graceful fallback to manual refresh
- User notifications for connection issues

### Event Delivery
- Callback cleanup on component unmount
- Duplicate event prevention
- Invoice-specific subscriptions

## Integration with Backend

### Prerequisites
The backend must implement:
1. **Redis Streams** for event processing
2. **WebSocket Server** (Socket.IO) for client connections
3. **Webhook Endpoints** that publish events to Redis
4. **Authentication Middleware** for WebSocket connections

### Event Flow
1. Payment gateway sends webhook to backend
2. Backend processes webhook and publishes to Redis Streams
3. Redis consumer processes event and publishes to WebSocket
4. Frontend receives real-time notification
5. UI updates automatically

## Testing

### WebSocket Connection
```typescript
// Check connection status
console.log('Connected:', webSocketPaymentService.connected);

// Test event subscription
webSocketPaymentService.subscribeToPayment('TEST123', (status) => {
  console.log('Test payment update:', status);
});
```

### Manual Event Testing
Use browser developer tools to monitor WebSocket events:
1. Open Network tab
2. Filter by WS/WebSocket
3. Monitor message exchanges

## Migration from Polling

### Removed Components
- `paymentNotificationService.ts` (polling service)
- All `startPaymentStatusPolling` calls
- `stopAllPolling` cleanup calls

### Updated Components
- `PaymentBilling.tsx` - WebSocket integration
- Environment config - WebSocket URLs added

### Backwards Compatibility
- Fallback event listeners maintained for direct Payable events
- Manual refresh options available if WebSocket fails

## Environment Variables

Your current production configuration:
```env
# Current Production Configuration ✅
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://salon.run.place/api/v1
VITE_WS_BASE_URL=wss://salon.run.place/ws
```

For development, you would use:
```env
# Development Configuration
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:8090/api/v1
VITE_WS_BASE_URL=ws://localhost:8090/ws
```

## Deployment Considerations

### Development
- Ensure backend WebSocket server is running on port 8090
- Redis Streams configured and running
- Webhook endpoints accessible

### Production
- Use WSS (secure WebSocket) for HTTPS sites
- Configure proper CORS for WebSocket connections
- Ensure webhook URLs are publicly accessible
- Monitor WebSocket connection stability

## Next Steps

1. **Backend Implementation**: Implement the Redis Streams + WebSocket architecture
2. **Testing**: Test end-to-end payment flows with real-time notifications
3. **Monitoring**: Add WebSocket connection monitoring and metrics
4. **Optimization**: Fine-tune reconnection logic and error handling

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**:
- Check backend WebSocket server is running
- Verify authentication token is valid
- Check CORS configuration

**Events Not Received**:
- Verify webhook endpoint is receiving calls
- Check Redis Streams are publishing events
- Monitor WebSocket server event emission

**Multiple Connections**:
- Ensure proper cleanup in useEffect
- Check for duplicate component mounts
- Verify disconnect() is called on unmount