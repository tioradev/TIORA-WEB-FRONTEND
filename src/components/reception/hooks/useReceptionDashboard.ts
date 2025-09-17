import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotificationHelpers } from '../../../utils/notificationHelpers';
import { useToast } from '../../../contexts/ToastProvider';
import { useReceptionState } from './useReceptionState';
import { usePagination } from './usePagination';
import { useStatistics } from './useStatistics';
import { useWebSocket } from './useWebSocket';
import { ReceptionApiService } from '../services/receptionApiService';
import { WebSocketService, WebSocketHandlers } from '../services/webSocketService';
import { ReceptionUtils } from '../utils/receptionUtils';

// Main hook that combines all reception dashboard functionality
export const useReceptionDashboard = () => {
  // Refs to track initialization states
  const isInitializedRef = useRef(false);
  const isLoadingDataRef = useRef(false);
  
  // Get hooks
  const receptionState = useReceptionState();
  const pagination = usePagination();
  const statistics = useStatistics();
  const webSocket = useWebSocket();
  
  // Get contexts
  const { triggerReceptionNotification } = useNotificationHelpers();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const { isProfileModalOpen, closeProfileModal, user, employee, getSalonId, getBranchId } = useAuth();

  // Load notification count from API
  const loadNotificationCount = async () => {
    try {
      const salonId = getSalonId();
      if (!salonId) return;
      const count = await ReceptionApiService.loadNotificationCount(salonId);
      receptionState.setNotificationCount(count);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error loading notification count:', error);
    }
  };

  // Load all appointments from API with pagination
  const loadAppointments = async (page: number = 0, size: number = 9) => {
    // Prevent rapid successive calls
    if (isLoadingDataRef.current) {
      console.log('⚠️ [LOAD] Appointments already loading, skipping...');
      return;
    }
    
    try {
      isLoadingDataRef.current = true;
      receptionState.setLoading(true);
      receptionState.setError(null);
      
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) {
        console.error('❌ [LOAD] No salon ID found for appointments');
        return;
      }

      const result = await ReceptionApiService.loadAppointments(
        parseInt(salonId.toString()),
        branchId || undefined,
        page,
        size
      );

      // Update pagination metadata
      pagination.setAllAppointmentsPagination(result.pagination);

      // Convert API data to frontend format
      const appointmentsWithSalonId = result.appointments.map((apiAppointment: any) =>
        ReceptionApiService.convertApiAppointmentToFrontend(apiAppointment, salonId.toString())
      );

      receptionState.setAppointments(appointmentsWithSalonId);
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading appointments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load appointments';
      receptionState.setError(errorMessage);
      receptionState.setAppointments([]);
    } finally {
      receptionState.setLoading(false);
      isLoadingDataRef.current = false;
    }
  };

  // Load today's appointments from API with pagination
  const loadTodayAppointments = async (page: number = 0, size: number = 9) => {
    try {
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) {
        console.error('❌ [LOAD] No salon ID found for today\'s appointments');
        return;
      }

      const result = await ReceptionApiService.loadTodayAppointments(
        parseInt(salonId.toString()),
        branchId || undefined,
        page,
        size
      );

      // Update pagination metadata
      pagination.setTodayAppointmentsPagination(result.pagination);

      if (result.appointments.length > 0) {
        const convertedAppointments = result.appointments.map((apiAppointment: any) =>
          ReceptionApiService.convertApiAppointmentToFrontend(apiAppointment, salonId.toString())
        );

        console.log('✅ [RECEPTION DASHBOARD] Converted today\'s appointments:', convertedAppointments);
        receptionState.setTodayAppointments(convertedAppointments);
      } else {
        console.log('📅 [RECEPTION DASHBOARD] No today\'s appointments found');
        receptionState.setTodayAppointments([]);
      }
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading today\'s appointments:', error);
      receptionState.setTodayAppointments([]);
    }
  };

  // Load pending payments from API with pagination
  // API endpoint /pending-payments already returns only completed sessions awaiting payment
  const loadPendingPayments = async (page: number = 0, size: number = 9) => {
    try {
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) return;

      const result = await ReceptionApiService.loadPendingPayments(
        parseInt(salonId.toString()),
        branchId || undefined,
        page,
        size
      );

      // Update pagination metadata
      pagination.setPendingPaymentsPagination(result.pagination);

      if (result.appointments.length > 0) {
        const convertedAppointments = result.appointments.map((apiAppointment: any) =>
          ReceptionApiService.convertApiAppointmentToFrontend(apiAppointment, salonId.toString())
        );

        console.log('✅ [RECEPTION DASHBOARD] Converted pending payments from API:', convertedAppointments);
        receptionState.setPendingPayments(convertedAppointments);
      } else {
        console.log('💰 [RECEPTION DASHBOARD] No pending payments returned from API');
        receptionState.setPendingPayments([]);
      }
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading pending payments:', error);
      receptionState.setPendingPayments([]);
    }
  };

  // Load total statistics
  const loadTotalStatistics = async () => {
    try {
      console.log('📊 [STATS] Loading total statistics...');
      statistics.setTotalStatistics(prev => ({ ...prev, loading: true }));

      const salonId = getSalonId();
      if (!salonId) {
        console.error('❌ [STATS] No salon ID found');
        return;
      }

      const stats = await ReceptionApiService.loadTotalStatistics(parseInt(salonId.toString()));
      statistics.setTotalStatistics(stats);
    } catch (error) {
      console.error('❌ [STATS] Error loading total statistics:', error);
      statistics.setTotalStatistics(prev => ({ ...prev, loading: false }));
    }
  };

  // Function to refresh appointments without page reload
  const fetchAppointments = async () => {
    try {
      const salonId = getSalonId();

      if (!salonId) {
        console.error('❌ [REFRESH] No salon ID found');
        return;
      }

      console.log('🔄 [REFRESH] Refreshing all appointments via WebSocket...');

      // Refresh all appointment lists to ensure data consistency - use current page numbers
      await Promise.all([
        loadAppointments(pagination.allAppointmentsPagination.currentPage, pagination.allAppointmentsPagination.size),
        loadTodayAppointments(pagination.todayAppointmentsPagination.currentPage, pagination.todayAppointmentsPagination.size),
        loadPendingPayments(pagination.pendingPaymentsPagination.currentPage, pagination.pendingPaymentsPagination.size)
      ]);

      console.log('✅ [REFRESH] All appointment lists refreshed via WebSocket');
    } catch (error) {
      console.error('❌ [REFRESH] Failed to refresh appointments:', error);
    }
  };

  // Function to refresh all appointment lists
  const refreshAllAppointments = async () => {
    console.log('🔄 [REFRESH] Refreshing all appointment lists...');
    try {
      // Refresh all three types of appointments and statistics
      await Promise.all([
        loadAppointments(pagination.allAppointmentsPagination.currentPage),
        loadTodayAppointments(pagination.todayAppointmentsPagination.currentPage),
        loadPendingPayments(pagination.pendingPaymentsPagination.currentPage),
        loadTotalStatistics()
      ]);
      console.log('✅ [REFRESH] All appointment lists and statistics refreshed successfully');
    } catch (error) {
      console.error('❌ [REFRESH] Error refreshing appointment lists:', error);
    }
  };

  // Load appointments on component mount and when user data changes
  useEffect(() => {
    const salonId = getSalonId();
    if (salonId && (employee?.salonId || user?.id) && !isInitializedRef.current) {
      console.log('🚀 [DASHBOARD] Initial data load triggered');
      isInitializedRef.current = true;
      loadAppointments();
      loadTodayAppointments();
      loadPendingPayments();
      loadTotalStatistics();
    }
  }, [employee?.salonId, user?.id]); // Add user?.id to ensure we have authenticated user

  // Initialize WebSocket connection - run once on mount with better dependency control
  useEffect(() => {
    const salonId = getSalonId();
    if (!salonId || !user?.id) {
      console.log('🔌 [WEBSOCKET] Skipping WebSocket init - missing salonId or user');
      return;
    }

    // Prevent multiple initializations by checking if already connected
    if (webSocket.wsRef.current && webSocket.wsConnected) {
      console.log('🔌 [WEBSOCKET] Already connected, skipping initialization');
      return;
    }

    const wsHandlers: WebSocketHandlers = {
      showSuccess,
      showError,
      showInfo,
      showWarning,
      showSuccessMessage: (message: string) => 
        ReceptionUtils.showSuccessMessage(message, receptionState.setSuccessMessage),
      triggerReceptionNotification: (type: string, name: string, timeOrAmount: string | number) =>
        triggerReceptionNotification(type as any, name, timeOrAmount),
      fetchAppointments,
      loadTodayAppointments,
      loadTotalStatistics,
      loadNotificationCount,
    };

    console.log('🚀 [WEBSOCKET] Initializing WebSocket connection...');
    WebSocketService.initWebSocket(salonId, webSocket.wsRef, webSocket.setWsConnected, wsHandlers);

    // Cleanup on unmount
    return () => {
      if (webSocket.wsRef.current) {
        console.log('🧹 [WEBSOCKET] Cleaning up WebSocket connection');
        webSocket.wsRef.current.close();
        webSocket.wsRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user?.id to prevent multiple initializations

  // Create user profile from real employee data
  const userProfile = ReceptionUtils.createUserProfile(user, employee);

  return {
    // State
    ...receptionState,
    ...pagination,
    ...statistics,
    ...webSocket,
    
    // Contexts
    isProfileModalOpen,
    closeProfileModal,
    user,
    employee,
    getSalonId,
    getBranchId,
    triggerReceptionNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    
    // Data loading functions
    loadNotificationCount,
    loadAppointments,
    loadTodayAppointments,
    loadPendingPayments,
    loadTotalStatistics,
    fetchAppointments,
    refreshAllAppointments,
    
    // User profile
    userProfile,
    
    // Utilities
    showSuccessMessage: (message: string) => 
      ReceptionUtils.showSuccessMessage(message, receptionState.setSuccessMessage),
    showErrorMessage: ReceptionUtils.showErrorMessage,
    searchAppointments: ReceptionUtils.searchAppointments,
    downloadReport: () => ReceptionUtils.downloadReport(receptionState.todayAppointments, statistics.totalStatistics),
  };
};
