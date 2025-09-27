import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { backendNotificationService } from '../services/backendNotificationService';
import { BackendNotification } from '../types';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  // Backend notification fields
  backendId?: number;
  appointmentId?: number;
  customerName?: string;
  amount?: number;
  sessionTime?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  backendNotifications: BackendNotification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  backendUnreadCount: number;
  totalUnreadCount: number;
  refreshBackendNotifications: () => Promise<void>;
  markBackendNotificationAsRead: (notificationId: number) => Promise<void>;
  markAllBackendNotificationsAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { getSalonId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [backendNotifications, setBackendNotifications] = useState<BackendNotification[]>([]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    console.log('🔔 [NOTIFICATION-CTX] addNotification called with:', notificationData);
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    console.log('🔔 [NOTIFICATION-CTX] Created new notification:', newNotification);
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      console.log('🔔 [NOTIFICATION-CTX] Updated notifications count:', updated.length);
      console.log('🔔 [NOTIFICATION-CTX] Unread count will be:', updated.filter(n => !n.read).length);
      return updated;
    });
    console.log('✅ [NOTIFICATION-CTX] Notification added successfully');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Backend notification methods
  const refreshBackendNotifications = useCallback(async () => {
    const salonId = getSalonId();
    if (!salonId) return;
    
    try {
      console.log('🔄 [NOTIFICATION-CTX] Refreshing backend notifications...');
      const response = await backendNotificationService.getNotifications(salonId);
      setBackendNotifications(response.notifications);
      console.log('✅ [NOTIFICATION-CTX] Backend notifications refreshed:', response);
    } catch (error) {
      console.error('❌ [NOTIFICATION-CTX] Error refreshing backend notifications:', error);
    }
  }, [getSalonId]);

  const markBackendNotificationAsRead = useCallback(async (notificationId: number) => {
    const salonId = getSalonId();
    if (!salonId) return;
    
    try {
      console.log('📝 [NOTIFICATION-CTX] Marking backend notification as read:', notificationId);
      await backendNotificationService.markNotificationAsRead(salonId, notificationId);
      
      // Update local state
      setBackendNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      console.log('✅ [NOTIFICATION-CTX] Backend notification marked as read');
    } catch (error) {
      console.error('❌ [NOTIFICATION-CTX] Error marking backend notification as read:', error);
    }
  }, [getSalonId]);

  const markAllBackendNotificationsAsRead = useCallback(async () => {
    const salonId = getSalonId();
    if (!salonId) return;
    
    try {
      console.log('📝 [NOTIFICATION-CTX] Marking all backend notifications as read...');
      await backendNotificationService.markAllNotificationsAsRead(salonId);
      
      // Update local state
      setBackendNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      console.log('✅ [NOTIFICATION-CTX] All backend notifications marked as read');
    } catch (error) {
      console.error('❌ [NOTIFICATION-CTX] Error marking all backend notifications as read:', error);
    }
  }, [getSalonId]);

  // Load backend notifications on mount
  useEffect(() => {
    refreshBackendNotifications();
  }, [refreshBackendNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const backendUnreadCount = backendNotifications.filter(n => !n.isRead).length;
  const totalUnreadCount = unreadCount + backendUnreadCount;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        backendNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        unreadCount,
        backendUnreadCount,
        totalUnreadCount,
        refreshBackendNotifications,
        markBackendNotificationAsRead,
        markAllBackendNotificationsAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
