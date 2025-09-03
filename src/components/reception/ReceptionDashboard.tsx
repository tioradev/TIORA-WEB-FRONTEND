import React, { useState, useRef, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Users, Plus, Download, ChevronLeft, ChevronRight, X, CheckCircle, Star, Search, Loader, Wifi, WifiOff } from 'lucide-react';
import { mockBarbers } from '../../data/mockData';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationHelpers } from '../../utils/notificationHelpers';
import { apiService } from '../../services/api';
import StatsCard from '../shared/StatsCard';
import AppointmentCard from '../appointments/AppointmentCard';
import BookingModal from '../appointments/BookingModal';
import ProfileModal from '../shared/ProfileModal';

const ReceptionDashboard: React.FC = () => {
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
  
  // WebSocket state for real-time updates
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const { triggerReceptionNotification } = useNotificationHelpers();
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

  // Load appointments from API
  const loadAppointments = async () => {
    try {
      console.log('🔄 [LOAD] Starting loadAppointments...');
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
      
      // Load all appointments for the salon using the new endpoint
      const allAppointmentsData = await apiService.getAllAppointmentsForSalon(parseInt(salonId.toString()), branchId || undefined);
      
      console.log('✅ [RECEPTION DASHBOARD] Appointments loaded:', allAppointmentsData.length);
      
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

        // Extract time from appointmentDate
        const appointmentDateTime = new Date(apiAppointment.appointmentDate);
        const timeSlot = appointmentDateTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        return {
          id: apiAppointment.id.toString(),
          salonId: salonId.toString(),
          customerId: `customer_${apiAppointment.id}`,
          customerName: apiAppointment.customerName,
          customerPhone: apiAppointment.customerPhone,
          customerEmail: '',
          customerGender: undefined,
          barberId: `employee_${apiAppointment.id}`,
          barberName: apiAppointment.employeeName,
          serviceId: `service_${apiAppointment.id}`,
          serviceName: apiAppointment.serviceName,
          date: appointmentDateTime.toISOString().split('T')[0],
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
    }
  }, [employee?.salonId]);

  const [successMessage, setSuccessMessage] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [pendingPaymentsSearch, setPendingPaymentsSearch] = useState('');
  const [todayAppointmentsSearch, setTodayAppointmentsSearch] = useState('');
  const [allAppointmentsSearch, setAllAppointmentsSearch] = useState('');
  const [allAppointmentsDateFilter, setAllAppointmentsDateFilter] = useState('');
  const allAppointmentsScrollRef = useRef<HTMLDivElement>(null);
  const todayAppointmentsScrollRef = useRef<HTMLDivElement>(null);

  // Load today's appointments from API
  const loadTodayAppointments = async () => {
    try {
      console.log('🔄 [LOAD] Starting loadTodayAppointments...');
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) {
        console.error('❌ [LOAD] No salon ID found for today\'s appointments');
        return;
      }

      console.log('📅 [RECEPTION DASHBOARD] Loading today\'s appointments for salon:', salonId, 'branch:', branchId);
      
      const response = await apiService.getTodayAppointments(parseInt(salonId.toString()), branchId || undefined);
      console.log('📡 [RECEPTION DASHBOARD] Today\'s appointments response:', response);
      
      let appointmentsData: any[] = [];
      
      // Handle different response structures
      if (response && response.appointments) {
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
            barberId: `employee_${apiAppointment.id}`,
            barberName: apiAppointment.employeeName,
            serviceId: `service_${apiAppointment.id}`,
            serviceName: apiAppointment.serviceName,
            date: appointmentDateTime.toISOString().split('T')[0],
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

  // Load pending payments from API
  const loadPendingPayments = async () => {
    try {
      const salonId = getSalonId();
      const branchId = getBranchId();
      if (!salonId) return;

      console.log('💰 [RECEPTION DASHBOARD] Loading pending payments for salon:', salonId, 'branch:', branchId);
      
      const response = await apiService.getPendingPaymentAppointments(parseInt(salonId.toString()), branchId || undefined);
      console.log('📡 [RECEPTION DASHBOARD] Pending payments response:', response);
      
      let appointmentsData: any[] = [];
      
      // Handle different response structures
      if (response && response.appointments) {
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
        // Only include appointments with status COMPLETED and paymentStatus PENDING
        const filteredAppointments = appointmentsData.filter(
          (apiAppointment: any) =>
            apiAppointment.status === 'COMPLETED' &&
            apiAppointment.paymentStatus === 'PENDING'
        );

        const convertedAppointments = filteredAppointments.map((apiAppointment: any) => {
          const appointmentDateTime = new Date(apiAppointment.appointmentDate);
          const timeSlot = appointmentDateTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });

          return {
            id: apiAppointment.id.toString(),
            salonId: salonId.toString(),
            customerId: `customer_${apiAppointment.id}`,
            customerName: apiAppointment.customerName,
            customerPhone: apiAppointment.customerPhone,
            customerEmail: '',
            customerGender: undefined,
            barberId: `employee_${apiAppointment.id}`,
            barberName: apiAppointment.employeeName,
            serviceId: `service_${apiAppointment.id}`,
            serviceName: apiAppointment.serviceName,
            date: appointmentDateTime.toISOString().split('T')[0],
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
  
  // Function to refresh appointments without page reload
  const fetchAppointments = async () => {
    try {
      const salonId = getSalonId();
      const branchId = getBranchId();
      
      if (!salonId) {
        console.error('❌ [REFRESH] No salon ID found');
        return;
      }

      console.log('🔄 [REFRESH] Refreshing all appointments via WebSocket...');
      
      // Refresh all appointment lists to ensure data consistency
      await Promise.all([
        loadAppointments(),        // All appointments
        loadTodayAppointments(),   // Today's appointments  
        loadPendingPayments()      // Pending payments
      ]);
      
      console.log('✅ [REFRESH] All appointment lists refreshed via WebSocket');
    } catch (error) {
      console.error('❌ [REFRESH] Failed to refresh appointments:', error);
    }
  };

  // Function to update a specific appointment in the list (for future granular updates)
  const updateAppointmentInList = (updatedAppointment: Appointment) => {
    setAppointments(prevAppointments => 
      prevAppointments.map(appointment => 
        appointment.id === updatedAppointment.id 
          ? updatedAppointment 
          : appointment
      )
    );
    
    setTodayAppointments(prevTodayAppointments =>
      prevTodayAppointments.map(appointment =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment
      )
    );
    
    setPendingPayments(prevPendingPayments =>
      prevPendingPayments.map(appointment =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment
      )
    );
    
    console.log('✅ [REFRESH] Appointment updated in list:', updatedAppointment.id);
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
  
  // Calculate daily income from appointments with completed payments only
  const dailyIncomeFromPayments = [...appointments, ...todayAppointments]
    .filter((app, index, self) => self.findIndex(a => a.id === app.id) === index) // Remove duplicates
    .filter(app => app.paymentStatus === 'completed' && app.date === new Date().toISOString().split('T')[0])
    .reduce((sum, app) => sum + app.finalAmount, 0);

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

      const wsUrl = `ws://localhost:8090/ws/appointments/${salonId}`;
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

            // Show real-time notification and update data based on update type
            switch (update.type) {
              case 'APPOINTMENT_CREATED':
                console.log('🆕 [WEBSOCKET] New appointment created:', update.customerName);
                showSuccessMessage(`🆕 New appointment booked for ${update.customerName || 'customer'} at ${update.timeSlot || 'scheduled time'}!`);
                triggerReceptionNotification('appointmentConfirmed', update.customerName, update.timeSlot);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment creation...');
                fetchAppointments();
                loadTodayAppointments();
                break;
              case 'APPOINTMENT_UPDATED':
                console.log('📝 [WEBSOCKET] Appointment updated:', update.customerName);
                showSuccessMessage(`📝 Appointment updated for ${update.customerName || 'customer'}!`);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment update...');
                fetchAppointments();
                loadTodayAppointments();
                break;
              case 'APPOINTMENT_CANCELLED':
                console.log('❌ [WEBSOCKET] Appointment cancelled:', update.customerName);
                showSuccessMessage(`❌ Appointment cancelled for ${update.customerName || 'customer'}!`);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after appointment cancellation...');
                fetchAppointments();
                loadTodayAppointments();
                break;
              case 'PAYMENT_RECEIVED':
                console.log('💰 [WEBSOCKET] Payment received:', update.customerName);
                showSuccessMessage(`💰 Payment received from ${update.customerName || 'customer'}!`);
                triggerReceptionNotification('paymentReceived', update.customerName, update.timeSlot);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after payment received...');
                fetchAppointments();
                loadTodayAppointments();
                loadPendingPayments();
                break;
              case 'SESSION_COMPLETED':
                console.log('✅ [WEBSOCKET] Session completed:', update.customerName);
                showSuccessMessage(`✅ Session completed for ${update.customerName || 'customer'}!`);
                triggerReceptionNotification('sessionCompleted', update.customerName, update.timeSlot);
                // Use auto-refresh function instead of individual loads
                console.log('🔄 [WEBSOCKET] Auto-refreshing data after session completion...');
                fetchAppointments();
                break;
              case 'PAYMENT_CONFIRMED':
                console.log('💳 [WEBSOCKET] Payment confirmed:', update.customerName);
                showSuccessMessage(`💳 Payment confirmed for ${update.customerName || 'customer'}!`);
                triggerReceptionNotification('paymentReceived', update.customerName, update.timeSlot);
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
          }
        };

        socket.onerror = (error) => {
          console.error('❌ [WEBSOCKET] Connection error occurred:', error);
          console.error('❌ [WEBSOCKET] Make sure your Spring Boot backend is running on port 8090');
          setWsConnected(false);
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
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    } else {
      showSuccessMessage(`New appointment for ${bookingData.customerName} has been booked successfully!`);
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    }
    
    // WebSocket will automatically refresh the data when the backend broadcasts the update
    setEditingAppointment(null);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsBookingModalOpen(true);
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
        
        // The WebSocket will automatically refresh the data when the backend broadcasts the update
        console.log('🎯 [CANCEL] Waiting for WebSocket update...');
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
        triggerReceptionNotification('sessionCompleted', completeSessionModal.appointment.customerName, completeSessionModal.appointment.timeSlot);
        setCompleteSessionModal({isOpen: false, appointment: null});
        
        // The WebSocket will automatically refresh the data when the backend broadcasts the update
        console.log('🎯 [COMPLETE SESSION] Waiting for WebSocket update...');
      } catch (error) {
        console.error('❌ [COMPLETE SESSION] Error completing session:', error);
        showErrorMessage(`Failed to complete session for ${completeSessionModal.appointment.customerName}. Please try again.`);
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
        triggerReceptionNotification('paymentReceived', paymentConfirmModal.appointment.finalAmount, paymentConfirmModal.appointment.customerName);
        setPaymentConfirmModal({isOpen: false, appointment: null});
        
        // The WebSocket will automatically refresh the data when the backend broadcasts the update
        console.log('🎯 [PAYMENT] Waiting for WebSocket update...');
      } catch (error) {
        console.error('❌ [PAYMENT] Error confirming payment:', error);
        showErrorMessage(`Failed to confirm payment for ${paymentConfirmModal.appointment.customerName}. Please try again.`);
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
- Total Income from Completed Payments: Rs. ${dailyIncomeFromPayments.toFixed(2)}

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

  // Scroll functions for all appointments carousel
  const scrollAllAppointments = (direction: 'left' | 'right') => {
    if (allAppointmentsScrollRef.current) {
      const scrollAmount = 408; // Width of one card (384px/w-96) plus gap (24px)
      const currentScroll = allAppointmentsScrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      allAppointmentsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleProfileSave = (updatedProfile: any) => {
    // Profile updates should be handled through the AuthContext
    // For now, we'll just log the changes and show success message
    console.log('Reception profile updated:', updatedProfile);
    showSuccessMessage('Profile has been updated successfully!');
    triggerReceptionNotification('appointmentConfirmed', 'Profile updated successfully', '');
  };

  // Scroll functions for today's appointments carousel
  const scrollTodayAppointments = (direction: 'left' | 'right') => {
    if (todayAppointmentsScrollRef.current) {
      const scrollAmount = 408; // Width of one card (384px/w-96) plus gap (24px)
      const currentScroll = todayAppointmentsScrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      todayAppointmentsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-purple-600" />
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
          value={searchAppointments(todayAppointments, todayAppointmentsSearch).length}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Pending Payments"
          value={searchAppointments(pendingPayments, pendingPaymentsSearch).length}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Daily Income"
          value={`Rs. ${dailyIncomeFromPayments.toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
          subtitle="From completed payments"
        />
        <StatsCard
          title="Total Customers"
          value={searchAppointments(appointments, allAppointmentsSearch).filter(app => 
            allAppointmentsDateFilter ? app.date === allAppointmentsDateFilter : true
          ).length}
          icon={Users}
          color="purple"
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
              {filteredTodayAppointments.length > 3 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => scrollTodayAppointments('left')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollTodayAppointments('right')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div
              ref={todayAppointmentsScrollRef}
              className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
              style={{
                scrollbarWidth: 'thin',
                msOverflowStyle: 'auto',
              }}
            >
              {filteredTodayAppointments.map(appointment => (
                <div key={appointment.id} className="flex-none w-96">
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
                </div>
              ))}
            </div>
          </div>
          {filteredTodayAppointments.length === 0 && todayAppointmentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No appointments found for "{todayAppointmentsSearch}"
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
            {filteredAllAppointments.length > 3 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => scrollAllAppointments('left')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollAllAppointments('right')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div
            ref={allAppointmentsScrollRef}
            className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
            style={{
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto',
            }}
          >
            {filteredAllAppointments.map(appointment => (
              <div key={appointment.id} className="flex-none w-96">
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
              </div>
            ))}
          </div>
          
          {/* Fade effect on edges */}
          {filteredAllAppointments.length > 3 && (
            <>
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
            </>
          )}
        </div>
        {filteredAllAppointments.length === 0 && (allAppointmentsSearch || allAppointmentsDateFilter) && (
          <div className="text-center py-8 text-gray-500">
            No appointments found for the current search criteria
          </div>
        )}
        </div>
      </div>

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
          </>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;

