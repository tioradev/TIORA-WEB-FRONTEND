import { MutableRefObject } from 'react';
import { getCurrentConfig } from '../../../config/environment';

export interface WebSocketHandlers {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showSuccessMessage: (message: string) => void;
  triggerReceptionNotification: (type: string, name: string, timeOrAmount: string | number) => void;
  fetchAppointments: () => Promise<void>;
  loadTodayAppointments: () => Promise<void>;
  loadTotalStatistics: () => Promise<void>;
  loadNotificationCount: () => Promise<void>;
}

export class WebSocketService {
  private static refreshTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Debounced refresh to prevent rapid successive calls
  private static debouncedRefresh(key: string, refreshFn: () => Promise<void>, delay: number = 1000) {
    // Clear existing timeout for this key
    if (this.refreshTimeouts.has(key)) {
      clearTimeout(this.refreshTimeouts.get(key)!);
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        await refreshFn();
        this.refreshTimeouts.delete(key);
      } catch (error) {
        console.error(`❌ [WEBSOCKET] Error in debounced refresh for ${key}:`, error);
        this.refreshTimeouts.delete(key);
      }
    }, delay);
    
    this.refreshTimeouts.set(key, timeout);
  }
  
  static initWebSocket(
    salonId: string | number,
    wsRef: MutableRefObject<WebSocket | null>,
    setWsConnected: (connected: boolean) => void,
    handlers: WebSocketHandlers
  ) {
    if (!salonId) {
      console.warn('🔌 [WEBSOCKET] No salon ID available for WebSocket connection');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      console.log('🔌 [WEBSOCKET] Closing existing connection...');
      wsRef.current.close();
    }

    const wsUrl = `${getCurrentConfig().WS_BASE_URL}/appointments/${salonId}`;
    console.log('🔌 [WEBSOCKET] Attempting connection to:', wsUrl);
    console.log('🔌 [WEBSOCKET] Salon ID:', salonId);

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('✅ [WEBSOCKET] Successfully connected to appointment updates!');
        setWsConnected(true);
        wsRef.current = socket;
        console.log('🎯 [WEBSOCKET] Ready to receive real-time updates');
        handlers.showSuccess('Real-time Updates Active', 'Connected to live appointment updates');
      };

      socket.onmessage = (event) => {
        this.handleWebSocketMessage(event, handlers);
      };

      socket.onclose = (event) => {
        console.log('🔌 [WEBSOCKET] Connection closed. Code:', event.code, 'Reason:', event.reason);
        setWsConnected(false);
        wsRef.current = null;

        if (event.code !== 1000) {
          console.log('🔄 [WEBSOCKET] Connection closed unexpectedly. Manual reconnection may be needed.');
          handlers.showWarning('Connection Lost', 'Real-time updates disconnected. Check your connection.');
        }
      };

      socket.onerror = (error) => {
        console.error('❌ [WEBSOCKET] Connection error occurred:', error);
        console.error('❌ [WEBSOCKET] Make sure your Spring Boot backend is running on port 8090');
        setWsConnected(false);
        handlers.showError('Connection Error', 'Failed to connect to real-time updates');
      };

    } catch (error) {
      console.error('❌ [WEBSOCKET] Failed to create WebSocket connection:', error);
      setWsConnected(false);
    }
  }

  private static handleWebSocketMessage(event: MessageEvent, handlers: WebSocketHandlers) {
    // Skip heartbeat messages before attempting JSON parsing
    if (event.data === 'heartbeat' || event.data === 'ping' || event.data === 'pong') {
      console.log('💓 [WEBSOCKET] Received heartbeat message, skipping...');
      return;
    }

    try {
      const update = JSON.parse(event.data);
      console.log('📨 [WEBSOCKET] Received update:', update);
      console.log('📨 [WEBSOCKET] Available properties:', Object.keys(update || {}));

      // Ensure we have a valid update object
      if (!update || typeof update !== 'object') {
        console.warn('⚠️ [WEBSOCKET] Invalid update object received:', update);
        return;
      }

      // Skip welcome/heartbeat messages that shouldn't trigger refreshes
      if (update.type === 'HEARTBEAT' || 
          (update.type === 'APPOINTMENT_UPDATED' && update.appointment_data === 'Welcome to real-time appointment updates')) {
        console.log('📨 [WEBSOCKET] Skipping heartbeat/welcome message:', update.type);
        return;
      }

      // Show real-time notification and update data based on update type
      switch (update.type) {
        case 'APPOINTMENT_CREATED': {
          const appointment = update.appointment_data || {};
          console.log('🆕 [WEBSOCKET] New appointment created:', appointment);
          const customerName = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
          const timeSlot = appointment.timeSlot || appointment.time_slot || appointment.appointmentTime || appointment.appointment_time || appointment.appointmentDate || appointment.appointment_date || appointment.scheduled_time || 'scheduled time';
          console.log('🔍 [WEBSOCKET] Customer name resolved to:', customerName);
          console.log('🔍 [WEBSOCKET] Time slot resolved to:', timeSlot);
          handlers.showSuccessMessage(`🆕 New appointment booked for ${customerName} at ${timeSlot}!`);
          handlers.showSuccess('New Appointment!', `${customerName} booked for ${timeSlot}`);
          handlers.triggerReceptionNotification('appointmentConfirmed', customerName, timeSlot);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment creation...');
          this.debouncedRefresh('appointment-created', async () => {
            await handlers.fetchAppointments();
            await handlers.loadTodayAppointments();
            await handlers.loadTotalStatistics();
            await handlers.loadNotificationCount();
          });
          break;
        }
        case 'APPOINTMENT_UPDATED': {
          const appointment = update.appointment_data || {};
          console.log('📝 [WEBSOCKET] Appointment updated:', appointment);
          const updatedCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
          handlers.showSuccessMessage(`📝 Appointment updated for ${updatedCustomer}!`);
          handlers.showInfo('Appointment Updated', `${updatedCustomer}'s appointment has been modified`);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment update...');
          this.debouncedRefresh('appointment-updated', async () => {
            await handlers.fetchAppointments();
            await handlers.loadTodayAppointments();
            await handlers.loadTotalStatistics();
            await handlers.loadNotificationCount();
          });
          break;
        }
        case 'APPOINTMENT_CANCELLED': {
          const appointment = update.appointment_data || {};
          console.log('❌ [WEBSOCKET] Appointment cancelled:', appointment);
          const cancelledCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
          handlers.showSuccessMessage(`❌ Appointment cancelled for ${cancelledCustomer}!`);
          handlers.showWarning('Appointment Cancelled', `${cancelledCustomer}'s appointment has been cancelled`);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment cancellation...');
          this.debouncedRefresh('appointment-cancelled', async () => {
            await handlers.fetchAppointments();
            await handlers.loadTodayAppointments();
            await handlers.loadTotalStatistics();
            await handlers.loadNotificationCount();
          });
          break;
        }
        case 'PAYMENT_RECEIVED': {
          const appointment = update.appointment_data || {};
          console.log('💰 [WEBSOCKET] Payment received:', appointment);
          const paymentCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
          handlers.showSuccessMessage(`💰 Payment received from ${paymentCustomer}!`);
          handlers.showSuccess('Payment Received', `Received payment from ${paymentCustomer}`);
          handlers.triggerReceptionNotification('paymentReceived', appointment.amount || 0, paymentCustomer);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after payment received...');
          this.debouncedRefresh('payment-received', async () => {
            await handlers.fetchAppointments();
            await handlers.loadTodayAppointments();
            await handlers.loadTotalStatistics();
            await handlers.loadNotificationCount();
          });
          break;
        }
        case 'SESSION_COMPLETED':
          console.log('✅ [WEBSOCKET] Session completed:', update);
          const sessionCustomer = update.customerName || update.customer_name || update.name || 'customer';
          const sessionTime = update.timeSlot || update.time_slot || update.appointmentTime || update.scheduled_time || 'scheduled time';
          handlers.showSuccessMessage(`✅ Session completed for ${sessionCustomer}!`);
          handlers.showSuccess('Session Complete', `${sessionCustomer}'s appointment is finished`);
          handlers.triggerReceptionNotification('sessionCompleted', sessionCustomer, sessionTime);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after session completion...');
          this.debouncedRefresh('session-completed', () => handlers.fetchAppointments());
          break;
        case 'PAYMENT_CONFIRMED':
          console.log('💳 [WEBSOCKET] Payment confirmed:', update);
          const confirmedCustomer = update.customerName || update.customer_name || update.name || 'customer';
          handlers.showSuccessMessage(`💳 Payment confirmed for ${confirmedCustomer}!`);
          handlers.showSuccess('Payment Confirmed', `Payment confirmed for ${confirmedCustomer}`);
          handlers.triggerReceptionNotification('paymentReceived', update.amount || 0, confirmedCustomer);
          console.log('🔄 [WEBSOCKET] Auto-refreshing data after payment confirmation...');
          this.debouncedRefresh('payment-confirmed', () => handlers.fetchAppointments());
          break;
        default:
          console.log('📨 [WEBSOCKET] Unknown update type:', update.type);
      }

      console.log('✅ [WEBSOCKET] Real-time update processed successfully');
    } catch (error) {
      console.error('❌ [WEBSOCKET] Error parsing message:', error);
    }
  }
}
