import React, { useState, useRef, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Users, Plus, Download, X, CheckCircle, Star, Search, Loader2, Wifi, WifiOff } from 'lucide-react';
import { mockBarbers } from '../../data/mockData';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationHelpers } from '../../utils/notificationHelpers';
import { useToast } from '../../contexts/ToastProvider';
import { apiService } from '../../services/api';
import { getCurrentConfig } from '../../config/environment';
import StatsCard from '../shared/StatsCard';
import AppointmentCard from '../appointments/AppointmentCard';
import BookingModal from '../appointments/BookingModal';
import ProfileModal from '../shared/ProfileModal';

const ReceptionDashboard: React.FC = () => {
  // Notification count state
  const [notificationCount, setNotificationCount] = useState(0);
  // Load notification count from API (replace with your actual API logic)
  const loadNotificationCount = async () => {
    try {
      // Example: Replace with your actual API call
      const salonId = getSalonId();
      if (!salonId) return;
      const count = await apiService.getNotificationCount?.(parseInt(salonId.toString()));
      if (typeof count === 'number') setNotificationCount(count);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error loading notification count:', error);
    }
  };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  const [completeSessionModal, setCompleteSessionModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  const [cancelAppointmentModal, setCancelAppointmentModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  
  // Pagination state for different appointment types
  const [allAppointmentsPagination, setAllAppointmentsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 9
  });
  const [todayAppointmentsPagination, setTodayAppointmentsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 9
  });
  const [pendingPaymentsPagination, setPendingPaymentsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 9
  });
  
  // Total statistics state (not affected by pagination)
  const [totalStatistics, setTotalStatistics] = useState({
    totalCustomers: 0,
    totalTodayAppointments: 0,
    totalPendingPayments: 0,
    totalDailyIncome: 0,
    loading: true
  });
  
  // WebSocket state for real-time updates
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const { triggerReceptionNotification } = useNotificationHelpers();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const { isProfileModalOpen, closeProfileModal, user, employee, getSalonId, getBranchId } = useAuth();

  // Manual reconnection function for the retry button
  const handleRetryConnection = () => {
    console.log('🔄 [WEBSOCKET] Manual retry requested');
    window.location.reload(); // Simple approach - reload the page to restart WebSocket
  };

  // Create user profile from real employee data instead of mock data
  const userProfile = {
    id: user?.id || '',
    name: employee?.fullName || user?.name || '',
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || user?.email || '',
    phone: employee?.phoneNumber || '',
    role: 'reception' as const,
    avatar: employee?.profileImageUrl || user?.profilePicture || '',
    // Employee specific fields
    employeeId: employee?.employeeId?.toString() || '',
    dateOfBirth: employee?.dateOfBirth || '',
    gender: employee?.gender || 'OTHER',
    address: employee?.address || '',
    city: employee?.city || '',
    hireDate: employee?.hireDate || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
    emergencyRelationship: employee?.emergencyRelationship || '',
    specializations: employee?.specializations || [],
    experience: employee?.experience || '',
    experienceYears: employee?.experienceYears || 0,
    baseSalary: employee?.baseSalary || 0,
    ratings: employee?.ratings || 0,
    // Salon specific fields  
    salonName: employee?.salonName || '',
    salonId: employee?.salonId?.toString() || '',
    branchId: employee?.branchId?.toString() || '',
    // Additional fields
    notes: employee?.notes || '',
    profileImageUrl: employee?.profileImageUrl || ''
  };

  // Load all appointments from API with pagination
  const loadAppointments = async (page: number = 0, size: number = 9) => {
    try {
      console.log('🔄 [LOAD] Starting loadAppointments with pagination...', { page, size });
      setLoading(true);
      setError(null);
      
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) {
        console.error('❌ [LOAD] No salon ID found');
        setError('Salon ID not found. Please ensure you are logged in.');
        return;
      }

      console.log('📅 [RECEPTION DASHBOARD] Loading appointments for salon:', salonId, 'branch:', branchId);
      
      // Load all appointments for the salon using the new endpoint with pagination
      const response = await apiService.getAllAppointmentsForSalon(
        parseInt(salonId.toString()), 
        branchId || undefined, 
        page, 
        size, 
        'createdAt', 
        'asc'
      );
      
      console.log('📡 [RECEPTION DASHBOARD] All appointments response:', response);
      console.log('📡 [RECEPTION DASHBOARD] Response type:', typeof response);
      console.log('📡 [RECEPTION DASHBOARD] Is Array:', Array.isArray(response));
      if (response && typeof response === 'object') {
        console.log('📡 [RECEPTION DASHBOARD] Response keys:', Object.keys(response));
        console.log('📡 [RECEPTION DASHBOARD] Response.content:', response.content);
        console.log('📡 [RECEPTION DASHBOARD] Response.total_elements:', response.total_elements);
        console.log('📡 [RECEPTION DASHBOARD] Response.total_pages:', response.total_pages);
        console.log('📡 [RECEPTION DASHBOARD] Response.page:', response.page);
      }
      
      // Extract data and pagination from response
      let allAppointmentsData: any[] = [];
      let totalElements = 0;
      let totalPages = 0;
      let currentPage = 0;
      
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // Handle Spring Boot paginated response structure
        if (Array.isArray(response.content)) {
          allAppointmentsData = response.content;
          // Handle both camelCase and snake_case property names from backend
          totalElements = response.total_elements || response.totalElements || 0;
          totalPages = response.total_pages || response.totalPages || Math.ceil(totalElements / size);
          currentPage = response.page !== undefined ? response.page : (response.number || 0);
        } else if (Array.isArray(response.appointments)) {
          allAppointmentsData = response.appointments;
          totalElements = response.total_elements || response.totalElements || response.appointments.length;
          totalPages = response.total_pages || response.totalPages || Math.ceil(totalElements / size);
          currentPage = response.page !== undefined ? response.page : (response.number || 0);
        }
      } else if (Array.isArray(response)) {
        // Direct array response (fallback)
        allAppointmentsData = response;
        totalElements = response.length;
        totalPages = 1;
        currentPage = 0;
      }
      
      console.log('✅ [RECEPTION DASHBOARD] Appointments loaded:', allAppointmentsData.length, 'total:', totalElements, 'pages:', totalPages, 'current page:', currentPage);
      
      // Update pagination metadata with correct values from API response
      setAllAppointmentsPagination({
        currentPage: currentPage,
        totalPages: totalPages,
        totalElements: totalElements,
        size: size
      });
      
      // Convert API data to frontend format
      const appointmentsWithSalonId = allAppointmentsData.map(apiAppointment => {
        // Map API status to frontend status
        const mapStatus = (apiStatus: string, apiPaymentStatus: string): 'booked' | 'in-progress' | 'completed' | 'payment-pending' | 'paid' | 'cancelled' | 'no-show' => {
          switch (apiStatus) {
            case 'SCHEDULED':
              return 'booked';
            case 'COMPLETED':
              // Show as 'paid' if paymentStatus is PAID or COMPLETED
              if (apiPaymentStatus === 'PAID' || apiPaymentStatus === 'COMPLETED') {
                return 'paid';
              } else if (apiPaymentStatus === 'PENDING' || apiPaymentStatus === 'PARTIAL') {
                return 'payment-pending';
              } else {
                return 'completed';
              }
            case 'CANCELLED':
              return 'cancelled';
            case 'NO_SHOW':
              return 'no-show';
            default:
              return 'booked';
          }
        };

        // Map API payment status to frontend payment status
        const mapPaymentStatus = (apiPaymentStatus: string): 'pending' | 'completed' | 'refunded' => {
          switch (apiPaymentStatus) {
            case 'COMPLETED':
              return 'completed';
            case 'PENDING':
            case 'PARTIAL':
              return 'pending';
            default:
              return 'pending';
          }
        };

        // Extract time from appointmentDate - fix timezone issue
        const appointmentDateTime = new Date(apiAppointment.appointmentDate);
        const timeSlot = appointmentDateTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        // Fix date display issue by using local date instead of UTC
        const appointmentDate = new Date(apiAppointment.appointmentDate);
        const localDateString = appointmentDate.getFullYear() + '-' + 
                               String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(appointmentDate.getDate()).padStart(2, '0');

        return {
          id: apiAppointment.id.toString(),
          salonId: salonId.toString(),
          customerId: `customer_${apiAppointment.id}`,
          customerName: apiAppointment.customerName,
          customerPhone: apiAppointment.customerPhone,
          customerEmail: '',
          customerGender: undefined,
          barberId: apiAppointment.employeeId ? apiAppointment.employeeId.toString() : `employee_${apiAppointment.id}`,
          barberName: apiAppointment.employeeName,
          serviceId: apiAppointment.serviceId ? apiAppointment.serviceId.toString() : `service_${apiAppointment.id}`,
          serviceName: apiAppointment.serviceName,
          // Store original API IDs for editing appointments
          originalEmployeeId: apiAppointment.employeeId,
          originalServiceId: apiAppointment.serviceId,
          date: localDateString,
          timeSlot: timeSlot,
          status: mapStatus(apiAppointment.status, apiAppointment.paymentStatus),
          paymentStatus: mapPaymentStatus(apiAppointment.paymentStatus),
          paymentMethod: undefined,
          amount: apiAppointment.servicePrice,
          discountAmount: apiAppointment.discountAmount || 0,
          finalAmount: apiAppointment.totalAmount,
          tipAmount: 0,
          notes: '',
          createdAt: new Date(apiAppointment.createdAt),
          updatedAt: new Date(apiAppointment.updatedAt),
        };
      });
      
      setAppointments(appointmentsWithSalonId);
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading appointments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load appointments';
      setError(errorMessage);
      
      // Fall back to empty array instead of mock data
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount and when user data changes
  useEffect(() => {
    if (employee?.salonId || getSalonId()) {
      loadAppointments();
      loadTodayAppointments();
      loadPendingPayments();
      loadTotalStatistics();
    }
  }, [employee?.salonId]);

  const [successMessage, setSuccessMessage] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [pendingPaymentsSearch, setPendingPaymentsSearch] = useState('');
  const [todayAppointmentsSearch, setTodayAppointmentsSearch] = useState('');
  const [allAppointmentsSearch, setAllAppointmentsSearch] = useState('');
  const [allAppointmentsDateFilter, setAllAppointmentsDateFilter] = useState('');

  // Load today's appointments from API with pagination
  const loadTodayAppointments = async (page: number = 0, size: number = 9) => {
    try {
      console.log('🔄 [LOAD] Starting loadTodayAppointments with pagination...', { page, size });
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) {
        console.error('❌ [LOAD] No salon ID found for today\'s appointments');
        return;
      }

      console.log('📅 [RECEPTION DASHBOARD] Loading today\'s appointments for salon:', salonId, 'branch:', branchId);
      
      const response = await apiService.getTodayAppointments(
        parseInt(salonId.toString()), 
        branchId || undefined, 
        page, 
        size, 
        'appointmentDate', 
        'asc'
      );
      console.log('📡 [RECEPTION DASHBOARD] Today\'s appointments response:', response);
      
      // Update pagination metadata using snake_case property names from API
      setTodayAppointmentsPagination({
        currentPage: response.page !== undefined ? response.page : (response.number || page),
        totalPages: response.total_pages || response.totalPages || Math.ceil((response.total_elements || response.totalElements || 0) / size),
        totalElements: response.total_elements || response.totalElements || 0,
        size: size
      });
      
      let appointmentsData: any[] = [];
      
      // Handle different response structures (Spring Boot pagination)
      if (response && response.content) {
        appointmentsData = response.content;
      } else if (response && response.appointments) {
        appointmentsData = response.appointments;
      } else if (Array.isArray(response)) {
        appointmentsData = response as any[];
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        appointmentsData = (response as any).data;
      } else {
        console.warn('📅 [RECEPTION DASHBOARD] No appointments found in response structure');
        setTodayAppointments([]);
        return;
      }

      console.log('📅 [RECEPTION DASHBOARD] Processing today\'s appointments:', appointmentsData.length);
      
      if (appointmentsData.length > 0) {
        const convertedAppointments = appointmentsData.map((apiAppointment: any) => {
          const appointmentDateTime = new Date(apiAppointment.appointmentDate);
          const timeSlot = appointmentDateTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });

          // Fix date display issue by using local date instead of UTC
          const appointmentDate = new Date(apiAppointment.appointmentDate);
          const localDateString = appointmentDate.getFullYear() + '-' + 
                                 String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                 String(appointmentDate.getDate()).padStart(2, '0');

          // Map status for today's appointments
          let status: 'booked' | 'in-progress' | 'completed' | 'payment-pending' | 'paid' | 'cancelled' | 'no-show';
          if (apiAppointment.status === 'SCHEDULED') {
            status = 'booked';
          } else if (apiAppointment.status === 'COMPLETED') {
            if (apiAppointment.paymentStatus === 'PAID' || apiAppointment.paymentStatus === 'COMPLETED') {
              status = 'paid';
            } else if (apiAppointment.paymentStatus === 'PENDING' || apiAppointment.paymentStatus === 'PARTIAL') {
              status = 'payment-pending';
            } else {
              status = 'completed';
            }
          } else if (apiAppointment.status === 'CANCELLED') {
            status = 'cancelled';
          } else if (apiAppointment.status === 'NO_SHOW') {
            status = 'no-show';
          } else {
            status = 'booked';
          }

          // Map payment status
          let paymentStatus: 'pending' | 'completed' | 'refunded';
          if (apiAppointment.paymentStatus === 'COMPLETED' || apiAppointment.paymentStatus === 'PAID') {
            paymentStatus = 'completed';
          } else if (apiAppointment.paymentStatus === 'PENDING' || apiAppointment.paymentStatus === 'PARTIAL') {
            paymentStatus = 'pending';
          } else {
            paymentStatus = 'pending';
          }

          return {
            id: apiAppointment.id.toString(),
            salonId: salonId.toString(),
            customerId: `customer_${apiAppointment.id}`,
            customerName: apiAppointment.customerName,
            customerPhone: apiAppointment.customerPhone,
            customerEmail: '',
            customerGender: undefined,
            barberId: apiAppointment.employeeId ? apiAppointment.employeeId.toString() : `employee_${apiAppointment.id}`,
            barberName: apiAppointment.employeeName,
            serviceId: apiAppointment.serviceId ? apiAppointment.serviceId.toString() : `service_${apiAppointment.id}`,
            serviceName: apiAppointment.serviceName,
            // Store original API IDs for editing appointments
            originalEmployeeId: apiAppointment.employeeId,
            originalServiceId: apiAppointment.serviceId,
            date: localDateString,
            timeSlot: timeSlot,
            status,
            paymentStatus,
            paymentMethod: undefined,
            amount: apiAppointment.servicePrice,
            discountAmount: apiAppointment.discountAmount || 0,
            finalAmount: apiAppointment.totalAmount,
            tipAmount: 0,
            notes: '',
            createdAt: new Date(apiAppointment.createdAt),
            updatedAt: new Date(apiAppointment.updatedAt),
          };
        });
        
        console.log('✅ [RECEPTION DASHBOARD] Converted today\'s appointments:', convertedAppointments);
        setTodayAppointments(convertedAppointments);
      } else {
        console.log('📅 [RECEPTION DASHBOARD] No today\'s appointments found');
        setTodayAppointments([]);
      }
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading today\'s appointments:', error);
      setTodayAppointments([]);
    }
  };

  // Load pending payments from API with pagination
  const loadPendingPayments = async (page: number = 0, size: number = 9) => {
    try {
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) return;

      console.log('💰 [RECEPTION DASHBOARD] Loading pending payments with pagination...', { page, size, salonId, branchId });
      
      const response = await apiService.getPendingPaymentAppointments(
        parseInt(salonId.toString()), 
        branchId || undefined, 
        page, 
        size, 
        'totalAmount', 
        'desc'
      );
      console.log('📡 [RECEPTION DASHBOARD] Pending payments response:', response);
      
      // Update pagination metadata using snake_case property names from API
      setPendingPaymentsPagination({
        currentPage: response.page !== undefined ? response.page : (response.number || page),
        totalPages: response.total_pages || response.totalPages || Math.ceil((response.total_elements || response.totalElements || 0) / size),
        totalElements: response.total_elements || response.totalElements || 0,
        size: size
      });
      
      let appointmentsData: any[] = [];
      
      // Handle different response structures (Spring Boot pagination)
      if (response && response.content) {
        appointmentsData = response.content;
      } else if (response && response.appointments) {
        appointmentsData = response.appointments;
      } else if (Array.isArray(response)) {
        appointmentsData = response as any[];
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        appointmentsData = (response as any).data;
      } else {
        console.warn('💰 [RECEPTION DASHBOARD] No pending payments found in response structure');
        setPendingPayments([]);
        return;
      }

      console.log('💰 [RECEPTION DASHBOARD] Processing pending payments:', appointmentsData.length);
      
      if (appointmentsData.length > 0) {
        // Include appointments with paymentStatus PENDING (regardless of appointment status)
        // This shows all appointments that need payment
        const filteredAppointments = appointmentsData.filter(
          (apiAppointment: any) => apiAppointment.paymentStatus === 'PENDING'
        );

        console.log('💰 [RECEPTION DASHBOARD] Filtered pending payments:', filteredAppointments.length, 'out of', appointmentsData.length);
        
        const convertedAppointments = filteredAppointments.map((apiAppointment: any) => {
          const appointmentDateTime = new Date(apiAppointment.appointmentDate);
          const timeSlot = appointmentDateTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });

          // Fix timezone-aware date formatting to prevent 1-day offset
          const appointmentDate = new Date(apiAppointment.appointmentDate);
          const formattedDate = appointmentDate.getFullYear() + '-' + 
                               String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(appointmentDate.getDate()).padStart(2, '0');

          return {
            id: apiAppointment.id.toString(),
            salonId: salonId.toString(),
            customerId: `customer_${apiAppointment.id}`,
            customerName: apiAppointment.customerName,
            customerPhone: apiAppointment.customerPhone,
            customerEmail: '',
            customerGender: undefined,
            barberId: apiAppointment.employeeId ? apiAppointment.employeeId.toString() : `employee_${apiAppointment.id}`,
            barberName: apiAppointment.employeeName,
            serviceId: apiAppointment.serviceId ? apiAppointment.serviceId.toString() : `service_${apiAppointment.id}`,
            serviceName: apiAppointment.serviceName,
            // Store original API IDs for editing appointments
            originalEmployeeId: apiAppointment.employeeId,
            originalServiceId: apiAppointment.serviceId,
            date: formattedDate,
            timeSlot: timeSlot,
            status: 'payment-pending' as const,
            paymentStatus: 'pending' as const,
            paymentMethod: undefined,
            amount: apiAppointment.servicePrice,
            discountAmount: apiAppointment.discountAmount || 0,
            finalAmount: apiAppointment.totalAmount,
            tipAmount: 0,
            notes: '',
            createdAt: new Date(apiAppointment.createdAt),
            updatedAt: new Date(apiAppointment.updatedAt),
          };
        });
        
        console.log('✅ [RECEPTION DASHBOARD] Converted pending payments:', convertedAppointments);
        setPendingPayments(convertedAppointments);
      } else {
        console.log('💰 [RECEPTION DASHBOARD] No pending payments found');
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading pending payments:', error);
      setPendingPayments([]);
    }
  };
  
  // Function to load total statistics (independent of pagination)
  const loadTotalStatistics = async () => {
    try {
      console.log('📊 [STATS] Loading total statistics...');
      setTotalStatistics(prev => ({ ...prev, loading: true }));
      
      const salonId = getSalonId();
      if (!salonId) {
        console.error('❌ [STATS] No salon ID found');
        return;
      }

      // Load statistics with large page size to get accurate totals
      const [allAppointmentsData, todayAppointmentsData, pendingPaymentsData] = await Promise.all([
        apiService.getAllAppointmentsForSalon(parseInt(salonId.toString()), undefined, 0, 1000, 'createdAt', 'asc'),
        apiService.getTodayAppointments(parseInt(salonId.toString()), undefined, 0, 1000, 'appointmentDate', 'asc'),
        apiService.getPendingPaymentAppointments(parseInt(salonId.toString()), undefined, 0, 1000, 'appointmentDate', 'desc')
      ]);

      // Handle different response structures for statistics
      let allAppointmentsForStats: any[] = [];
      if (Array.isArray(allAppointmentsData)) {
        allAppointmentsForStats = allAppointmentsData;
      } else if (allAppointmentsData && (allAppointmentsData as any).appointments) {
        allAppointmentsForStats = (allAppointmentsData as any).appointments;
      } else if (allAppointmentsData && (allAppointmentsData as any).content) {
        allAppointmentsForStats = (allAppointmentsData as any).content;
      }

      // Calculate total customers (unique customers from all appointments)
      const uniqueCustomers = new Set();
      allAppointmentsForStats.forEach((appointment: any) => {
        if (appointment.customerPhone) {
          uniqueCustomers.add(appointment.customerPhone);
        }
      });

      // Handle pending payments data structure
      let pendingPaymentsForStats: any[] = [];
      if (Array.isArray(pendingPaymentsData)) {
        pendingPaymentsForStats = pendingPaymentsData;
      } else if (pendingPaymentsData && (pendingPaymentsData as any).appointments) {
        pendingPaymentsForStats = (pendingPaymentsData as any).appointments;
      } else if (pendingPaymentsData && (pendingPaymentsData as any).content) {
        pendingPaymentsForStats = (pendingPaymentsData as any).content;
      }

      // Calculate daily income from pending payments that are actually completed
      const completedPayments = pendingPaymentsForStats.filter((appointment: any) => 
        appointment.status === 'COMPLETED' && appointment.paymentStatus === 'PAID'
      );
      const totalDailyIncome = completedPayments.reduce((sum: number, appointment: any) => 
        sum + (appointment.totalAmount || 0), 0
      );

      // Handle today's appointments data structure
      let todayAppointmentsForStats: any[] = [];
      if (Array.isArray(todayAppointmentsData)) {
        todayAppointmentsForStats = todayAppointmentsData;
      } else if (todayAppointmentsData && (todayAppointmentsData as any).appointments) {
        todayAppointmentsForStats = (todayAppointmentsData as any).appointments;
      } else if (todayAppointmentsData && (todayAppointmentsData as any).content) {
        todayAppointmentsForStats = (todayAppointmentsData as any).content;
      }
      
      // Calculate pending payments count (completed but not paid)
      const actualPendingPayments = pendingPaymentsForStats.filter((appointment: any) => 
        appointment.status === 'COMPLETED' && appointment.paymentStatus === 'PENDING'
      );

      setTotalStatistics({
        totalCustomers: uniqueCustomers.size,
        totalTodayAppointments: todayAppointmentsForStats.length,
        totalPendingPayments: actualPendingPayments.length,
        totalDailyIncome: totalDailyIncome,
        loading: false
      });

      console.log('✅ [STATS] Total statistics loaded:', {
        totalCustomers: uniqueCustomers.size,
        totalTodayAppointments: todayAppointmentsForStats.length,
        totalPendingPayments: actualPendingPayments.length,
        totalDailyIncome: totalDailyIncome
      });

    } catch (error) {
      console.error('❌ [STATS] Error loading total statistics:', error);
      setTotalStatistics(prev => ({ ...prev, loading: false }));
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
        loadAppointments(allAppointmentsPagination.currentPage, allAppointmentsPagination.size),
        loadTodayAppointments(todayAppointmentsPagination.currentPage, todayAppointmentsPagination.size),   
        loadPendingPayments(pendingPaymentsPagination.currentPage, pendingPaymentsPagination.size)
      ]);
      
      console.log('✅ [REFRESH] All appointment lists refreshed via WebSocket');
    } catch (error) {
      console.error('❌ [REFRESH] Failed to refresh appointments:', error);
    }
  };

  // Pagination handlers
  const handleAllAppointmentsPageChange = (newPage: number) => {
    console.log('🔄 [PAGINATION] All Appointments page change requested:', newPage);
    console.log('📊 [PAGINATION] Current pagination state:', allAppointmentsPagination);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < allAppointmentsPagination.totalPages) {
      console.log('✅ [PAGINATION] Loading page:', newPage);
      loadAppointments(newPage, allAppointmentsPagination.size);
    // } else {
    //   console.log('⚠️ [PAGINATION] Page change blocked - out of bounds');
    // }
  };

  const handleTodayAppointmentsPageChange = (newPage: number) => {
    console.log('🔄 [PAGINATION] Today\'s Appointments page change requested:', newPage);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < todayAppointmentsPagination.totalPages) {
      loadTodayAppointments(newPage, todayAppointmentsPagination.size);
    // }
  };

  const handlePendingPaymentsPageChange = (newPage: number) => {
    console.log('🔄 [PAGINATION] Pending Payments page change requested:', newPage);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < pendingPaymentsPagination.totalPages) {
      loadPendingPayments(newPage, pendingPaymentsPagination.size);
    // }
  };
  
  // Search function for appointments
  const searchAppointments = (appointments: Appointment[], searchTerm: string) => {
    if (!searchTerm.trim()) return appointments;
    const searchLower = searchTerm.toLowerCase();
    return appointments.filter(app => 
      app.customerName.toLowerCase().includes(searchLower) ||
      app.customerPhone.toLowerCase().includes(searchLower)
    );
  };

  // Filtered appointments based on search
  const filteredPendingPayments = searchAppointments(pendingPayments, pendingPaymentsSearch);
  const filteredTodayAppointments = searchAppointments(todayAppointments, todayAppointmentsSearch);
  
  // All appointments with search and date filtering
  let filteredAllAppointments = searchAppointments(appointments, allAppointmentsSearch);
  if (allAppointmentsDateFilter) {
    filteredAllAppointments = filteredAllAppointments.filter(app => app.date === allAppointmentsDateFilter);
  }
  
  // Function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage({show: true, message});
    setTimeout(() => {
      setSuccessMessage({show: false, message: ''});
    }, 3000); // Hide after 3 seconds
  };

  const showErrorMessage = (message: string) => {
    // You can implement error state here or use a toast library
    console.error('❌ [ERROR]', message);
    alert(message); // Simple alert for now, can be replaced with better UI
  };

  // Initialize WebSocket connection - run once on mount
  useEffect(() => {
    const initWebSocket = () => {
      const salonId = getSalonId();
      if (!salonId) {
        console.warn('🔌 [WEBSOCKET] No salon ID available for WebSocket connection');
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        console.log('� [WEBSOCKET] Closing existing connection...');
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
          reconnectAttemptsRef.current = 0;
          console.log('🎯 [WEBSOCKET] Ready to receive real-time updates');
          // Show toast notification for successful connection
          showSuccess('Real-time Updates Active', 'Connected to live appointment updates');
        };

        socket.onmessage = (event) => {
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

            // Show real-time notification and update data based on update type
            switch (update.type) {
              case 'APPOINTMENT_CREATED': {
                const appointment = update.appointment_data || {};
                console.log('🆕 [WEBSOCKET] New appointment created:', appointment);
                const customerName = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
                const timeSlot = appointment.timeSlot || appointment.time_slot || appointment.appointmentTime || appointment.appointment_time || appointment.appointmentDate || appointment.appointment_date || appointment.scheduled_time || 'scheduled time';
                console.log('🔍 [WEBSOCKET] Customer name resolved to:', customerName);
                console.log('🔍 [WEBSOCKET] Time slot resolved to:', timeSlot);
                showSuccessMessage(`🆕 New appointment booked for ${customerName} at ${timeSlot}!`);
                showSuccess('New Appointment!', `${customerName} booked for ${timeSlot}`);
                triggerReceptionNotification('appointmentConfirmed', customerName, timeSlot);
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment creation...');
                fetchAppointments();
                loadTodayAppointments();
                loadTotalStatistics();
                loadNotificationCount();
                break;
              }
              case 'APPOINTMENT_UPDATED': {
                const appointment = update.appointment_data || {};
                console.log('📝 [WEBSOCKET] Appointment updated:', appointment);
                const updatedCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
                showSuccessMessage(`📝 Appointment updated for ${updatedCustomer}!`);
                showInfo('Appointment Updated', `${updatedCustomer}'s appointment has been modified`);
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment update...');
                fetchAppointments();
                loadTodayAppointments();
                loadTotalStatistics();
                loadNotificationCount();
                break;
              }
              case 'APPOINTMENT_CANCELLED': {
                const appointment = update.appointment_data || {};
                console.log('❌ [WEBSOCKET] Appointment cancelled:', appointment);
                const cancelledCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
                showSuccessMessage(`❌ Appointment cancelled for ${cancelledCustomer}!`);
                showWarning('Appointment Cancelled', `${cancelledCustomer}'s appointment has been cancelled`);
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment cancellation...');
                fetchAppointments();
                loadTodayAppointments();
                loadTotalStatistics();
                loadNotificationCount();
                break;
              }
              case 'PAYMENT_RECEIVED': {
                const appointment = update.appointment_data || {};
                console.log('💰 [WEBSOCKET] Payment received:', appointment);
                const paymentCustomer = appointment.customerName || appointment.customer_name || appointment.name || 'customer';
                showSuccessMessage(`💰 Payment received from ${paymentCustomer}!`);
                showSuccess('Payment Received', `Received payment from ${paymentCustomer}`);
                triggerReceptionNotification('paymentReceived', appointment.amount || 0, paymentCustomer);
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after payment received...');
                fetchAppointments();
                loadTodayAppointments();
                loadTotalStatistics();
                loadNotificationCount();
                break;
              }
                loadTodayAppointments();
                loadPendingPayments();
                break;
              case 'SESSION_COMPLETED':
                console.log('✅ [WEBSOCKET] Session completed:', update);
                const sessionCustomer = update.customerName || update.customer_name || update.name || 'customer';
                const sessionTime = update.timeSlot || update.time_slot || update.appointmentTime || update.scheduled_time || 'scheduled time';
                showSuccessMessage(`✅ Session completed for ${sessionCustomer}!`);
                // Show toast notification
                showSuccess('Session Complete', `${sessionCustomer}'s appointment is finished`);
                triggerReceptionNotification('sessionCompleted', sessionCustomer, sessionTime);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after session completion...');
                fetchAppointments();
                break;
              case 'PAYMENT_CONFIRMED':
                console.log('💳 [WEBSOCKET] Payment confirmed:', update);
                const confirmedCustomer = update.customerName || update.customer_name || update.name || 'customer';
                showSuccessMessage(`💳 Payment confirmed for ${confirmedCustomer}!`);
                // Show toast notification
                showSuccess('Payment Confirmed', `Payment confirmed for ${confirmedCustomer}`);
                triggerReceptionNotification('paymentReceived', update.amount || 0, confirmedCustomer);
                // Use auto-refresh function to update all lists
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after payment confirmation...');
                fetchAppointments();
                break;
              default:
                console.log('📨 [WEBSOCKET] Unknown update type:', update.type);
            }

            console.log('✅ [WEBSOCKET] Real-time update processed successfully');
          } catch (error) {
            console.error('❌ [WEBSOCKET] Error parsing message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('🔌 [WEBSOCKET] Connection closed. Code:', event.code, 'Reason:', event.reason);
          setWsConnected(false);
          wsRef.current = null;

          // Don't auto-reconnect to prevent loops
          if (event.code !== 1000) {
            console.log('🔄 [WEBSOCKET] Connection closed unexpectedly. Manual reconnection may be needed.');
            // Show toast notification for connection loss
            showWarning('Connection Lost', 'Real-time updates disconnected. Check your connection.');
          }
        };

        socket.onerror = (error) => {
          console.error('❌ [WEBSOCKET] Connection error occurred:', error);
          console.error('❌ [WEBSOCKET] Make sure your Spring Boot backend is running on port 8090');
          setWsConnected(false);
          // Show toast notification for connection error
          showError('Connection Error', 'Failed to connect to real-time updates');
        };

      } catch (error) {
        console.error('❌ [WEBSOCKET] Failed to create WebSocket connection:', error);
        setWsConnected(false);
      }
    };

    console.log('🚀 [WEBSOCKET] Initializing WebSocket connection...');
    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        console.log('🧹 [WEBSOCKET] Cleaning up WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array - run only once on mount

  const handleBookAppointment = (bookingData: any) => {
    if (editingAppointment) {
      showSuccessMessage(`Appointment for ${bookingData.customerName} has been updated successfully!`);
      // Show toast notification for editing
      showSuccess('Appointment Updated', `${bookingData.customerName}'s appointment updated successfully`);
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    } else {
      showSuccessMessage(`New appointment for ${bookingData.customerName} has been booked successfully!`);
      // Show toast notification for new booking
      showSuccess('Appointment Booked', `${bookingData.customerName} scheduled for ${bookingData.time}`);
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    }
    
    // WebSocket will automatically refresh the data when the backend broadcasts the update
    setEditingAppointment(null);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsBookingModalOpen(true);
  };

  // Function to refresh all appointment lists
  const refreshAllAppointments = async () => {
    console.log('🔄 [REFRESH] Refreshing all appointment lists...');
    try {
      // Refresh all three types of appointments and statistics
      await Promise.all([
        loadAppointments(allAppointmentsPagination.currentPage),
        loadTodayAppointments(todayAppointmentsPagination.currentPage),
        loadPendingPayments(pendingPaymentsPagination.currentPage),
        loadTotalStatistics()
      ]);
      console.log('✅ [REFRESH] All appointment lists and statistics refreshed successfully');
    } catch (error) {
      console.error('❌ [REFRESH] Error refreshing appointment lists:', error);
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setCancelAppointmentModal({isOpen: true, appointment});
    }
  };

  const confirmCancelAppointment = async () => {
    if (cancelAppointmentModal.appointment) {
      try {
        console.log('🔄 [CANCEL] Starting appointment cancellation for appointment:', cancelAppointmentModal.appointment.id);
        
        // Call API to cancel the appointment
        await apiService.cancelAppointment(
          parseInt(cancelAppointmentModal.appointment.id), 
          {
            userRole: 'RECEPTION',
            reason: 'Cancelled by reception'
          }
        );
        
        console.log('✅ [CANCEL] Appointment cancelled successfully via API');
        showSuccessMessage(`Appointment for ${cancelAppointmentModal.appointment.customerName} has been cancelled successfully!`);
        setCancelAppointmentModal({isOpen: false, appointment: null});
        
        // Refresh all appointment lists after cancellation
        console.log('🔄 [CANCEL] Refreshing appointment lists...');
        await refreshAllAppointments();
        
        console.log('🎯 [CANCEL] Appointment lists refreshed successfully');
      } catch (error) {
        console.error('❌ [CANCEL] Error cancelling appointment:', error);
        showErrorMessage(`Failed to cancel appointment for ${cancelAppointmentModal.appointment.customerName}. Please try again.`);
      }
    }
  };

  const handleAssignBarber = (appointmentId: string, barberId: string) => {
    const barber = mockBarbers.find(b => b.id === barberId);
    if (barber) {
      const allAppointmentsList = [...appointments, ...todayAppointments, ...pendingPayments];
      const appointment = allAppointmentsList.find(app => app.id === appointmentId);
      
      // Update the appointment in the appropriate state array
      setAppointments(appointments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      setTodayAppointments(todayAppointments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      setPendingPayments(pendingPayments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      
      if (appointment) {
        showSuccessMessage(`${barber.firstName} ${barber.lastName} has been assigned to ${appointment.customerName}'s appointment!`);
        triggerReceptionNotification('appointmentConfirmed', `Barber assigned to ${appointment.customerName}`, '');
      }
    }
  };

  const handleMarkPaid = (appointmentId: string) => {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setPaymentConfirmModal({isOpen: true, appointment});
    }
  };

  const handleCompleteSession = (appointmentId: string) => {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setCompleteSessionModal({isOpen: true, appointment});
    }
  };

  const confirmCompleteSession = async () => {
    if (completeSessionModal.appointment) {
      try {
        console.log('🔄 [COMPLETE SESSION] Starting session completion for appointment:', completeSessionModal.appointment.id);
        
        // Call API to complete the session
        await apiService.completeSession(
          parseInt(completeSessionModal.appointment.id), 
          'RECEPTION' // userRole
        );
        
        console.log('✅ [COMPLETE SESSION] Session completed successfully via API');
        showSuccessMessage(`Session for ${completeSessionModal.appointment.customerName} has been completed successfully!`);
        // Show toast notification for session completion
        showSuccess('Session Complete', `${completeSessionModal.appointment.customerName}'s appointment finished`);
        triggerReceptionNotification('sessionCompleted', completeSessionModal.appointment.customerName, completeSessionModal.appointment.timeSlot);
        setCompleteSessionModal({isOpen: false, appointment: null});
        
        // Refresh all appointment lists after session completion
        console.log('🔄 [COMPLETE SESSION] Refreshing appointment lists...');
        await refreshAllAppointments();
        
        console.log('🎯 [COMPLETE SESSION] Appointment lists refreshed successfully');
      } catch (error) {
        console.error('❌ [COMPLETE SESSION] Error completing session:', error);
        showErrorMessage(`Failed to complete session for ${completeSessionModal.appointment.customerName}. Please try again.`);
        // Show toast notification for session completion error
        showError('Session Error', `Failed to complete session for ${completeSessionModal.appointment.customerName}`);
      }
    }
  };

  const confirmPaymentReceived = async () => {
    if (paymentConfirmModal.appointment) {
      try {
        console.log('🔄 [PAYMENT] Starting payment confirmation for appointment:', paymentConfirmModal.appointment.id);
        
        // Call API to confirm payment
        await apiService.confirmAppointmentPayment(
          parseInt(paymentConfirmModal.appointment.id), 
          'RECEPTION' // userRole
        );
        
        console.log('✅ [PAYMENT] Payment confirmed successfully via API');
        showSuccessMessage(`Payment of LKR ${paymentConfirmModal.appointment.finalAmount} from ${paymentConfirmModal.appointment.customerName} has been received successfully!`);
        // Show toast notification for payment confirmation
        showSuccess('Payment Received', `LKR ${paymentConfirmModal.appointment.finalAmount} received from ${paymentConfirmModal.appointment.customerName}`);
        triggerReceptionNotification('paymentReceived', paymentConfirmModal.appointment.finalAmount, paymentConfirmModal.appointment.customerName);
        setPaymentConfirmModal({isOpen: false, appointment: null});
        
        // Refresh all appointment lists after payment confirmation
        console.log('🔄 [PAYMENT] Refreshing appointment lists...');
        await refreshAllAppointments();
        
        console.log('🎯 [PAYMENT] Appointment lists refreshed successfully');
      } catch (error) {
        console.error('❌ [PAYMENT] Error confirming payment:', error);
        showErrorMessage(`Failed to confirm payment for ${paymentConfirmModal.appointment.customerName}. Please try again.`);
        // Show toast notification for payment error
        showError('Payment Error', `Failed to confirm payment for ${paymentConfirmModal.appointment.customerName}`);
      }
    }
  };

  const downloadReport = () => {
    // Create PDF report content
    const reportContent = `
DAILY RECEPTION REPORT
Date: ${new Date().toLocaleDateString()}

TODAY'S APPOINTMENTS: ${todayAppointments.length}

PAYMENT STATUS:
- Completed Payments: ${[...appointments, ...todayAppointments].filter((app, index, self) => self.findIndex(a => a.id === app.id) === index).filter(app => app.paymentStatus === 'completed' && app.date === new Date().toISOString().split('T')[0]).length}
- Pending Payments: ${pendingPayments.length}
- Total Income from Completed Payments: Rs. ${totalStatistics.totalDailyIncome.toFixed(2)}

APPOINTMENT DETAILS:
${todayAppointments.map(app => 
  `- ${app.customerName} | ${app.serviceName} | ${app.timeSlot} | ${app.status} | Rs. ${app.finalAmount}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `.trim();
    
    // Create a simple text-based PDF content
    const blob = new Blob([reportContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reception-report-${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleProfileSave = (updatedProfile: any) => {
    // Profile updates should be handled through the AuthContext
    // For now, we'll just log the changes and show success message
    console.log('Reception profile updated:', updatedProfile);
    showSuccessMessage('Profile has been updated successfully!');
    triggerReceptionNotification('appointmentConfirmed', 'Profile updated successfully', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600 font-medium">Loading appointments...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">Data will automatically refresh once the connection is restored.</p>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Success Message */}
            {successMessage.show && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 transform transition-all duration-300 ease-in-out max-w-md">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{successMessage.message}</span>
                <button
                  onClick={() => setSuccessMessage({show: false, message: ''})}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, Reception! 👋
                  </h1>
                  <p className="text-gray-600">Manage appointments and customer services efficiently</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* WebSocket Status Indicator */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                    {wsConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Live Updates</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Connecting...</span>
                        <button
                          onClick={handleRetryConnection}
                          className="text-xs text-blue-600 hover:text-blue-700 ml-2 underline"
                          title="Reconnect to live updates"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

        <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Appointments"
          value={totalStatistics.totalTodayAppointments}
          icon={Calendar}
          color="blue"
          loading={totalStatistics.loading}
        />
        <StatsCard
          title="Pending Payments"
          value={totalStatistics.totalPendingPayments}
          icon={Clock}
          color="amber"
          loading={totalStatistics.loading}
        />
        <StatsCard
          title="Daily Income"
          value={`Rs. ${totalStatistics.totalDailyIncome.toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
          subtitle="From completed payments"
          loading={totalStatistics.loading}
        />
        <StatsCard
          title="Total Customers"
          value={totalStatistics.totalCustomers}
          icon={Users}
          color="purple"
          loading={totalStatistics.loading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Book Appointment</span>
        </button>
        <button
          onClick={downloadReport}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <Download className="w-5 h-5" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={pendingPaymentsSearch}
                onChange={(e) => setPendingPaymentsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPendingPayments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onMarkPaid={handleMarkPaid}
                onDelete={handleDeleteAppointment}
                onAssignBarber={handleAssignBarber}
                showActions={true}
                userRole="reception"
              />
            ))}
          </div>
          {filteredPendingPayments.length === 0 && pendingPaymentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No pending payments found for "{pendingPaymentsSearch}"
            </div>
          )}
          
          {/* Pagination for Pending Payments */}
          {pendingPaymentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <p className="text-sm text-gray-600">
                Showing {(pendingPaymentsPagination.currentPage * pendingPaymentsPagination.size) + 1} to {Math.min((pendingPaymentsPagination.currentPage + 1) * pendingPaymentsPagination.size, pendingPaymentsPagination.totalElements)} of {pendingPaymentsPagination.totalElements} payments
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePendingPaymentsPageChange(pendingPaymentsPagination.currentPage - 1)}
                  disabled={pendingPaymentsPagination.currentPage <= 0}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({length: Math.min(5, pendingPaymentsPagination.totalPages)}, (_, index) => {
                  const page = pendingPaymentsPagination.currentPage <= 2 
                    ? index 
                    : pendingPaymentsPagination.currentPage + index - 2;
                  
                  if (page >= pendingPaymentsPagination.totalPages || page < 0) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePendingPaymentsPageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        pendingPaymentsPagination.currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePendingPaymentsPageChange(pendingPaymentsPagination.currentPage + 1)}
                  disabled={pendingPaymentsPagination.currentPage >= pendingPaymentsPagination.totalPages - 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Appointments Section */}
      {todayAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredTodayAppointments.length} appointments
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={todayAppointmentsSearch}
                  onChange={(e) => setTodayAppointmentsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTodayAppointments.map(appointment => (
              <AppointmentCard
                appointment={appointment}
                onEdit={handleEditAppointment}
                onMarkPaid={handleMarkPaid}
                onCompleteSession={handleCompleteSession}
                onDelete={handleDeleteAppointment}
                onAssignBarber={handleAssignBarber}
                showActions={true}
                userRole="reception"
              />
            ))}
          </div>
          {filteredTodayAppointments.length === 0 && todayAppointmentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No appointments found for "{todayAppointmentsSearch}"
            </div>
          )}
          
          {/* Pagination for Today's Appointments */}
          {todayAppointmentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <p className="text-sm text-gray-600">
                Showing {(todayAppointmentsPagination.currentPage * todayAppointmentsPagination.size) + 1} to {Math.min((todayAppointmentsPagination.currentPage + 1) * todayAppointmentsPagination.size, todayAppointmentsPagination.totalElements)} of {todayAppointmentsPagination.totalElements} appointments
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTodayAppointmentsPageChange(todayAppointmentsPagination.currentPage - 1)}
                  disabled={todayAppointmentsPagination.currentPage <= 0}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({length: Math.min(5, todayAppointmentsPagination.totalPages)}, (_, index) => {
                  const page = todayAppointmentsPagination.currentPage <= 2 
                    ? index 
                    : todayAppointmentsPagination.currentPage + index - 2;
                  
                  if (page >= todayAppointmentsPagination.totalPages || page < 0) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handleTodayAppointmentsPageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        todayAppointmentsPagination.currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handleTodayAppointmentsPageChange(todayAppointmentsPagination.currentPage + 1)}
                  disabled={todayAppointmentsPagination.currentPage >= todayAppointmentsPagination.totalPages - 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={allAppointmentsSearch}
                onChange={(e) => setAllAppointmentsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={allAppointmentsDateFilter}
                onChange={(e) => setAllAppointmentsDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44"
              />
            </div>
            {allAppointmentsDateFilter && (
              <button
                onClick={() => setAllAppointmentsDateFilter('')}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAllAppointments.map(appointment => (
            <AppointmentCard
              appointment={appointment}
              onEdit={handleEditAppointment}
              onMarkPaid={handleMarkPaid}
              onCompleteSession={handleCompleteSession}
              onDelete={handleDeleteAppointment}
              onAssignBarber={handleAssignBarber}
              showActions={true}
              userRole="reception"
            />
          ))}
        </div>
        {filteredAllAppointments.length === 0 && (allAppointmentsSearch || allAppointmentsDateFilter) && (
          <div className="text-center py-8 text-gray-500">
            No appointments found for the current search criteria
          </div>
        )}
        
        {/* Pagination for All Appointments */}
        {allAppointmentsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <p className="text-sm text-gray-600">
              Showing {(allAppointmentsPagination.currentPage * allAppointmentsPagination.size) + 1} to {Math.min((allAppointmentsPagination.currentPage + 1) * allAppointmentsPagination.size, allAppointmentsPagination.totalElements)} of {allAppointmentsPagination.totalElements} appointments
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAllAppointmentsPageChange(allAppointmentsPagination.currentPage - 1)}
                disabled={allAppointmentsPagination.currentPage <= 0}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({length: Math.min(5, allAppointmentsPagination.totalPages)}, (_, index) => {
                const page = allAppointmentsPagination.currentPage <= 2 
                  ? index 
                  : allAppointmentsPagination.currentPage + index - 2;
                
                if (page >= allAppointmentsPagination.totalPages || page < 0) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handleAllAppointmentsPageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      allAppointmentsPagination.currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handleAllAppointmentsPageChange(allAppointmentsPagination.currentPage + 1)}
                disabled={allAppointmentsPagination.currentPage >= allAppointmentsPagination.totalPages - 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </div>
        </div>
        </>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingAppointment(null);
        }}
        onBook={handleBookAppointment}
        editingAppointment={editingAppointment}
        userRole="reception"
      />

      {/* Payment Confirmation Modal */}
      {paymentConfirmModal.isOpen && paymentConfirmModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment Received</h2>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to mark the payment as received for{' '}
                <span className="font-semibold text-gray-900">{paymentConfirmModal.appointment.customerName}</span>?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-gray-900">LKR {paymentConfirmModal.appointment.finalAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{paymentConfirmModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-gray-900">{paymentConfirmModal.appointment.date} at {paymentConfirmModal.appointment.timeSlot}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setPaymentConfirmModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPaymentReceived}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Confirmation Modal */}
      {completeSessionModal.isOpen && completeSessionModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Session</h2>
              
              <p className="text-gray-600 mb-6">
                You are going to complete the barber session for{' '}
                <span className="font-semibold text-gray-900">{completeSessionModal.appointment.customerName}</span>
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Barber:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.barberName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.timeSlot}</span>
                </div>
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-200">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-600">Mark session as completed</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCompleteSessionModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button
                  onClick={confirmCompleteSession}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Confirmation Modal */}
      {cancelAppointmentModal.isOpen && cancelAppointmentModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment</h2>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel the appointment for{' '}
                <span className="font-semibold text-gray-900">{cancelAppointmentModal.appointment.customerName}</span>?
                <br />
                <span className="text-sm text-gray-500 mt-1 block">Only booked appointments can be cancelled.</span>
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{cancelAppointmentModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-gray-900">{cancelAppointmentModal.appointment.date} at {cancelAppointmentModal.appointment.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900">LKR {cancelAppointmentModal.appointment.finalAmount}</span>
                </div>
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-red-200">
                  <X className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-600 font-medium">This action cannot be undone</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCancelAppointmentModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white p-8 rounded-lg">
            <h2>Test Modal</h2>
            <p>If you can see this, the modal system is working</p>
            <button 
              onClick={closeProfileModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          console.log('Closing profile modal');
          closeProfileModal();
        }}
        profile={userProfile}
        onSave={handleProfileSave}
        userRole="reception"
      />
      </div>
    </div>
  );
};

export default ReceptionDashboard;

