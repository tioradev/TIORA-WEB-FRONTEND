export interface User {
  id: string;
  name: string;
  email: string;
  role: 'reception' | 'owner' | 'super-admin';
  profilePicture?: string;
  salonId?: string; // For reception and owner roles
  salon?: SalonInfo; // For owner role - will contain full salon details
  employee?: EmployeeInfo; // For reception role - will contain employee details
}

export interface EmployeeInfo {
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
}

export interface SalonInfo {
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
}

export interface Salon {
  id: string;
  name: string;
  businessName: string;
  salonEmail: string;
  branchName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  username?: string;
  defaultPassword?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  registrationNumber?: string;
  taxId?: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  isActive: boolean;
  systemStatus: 'online' | 'offline' | 'maintenance' | 'error';
  lastActiveDate: Date;
  totalEmployees: number;
  totalCustomers: number;
  monthlyRevenue: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  features: string[];
  branchCount: number;
  latitude?: string;
  longitude?: string;
}

export interface Barber {
  id: string;
  salonId: string;
  profilePicture?: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  experience: number;
  specializedArea: string;
  isActive: boolean;
  createdAt: Date;
  salary?: number;
  employeeId?: string;
  address?: string;
  emergencyContact?: string;
  joiningDate?: Date;
  lastActiveDate?: Date;
  commissionRate?: number;
  performanceRating?: number;
  trainingModules?: TrainingModule[];
  shifts?: Shift[];
  role?: 'barber' | 'reception' | 'branch-manager';
  username?: string;
}

export interface Service {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  type: string;
  category: 'hair' | 'beard' | 'styling' | 'treatment' | 'coloring' | 'spa';
  duration: number; // in minutes
  price: number;
  discountPrice?: number;
  isActive: boolean;
  requiredSkills?: string[];
  availableForGender: 'male' | 'female' | 'both';
  imageUrl?: string;
  popularity: number; // 1-5 rating
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // user id who created the service
  profitMargin?: number;
  productUsage?: ProductUsage[];
}

export interface Appointment {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerGender?: 'male' | 'female';
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  // Store original API IDs for editing appointments
  originalEmployeeId?: number;
  originalServiceId?: number;
  date: string;
  timeSlot: string;
  status: 'booked' | 'in-progress' | 'completed' | 'payment-pending' | 'paid' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'digital' | 'upi';
  amount: number;
  discountAmount?: number;
  finalAmount: number;
  tipAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LeaveRequest {
  id: string;
  salonId: string;
  barberId: string;
  barberName: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Earning {
  salonId: string;
  date: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: string;
  commission?: number; // barber commission percentage
  salonEarning?: number; // salon's share
}

export interface Customer {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  address?: string;
  preferences?: string[];
  lastVisit?: Date;
  totalVisits: number;
  totalSpent: number;
  lifetimeValue: number;
  isActive: boolean;
  createdAt: Date;
  loyaltyPoints?: number;
  membershipType?: 'basic' | 'premium' | 'vip';
}

export interface AuditReport {
  id: string;
  reportType: 'income' | 'expense' | 'employee' | 'customer' | 'service' | 'salon-overview' | 'system-analytics';
  generatedBy: string;
  generatedAt: Date;
  salonId?: string; // Optional for salon-specific reports
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: any;
  totalRecords: number;
  summary: {
    totalIncome?: number;
    totalExpenses?: number;
    netProfit?: number;
    employeeCount?: number;
    activeCustomers?: number;
    activeSalons?: number;
    systemUptime?: number;
  };
}

export interface Expense {
  id: string;
  salonId: string;
  category: 'salary' | 'rent' | 'utilities' | 'supplies' | 'maintenance' | 'marketing' | 'subscription' | 'other';
  description: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'cheque';
  receipt?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SalonBranch {
  id: string;
  salonId: string;
  name: string;
  address: string;
  description?: string; // Add description field
  phone: string;
  email: string;
  managerId?: string;
  isActive: boolean;
  image?: string;
  employeeCount?: number;
  openingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  createdAt: Date;
}

export interface SystemAnalytics {
  totalSalons: number;
  activeSalons: number;
  inactiveSalons: number;
  totalCustomers: number;
  totalEmployees: number;
  totalRevenue: number;
  systemUptime: number;
  errorRate: number;
  averageResponseTime: number;
  subscriptionBreakdown: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  geographicDistribution: {
    [country: string]: number;
  };
  monthlyGrowth: number;
  customerSatisfaction: number;
}

// New interfaces for enhanced features

export interface InventoryItem {
  id: string;
  salonId: string;
  name: string;
  category: 'shampoo' | 'conditioner' | 'styling-product' | 'tools' | 'equipment' | 'other';
  brand: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number;
  supplierId: string;
  supplierName: string;
  lastRestocked: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  salonId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  isActive: boolean;
  rating: number;
  createdAt: Date;
}

export interface ProductUsage {
  productId: string;
  productName: string;
  quantityUsed: number;
  costPerUnit: number;
}

export interface StockAlert {
  id: string;
  salonId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  minStockLevel: number;
  alertType: 'low-stock' | 'out-of-stock' | 'expiring-soon';
  createdAt: Date;
  isResolved: boolean;
}

export interface Shift {
  id: string;
  salonId: string;
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // in hours
  category: 'technical' | 'customer-service' | 'safety' | 'product-knowledge';
  isCompleted: boolean;
  completedDate?: Date;
  score?: number;
  certificateUrl?: string;
}

export interface PayrollRecord {
  id: string;
  salonId: string;
  barberId: string;
  barberName: string;
  period: string; // YYYY-MM format
  baseSalary: number;
  commissionEarned: number;
  bonuses: number;
  deductions: number;
  totalPay: number;
  paymentDate: Date;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface Promotion {
  id: string;
  salonId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// API-compatible promotion interfaces
export interface PromotionResponse {
  promotionId: number;
  promotionName: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  active: boolean;
  currentlyValid: boolean;
  expired: boolean;
  upcoming: boolean;
}

export interface PromotionRequest {
  promotionName: string;
  description: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Integration {
  id: string;
  salonId: string;
  type: 'pos' | 'accounting' | 'social-media' | 'calendar' | 'booking-platform';
  name: string;
  isActive: boolean;
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: Date;
  syncStatus: 'success' | 'failed' | 'pending';
  settings: Record<string, any>;
}

export interface RevenueAnalytics {
  salonId: string;
  period: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  averageTicketSize: number;
  customerCount: number;
  appointmentCount: number;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    count: number;
  }>;
  topBarbers: Array<{
    barberId: string;
    barberName: string;
    revenue: number;
    appointmentCount: number;
  }>;
}

export interface CustomerAnalytics {
  salonId: string;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  retentionRate: number;
  churnRate: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    visitCount: number;
  }>;
}

// Pagination interfaces
export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}