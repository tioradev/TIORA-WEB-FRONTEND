/**
 * WebSocket Leave Request Notification Service
 * Real-time leave request updates using native WebSocket
 */

import { LeaveRequest } from '../types';
import { ENV_CONFIG } from '../config/environment';

export interface WebSocketLeaveCallbacks {
  onLeaveRequestSubmitted?: (leaveRequest: LeaveRequest) => void;
  onLeaveRequestApproved?: (leaveRequest: LeaveRequest) => void;
  onLeaveRequestRejected?: (leaveRequest: LeaveRequest) => void;
  onAnyLeaveNotification?: (rawMessage: any) => void;
}

type ConnectionStatusCallback = (connected: boolean, connecting: boolean) => void;

class WebSocketLeaveService {
  private socket: WebSocket | null = null;
  private callbacks: WebSocketLeaveCallbacks = {};
  private statusCallbacks: ConnectionStatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentSalonId: number | null = null;
  private isConnecting = false;

  // Leave WebSocket endpoint - using appointments endpoint as specified
  private getWebSocketUrl(salonId: number): string {
    const config = ENV_CONFIG[ENV_CONFIG.CURRENT_ENV];
    return `${config.WS_BASE_URL}/ws/appointments/${salonId}`;
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
          console.log('📨 [WS-LEAVE] Received raw message:', JSON.stringify(data, null, 2));
          
          // Check if this is a leave-related notification
          if (this.isLeaveNotification(data)) {
            console.log('✅ [WS-LEAVE] Identified as leave notification, processing...');
            this.processLeaveMessage(data);
          } else {
            console.log('❌ [WS-LEAVE] Not a leave notification, ignoring');
          }
        } catch (error) {
          console.error('❌ [WS-LEAVE] Error parsing message:', error);
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
   * Based on the message format: { type: "LEAVE_REQUESTED", appointment_data: { leaveId, barberId, ... } }
   */
  private isLeaveNotification(data: any): boolean {
    console.log('🔍 [WS-LEAVE] Checking if message is leave notification...');
    console.log('🔍 [WS-LEAVE] Message type:', data.type);
    console.log('🔍 [WS-LEAVE] Has appointment_data:', !!data.appointment_data);
    console.log('🔍 [WS-LEAVE] Has appointmentData:', !!data.appointmentData);
    
    // Check for the specific message format - handle both underscore and camelCase
    const hasAppointmentData = !!(data.appointment_data || data.appointmentData);
    const hasLeaveId = !!(data.appointment_data?.leaveId || data.appointmentData?.leaveId);
    
    const isLeaveMsg = (
      data.type === 'LEAVE_REQUESTED' || 
      data.type === 'LEAVE_APPROVED' || 
      data.type === 'LEAVE_REJECTED' ||
      data.type === 'LEAVE_UPDATED'
    ) && hasAppointmentData && hasLeaveId;
    
    console.log('🔍 [WS-LEAVE] Detection details:', {
      hasCorrectType: ['LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_UPDATED'].includes(data.type),
      hasAppointmentData,
      hasLeaveId,
      finalDecision: isLeaveMsg
    });
    
    console.log('🔍 [WS-LEAVE] Final decision - is leave notification:', isLeaveMsg);
    return isLeaveMsg;
  }

  /**
   * Process leave message and trigger appropriate callbacks
   */
  private processLeaveMessage(data: any): void {
    try {
      console.log('🔄 [WS-LEAVE] Processing leave message:', data);
      console.log('🔍 [WS-LEAVE] Message type received:', data.type);
      
      const messageType = this.mapNotificationType(data.type);
      console.log('📝 [WS-LEAVE] Mapped message type:', messageType, 'from original:', data.type);
      
      const leaveData = this.extractLeaveData(data);
      if (!leaveData) {
        console.warn('⚠️ [WS-LEAVE] Could not extract leave data, triggering generic callback only');
        this.callbacks.onAnyLeaveNotification?.(data);
        return;
      }
      
      console.log('🎯 [WS-LEAVE] About to trigger callbacks for type:', messageType);
      console.log('📋 [WS-LEAVE] Available callbacks:', Object.keys(this.callbacks));
      
      // Execute specific callback based on message type
      switch (messageType) {
        case 'LEAVE_REQUESTED':
          console.log('📞 [WS-LEAVE] Executing onLeaveRequestSubmitted callback');
          console.log('📞 [WS-LEAVE] Callback exists?', !!this.callbacks.onLeaveRequestSubmitted);
          if (this.callbacks.onLeaveRequestSubmitted) {
            console.log('📞 [WS-LEAVE] About to call onLeaveRequestSubmitted...');
            this.callbacks.onLeaveRequestSubmitted(leaveData);
            console.log('✅ [WS-LEAVE] onLeaveRequestSubmitted callback executed');
          } else {
            console.warn('❌ [WS-LEAVE] onLeaveRequestSubmitted callback not available');
          }
          break;
        case 'LEAVE_APPROVED':
          console.log('📞 [WS-LEAVE] Executing onLeaveRequestApproved callback');
          console.log('📞 [WS-LEAVE] Callback exists?', !!this.callbacks.onLeaveRequestApproved);
          if (this.callbacks.onLeaveRequestApproved) {
            console.log('📞 [WS-LEAVE] About to call onLeaveRequestApproved...');
            this.callbacks.onLeaveRequestApproved(leaveData);
            console.log('✅ [WS-LEAVE] onLeaveRequestApproved callback executed');
          } else {
            console.warn('❌ [WS-LEAVE] onLeaveRequestApproved callback not available');
          }
          break;
        case 'LEAVE_REJECTED':
          console.log('📞 [WS-LEAVE] Executing onLeaveRequestRejected callback');
          console.log('📞 [WS-LEAVE] Callback exists?', !!this.callbacks.onLeaveRequestRejected);
          if (this.callbacks.onLeaveRequestRejected) {
            console.log('📞 [WS-LEAVE] About to call onLeaveRequestRejected...');
            this.callbacks.onLeaveRequestRejected(leaveData);
            console.log('✅ [WS-LEAVE] onLeaveRequestRejected callback executed');
          } else {
            console.warn('❌ [WS-LEAVE] onLeaveRequestRejected callback not available');
          }
          break;
        default:
          console.log('📞 [WS-LEAVE] Unknown message type, using generic callback');
      }
      
      // Always call the generic callback as well
      console.log('📞 [WS-LEAVE] Executing onAnyLeaveNotification callback');
      if (this.callbacks.onAnyLeaveNotification) {
        this.callbacks.onAnyLeaveNotification(data);
        console.log('✅ [WS-LEAVE] onAnyLeaveNotification callback executed');
      } else {
        console.warn('❌ [WS-LEAVE] onAnyLeaveNotification callback not available');
      }
      
    } catch (error) {
      console.error('❌ [WS-LEAVE] Error processing leave message:', error);
    }
  }

  /**
   * Extract leave data from the message format
   * Message format: { appointment_data: { leaveId, barberId, barberName, startDate, endDate, status, ... } }
   */
  private extractLeaveData(data: any): LeaveRequest | null {
    try {
      console.log('🔍 [WS-LEAVE] Extracting leave data from:', JSON.stringify(data, null, 2));
      
      // Extract data from appointment_data (with underscore) based on the actual message format
      const appointmentData = data.appointment_data || data.appointmentData;
      if (!appointmentData) {
        console.warn('❌ [WS-LEAVE] Missing appointment_data in message');
        return null;
      }
      
      console.log('🔍 [WS-LEAVE] Found appointment_data:', appointmentData);
      
      // Extract fields from appointment_data
      const leaveId = appointmentData.leaveId;
      const barberId = appointmentData.barberId;
      const barberName = appointmentData.barberName || data.customer_name;
      const startDate = appointmentData.startDate;
      const endDate = appointmentData.endDate;
      const reason = appointmentData.leaveReason || appointmentData.reason;
      const status = appointmentData.status;
      
      console.log('🔍 [WS-LEAVE] Extracted fields:', {
        leaveId, barberId, barberName, startDate, endDate, reason, status
      });
      
      if (!leaveId || !barberId) {
        console.warn('❌ [WS-LEAVE] Missing required leave data:', { leaveId, barberId });
        return null;
      }
      
      const extractedData: LeaveRequest = {
        id: leaveId.toString(),
        salonId: data.salon_id?.toString() || appointmentData.salonId?.toString() || '',
        barberId: barberId.toString(),
        barberName: barberName || 'Unknown',
        startDate: startDate || '',
        endDate: endDate || '',
        reason: reason || '',
        leaveType: 'other', // Default since not provided in message
        status: (status || 'PENDING').toLowerCase() as 'pending' | 'approved' | 'rejected',
        createdAt: new Date()
      };
      
      console.log('✅ [WS-LEAVE] Successfully extracted leave data:', extractedData);
      return extractedData;
    } catch (error) {
      console.error('❌ [WS-LEAVE] Error extracting leave data:', error);
      return null;
    }
  }

  /**
   * Map backend notification types to our standard types
   */
  private mapNotificationType(type: string): 'LEAVE_REQUESTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_UPDATED' {
    console.log('🏷️ [WS-LEAVE] Mapping notification type:', type);
    
    let mappedType: 'LEAVE_REQUESTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_UPDATED';
    
    switch (type) {
      case 'LEAVE_REQUESTED':
        mappedType = 'LEAVE_REQUESTED';
        break;
      case 'LEAVE_APPROVED':
        mappedType = 'LEAVE_APPROVED';
        break;
      case 'LEAVE_REJECTED':
        mappedType = 'LEAVE_REJECTED';
        break;
      case 'LEAVE_UPDATED':
        mappedType = 'LEAVE_UPDATED';
        break;
      default:
        console.warn('⚠️ [WS-LEAVE] Unknown message type:', type, 'defaulting to LEAVE_REQUESTED');
        mappedType = 'LEAVE_REQUESTED';
    }
    
    console.log('🏷️ [WS-LEAVE] Type mapping result:', { original: type, mapped: mappedType });
    return mappedType;
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
   * Set callbacks for leave notifications
   */
  setCallbacks(callbacks: WebSocketLeaveCallbacks): void {
    console.log('🔧 [WS-LEAVE] Setting callbacks:', Object.keys(callbacks));
    this.callbacks = { ...callbacks };
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
    this.callbacks = {};
    this.statusCallbacks.length = 0;
    this.reconnectAttempts = 0;
    this.notifyStatusChange(false, false);
  }
}

// Export singleton instance
export const webSocketLeaveService = new WebSocketLeaveService();