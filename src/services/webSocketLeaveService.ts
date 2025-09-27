/**
 * WebSocket Leave Request Notification Service
 * Real-time leave request updates using native WebSocket
 */

export interface LeaveRequestNotification {
  type: 'LEAVE_REQUEST_SUBMITTED' | 'LEAVE_REQUEST_APPROVED' | 'LEAVE_REQUEST_REJECTED' | 'LEAVE_REQUEST_UPDATED';
  leaveId?: number;
  employeeId: number;
  employeeName: string;
  salonId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  comment?: string;
  timestamp: string;
}

type LeaveNotificationCallback = (notification: LeaveRequestNotification) => void;
type ConnectionStatusCallback = (connected: boolean, connecting: boolean) => void;

class WebSocketLeaveService {
  private socket: WebSocket | null = null;
  private callbacks: LeaveNotificationCallback[] = [];
  private statusCallbacks: ConnectionStatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentSalonId: number | null = null;
  private isConnecting = false;

  // Leave WebSocket endpoint - using appointments endpoint as specified
  private getWebSocketUrl(salonId: number): string {
    const WS_BASE = import.meta.env.PROD 
      ? 'wss://salon.run.place:8090' 
      : 'ws://localhost:8090';
    return `${WS_BASE}/ws/appointments/${salonId}`;
  }

