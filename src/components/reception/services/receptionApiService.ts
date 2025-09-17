import { apiService } from '../../../services/api';
import { Appointment } from '../../../types';

// Reception-specific API service functions
export class ReceptionApiService {
  
  // Load notification count from API
  static async loadNotificationCount(salonId: string | number): Promise<number> {
    try {
      const count = await apiService.getNotificationCount?.(parseInt(salonId.toString()));
      return typeof count === 'number' ? count : 0;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error loading notification count:', error);
      return 0;
    }
  }

  // Load all appointments from API with pagination
  static async loadAppointments(
    salonId: number,
    branchId?: number,
    page: number = 0,
    size: number = 9
  ) {
    try {
      console.log('🔄 [LOAD] Starting loadAppointments with pagination...', { page, size });
      
      const response = await apiService.getAllAppointmentsForSalon(
        salonId,
        branchId,
        page,
        size,
        'createdAt',
        'asc'
      );

      console.log('📡 [RECEPTION DASHBOARD] All appointments response:', response);

      // Extract data and pagination from response
      let allAppointmentsData: any[] = [];
      let totalElements = 0;
      let totalPages = 0;
      let currentPage = 0;

      if (response && typeof response === 'object' && !Array.isArray(response)) {
        if (response.content && Array.isArray(response.content)) {
          allAppointmentsData = response.content;
          totalElements = response.total_elements || response.totalElements || response.content.length;
          totalPages = response.total_pages || response.totalPages || Math.ceil(totalElements / size);
          currentPage = response.page !== undefined ? response.page : (response.number || 0);
        } else if (response.appointments && Array.isArray(response.appointments)) {
          allAppointmentsData = response.appointments;
          totalElements = response.total_elements || response.totalElements || response.appointments.length;
          totalPages = response.total_pages || response.totalPages || Math.ceil(totalElements / size);
          currentPage = response.page !== undefined ? response.page : (response.number || 0);
        }
      } else if (Array.isArray(response)) {
        allAppointmentsData = response;
        totalElements = response.length;
        totalPages = 1;
        currentPage = 0;
      }

      console.log('✅ [RECEPTION DASHBOARD] Appointments loaded:', allAppointmentsData.length);

      return {
        appointments: allAppointmentsData,
        pagination: {
          currentPage,
          totalPages,
          totalElements,
          size
        }
      };
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading appointments:', error);
      throw error;
    }
  }

