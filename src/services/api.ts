import { getCurrentConfig, envLog } from '../config/environment';

// API Endpoints
const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  SALONS: {
    REGISTER: '/salons/comprehensive',
    UPDATE_OWNER_PROFILE: '/salons',
  },
  BRANCHES: {
    ACTIVE: '/branches/active',
    CREATE: '/branches',
    UPDATE: '/branches',
    STATISTICS: '/branches/salon',
    COMPREHENSIVE: '/branches/salon',
  },
  EMPLOYEES: {
    CREATE_SALON: '/employees/salon',
    LIST: '/employees',
    UPDATE_SALON: '/employees/salon',
    DELETE: '/employees',
    BY_SALON: '/employees/salon',
    RECEPTIONISTS: '/employees/salon', // /employees/salon/{salonId}/receptionists
    BARBERS: '/employees/salon', // /employees/salon/{salonId}/barbers
    DETAILS: '/employees', // /employees/{employeeId}/details
  },
  SERVICES: {
    CREATE: '/services',
    ACTIVE: '/services/active',
    DETAIL: '/services',
    UPDATE: '/services',
    DELETE: '/services',
    BOOKING: '/services/booking',
  },
  AVAILABILITY: {
    BARBERS: '/availability/barbers',
    TIME_SLOTS: '/availability/time-slots',
  },
  APPOINTMENTS: {
    CREATE: '/appointments',
    LIST: '/appointments', // GET /appointments?salonId={salonId}&date={date}&status={status}
    TODAY: '/appointments/today', // GET /appointments/today?salonId={salonId}
    PENDING_PAYMENTS: '/appointments/pending-payments', // GET /appointments/pending-payments?salonId={salonId}
    GET_DETAILS: '/appointments', // GET /appointments/{appointmentId}
    GET_AVAILABLE_ACTIONS: '/appointments', // GET /appointments/{appointmentId}/available-actions?userRole={role}
    UPDATE_DETAILS: '/appointments', // PUT /appointments/{appointmentId}/details
    CANCEL_WITH_ROLE: '/appointments', // PUT /appointments/{appointmentId}/cancel-with-role?userRole={role}
    CONFIRM_PAYMENT_WITH_ROLE: '/appointments', // PUT /appointments/{appointmentId}/confirm-payment?userRole={role}
    COMPLETE_SESSION_WITH_ROLE: '/appointments', // PUT /appointments/{appointmentId}/complete-session?userRole={role}
  },
};