  /**
   * Initialize WebSocket connection for leave request notifications
   */
  connect(salonId: number): void {
    // Prevent duplicate connections
    if (this.isConnecting) {
      console.log('🔌 [WEBSOCKET-LEAVE] Connection already in progress');
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN && this.currentSalonId === salonId) {
      console.log('🔌 [WEBSOCKET-LEAVE] Already connected to salon:', salonId);
      return;
    }

    // Disconnect existing connection if connecting to different salon
    if (this.socket && this.currentSalonId !== salonId) {
      console.log('🔌 [WEBSOCKET-LEAVE] Switching salon connection from', this.currentSalonId, 'to', salonId);
      this.disconnect();
    }

    this.currentSalonId = salonId;
    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl(salonId);
    console.log('🔌 [WEBSOCKET-LEAVE] Connecting to:', wsUrl);
    console.log('🔌 [WEBSOCKET-LEAVE] Environment:', import.meta.env.PROD ? 'production' : 'development');
    console.log('🔌 [WEBSOCKET-LEAVE] Salon ID:', salonId);

    try {
      this.notifyStatusChange(false, true); // connecting
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('🔌 [WEBSOCKET-LEAVE] Connected successfully to salon:', this.currentSalonId);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.notifyStatusChange(true, false); // connected
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [WEBSOCKET-LEAVE] Received message:', data);

          // Check if this is a leave-related notification
          if (this.isLeaveNotification(data)) {
            const notification = this.transformToLeaveNotification(data);
            this.callbacks.forEach(callback => callback(notification));
          }
        } catch (error) {
          console.error('❌ [WEBSOCKET-LEAVE] Error parsing message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 [WEBSOCKET-LEAVE] Connection closed. Code:', event.code, 'Reason:', event.reason);
        this.isConnecting = false;
        this.notifyStatusChange(false, false); // disconnected
        
        // Only attempt to reconnect if not a normal closure and we have a salon ID
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts && this.currentSalonId) {
          this.scheduleReconnect(this.currentSalonId);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ [WEBSOCKET-LEAVE] Connection error:', error);
        this.isConnecting = false;
        this.notifyStatusChange(false, false); // disconnected
        
        // Only attempt to reconnect if we have a salon ID
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentSalonId) {
          this.scheduleReconnect(this.currentSalonId);
        }
      };

    } catch (error) {
      console.error('❌ [WEBSOCKET-LEAVE] Failed to create connection:', error);
      this.isConnecting = false;
      this.notifyStatusChange(false, false); // disconnected
    }
  }

  /**
   * Check if the received message is a leave-related notification
   */
  private isLeaveNotification(data: any): boolean {
    // Look for leave-related keywords in the message
    return (
      data.type && (
        data.type.includes('LEAVE') || 
        data.type.includes('leave') ||
        data.employeeLeave ||
        data.leaveRequest
      )
    ) || (
      data.message && (
        data.message.includes('leave') ||
        data.message.includes('Leave')
      )
    );
  }

  /**
   * Transform generic WebSocket message to LeaveRequestNotification
   */
  private transformToLeaveNotification(data: any): LeaveRequestNotification {
    // Handle different possible message formats from the backend
    const leaveData = data.employeeLeave || data.leaveRequest || data;
    
    return {
      type: this.mapNotificationType(data.type || data.action),
      leaveId: leaveData.id || leaveData.leaveId,
      employeeId: leaveData.employeeId || leaveData.barberId,
      employeeName: leaveData.employeeName || leaveData.barberName || 'Unknown Employee',
      salonId: leaveData.salonId || data.salonId,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason || '',
      status: leaveData.status || 'PENDING',
      approvedBy: leaveData.approvedBy,
      comment: leaveData.comment,
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Map backend notification types to our standard types
   */
  private mapNotificationType(type: string): LeaveRequestNotification['type'] {
    const lowerType = (type || '').toLowerCase();
    
    if (lowerType.includes('submit') || lowerType.includes('create') || lowerType.includes('new')) {
      return 'LEAVE_REQUEST_SUBMITTED';
    } else if (lowerType.includes('approve')) {
      return 'LEAVE_REQUEST_APPROVED';
    } else if (lowerType.includes('reject') || lowerType.includes('decline')) {
      return 'LEAVE_REQUEST_REJECTED';
    } else if (lowerType.includes('update') || lowerType.includes('modify')) {
      return 'LEAVE_REQUEST_UPDATED';
    }
    
    return 'LEAVE_REQUEST_UPDATED'; // Default
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(salonId: number): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, Math.min(this.reconnectAttempts - 1, 3)); // Exponential backoff

    console.log(`🔄 [WEBSOCKET-LEAVE] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`🔄 [WEBSOCKET-LEAVE] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(salonId);
    }, delay);
  }

  /**
   * Manually retry connection
   */
  retry(salonId: number): void {
    this.reconnectAttempts = 0;
    this.connect(salonId);
  }

  /**
   * Test WebSocket endpoint connectivity
   */
  async testConnectivity(salonId: number): Promise<boolean> {
    return new Promise((resolve) => {
      const wsUrl = this.getWebSocketUrl(salonId);
      console.log('🧪 [WEBSOCKET-LEAVE] Testing connectivity to:', wsUrl);
      const testSocket = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        testSocket.close();
        console.log('❌ [WEBSOCKET-LEAVE] Connectivity test timeout');
        resolve(false);
      }, 5000); // 5 second timeout
      
      testSocket.onopen = () => {
        clearTimeout(timeout);
        testSocket.close();
        console.log('✅ [WEBSOCKET-LEAVE] Connectivity test successful');
        resolve(true);
      };
      
      testSocket.onerror = (error) => {
        clearTimeout(timeout);
        console.log('❌ [WEBSOCKET-LEAVE] Connectivity test failed:', error);
        resolve(false);
      };
    });
  }

  /**
   * Subscribe to leave request notifications
   */
  onLeaveNotification(callback: LeaveNotificationCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all status callbacks of connection state change
   */
  private notifyStatusChange(connected: boolean, connecting: boolean): void {
    this.statusCallbacks.forEach(callback => callback(connected, connecting));
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('🔌 [WEBSOCKET-LEAVE] Disconnecting...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    
    this.currentSalonId = null;
    this.isConnecting = false;
    this.callbacks.length = 0;
    this.statusCallbacks.length = 0;
    this.reconnectAttempts = 0;
    this.notifyStatusChange(false, false);
  }
}

// Export singleton instance
export const webSocketLeaveService = new WebSocketLeaveService();