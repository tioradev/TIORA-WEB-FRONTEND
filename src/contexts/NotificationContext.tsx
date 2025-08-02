import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Welcome!',
      message: 'Welcome to Salon Manager. Your workspace is ready.',
      timestamp: new Date(Date.now() - 30000),
      read: false
    },
    {
      id: '2',
      type: 'success',
      title: 'Appointment Confirmed',
      message: 'John Doe\'s appointment has been confirmed for 2:00 PM.',
      timestamp: new Date(Date.now() - 300000),
      read: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Inventory Alert',
      message: 'Hair shampoo stock is running low. Only 3 bottles remaining.',
      timestamp: new Date(Date.now() - 600000),
      read: false
    },
    {
      id: '4',
      type: 'success',
      title: 'Monthly Revenue Target',
      message: 'Congratulations! You\'ve achieved 95% of monthly revenue target.',
      timestamp: new Date(Date.now() - 900000),
      read: false
    },
    {
      id: '5',
      type: 'info',
      title: 'Staff Schedule Update',
      message: 'Sarah Johnson has requested a schedule change for next week.',
      timestamp: new Date(Date.now() - 1200000),
      read: true
    },
    {
      id: '6',
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment processing failed for customer Emma Wilson. Please retry.',
      timestamp: new Date(Date.now() - 1800000),
      read: false
    },
    {
      id: '7',
      type: 'success',
      title: 'New Customer Registration',
      message: '5 new customers registered this week. Great job team!',
      timestamp: new Date(Date.now() - 2400000),
      read: true
    },
    {
      id: '8',
      type: 'warning',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance tonight from 2:00 AM to 4:00 AM.',
      timestamp: new Date(Date.now() - 3600000),
      read: false
    }
  ]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
