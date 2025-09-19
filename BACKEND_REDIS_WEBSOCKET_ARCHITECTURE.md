# Payment Webhook Integration with Redis Streams & WebSockets

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Payable IPG   │────│  Backend API    │────│  Redis Streams  │────│   Frontend      │
│                 │    │                 │    │                 │    │   (WebSocket)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Webhook POST       │ 2. Save to DB        │ 3. Stream Event      │ 4. Real-time UI
         │ /api/payments/webhook │ /api/payments/tokens  │ payment:events        │ Update
         │                       │ /api/payments/trans   │                       │
```

## 🔧 Backend Implementation Steps

### Step 1: Redis Streams Configuration

```typescript
// config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Redis Streams configuration
export const REDIS_STREAMS = {
  PAYMENT_EVENTS: 'payment:events',
  CONSUMER_GROUP: 'payment-processors',
  CONSUMER_NAME: 'websocket-notifier'
};

// Initialize consumer group (run once)
export async function initializeRedisStreams() {
  try {
    await redis.xgroup('CREATE', REDIS_STREAMS.PAYMENT_EVENTS, REDIS_STREAMS.CONSUMER_GROUP, '$', 'MKSTREAM');
    console.log('✅ Redis Streams consumer group initialized');
  } catch (error) {
    if (error.message.includes('BUSYGROUP')) {
      console.log('✅ Redis Streams consumer group already exists');
    } else {
      console.error('❌ Error initializing Redis Streams:', error);
    }
  }
}
```

### Step 2: WebSocket Server Setup

```typescript
// websocket/socketServer.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { redis, REDIS_STREAMS } from '../config/redis';

export class PaymentWebSocketServer {
  private io: SocketIOServer;
  private isListening = false;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
    this.startStreamListener();
  }

  private setupAuthentication() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.user?.userId;
      const salonId = socket.data.user?.salonId;
      
      console.log(`🔌 [WEBSOCKET] User connected: ${userId}, Salon: ${salonId}`);
      
      // Join salon-specific room for targeted notifications
      if (salonId) {
        socket.join(`salon:${salonId}`);
        console.log(`🏢 [WEBSOCKET] User joined salon room: salon:${salonId}`);
      }

      // Handle subscription to payment events
      socket.on('subscribe:payment-events', (data) => {
        const { invoiceId } = data;
        if (invoiceId) {
          socket.join(`payment:${invoiceId}`);
          console.log(`💳 [WEBSOCKET] User subscribed to payment: ${invoiceId}`);
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe:payment-events', (data) => {
        const { invoiceId } = data;
        if (invoiceId) {
          socket.leave(`payment:${invoiceId}`);
          console.log(`💳 [WEBSOCKET] User unsubscribed from payment: ${invoiceId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 [WEBSOCKET] User disconnected: ${userId}`);
      });
    });
  }

  private async startStreamListener() {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('🔄 [REDIS STREAMS] Starting payment events listener...');

    while (this.isListening) {
      try {
        const streams = await redis.xreadgroup(
          'GROUP', REDIS_STREAMS.CONSUMER_GROUP, REDIS_STREAMS.CONSUMER_NAME,
          'COUNT', '10',
          'BLOCK', '1000',
          'STREAMS', REDIS_STREAMS.PAYMENT_EVENTS, '>'
        );

        if (streams && streams.length > 0) {
          for (const stream of streams) {
            const [streamName, messages] = stream;
            
            for (const message of messages) {
              const [messageId, fields] = message;
              await this.processPaymentEvent(messageId, fields);
            }
          }
        }
      } catch (error) {
        console.error('❌ [REDIS STREAMS] Error reading from stream:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
      }
    }
  }

  private async processPaymentEvent(messageId: string, fields: string[]) {
    try {
      // Convert fields array to object
      const eventData: any = {};
      for (let i = 0; i < fields.length; i += 2) {
        eventData[fields[i]] = fields[i + 1];
      }

      // Parse JSON fields
      if (eventData.paymentData) {
        eventData.paymentData = JSON.parse(eventData.paymentData);
      }
      if (eventData.tokenData) {
        eventData.tokenData = JSON.parse(eventData.tokenData);
      }

      console.log('📡 [WEBSOCKET] Processing payment event:', eventData);

      // Emit to specific rooms based on event type
      const { eventType, salonId, invoiceId } = eventData;

      if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_FAILED') {
        // Emit to salon room
        if (salonId) {
          this.io.to(`salon:${salonId}`).emit('payment:status-update', {
            invoiceId,
            status: eventType === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED',
            timestamp: Date.now(),
            data: eventData.paymentData
          });
        }

        // Emit to specific payment subscribers
        if (invoiceId) {
          this.io.to(`payment:${invoiceId}`).emit('payment:completed', {
            invoiceId,
            status: eventType === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED',
            timestamp: Date.now(),
            data: eventData.paymentData
          });
        }
      }

      if (eventType === 'TOKEN_SAVED' && salonId) {
        // Emit token saved event to salon
        this.io.to(`salon:${salonId}`).emit('payment:token-saved', {
          tokenId: eventData.tokenData?.tokenId,
          timestamp: Date.now(),
          data: eventData.tokenData
        });
      }

      // Acknowledge message processing
      await redis.xack(REDIS_STREAMS.PAYMENT_EVENTS, REDIS_STREAMS.CONSUMER_GROUP, messageId);
      console.log(`✅ [REDIS STREAMS] Acknowledged message: ${messageId}`);

    } catch (error) {
      console.error('❌ [WEBSOCKET] Error processing payment event:', error);
      // Don't acknowledge failed messages - they'll be retried
    }
  }

  public stopListening() {
    this.isListening = false;
    console.log('🛑 [REDIS STREAMS] Stopped payment events listener');
  }
}
```

### Step 3: Webhook Endpoint with Redis Streams

```typescript
// routes/webhookRoutes.ts
import express from 'express';
import { redis, REDIS_STREAMS } from '../config/redis';

