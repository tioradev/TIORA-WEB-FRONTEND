/**
 * Custom Hook for Leave Request WebSocket Management
 * Handles real-time leave request notifications and updates
 */

import { useEffect, useState, useCallback } from 'react';
import { webSocketLeaveService, LeaveRequestNotification } from '../services/webSocketLeaveService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface UseLeaveWebSocketOptions {
  autoConnect?: boolean;
  onLeaveRequestSubmitted?: (notification: LeaveRequestNotification) => void;
  onLeaveRequestApproved?: (notification: LeaveRequestNotification) => void;
  onLeaveRequestRejected?: (notification: LeaveRequestNotification) => void;
  onLeaveRequestUpdated?: (notification: LeaveRequestNotification) => void;
  onAnyLeaveNotification?: (notification: LeaveRequestNotification) => void;
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
    onLeaveRequestUpdated,
    onAnyLeaveNotification
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { addNotification } = useNotifications();
  const { getSalonId } = useAuth();

  // Handle leave request notifications
  const handleLeaveNotification = useCallback((notification: LeaveRequestNotification) => {
    console.log('🔔 [LEAVE-WEBSOCKET] Received leave notification:', notification);

    // Call specific handler based on notification type
    switch (notification.type) {
      case 'LEAVE_REQUEST_SUBMITTED':
        onLeaveRequestSubmitted?.(notification);
        // Add system notification
        addNotification({
          type: 'info',
          title: 'New Leave Request',
          message: `${notification.employeeName} has submitted a leave request from ${notification.startDate} to ${notification.endDate}`,
          action: {
            label: 'View Request',
            onClick: () => {
              // Navigate to leave requests page
              console.log('Navigate to leave request:', notification.leaveId);
            }
          }
        });
        break;

      case 'LEAVE_REQUEST_APPROVED':
        onLeaveRequestApproved?.(notification);
        addNotification({
          type: 'success',
          title: 'Leave Request Approved',
          message: `Leave request for ${notification.employeeName} has been approved`,
        });
        break;

      case 'LEAVE_REQUEST_REJECTED':
        onLeaveRequestRejected?.(notification);
        addNotification({
          type: 'warning',
          title: 'Leave Request Rejected',
          message: `Leave request for ${notification.employeeName} has been rejected`,
        });
        break;

      case 'LEAVE_REQUEST_UPDATED':
        onLeaveRequestUpdated?.(notification);
        addNotification({
          type: 'info',
          title: 'Leave Request Updated',
          message: `Leave request for ${notification.employeeName} has been updated`,
        });
        break;
    }

    // Call general handler if provided
    onAnyLeaveNotification?.(notification);
  }, [
    onLeaveRequestSubmitted,
    onLeaveRequestApproved,
    onLeaveRequestRejected,
    onLeaveRequestUpdated,
    onAnyLeaveNotification,
    addNotification
  ]);

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
    // Subscribe to leave notifications
    const unsubscribeNotifications = webSocketLeaveService.onLeaveNotification(handleLeaveNotification);
    
    // Subscribe to connection status changes
    const unsubscribeStatus = webSocketLeaveService.onConnectionStatusChange(handleConnectionStatus);

    // Cleanup on unmount only
    return () => {
      unsubscribeNotifications();
      unsubscribeStatus();
    };
  }, []); // Empty dependency array to prevent re-subscription

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