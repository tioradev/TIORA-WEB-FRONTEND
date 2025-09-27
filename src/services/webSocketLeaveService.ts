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
          console.log('🔍 [WEBSOCKET-LEAVE] Message analysis:', {
            hasType: !!data.type,
            type: data.type,
            hasMessage: !!data.message,
            message: data.message,
            hasEmployeeLeave: !!data.employeeLeave,
            hasLeaveRequest: !!data.leaveRequest,
            allKeys: Object.keys(data)
          });

          // Check if this is a leave-related notification
          const isLeaveMsg = this.isLeaveNotification(data);
          console.log('🔍 [WEBSOCKET-LEAVE] Is leave notification?', isLeaveMsg);
          
          if (isLeaveMsg) {
            console.log('✅ [WEBSOCKET-LEAVE] Processing leave notification');
            const notification = this.transformToLeaveNotification(data);
            console.log('🔔 [WEBSOCKET-LEAVE] Transformed notification:', notification);
            this.callbacks.forEach((callback, index) => {
              console.log(`🔔 [WEBSOCKET-LEAVE] Calling callback ${index + 1}/${this.callbacks.length}`);
              callback(notification);
            });
          } else {
            console.log('❌ [WEBSOCKET-LEAVE] Message not recognized as leave notification');
            
            // TEMPORARY: For debugging, try to process any message that might be leave-related
            // This helps identify if the issue is with message detection vs callback execution
            if (data && typeof data === 'object') {
              console.log('🧪 [WEBSOCKET-LEAVE] DEBUGGING: Attempting to process as leave notification anyway...');
              try {
                const debugNotification = this.transformToLeaveNotification(data);
                console.log('🧪 [WEBSOCKET-LEAVE] DEBUG: Transformed notification:', debugNotification);
                
                // Only call callbacks if the transformation looks valid
                if (debugNotification.employeeId && debugNotification.employeeName) {
                  console.log('🧪 [WEBSOCKET-LEAVE] DEBUG: Calling callbacks for debug notification');
                  this.callbacks.forEach((callback, index) => {
                    console.log(`🧪 [WEBSOCKET-LEAVE] DEBUG: Calling callback ${index + 1}/${this.callbacks.length}`);
                    callback(debugNotification);
                  });
                } else {
                  console.log('🧪 [WEBSOCKET-LEAVE] DEBUG: Transformed notification invalid, skipping callbacks');
                }
              } catch (debugError) {
                console.error('🧪 [WEBSOCKET-LEAVE] DEBUG: Error in debug transformation:', debugError);
              }
            }
            
            // Log all messages for debugging - remove this in production
            if (data.type || data.message) {
              console.log('📝 [WEBSOCKET-LEAVE] Non-leave message details:', {
                type: data.type,
                message: data.message,
                fullData: data
              });
            }
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
    console.log('🔍 [WEBSOCKET-LEAVE] Checking if message is leave-related:', data);
    
    // More flexible leave detection - check various possible formats
    const checks = {
      typeContainsLeave: data.type && (data.type.toUpperCase().includes('LEAVE') || data.type.toLowerCase().includes('leave')),
      hasEmployeeLeave: !!data.employeeLeave,
      hasLeaveRequest: !!data.leaveRequest,
      messageContainsLeave: data.message && (data.message.includes('leave') || data.message.includes('Leave')),
      dataContainsLeaveKeys: Object.keys(data).some(key => key.toLowerCase().includes('leave')),
      // Check for common leave-related fields
      hasLeaveFields: data.startDate && data.endDate && data.reason && (data.employeeId || data.barberId),
      // Check if it's a general notification about leave (even without 'leave' keyword)
      looksLikeLeaveData: data.employeeId && data.employeeName && data.startDate && data.endDate
    };
    
    console.log('🔍 [WEBSOCKET-LEAVE] Leave detection checks:', checks);
    
    const isLeave = Object.values(checks).some(Boolean);
    console.log('🔍 [WEBSOCKET-LEAVE] Final decision - is leave notification:', isLeave);
    
    return isLeave;
  }

  /**
   * Transform generic WebSocket message to LeaveRequestNotification
   */
  private transformToLeaveNotification(data: any): LeaveRequestNotification {
    console.log('🔄 [WEBSOCKET-LEAVE] Transforming message to leave notification:', data);
    
    // Handle different possible message formats from the backend
    const leaveData = data.employeeLeave || data.leaveRequest || data;
    console.log('🔄 [WEBSOCKET-LEAVE] Extracted leave data:', leaveData);
    
    const notification = {
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
    
    console.log('🔄 [WEBSOCKET-LEAVE] Final notification:', notification);
    return notification;
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