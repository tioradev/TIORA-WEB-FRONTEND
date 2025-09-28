import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    backendNotifications,
    markAsRead, 
    removeNotification, 
    markBackendNotificationAsRead,
    totalUnreadCount
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Convert backend notifications to unified format
  const unifiedNotifications = [
    // Local notifications
    ...notifications,
    // Backend notifications converted to unified format
    ...backendNotifications.map(bn => ({
      id: `backend-${bn.id}`,
      type: bn.type === 'APPOINTMENT_CREATED' ? 'info' as const :
            bn.type === 'PAYMENT_RECEIVED' ? 'success' as const :
            bn.type === 'LEAVE_REQUEST' ? 'warning' as const : 'info' as const,
      title: bn.title,
      message: bn.message,
      timestamp: new Date(bn.createdAt),
      read: bn.isRead,
      // Backend-specific fields
      backendId: bn.id,
      appointmentId: bn.appointmentId,
      customerName: bn.customerName,
      amount: bn.amount,
      sessionTime: bn.sessionTime
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleMarkAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (id.startsWith('backend-')) {
      // Handle backend notification
      const backendId = parseInt(id.replace('backend-', ''));
      markBackendNotificationAsRead(backendId);
    } else {
      // Handle local notification
      markAsRead(id);
    }
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (id.startsWith('backend-')) {
      // Backend notifications can't be deleted, only marked as read
      const backendId = parseInt(id.replace('backend-', ''));
      markBackendNotificationAsRead(backendId);
    } else {
      // Handle local notification deletion
      removeNotification(id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-gray-500 hover:text-gray-700 bg-gray-50/50 hover:bg-gray-100/70 rounded-2xl transition-all duration-300 border border-gray-200/50 hover:border-gray-300/50 transform hover:scale-105 shadow-sm hover:shadow-md group"
      >
        <Bell className="w-5 h-5 group-hover:animate-pulse" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg animate-pulse min-w-[20px]">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Enhanced Notification Panel */}
          <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    {totalUnreadCount > 0 && (
                      <p className="text-sm text-gray-500">{totalUnreadCount} unread</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {unifiedNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-400">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">When you get notifications, they'll show up here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/50">
                  {unifiedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 transition-all duration-200 cursor-pointer group ${
                        !notification.read ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/30 border-l-4 border-blue-400' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`p-2 rounded-xl ${
                            notification.type === 'success' ? 'bg-green-100' :
                            notification.type === 'warning' ? 'bg-yellow-100' :
                            notification.type === 'error' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-semibold leading-tight ${
                                !notification.read ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              {/* Show additional backend notification details */}
                              {notification.customerName && (
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                  {notification.customerName && (
                                    <span>Customer: {notification.customerName}</span>
                                  )}
                                  {notification.amount && (
                                    <span>Amount: Rs. {notification.amount}</span>
                                  )}
                                  {notification.sessionTime && (
                                    <span>Time: {new Date(notification.sessionTime).toLocaleString()}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-3">
                              <span className="text-xs text-gray-400 font-medium">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-100 transition-all duration-200"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-blue-600 font-medium ml-2">New</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {unifiedNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-white/30">
                <button
                  onClick={() => {
                    unifiedNotifications.forEach(n => {
                      if (!n.read) {
                        if (n.id.startsWith('backend-') && n.backendId) {
                          markBackendNotificationAsRead(n.backendId);
                        } else {
                          markAsRead(n.id);
                        }
                      }
                    });
                  }}
                  className="w-full text-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