  // Load today's appointments from API with pagination
  static async loadTodayAppointments(
    salonId: number,
    branchId?: number,
    page: number = 0,
    size: number = 9
  ) {
    try {
      console.log('🔄 [LOAD] Starting loadTodayAppointments with pagination...', { page, size });

      const response = await apiService.getTodayAppointments(
        salonId,
        branchId,
        page,
        size,
        'appointmentDate',
        'asc'
      );

      console.log('📡 [RECEPTION DASHBOARD] Today\'s appointments response:', response);

      let appointmentsData: any[] = [];
      let pagination = {
        currentPage: response.page !== undefined ? response.page : (response.number || page),
        totalPages: response.total_pages || response.totalPages || Math.ceil((response.total_elements || response.totalElements || 0) / size),
        totalElements: response.total_elements || response.totalElements || 0,
        size: size
      };

      // Handle different response structures (Spring Boot pagination)
      if (response && response.content) {
        appointmentsData = response.content;
      } else if (response && response.appointments) {
        appointmentsData = response.appointments;
      } else if (Array.isArray(response)) {
        appointmentsData = response as any[];
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        appointmentsData = (response as any).data;
      }

      console.log('📅 [RECEPTION DASHBOARD] Processing today\'s appointments:', appointmentsData.length);

      return {
        appointments: appointmentsData,
        pagination
      };
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading today\'s appointments:', error);
      throw error;
    }
  }

  // Load pending payments from API with pagination
  static async loadPendingPayments(
    salonId: number,
    branchId?: number,
    page: number = 0,
    size: number = 9
  ) {
    try {
      console.log('💰 [RECEPTION DASHBOARD] Loading pending payments with pagination...', { page, size, salonId, branchId });

      const response = await apiService.getPendingPaymentAppointments(
        salonId,
        branchId,
        page,
        size,
        'totalAmount',
        'desc'
      );

      console.log('📡 [RECEPTION DASHBOARD] Pending payments response:', response);

      let appointmentsData: any[] = [];
      let pagination = {
        currentPage: response.page !== undefined ? response.page : (response.number || page),
        totalPages: response.total_pages || response.totalPages || Math.ceil((response.total_elements || response.totalElements || 0) / size),
        totalElements: response.total_elements || response.totalElements || 0,
        size: size
      };

      // Handle different response structures (Spring Boot pagination)
      if (response && response.content) {
        appointmentsData = response.content;
      } else if (response && response.appointments) {
        appointmentsData = response.appointments;
      } else if (Array.isArray(response)) {
        appointmentsData = response as any[];
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        appointmentsData = (response as any).data;
      }

      // The API endpoint already filters for pending payments, no additional filtering needed
      console.log('💰 [RECEPTION DASHBOARD] Pending payments from API:', appointmentsData.length);

      return {
        appointments: appointmentsData,
        pagination
      };
    } catch (error) {
      console.error('❌ [RECEPTION DASHBOARD] Error loading pending payments:', error);
      throw error;
    }
  }

  // Load total statistics
  static async loadTotalStatistics(salonId: number) {
    try {
      console.log('📊 [STATS] Loading total statistics...');

      // Load statistics with large page size to get accurate totals
      const [allAppointmentsData, todayAppointmentsData, pendingPaymentsData] = await Promise.all([
        apiService.getAllAppointmentsForSalon(salonId, undefined, 0, 1000, 'createdAt', 'asc'),
        apiService.getTodayAppointments(salonId, undefined, 0, 1000, 'appointmentDate', 'asc'),
        apiService.getPendingPaymentAppointments(salonId, undefined, 0, 1000, 'appointmentDate', 'desc')
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

      // Calculate daily income from completed payments
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

      const statistics = {
        totalCustomers: uniqueCustomers.size,
        totalTodayAppointments: todayAppointmentsForStats.length,
        totalPendingPayments: actualPendingPayments.length,
        totalDailyIncome: totalDailyIncome,
        loading: false
      };

      console.log('✅ [STATS] Total statistics loaded:', statistics);
      return statistics;
    } catch (error) {
      console.error('❌ [STATS] Error loading total statistics:', error);
      throw error;
    }
  }

  // Convert API appointment to frontend format
  static convertApiAppointmentToFrontend(apiAppointment: any, salonId: string): Appointment {
    // Handle timezone-aware date formatting
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
      salonId: salonId,
      customerId: `customer_${apiAppointment.id}`,
      customerName: apiAppointment.customerName,
      customerPhone: apiAppointment.customerPhone,
      customerEmail: '',
      customerGender: undefined,
      barberId: apiAppointment.employeeId ? apiAppointment.employeeId.toString() : `employee_${apiAppointment.id}`,
      barberName: apiAppointment.employeeName,
      serviceId: apiAppointment.serviceId ? apiAppointment.serviceId.toString() : `service_${apiAppointment.id}`,
      serviceName: apiAppointment.serviceName,
      originalEmployeeId: apiAppointment.employeeId,
      originalServiceId: apiAppointment.serviceId,
      date: formattedDate,
      timeSlot: timeSlot,
      status: this.mapApiStatusToFrontend(apiAppointment.status, apiAppointment.paymentStatus),
      paymentStatus: this.mapApiPaymentStatus(apiAppointment.paymentStatus),
      paymentMethod: undefined,
      amount: apiAppointment.servicePrice,
      discountAmount: apiAppointment.discountAmount || 0,
      finalAmount: apiAppointment.totalAmount,
      tipAmount: 0,
      notes: '',
      createdAt: new Date(apiAppointment.createdAt),
      updatedAt: new Date(apiAppointment.updatedAt),
    };
  }

  // Map API status to frontend status
  private static mapApiStatusToFrontend(apiStatus: string, paymentStatus?: string): 'booked' | 'in-progress' | 'completed' | 'payment-pending' | 'paid' | 'cancelled' | 'no-show' {
    switch (apiStatus) {
      case 'SCHEDULED':
        return 'booked';
      case 'COMPLETED':
        return paymentStatus === 'PENDING' ? 'payment-pending' : 'completed';
      case 'CANCELLED':
        return 'cancelled';
      case 'IN_PROGRESS':
        return 'in-progress';
      default:
        return 'booked';
    }
  }

  // Map API payment status to frontend format
  private static mapApiPaymentStatus(apiPaymentStatus: string): 'pending' | 'completed' | 'refunded' {
    switch (apiPaymentStatus) {
      case 'PENDING':
        return 'pending';
      case 'PAID':
        return 'completed';
      case 'PARTIAL':
        return 'pending'; // Map partial to pending for now
      default:
        return 'pending';
    }
  }
}
