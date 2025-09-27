/**
 * Backend Notification Service
 * Handles communication with the backend notification API
 */

import { BackendNotificationResponse, MarkNotificationReadRequest } from '../types';

class BackendNotificationService {
  private baseUrl = import.meta.env.PROD ? 'https://salon.run.place:8090' : 'http://localhost:8090';

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get headers with authentication
   */
  private getHeaders(): HeadersInit {
    const authToken = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    };
  }

  /**
   * Get notifications for a salon
   */
  async getNotifications(salonId: number, page: number = 0, size: number = 20): Promise<BackendNotificationResponse> {
    try {
      console.log('📡 [NOTIFICATION-API] Fetching notifications:', { salonId, page, size });
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications?salonId=${salonId}&page=${page}&size=${size}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [NOTIFICATION-API] Notifications fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ [NOTIFICATION-API] Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(
    salonId: number, 
    request: MarkNotificationReadRequest
  ): Promise<void> {
    try {
      console.log('📡 [NOTIFICATION-API] Marking notifications as read:', { salonId, request });
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/mark-read?salonId=${salonId}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [NOTIFICATION-API] Notifications marked as read successfully');
    } catch (error) {
      console.error('❌ [NOTIFICATION-API] Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markNotificationAsRead(salonId: number, notificationId: number): Promise<void> {
    return this.markNotificationsAsRead(salonId, {
      notificationIds: [notificationId],
      markAllAsRead: false
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(salonId: number): Promise<void> {
    return this.markNotificationsAsRead(salonId, {
      markAllAsRead: true
    });
  }
}

export const backendNotificationService = new BackendNotificationService();