const router = express.Router();

// Helper function to extract salon ID from customer reference
function extractSalonIdFromCustomerRef(customerRefNo: string): number {
  const match = customerRefNo?.match(/SALON(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

// Helper function to publish to Redis Stream
async function publishPaymentEvent(eventType: string, data: any) {
  const streamData = [
    'eventType', eventType,
    'timestamp', Date.now().toString(),
    'salonId', data.salonId?.toString() || '1',
    'invoiceId', data.invoiceId || '',
    'paymentData', JSON.stringify(data.paymentData || {}),
    'tokenData', JSON.stringify(data.tokenData || {})
  ];

  const messageId = await redis.xadd(REDIS_STREAMS.PAYMENT_EVENTS, '*', ...streamData);
  console.log(`📡 [REDIS STREAMS] Published event ${eventType}: ${messageId}`);
  return messageId;
}

router.post('/webhook', async (req, res) => {
  const webhookData = req.body;
  
  console.log('🔔 [WEBHOOK] Received Payable notification:', JSON.stringify(webhookData, null, 2));
  
  try {
    const salonId = extractSalonIdFromCustomerRef(webhookData.customerRefNo);
    
    if (webhookData.statusCode === 1 && webhookData.statusMessage === 'SUCCESS') {
      // Handle successful payment
      
      if (webhookData.paymentType === 3 && webhookData.token) {
        // Tokenization payment - save token
        const tokenData = {
          tokenId: webhookData.token.tokenId,
          customerRefNo: webhookData.customerRefNo,
          salonId: salonId,
          maskedCardNo: webhookData.token.maskedCardNo,
          cardExpiry: webhookData.token.exp,
          cardScheme: webhookData.paymentScheme,
          cardHolderName: webhookData.cardHolderName,
          nickname: webhookData.token.nickname,
          isDefaultCard: webhookData.token.defaultCard === 1,
          tokenStatus: 'ACTIVE',
          reference: webhookData.token.reference,
          payableMerchantId: webhookData.merchantId,
          payableCustomerId: webhookData.customerId
        };

        // Save to database (call your existing API)
        await fetch(`${process.env.API_BASE_URL}/api/payments/tokens/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenData)
        });

        // Publish to Redis Stream
        await publishPaymentEvent('TOKEN_SAVED', {
          salonId,
          invoiceId: webhookData.invoiceNo,
          tokenData: tokenData
        });
      }
      
      // Save transaction (both tokenization and regular payments)
      const transactionData = {
        invoiceId: webhookData.invoiceNo,
        payableOrderId: webhookData.payableOrderId,
        payableTransactionId: webhookData.payableTransactionId,
        salonId: salonId,
        amount: parseFloat(webhookData.payableAmount),
        currencyCode: webhookData.payableCurrency,
        paymentType: webhookData.paymentType === 3 ? 'TOKENIZATION' : 'ONE_TIME_PAYMENT',
        paymentMethod: 'CARD',
        paymentScheme: webhookData.paymentScheme,
        cardHolderName: webhookData.cardHolderName,
        maskedCardNo: webhookData.cardNumber || webhookData.token?.maskedCardNo,
        status: 'SUCCESS',
        statusCode: webhookData.statusCode,
        statusMessage: webhookData.statusMessage,
        checkValue: webhookData.checkValue,
        custom1: webhookData.custom1,
        custom2: webhookData.custom2
      };

      // Save to database (call your existing API)
      await fetch(`${process.env.API_BASE_URL}/api/payments/transactions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      // Publish to Redis Stream
      await publishPaymentEvent('PAYMENT_SUCCESS', {
        salonId,
        invoiceId: webhookData.invoiceNo,
        paymentData: transactionData
      });

    } else {
      // Handle failed payment
      const transactionData = {
        invoiceId: webhookData.invoiceNo,
        payableOrderId: webhookData.payableOrderId,
        payableTransactionId: webhookData.payableTransactionId,
        salonId: salonId,
        amount: parseFloat(webhookData.payableAmount || '0'),
        currencyCode: webhookData.payableCurrency || 'LKR',
        paymentType: webhookData.paymentType === 3 ? 'TOKENIZATION' : 'ONE_TIME_PAYMENT',
        paymentMethod: 'CARD',
        status: 'FAILED',
        statusCode: webhookData.statusCode,
        statusMessage: webhookData.statusMessage
      };

      // Save to database
      await fetch(`${process.env.API_BASE_URL}/api/payments/transactions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      // Publish to Redis Stream
      await publishPaymentEvent('PAYMENT_FAILED', {
        salonId,
        invoiceId: webhookData.invoiceNo,
        paymentData: transactionData
      });
    }
    
    // Always return 200 status to acknowledge receipt
    res.status(200).json({ Status: 200 });
  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ Status: 200 });
  }
});

export default router;
```

### Step 4: Server Initialization

```typescript
// server.ts
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { PaymentWebSocketServer } from './websocket/socketServer';
import { initializeRedisStreams } from './config/redis';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/payments', webhookRoutes);

// Initialize Redis Streams
async function initializeServer() {
  try {
    await initializeRedisStreams();
    
    // Initialize WebSocket server
    const wsServer = new PaymentWebSocketServer(httpServer);
    
    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 WebSocket server initialized`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down server...');
      wsServer.stopListening();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();
```

## 📝 Environment Variables

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret
API_BASE_URL=https://salon.run.place/api/v1
FRONTEND_URL=https://salon.run.place
PORT=8080
```

## 🔧 Package Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/cors": "^2.8.13"
  }
}
```

This architecture provides real-time, scalable payment notifications without polling, using Redis Streams for reliable event processing and WebSockets for instant frontend updates.