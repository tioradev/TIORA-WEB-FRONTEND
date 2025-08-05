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

// Export singleton instance
export const apiService = new ApiService();

// Export API configuration for easy updates
export { ENDPOINTS };

// Export environment configuration getter
export const getApiBaseUrl = () => getCurrentConfig().API_BASE_URL;