// API Service Class
class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    const config = getCurrentConfig();
    this.baseURL = config.API_BASE_URL;
    // Load token from localStorage on initialization
    this.authToken = localStorage.getItem('authToken');
    if (this.authToken) {
      envLog.info('🔐 [AUTH] Token loaded from localStorage');
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
    envLog.info('🔐 [AUTH] Authentication token set and stored');
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
    envLog.info('🔓 [AUTH] Authentication token cleared');
  }

  // Get current token status (for debugging)
  getTokenStatus() {
    return {
      hasToken: !!this.authToken,
      tokenLength: this.authToken ? this.authToken.length : 0,
      tokenPreview: this.authToken ? `${this.authToken.substring(0, 20)}...` : 'No token'
    };
  }

  // Get stored auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      envLog.info('🌐 [API] Making request to:', url);
      envLog.info('📋 [API] Request config:', {
        ...config,
        headers: {
          ...config.headers,
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken.substring(0, 20)}...` })
        }
      });
      envLog.info('🔐 [API] Has auth token:', !!this.authToken);
      
      const response = await fetch(url, config);
      
      envLog.info('📡 [API] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        envLog.error('❌ [API] Error response:', errorText);
        envLog.error('❌ [API] Error status:', response.status);
        envLog.error('❌ [API] Error headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      envLog.info('✅ [API] Success response:', data);
      return data;
    } catch (error) {
      envLog.error('❌ [API] Request failed:', error);
      throw error;
    }
  }

  // Authentication API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    
    // Store the token if login is successful
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  // Salon Registration API
  async registerSalon(salonData: SalonRegistrationRequest): Promise<SalonRegistrationResponse> {
    return this.request<SalonRegistrationResponse>(
      ENDPOINTS.SALONS.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(salonData),
      }
    );
  }

  // Update Salon Owner Profile API
  async updateSalonOwnerProfile(salonId: string | number, profileData: SalonOwnerProfileUpdateRequest): Promise<SalonOwnerProfileUpdateResponse> {
    const endpoint = `${ENDPOINTS.SALONS.UPDATE_OWNER_PROFILE}/${salonId}/owner-profile`;
    envLog.info('🔄 [API] Updating salon owner profile...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    envLog.info('📋 [API] Profile data:', profileData);
    
    return this.request<SalonOwnerProfileUpdateResponse>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }
    );
  }

  // Branch Management API
  async getActiveBranches(salonId: number): Promise<BranchResponse[]> {
    return this.request<BranchResponse[]>(
      `${ENDPOINTS.BRANCHES.ACTIVE}?salonId=${salonId}`,
      {
        method: 'GET',
      }
    );
  }

  // Create New Branch API
  async createBranch(branchData: BranchCreateRequest): Promise<BranchCreateResponse> {
    const endpoint = ENDPOINTS.BRANCHES.CREATE;
    envLog.info('🌿 [API] Creating new branch...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Branch data:', branchData);
    
    return this.request<BranchCreateResponse>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(branchData),
      }
    );
  }

  // Update Branch API
  async updateBranch(branchId: string | number, branchData: BranchUpdateRequest): Promise<BranchUpdateResponse> {
    const endpoint = `${ENDPOINTS.BRANCHES.UPDATE}/${branchId}`;
    envLog.info('🔄 [API] Updating branch...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Branch ID:', branchId);
    envLog.info('📋 [API] Branch update data:', branchData);
    
    return this.request<BranchUpdateResponse>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(branchData),
      }
    );
  }

  // Get branch statistics for a salon
  async getBranchStatistics(salonId: string | number): Promise<BranchStatisticsResponse> {
    const endpoint = `${ENDPOINTS.BRANCHES.STATISTICS}/${salonId}/statistics`;
    envLog.info('📊 [API] Getting branch statistics...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    return this.request<BranchStatisticsResponse>(endpoint);
  }

  // Get comprehensive branch data for a salon
  async getComprehensiveBranches(salonId: string | number): Promise<ComprehensiveBranchResponse> {
    const endpoint = `${ENDPOINTS.BRANCHES.COMPREHENSIVE}/${salonId}/comprehensive`;
    envLog.info('🏢 [API] Getting comprehensive branch data...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    return this.request<ComprehensiveBranchResponse>(endpoint);
  }

  // Employee Management API
  async createEmployee(employeeData: EmployeeRegistrationRequest): Promise<EmployeeRegistrationResponse> {
    return this.request<EmployeeRegistrationResponse>(
      ENDPOINTS.EMPLOYEES.CREATE_SALON,
      {
        method: 'POST',
        body: JSON.stringify(employeeData),
      }
    );
  }

  // Get employees by salon ID
  async getEmployeesBySalon(salonId: string | number): Promise<EmployeesResponse> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.BY_SALON}/${salonId}`;
    envLog.info('👥 [API] Getting employees by salon...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    return this.request<EmployeesResponse>(endpoint);
  }

  // Update employee by ID
  async updateEmployee(employeeId: string | number, employeeData: EmployeeUpdateRequest): Promise<EmployeeUpdateResponse> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.UPDATE_SALON}/${employeeId}`;
    envLog.info('✏️ [API] Updating employee...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('👤 [API] Employee ID:', employeeId);
    envLog.info('📋 [API] Employee update data:', employeeData);
    
    return this.request<EmployeeUpdateResponse>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(employeeData),
      }
    );
  }

  // Get salon receptionists
  async getSalonReceptionists(salonId: string | number): Promise<EmployeeRegistrationResponse[]> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.RECEPTIONISTS}/${salonId}/receptionists`;
    envLog.info('👥 [API] Getting salon receptionists...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    return this.request<EmployeeRegistrationResponse[]>(endpoint);
  }

  // Get salon barbers
  async getSalonBarbers(salonId: string | number): Promise<EmployeeRegistrationResponse[]> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.BARBERS}/${salonId}/barbers`;
    envLog.info('👥 [API] Getting salon barbers...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    return this.request<EmployeeRegistrationResponse[]>(endpoint);
  }

  // Get employee details
  async getEmployeeDetails(employeeId: string | number): Promise<EmployeeRegistrationResponse> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.DETAILS}/${employeeId}/details`;
    envLog.info('👤 [API] Getting employee details...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('👤 [API] Employee ID:', employeeId);
    
    return this.request<EmployeeRegistrationResponse>(endpoint);
  }

  // Delete employee by ID
  async deleteEmployee(employeeId: string | number): Promise<{ message: string; success: boolean }> {
    const endpoint = `${ENDPOINTS.EMPLOYEES.DELETE}/${employeeId}`;
    envLog.info('🗑️ [API] Deleting employee...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('👤 [API] Employee ID:', employeeId);
    
    return this.request<{ message: string; success: boolean }>(
      endpoint,
      {
        method: 'DELETE',
      }
    );
  }

  // Service Management API
  
  // Create a new service
  async createService(serviceData: ServiceCreateRequest): Promise<ServiceResponse> {
    envLog.info('🆕 [API] Creating new service...');
    envLog.info('📋 [API] Service data:', serviceData);
    
    return this.request<ServiceResponse>(
      ENDPOINTS.SERVICES.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(serviceData),
      }
    );
  }

  // Get all active services for a salon
  async getActiveServices(salonId: string | number): Promise<ServicesListResponse> {
    const endpoint = `${ENDPOINTS.SERVICES.ACTIVE}?salonId=${salonId}`;
    envLog.info('📋 [API] Getting active services...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    try {
      const response = await this.request<ServiceData[]>(endpoint);
      envLog.info('📡 [API] Raw response received:', response);
      
      // Since the API returns an array directly, wrap it in the expected format
      if (Array.isArray(response)) {
        envLog.info('✅ [API] Response is array, wrapping in expected format');
        return {
          services: response,
          message: 'Services loaded successfully',
          success: true
        };
      } else {
        // If it's already in the expected format, return as is
        envLog.info('✅ [API] Response is already in expected format');
        return response as ServicesListResponse;
      }
    } catch (error) {
      envLog.error('❌ [API] Error getting active services:', error);
      return {
        services: [],
        message: 'Failed to load services',
        success: false
      };
    }
  }

  // Get services for booking screen with gender filter
  async getBookingServices(salonId: string | number, gender: 'MALE' | 'FEMALE'): Promise<ServicesListResponse> {
    const endpoint = `${ENDPOINTS.SERVICES.BOOKING}?salonId=${salonId}&gender=${gender}`;
    envLog.info('📅 [API] Getting booking services...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    envLog.info('👤 [API] Gender filter:', gender);
    
    try {
      const response = await this.request<ServiceData[]>(endpoint);
      envLog.info('📡 [API] Raw booking services response received:', response);
      
      // Since the API returns an array directly, wrap it in the expected format
      if (Array.isArray(response)) {
        envLog.info('✅ [API] Booking services response is array, wrapping in expected format');
        return {
          services: response,
          message: 'Booking services loaded successfully',
          success: true
        };
      } else {
        // If it's already in the expected format, return as is
        envLog.info('✅ [API] Booking services response is already in expected format');
        return response as ServicesListResponse;
      }
    } catch (error) {
      envLog.error('❌ [API] Error getting booking services:', error);
      return {
        services: [],
        message: 'Failed to load booking services',
        success: false
      };
    }
  }

  // Get single service details
  async getServiceDetails(serviceId: string | number): Promise<ServiceResponse> {
    const endpoint = `${ENDPOINTS.SERVICES.DETAIL}/${serviceId}`;
    envLog.info('🔍 [API] Getting service details...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Service ID:', serviceId);
    
    return this.request<ServiceResponse>(endpoint);
  }

  // Update a service
  async updateService(serviceId: string | number, serviceData: ServiceUpdateRequest): Promise<ServiceResponse> {
    const endpoint = `${ENDPOINTS.SERVICES.UPDATE}/${serviceId}`;
    envLog.info('✏️ [API] Updating service...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Service ID:', serviceId);
    envLog.info('📋 [API] Service update data:', serviceData);
    
    return this.request<ServiceResponse>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(serviceData),
      }
    );
  }

  // Delete a service
  async deleteService(serviceId: string | number): Promise<{ message: string; success: boolean }> {
    const endpoint = `${ENDPOINTS.SERVICES.DELETE}/${serviceId}`;
    envLog.info('🗑️ [API] Deleting service...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Service ID:', serviceId);
    
    return this.request<{ message: string; success: boolean }>(
      endpoint,
      {
        method: 'DELETE',
      }
    );
  }

  // Get available barbers for specific services and date
  async getAvailableBarbers(serviceIds: string[], date: string, salonId: string | number, customerGender?: string): Promise<AvailableBarber[]> {
    const serviceIdsParam = serviceIds.join(',');
    let endpoint = `${ENDPOINTS.AVAILABILITY.BARBERS}?service_ids=${encodeURIComponent(serviceIdsParam)}&date=${encodeURIComponent(date)}&salonId=${salonId}`;
    
    // Add customerGender parameter if provided
    if (customerGender) {
      endpoint += `&customerGender=${encodeURIComponent(customerGender)}`;
    }
    
    envLog.info('👥 [API] Getting available barbers...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🛠️ [API] Service IDs:', serviceIds);
    envLog.info('📅 [API] Date:', date);
    envLog.info('🏪 [API] Salon ID:', salonId);
    envLog.info('👤 [API] Customer Gender:', customerGender || 'Not specified');
    
    try {
      const response = await this.request<AvailableBarbersResponse>(endpoint);
      envLog.info('✅ [API] Available barbers loaded successfully');
      
      // Return the available_barbers array from the response
      return response.available_barbers || [];
    } catch (error) {
      envLog.error('❌ [API] Error getting available barbers:', error);
      return [];
    }
  }

  // Get available time slots for a specific barber
  async getAvailableTimeSlots(barberId: string | number, serviceIds: string[], date: string, salonId: string | number): Promise<TimeSlotResponse> {
    const serviceIdsParam = serviceIds.join(',');
    const endpoint = `${ENDPOINTS.AVAILABILITY.TIME_SLOTS}?barber_id=${barberId}&service_ids=${encodeURIComponent(serviceIdsParam)}&date=${encodeURIComponent(date)}&salonId=${salonId}`;
    
    envLog.info('⏰ [API] Getting available time slots...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('👤 [API] Barber ID:', barberId);
    envLog.info('🛠️ [API] Service IDs:', serviceIds);
    envLog.info('📅 [API] Date:', date);
    envLog.info('🏪 [API] Salon ID:', salonId);
    
    try {
      const response = await this.request<TimeSlotResponse>(endpoint);
      envLog.info('✅ [API] Available time slots loaded successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error getting available time slots:', error);
      return {
        available_slots: [],
        barber_id: null,
        barber_name: null,
        total_duration_minutes: null,
        buffer_time_minutes: 15,
        message: 'Failed to load time slots',
        success: false
      };
    }
  }

  // Create appointment
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const endpoint = ENDPOINTS.APPOINTMENTS.CREATE;
    
    envLog.info('📅 [API] Creating appointment...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('📋 [API] Appointment data:', appointmentData);
    
    try {
      const response = await this.request<CreateAppointmentResponse>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(appointmentData),
        }
      );
      envLog.info('✅ [API] Appointment created successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error creating appointment:', error);
      return {
        appointment_id: null,
        appointment_number: null,
        customer_id: null,
        customer_name: null,
        barber_id: null,
        barber_name: null,
        services: null,
        appointment_date: null,
        estimated_end_time: null,
        total_duration_minutes: null,
        total_amount: null,
        status: null,
        message: 'Failed to create appointment',
        success: false,
        created_at: null
      };
    }
  }

  // Get appointment details with optional role-based actions
  async getAppointmentDetails(appointmentId: number, userRole?: 'RECEPTION' | 'OWNER' | 'ADMIN'): Promise<AppointmentDetails> {
    const endpoint = userRole 
      ? `${ENDPOINTS.APPOINTMENTS.GET_DETAILS}/${appointmentId}?userRole=${userRole}`
      : `${ENDPOINTS.APPOINTMENTS.GET_DETAILS}/${appointmentId}`;
    
    envLog.info('📅 [API] Getting appointment details...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('👤 [API] User Role:', userRole || 'none');
    
    try {
      const response = await this.request<AppointmentDetails>(endpoint, {
        method: 'GET',
      });
      envLog.info('✅ [API] Appointment details retrieved successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error getting appointment details:', error);
      throw error;
    }
  }

  // Get available actions for appointment based on user role
  async getAvailableActions(appointmentId: number, userRole: 'RECEPTION' | 'OWNER' | 'ADMIN'): Promise<AvailableActionsResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.GET_AVAILABLE_ACTIONS}/${appointmentId}/available-actions?userRole=${userRole}`;
    
    envLog.info('🔐 [API] Getting available actions...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('👤 [API] User Role:', userRole);
    
    try {
      const response = await this.request<AvailableActionsResponse>(endpoint, {
        method: 'GET',
      });
      envLog.info('✅ [API] Available actions retrieved successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error getting available actions:', error);
      throw error;
    }
  }

  // Update appointment details
  async updateAppointmentDetails(appointmentId: number, updateData: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.UPDATE_DETAILS}/${appointmentId}/details`;
    
    envLog.info('📅 [API] Updating appointment details...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('📋 [API] Update data:', updateData);
    
    try {
      const response = await this.request<UpdateAppointmentResponse>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );
      envLog.info('✅ [API] Appointment updated successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel appointment with role-based access
  async cancelAppointment(appointmentId: number, cancelData: CancelAppointmentRequest): Promise<CancelAppointmentResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.CANCEL_WITH_ROLE}/${appointmentId}/cancel-with-role?userRole=${cancelData.userRole}`;
    
    envLog.info('📅 [API] Cancelling appointment...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('� [API] User Role:', cancelData.userRole);
    envLog.info('�📋 [API] Cancel data:', cancelData);
    
    try {
      const response = await this.request<CancelAppointmentResponse>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify({
            reason: cancelData.reason,
            cancelledBy: cancelData.cancelledBy || cancelData.userRole
          }),
        }
      );
      envLog.info('✅ [API] Appointment cancelled successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error cancelling appointment:', error);
      throw error;
    }
  }

  // Confirm payment with role-based access
  async confirmAppointmentPayment(appointmentId: number, userRole: 'RECEPTION' | 'OWNER' | 'ADMIN'): Promise<ConfirmPaymentResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.CONFIRM_PAYMENT_WITH_ROLE}/${appointmentId}/confirm-payment?userRole=${userRole}`;
    
    envLog.info('💳 [API] Confirming appointment payment...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('👤 [API] User Role:', userRole);
    
    try {
      const response = await this.request<ConfirmPaymentResponse>(
        endpoint,
        {
          method: 'PUT',
        }
      );
      envLog.info('✅ [API] Payment confirmed successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error confirming payment:', error);
      throw error;
    }
  }

  // Complete session (Reception only)
  async completeSession(appointmentId: number, userRole: 'RECEPTION' | 'OWNER' | 'ADMIN'): Promise<CompleteSessionResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.COMPLETE_SESSION_WITH_ROLE}/${appointmentId}/complete-session?userRole=${userRole}`;
    
    envLog.info('📅 [API] Completing appointment session...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🆔 [API] Appointment ID:', appointmentId);
    envLog.info('👤 [API] User Role:', userRole);
    
    try {
      const response = await this.request<CompleteSessionResponse>(
        endpoint,
        {
          method: 'PUT',
        }
      );
      envLog.info('✅ [API] Session completed successfully');
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error completing session:', error);
      throw error;
    }
  }

  // Get appointments list
  async getAppointments(params: GetAppointmentsRequest): Promise<AppointmentListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('salonId', params.salonId.toString());
    
    if (params.date) queryParams.append('date', params.date);
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${ENDPOINTS.APPOINTMENTS.LIST}?${queryParams.toString()}`;
    
    envLog.info('📅 [API] Fetching appointments list...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('📋 [API] Parameters:', params);
    
    try {
      const response = await this.request<AppointmentListResponse>(endpoint, {
        method: 'GET',
      });
      envLog.info('✅ [API] Appointments fetched successfully');
      envLog.info('📊 [API] Total appointments:', response.totalCount);
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error fetching appointments:', error);
      throw error;
    }
  }

  // Get today's appointments
  async getTodayAppointments(salonId: number): Promise<AppointmentListResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.TODAY}?salonId=${salonId}`;
    
    envLog.info('📅 [API] Fetching today\'s appointments...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    try {
      const response = await this.request<AppointmentListResponse>(endpoint, {
        method: 'GET',
      });
      envLog.info('✅ [API] Today\'s appointments fetched successfully');
      envLog.info('📊 [API] Total appointments:', response.totalCount);
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  // Get pending payment appointments
  async getPendingPaymentAppointments(salonId: number): Promise<AppointmentListResponse> {
    const endpoint = `${ENDPOINTS.APPOINTMENTS.PENDING_PAYMENTS}?salonId=${salonId}`;
    
    envLog.info('💰 [API] Fetching pending payment appointments...');
    envLog.info('🌐 [API] Endpoint:', endpoint);
    envLog.info('🏢 [API] Salon ID:', salonId);
    
    try {
      const response = await this.request<AppointmentListResponse>(endpoint, {
        method: 'GET',
      });
      envLog.info('✅ [API] Pending payment appointments fetched successfully');
      envLog.info('📊 [API] Total appointments:', response.totalCount);
      return response;
    } catch (error) {
      envLog.error('❌ [API] Error fetching pending payment appointments:', error);
      throw error;
    }
  }

  // Utility function to convert API appointment data to frontend Appointment format
  private convertApiAppointmentToFrontend(apiAppointment: AppointmentListItem): any {
    // Map API status to frontend status
    const mapStatus = (apiStatus: string): 'booked' | 'in-progress' | 'completed' | 'payment-pending' | 'paid' | 'cancelled' | 'no-show' => {
      switch (apiStatus) {
        case 'SCHEDULED':
          return 'booked';
        case 'COMPLETED':
          // Check payment status to determine if it's completed or payment-pending
          if (apiAppointment.paymentStatus === 'COMPLETED') {
            return 'paid';
          } else {
            return 'payment-pending';
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
      salonId: '', // Will be set from context
      customerId: `customer_${apiAppointment.id}`, // Generate customer ID
      customerName: apiAppointment.customerName,
      customerPhone: apiAppointment.customerPhone,
      customerEmail: '', // Not available in API response
      customerGender: undefined, // Not available in API response
      barberId: `employee_${apiAppointment.id}`, // Generate barber ID
      barberName: apiAppointment.employeeName,
      serviceId: `service_${apiAppointment.id}`, // Generate service ID
      serviceName: apiAppointment.serviceName,
      date: appointmentDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
      timeSlot: timeSlot,
      status: mapStatus(apiAppointment.status),
      paymentStatus: mapPaymentStatus(apiAppointment.paymentStatus),
      paymentMethod: undefined, // Not available in API response
      amount: apiAppointment.servicePrice,
      discountAmount: apiAppointment.discountAmount || 0,
      finalAmount: apiAppointment.totalAmount,
      tipAmount: 0, // Not available in API response
      notes: '', // Not available in API response
      createdAt: new Date(apiAppointment.createdAt),
      updatedAt: new Date(apiAppointment.updatedAt),
    };
  }

  // Enhanced appointment list methods with conversion
  async getAppointmentsForDashboard(params: GetAppointmentsRequest): Promise<any[]> {
    try {
      const response = await this.getAppointments(params);
      if (response.success && response.appointments) {
        return response.appointments.map(apt => this.convertApiAppointmentToFrontend(apt));
      }
      return [];
    } catch (error) {
      envLog.error('❌ [API] Error getting appointments for dashboard:', error);
      throw error;
    }
  }

  async getTodayAppointmentsForDashboard(salonId: number): Promise<any[]> {
    try {
      const response = await this.getTodayAppointments(salonId);
      if (response.success && response.appointments) {
        return response.appointments.map(apt => this.convertApiAppointmentToFrontend(apt));
      }
      return [];
    } catch (error) {
      envLog.error('❌ [API] Error getting today\'s appointments for dashboard:', error);
      throw error;
    }
  }

  async getPendingPaymentAppointmentsForDashboard(salonId: number): Promise<any[]> {
    try {
      const response = await this.getPendingPaymentAppointments(salonId);
      if (response.success && response.appointments) {
        return response.appointments.map(apt => this.convertApiAppointmentToFrontend(apt));
      }
      return [];
    } catch (error) {
      envLog.error('❌ [API] Error getting pending payment appointments for dashboard:', error);
      throw error;
    }
  }
}

// Types for API requests and responses

// Authentication types
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// Branch types
export interface BranchResponse {
  branchId: number;
  branchName: string;
}

// Branch Creation types
export interface BranchCreateRequest {
  salonId: number;
  branchName: string;
  branchPhoneNumber: string;
  branchEmail: string;
  latitude: number;
  longitude: number;
  branchImage?: string;
  weeklySchedule: {
    schedule: {
      [key: string]: {
        open: boolean;
        openingTime: string;
        closingTime: string;
      };
    };
  };
}

export interface BranchCreateResponse {
  branchId: number;
  salonId: number;
  branchName: string;
  branchPhoneNumber: string;
  branchEmail: string;
  latitude: number;
  longitude: number;
  branchImage?: string;
  status: string;
  weeklySchedule: {
    schedule: {
      [key: string]: {
        open: boolean;
        openingTime: string;
        closingTime: string;
      };
    };
  };
  createdAt: string;
  message: string;
}

// Branch Update types
export interface BranchUpdateRequest {
  branchName: string;
  branchPhoneNumber: string;
  branchEmail: string;
  latitude: number;
  longitude: number;
  branchImage?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
  weeklySchedule: {
    schedule: {
      [key: string]: {
        open: boolean;
        openingTime: string;
        closingTime: string;
      };
    };
  };
}

export interface BranchUpdateResponse {
  branchId: number;
  branchName: string;
  branchPhoneNumber: string;
  branchEmail: string;
  latitude: number;
  longitude: number;
  branchImage?: string;
  status: string;
  weeklySchedule: {
    schedule: {
      [key: string]: {
        open: boolean;
        openingTime: string;
        closingTime: string;
      };
    };
  };
  updatedAt: string;
  message: string;
}

export interface BranchStatisticsResponse {
  salonId: number;
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  message: string;
}

export interface ComprehensiveBranchData {
  branchId: number;
  salonId: number;
  branchName: string;
  branchPhoneNumber: string;
  branchEmail: string;
  longitude: number;
  latitude: number;
  branchImage?: string;
  status: string;
  weeklySchedule: {
    schedule: {
      [key: string]: {
        open: boolean;
        openingTime: string;
        closingTime: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
  employeeCount: number;
}

export interface ComprehensiveBranchResponse {
  statistics: BranchStatisticsResponse;
  branches: ComprehensiveBranchData[];
}

export interface LoginResponse {
  token?: string;
  tokenType?: string;
  role?: 'SALON_OWNER' | 'SALON_RECEPTION' | 'SUPER_ADMIN';
  username?: string;
  expiresIn?: number;
  employee?: {
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    phoneNumber: string;
    dateOfBirth: string | null;
    gender: "MALE" | "FEMALE" | "OTHER";
    address: string;
    city: string | null;
    role: "RECEPTIONIST" | "BARBER";
    status: "ACTIVE" | "INACTIVE";
    hireDate: string;
    terminationDate: string | null;
    baseSalary: number;
    experience: string | null;
    specializations: string[];
    emergencyContact: string;
    emergencyPhone: string;
    emergencyRelationship: string;
    ratings: number;
    experienceYears: number | null;
    notes: string | null;
    profileImageUrl: string | null;
    salonName: string;
    salonId: number;
    branchId: number;
    employeeWeeklySchedule: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    fullName: string;
  };
  salon?: {
    salonId: number;
    name: string;
    address: string;
    district: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerPhone: string;
    ownerEmail: string;
    brNumber: string;
    taxId: string;
    imageUrl: string;
    ownerImgUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    username?: string;
    userRole?: string;
    defaultBranchId?: number;
    defaultBranchName?: string;
    fullOwnerName: string;
  };
  message?: string;
  success?: boolean;
}

// Salon registration types - updated format to match new API requirements
export interface SalonRegistrationRequest {
  name: string;
  address: string;
  district: string; // Changed from city/state to district
  postalCode: string; // Changed from zipCode
  phoneNumber: string;
  email: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  ownerEmail: string;
  brNumber: string; // Changed from taxId
  taxId: string;
  imageUrl: string; // For base64 image data
  latitude?: string; // Coordinates as strings
  longitude?: string; // Coordinates as strings
  username: string;
  password: string;
  defaultBranchName: string;
  branchEmail: string;
  branchPhoneNumber: string;
}

export interface SalonRegistrationResponse {
  id?: string;
  message?: string;
  success?: boolean;
  data?: any;
  // Add other response fields as needed
}

// Salon Owner Profile Update types
export interface SalonOwnerProfileUpdateRequest {
  name: string;
  address: string;
  district: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  ownerEmail: string;
  brNumber: string;
  taxId: string;
  imageUrl?: string;
  ownerImgUrl?: string;
}

export interface SalonOwnerProfileUpdateResponse {
  id?: string;
  message?: string;
  success?: boolean;
  data?: any;
}

// Employee registration types
export interface EmployeeWeeklySchedule {
  monday: { openTime: string; closeTime: string; isOpen: boolean };
  tuesday: { openTime: string; closeTime: string; isOpen: boolean };
  wednesday: { openTime: string; closeTime: string; isOpen: boolean };
  thursday: { openTime: string; closeTime: string; isOpen: boolean };
  friday: { openTime: string; closeTime: string; isOpen: boolean };
  saturday: { openTime: string; closeTime: string; isOpen: boolean };
  sunday: { openTime: string; closeTime: string; isOpen: boolean };
}

export interface EmployeeRegistrationRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  date_of_birth: string;
  address: string;
  salon_id: number;
  branch_id?: number; // Optional branch assignment
  role: 'RECEPTIONIST' | 'BARBER';
  base_salary: number;
  experience_years: number;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_relationship: string;
  username?: string; // Required for RECEPTIONIST role
  password?: string; // Required for RECEPTIONIST role
  specializations?: string[]; // For BARBER role
  weekly_schedule: string; // JSON string format
  ratings?: number;
  profile_image_url?: string;
  notes?: string;
  serves_gender?: 'MALE' | 'FEMALE' | 'BOTH'; // Gender preference for barber services
}

export interface EmployeeRegistrationResponse {
  employee_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  age: number;
  address: string;
  city: string;
  role: string;
  base_salary: number;
  experience_years: number;
  hire_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_relationship: string;
  specializations: string[] | null;
  username: string | null;
  ratings: number;
  profile_image_url: string | null;
  notes: string;
  status: string;
  salon_id: number;
  salon_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EmployeeData {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  status: string;
  hire_date: string;
  base_salary: number;
  date_of_birth: string;
  address: string;
  specializations: string[];
  branch_id: number;
  branch_name: string;
  profile_image?: string;
  username: string;
  commission_rate?: number;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  date_of_birth?: string;
  address?: string;
  city?: string;
  branch_id?: number; // Branch assignment
  base_salary?: number;
  experience_years?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_relationship?: string;
  username?: string; // For RECEPTIONIST role
  ratings?: number;
  profile_image_url?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  serves_gender?: 'MALE' | 'FEMALE' | 'BOTH'; // Gender preference for barber services
}

export interface EmployeeUpdateResponse {
  employee_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  branch_id?: number;
  branch_name?: string;
  salon_id?: number;
  salon_name?: string;
  message: string;
  success: boolean;
  updated_at: string;
}

export interface EmployeesResponse {
  salon_id: number;
  salon_name: string;
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  employees: EmployeeData[];
  message: string;
  success: boolean;
}

// Service Management Types
export interface ServiceCreateRequest {
  salon_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  discount_price?: number;
  category: string;
  gender_availability: string;
  image_url?: string;
  is_active: boolean;
  is_popular: boolean;
}

export interface ServiceUpdateRequest {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  discount_price?: number;
  category: string;
  gender_availability: string;
  image_url?: string;
  status: string;
  is_active: boolean;
  is_popular: boolean;
}

export interface ServiceData {
  id: number;
  salon_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  discount_price?: number;
  category: string;
  gender_availability: string;
  image_url?: string;
  status: string;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceResponse {
  id: number;
  salon_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  discount_price?: number;
  category: string;
  gender_availability: string;
  image_url?: string;
  status: string;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
  message?: string;
  success?: boolean;
}

export interface ServicesListResponse {
  services: ServiceData[];
  message: string;
  success: boolean;
}

// Availability types
export interface AvailableBarber {
  barber_id: number;
  name: string;
  image_url?: string;
  experience_years: number;
  specialties: string[];
  ratings: number;
  can_perform_services: boolean;
  serves_gender: string; // 'MALE' | 'FEMALE' | 'BOTH'
}

export interface AvailableBarbersResponse {
  available_barbers: AvailableBarber[];
  total_barbers: number;
  total_service_providers: number;
  total_employees: number;
  message: string;
  success: boolean;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  unavailable_reason?: string | null;
}

export interface TimeSlotResponse {
  available_slots: TimeSlot[];
  barber_id: number | null;
  barber_name: string | null;
  total_duration_minutes: number | null;
  buffer_time_minutes: number;
  message: string;
  success: boolean;
}

export interface CreateAppointmentRequest {
  salonId: number;
  serviceIds: number[];
  employeeId: number;
  appointmentDate: string; // "2024-08-15T14:00:00"
  estimatedEndTime: string; // "2024-08-15T15:00:00"
  servicePrice: number;
  discountAmount?: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerGender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface AppointmentService {
  service_id: number;
  service_name: string;
  duration_minutes: number;
  price: number;
}

export interface CreateAppointmentResponse {
  // Fields that might be returned by API
  appointment_id?: number | null;
  appointment_number?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  barber_id?: number | null;
  barber_name?: string | null;
  services?: AppointmentService[] | null;
  appointment_date?: string | null;
  estimated_end_time?: string | null;
  total_duration_minutes?: number | null;
  total_amount?: number | null;
  status?: string | null;
  message?: string;
  success?: boolean;
  created_at?: string | null;
  
  // Actual API response fields (camelCase format)
  id?: number;
  appointmentNumber?: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  serviceId?: number;
  serviceName?: string;
  employeeId?: number;
  employeeName?: string;
  salonId?: number;
  salonName?: string;
  appointmentDate?: string;
  estimatedEndTime?: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  paymentStatus?: string;
  servicePrice?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  paymentMethod?: string | null;
  customerNotes?: string;
  internalNotes?: string;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  reminderSent?: boolean;
  confirmationSent?: boolean;
  rating?: number | null;
  review?: string | null;
  reviewDate?: string | null;
  createdDate?: string;
  lastModifiedDate?: string;
}

// New Appointment Management Interfaces
export interface AppointmentDetails {
  id: number;
  appointmentNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceId: number;
  serviceName: string;
  employeeId: number;
  employeeName: string;
  salonId: number;
  appointmentDate: string;
  estimatedEndTime: string;
  status: string;
  paymentStatus: string;
  servicePrice: number;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  viewContext?: string; // 'payment-pending' | 'today-appointments' | 'all-appointments'
  availableActions?: AppointmentActions;
}

export interface AppointmentActions {
  canEdit: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canConfirmPayment: boolean;
  statusDisplay?: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate: string;
  estimatedEndTime: string;
  serviceIds: number[];
  employeeId: number;
  servicePrice: number;
  discountAmount?: number;
}

export interface UpdateAppointmentResponse {
  id: number;
  appointmentDate: string;
  estimatedEndTime: string;
  servicePrice: number;
  discountAmount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface CancelAppointmentRequest {
  userRole: 'RECEPTION' | 'OWNER' | 'ADMIN';
  reason?: string;
  cancelledBy?: string;
}

export interface CancelAppointmentResponse {
  id: number;
  status: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt: string;
  message: string;
}

export interface ConfirmPaymentResponse {
  id: number;
  paymentStatus: string;
  paidAmount: number;
  totalAmount?: number;
  updatedAt?: string;
  message: string;
}

export interface CompleteSessionResponse {
  id: number;
  status: string;
  actualEndTime: string;
  updatedAt?: string;
  message: string;
}

export interface AvailableActionsResponse {
  status: string;
  paymentStatus?: string;
  actions: AppointmentActions;
}

// Appointment List Interfaces
export interface AppointmentListItem {
  id: number;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  employeeName: string;
  appointmentDate: string;
  estimatedEndTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  servicePrice: number;
  totalAmount: number;
  paidAmount: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListResponse {
  success: boolean;
  message: string;
  appointments: AppointmentListItem[];
  totalCount: number;
  page?: number;
  limit?: number;
}

export interface GetAppointmentsRequest {
  salonId: number;
  date?: string; // YYYY-MM-DD format
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  page?: number;
  limit?: number;
}

// Export singleton instance
export const apiService = new ApiService();

// Export API configuration for easy updates
export { ENDPOINTS };

// Export environment configuration getter
export const getApiBaseUrl = () => getCurrentConfig().API_BASE_URL;
