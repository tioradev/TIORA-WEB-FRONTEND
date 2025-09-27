/**
 * Custom Hook for Leave Request WebS  const stableOnLeaveRequestSubmitted = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestSubmitted TRIGGERED =======');
    console.log('📝 [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestSubmitted?.(leaveRequest);
    
    console.log('🔔 [LEAVE-WS] About to call addNotification for new leave request...');
    addNotification({
      type: 'info',
      title: 'New Leave Request',
      message: `${leaveRequest.barberName} has submitted a leave request from ${leaveRequest.startDate} to ${leaveRequest.endDate}`,
    });
    console.log('✅ [LEAVE-WS] addNotification called successfully');
  }, [onLeaveRequestSubmitted, addNotification]);m  const stableOnLeaveRequestApproved = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestApproved TRIGGERED =======');
    console.log('📝 [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestApproved?.(leaveRequest);
    
    console.log('🔔 [LEAVE-WS] About to call addNotification for approved leave request...');
    addNotification({
      type: 'success',
      title: 'Leave Request Approved',
      message: `Leave request for ${leaveRequest.barberName} has been approved`,
    });
    console.log('✅ [LEAVE-WS] addNotification called successfully');
  }, [onLeaveRequestApproved, addNotification]);l  const stableOnLeaveRequestRejected = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestRejected TRIGGERED =======');
    console.log('📝 [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestRejected?.(leaveRequest);
    
    console.log('🔔 [LEAVE-WS] About to call addNotification for rejected leave request...');
    addNotification({
      type: 'warning',
      title: 'Leave Request Rejected',
      message: `Leave request for ${leaveRequest.barberName} has been rejected`,
    });
    console.log('✅ [LEAVE-WS] addNotification called successfully');
  }, [onLeaveRequestRejected, addNotification]); leave request notifications and updates
 */

import { useEffect, useState, useCallback } from 'react';
import { webSocketLeaveService, WebSocketLeaveCallbacks } from '../services/webSocketLeaveService';
import { LeaveRequest } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface UseLeaveWebSocketOptions {
  autoConnect?: boolean;
  onLeaveRequestSubmitted?: (leaveRequest: LeaveRequest) => void;
  onLeaveRequestApproved?: (leaveRequest: LeaveRequest) => void;
  onLeaveRequestRejected?: (leaveRequest: LeaveRequest) => void;
  onAnyLeaveNotification?: (rawMessage: any) => void;
}

interface UseLeaveWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  retry: () => void;
  connect: () => void;
  disconnect: () => void;
}

export const useLeaveWebSocket = (options: UseLeaveWebSocketOptions = {}): UseLeaveWebSocketReturn => {
  const {
    autoConnect = true,
    onLeaveRequestSubmitted,
    onLeaveRequestApproved,
    onLeaveRequestRejected,
    onAnyLeaveNotification
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { addNotification } = useNotifications();
  const { getSalonId } = useAuth();

  // Stable callback functions
  const stableOnLeaveRequestSubmitted = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestSubmitted TRIGGERED =======');
    console.log('� [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestSubmitted?.(leaveRequest);
    
    addNotification({
      type: 'info',
      title: 'New Leave Request',
      message: `${leaveRequest.barberName} has submitted a leave request from ${leaveRequest.startDate} to ${leaveRequest.endDate}`,
    });
  }, [onLeaveRequestSubmitted, addNotification]);

  const stableOnLeaveRequestApproved = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestApproved TRIGGERED =======');
    console.log('� [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestApproved?.(leaveRequest);
    
    addNotification({
      type: 'success',
      title: 'Leave Request Approved',
      message: `Leave request for ${leaveRequest.barberName} has been approved`,
    });
  }, [onLeaveRequestApproved, addNotification]);

  const stableOnLeaveRequestRejected = useCallback((leaveRequest: LeaveRequest) => {
    console.log('🎯 [LEAVE-WS] ======= onLeaveRequestRejected TRIGGERED =======');
    console.log('� [LEAVE-WS] Leave request data:', leaveRequest);
    
    onLeaveRequestRejected?.(leaveRequest);
    
    addNotification({
      type: 'warning',
      title: 'Leave Request Rejected',
      message: `Leave request for ${leaveRequest.barberName} has been rejected`,
    });
  }, [onLeaveRequestRejected, addNotification]);

  const stableOnAnyLeaveNotification = useCallback((rawMessage: any) => {
    console.log('🎯 [LEAVE-WS] ======= onAnyLeaveNotification TRIGGERED =======');
    console.log('📝 [LEAVE-WS] Raw message:', rawMessage);
    
    onAnyLeaveNotification?.(rawMessage);
  }, [onAnyLeaveNotification]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((connected: boolean, connecting: boolean) => {
    setIsConnected(connected);
    setIsConnecting(connecting);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const salonId = getSalonId();
    if (salonId) {
      webSocketLeaveService.connect(salonId);
    } else {
      console.error('❌ [LEAVE-WEBSOCKET] Cannot connect: No salon ID available');
    }
  }, [getSalonId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketLeaveService.disconnect();
  }, []);

  // Retry connection
  const retry = useCallback(() => {
    const salonId = getSalonId();
    if (salonId) {
      webSocketLeaveService.retry(salonId);
    }
  }, [getSalonId]);

  // Setup WebSocket connection and listeners
  useEffect(() => {
    console.log('🔧 [LEAVE-WS] Setting up WebSocket callbacks...');
    
    // Set callbacks on the service
    webSocketLeaveService.setCallbacks({
      onLeaveRequestSubmitted: stableOnLeaveRequestSubmitted,
      onLeaveRequestApproved: stableOnLeaveRequestApproved,
      onLeaveRequestRejected: stableOnLeaveRequestRejected,
      onAnyLeaveNotification: stableOnAnyLeaveNotification
    });
    
    // Subscribe to connection status changes
    const unsubscribeStatus = webSocketLeaveService.onConnectionStatusChange(handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      console.log('🧹 [LEAVE-WS] Cleaning up WebSocket callbacks...');
      unsubscribeStatus();
    };
  }, [stableOnLeaveRequestSubmitted, stableOnLeaveRequestApproved, stableOnLeaveRequestRejected, stableOnAnyLeaveNotification, handleConnectionStatus]);

  // Separate effect for auto-connect to prevent disconnection on callback changes
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Only disconnect on unmount, not on dependency changes
    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    retry,
    connect,
    disconnect
  };
};