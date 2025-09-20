/**
 * WebSocket Payment Notification Service
 * Real-time payment status updates using Socket.IO
 */

import { io, Socket } from 'socket.io-client';

interface PaymentStatusEvent {
  invoiceId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: number;
  data?: any;
}

interface TokenSavedEvent {
  tokenId: string;
  timestamp: number;
  data?: any;
}

class WebSocketPaymentService {
  private socket: Socket | null = null;
  private isConnected = false;
  private paymentCallbacks: Map<string, (status: PaymentStatusEvent) => void> = new Map();
  private tokenCallbacks: Array<(event: TokenSavedEvent) => void> = [];

  /**
   * Initialize WebSocket connection
   */
  async connect(salonId: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('🔌 [WEBSOCKET] Already connected');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Use the correct WebSocket URL pattern for payment events
    const WS_BASE = import.meta.env.PROD 
      ? 'wss://salon.run.place' 
      : 'ws://localhost:8090';
    
    const wsUrl = `${WS_BASE}/payments/salon/${salonId}`;
    
    console.log('🔌 [WEBSOCKET] Connecting to:', wsUrl, 'Environment:', import.meta.env.PROD ? 'production' : 'development');
    console.log('🔌 [WEBSOCKET] WS_BASE:', WS_BASE);
    console.log('🔌 [WEBSOCKET] Salon ID:', salonId);
    console.log('🔌 [WEBSOCKET] Full URL will be:', wsUrl);
    
    // For Socket.IO with custom namespace, connect to base URL with namespace path
    this.socket = io(`${WS_BASE}/payments/salon/${salonId}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 15000,
      retries: 5,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));

      this.socket.on('connect', () => {
        console.log('✅ [WEBSOCKET] Connected to payment notification service');
        this.isConnected = true;
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ [WEBSOCKET] Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason: any) => {
        console.log('🔌 [WEBSOCKET] Disconnected:', reason);
        this.isConnected = false;
      });
    });
  }

  /**
   * Setup event listeners for payment notifications
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen for payment status updates
    this.socket.on('payment:status-update', (event: PaymentStatusEvent) => {
      console.log('📡 [WEBSOCKET] Payment status update:', event);
      
      const callback = this.paymentCallbacks.get(event.invoiceId);
      if (callback) {
        callback(event);
        // Remove callback after notification
        this.paymentCallbacks.delete(event.invoiceId);
      }
    });

    // Listen for payment completion (specific to invoice)
    this.socket.on('payment:completed', (event: PaymentStatusEvent) => {
      console.log('📡 [WEBSOCKET] Payment completed:', event);
      
      const callback = this.paymentCallbacks.get(event.invoiceId);
      if (callback) {
        callback(event);
        this.paymentCallbacks.delete(event.invoiceId);
      }
    });

    // Listen for token saved events
    this.socket.on('payment:token-saved', (event: TokenSavedEvent) => {
      console.log('📡 [WEBSOCKET] Token saved:', event);
      
      // Notify all token callbacks
      this.tokenCallbacks.forEach(callback => callback(event));
    });

    // Listen for connection errors
    this.socket.on('error', (error: any) => {
      console.error('❌ [WEBSOCKET] Socket error:', error);
    });
  }

  /**
   * Subscribe to payment status for a specific invoice
   */
  subscribeToPayment(invoiceId: string, callback: (status: PaymentStatusEvent) => void): void {
    if (!this.isConnected || !this.socket) {
      console.error('❌ [WEBSOCKET] Not connected. Cannot subscribe to payment:', invoiceId);
      return;
    }

    console.log('🔔 [WEBSOCKET] Subscribing to payment notifications:', invoiceId);
    
    // Store callback for this invoice
    this.paymentCallbacks.set(invoiceId, callback);
    
    // Subscribe to payment events for this invoice
    this.socket.emit('subscribe:payment-events', { invoiceId });
  }

  /**
   * Unsubscribe from payment status for a specific invoice
   */
  unsubscribeFromPayment(invoiceId: string): void {
    if (!this.socket) return;

    console.log('🔕 [WEBSOCKET] Unsubscribing from payment notifications:', invoiceId);
    
    // Remove callback
    this.paymentCallbacks.delete(invoiceId);
    
    // Unsubscribe from payment events
    this.socket.emit('unsubscribe:payment-events', { invoiceId });
  }

  /**
   * Subscribe to token saved events (for card list refresh)
   */
  subscribeToTokenEvents(callback: (event: TokenSavedEvent) => void): void {
    this.tokenCallbacks.push(callback);
    console.log('🔔 [WEBSOCKET] Subscribed to token saved events');
  }

  /**
   * Unsubscribe from token saved events
   */
  unsubscribeFromTokenEvents(callback: (event: TokenSavedEvent) => void): void {
    const index = this.tokenCallbacks.indexOf(callback);
    if (index > -1) {
      this.tokenCallbacks.splice(index, 1);
      console.log('🔕 [WEBSOCKET] Unsubscribed from token saved events');
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 [WEBSOCKET] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.paymentCallbacks.clear();
      this.tokenCallbacks = [];
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Reconnect if disconnected
   */
  async reconnect(salonId: string): Promise<void> {
    if (!this.connected) {
      console.log('🔄 [WEBSOCKET] Attempting to reconnect...');
      this.disconnect(); // Clean up
      await this.connect(salonId);
    }
  }
}

export const webSocketPaymentService = new WebSocketPaymentService();
export type { PaymentStatusEvent, TokenSavedEvent };