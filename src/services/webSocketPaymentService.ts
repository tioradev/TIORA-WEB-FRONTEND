/**
 * WebSocket Payment Notification Service
 * Real-time payment status updates using native WebSocket (matching appointments pattern)
 */

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
  private socket: WebSocket | null = null;
  private isConnected = false;
  private paymentCallbacks: Map<string, (status: PaymentStatusEvent) => void> = new Map();
  private tokenCallbacks: Array<(event: TokenSavedEvent) => void> = [];

  /**
   * Initialize WebSocket connection using native WebSocket (same as appointments)
   */
  async connect(salonId: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('🔌 [WEBSOCKET] Already connected');
      return;
    }

    // Use the same pattern as appointments WebSocket but for payments
    const WS_BASE = import.meta.env.PROD 
      ? 'wss://salon.run.place' 
      : 'ws://localhost:8090';
    
    const wsUrl = `${WS_BASE}/ws/payments/salon/${salonId}`;
    
    console.log('🔌 [WEBSOCKET] Connecting to:', wsUrl, 'Environment:', import.meta.env.PROD ? 'production' : 'development');
    console.log('🔌 [WEBSOCKET] WS_BASE:', WS_BASE);
    console.log('🔌 [WEBSOCKET] Salon ID:', salonId);
    console.log('🔌 [WEBSOCKET] Full URL will be:', wsUrl);
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✅ [WEBSOCKET] Successfully connected to payment updates!');
          this.isConnected = true;
          this.setupEventListeners();
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.socket.onclose = (event) => {
          console.log('🔌 [WEBSOCKET] Payment connection closed. Code:', event.code, 'Reason:', event.reason);
          this.isConnected = false;
          
          if (event.code !== 1000) {
            console.log('🔄 [WEBSOCKET] Connection closed unexpectedly. Manual reconnection may be needed.');
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ [WEBSOCKET] Payment connection error:', error);
          console.error('❌ [WEBSOCKET] Make sure your backend WebSocket server supports /ws/payments/salon/{salonId}');
          this.isConnected = false;
          reject(error);
        };

      } catch (error) {
        console.error('❌ [WEBSOCKET] Failed to create payment WebSocket connection:', error);
        this.isConnected = false;
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('📡 [WEBSOCKET] Received payment message:', data);

      // Handle different types of payment events
      switch (data.type) {
        case 'payment:status-update':
        case 'payment:completed':
          this.handlePaymentStatusUpdate(data);
          break;
          
        case 'payment:token-saved':
          this.handleTokenSaved(data);
          break;
          
        default:
          console.log('📡 [WEBSOCKET] Unknown payment message type:', data.type);
      }
    } catch (error) {
      console.error('❌ [WEBSOCKET] Error parsing payment message:', error);
    }
  }

  /**
   * Handle payment status updates
   */
  private handlePaymentStatusUpdate(data: any): void {
    const event: PaymentStatusEvent = {
      invoiceId: data.invoiceId,
      status: data.status,
      timestamp: data.timestamp || Date.now(),
      data: data.data
    };

    console.log('📡 [WEBSOCKET] Payment status update:', event);
    
    const callback = this.paymentCallbacks.get(event.invoiceId);
    if (callback) {
      callback(event);
      // Remove callback after notification
      this.paymentCallbacks.delete(event.invoiceId);
    }
  }

  /**
   * Handle token saved events
   */
  private handleTokenSaved(data: any): void {
    const event: TokenSavedEvent = {
      tokenId: data.tokenId,
      timestamp: data.timestamp || Date.now(),
      data: data.data
    };

    console.log('📡 [WEBSOCKET] Token saved:', event);
    
    // Notify all token callbacks
    this.tokenCallbacks.forEach(callback => callback(event));
  }

  /**
   * Setup event listeners (keeping for compatibility)
   */
  private setupEventListeners(): void {
    // Event listeners are handled in handleWebSocketMessage
    console.log('📡 [WEBSOCKET] Payment event listeners ready');
  }

  /**
   * Subscribe to payment status for a specific invoice
   */
  subscribeToPayment(invoiceId: string, callback: (status: PaymentStatusEvent) => void): void {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ [WEBSOCKET] Not connected. Cannot subscribe to payment:', invoiceId);
      return;
    }

    console.log('🔔 [WEBSOCKET] Subscribing to payment notifications:', invoiceId);
    
    // Store callback for this invoice
    this.paymentCallbacks.set(invoiceId, callback);
    
    // Send subscription message to backend
    const message = {
      type: 'subscribe:payment-events',
      invoiceId: invoiceId
    };
    
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Unsubscribe from payment status for a specific invoice
   */
  unsubscribeFromPayment(invoiceId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    console.log('🔕 [WEBSOCKET] Unsubscribing from payment notifications:', invoiceId);
    
    // Remove callback
    this.paymentCallbacks.delete(invoiceId);
    
    // Send unsubscription message to backend
    const message = {
      type: 'unsubscribe:payment-events',
      invoiceId: invoiceId
    };
    
    this.socket.send(JSON.stringify(message));
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
      this.socket.close();
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
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
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