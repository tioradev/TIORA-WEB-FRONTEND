import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, SalonInfo, EmployeeInfo } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  salon: SalonInfo | null;
  employee: EmployeeInfo | null;
  login: (userData: User, token?: string, salonData?: SalonInfo, employeeData?: EmployeeInfo) => void;
  logout: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  getSalonId: () => number | null;
  getSalonName: () => string | null;
  getBranchId: () => number | null;
  getOwnerInfo: () => { firstName: string; lastName: string; fullName: string } | null;
  getEmployeeInfo: () => EmployeeInfo | null;
  isReceptionUser: () => boolean;
  isOwnerUser: () => boolean;
  updateSalonInfo: (updatedSalon: Partial<SalonInfo>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load user, salon, and employee data from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedSalon = localStorage.getItem('salon');
    const savedEmployee = localStorage.getItem('employee');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Load salon data if available (for salon owners)
        if (savedSalon) {
          const salonData = JSON.parse(savedSalon);
          setSalon(salonData);
        }
        
        // Load employee data if available (for reception staff)
        if (savedEmployee) {
          const employeeData = JSON.parse(savedEmployee);
          setEmployee(employeeData);
        }
        
        // Ensure API service has the token
        apiService.setAuthToken(authToken);
        console.log('🔐 [AUTH] User and token restored from localStorage');
      } catch (error) {
        console.error('❌ [AUTH] Failed to restore user session:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('salon');
        localStorage.removeItem('employee');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = (userData: User, token?: string, salonData?: SalonInfo, employeeData?: EmployeeInfo) => {
    setUser(userData);
    setSalon(salonData || null);
    setEmployee(employeeData || null);
    
    // Set the auth token in API service if provided
    if (token) {
      apiService.setAuthToken(token);
      localStorage.setItem('authToken', token);
    }
    
    // Save user data to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Save salon data if provided (for salon owners)
    if (salonData) {
      localStorage.setItem('salon', JSON.stringify(salonData));
    }
    
    // Save employee data if provided (for reception staff)
    if (employeeData) {
      localStorage.setItem('employee', JSON.stringify(employeeData));
    }
    
    console.log('✅ [AUTH] User logged in and saved to localStorage');
    if (token) {
      console.log('🔐 [AUTH] Auth token set and saved');
    }
    if (salonData) {
      console.log('🏢 [AUTH] Salon data saved to localStorage:', salonData.name);
    }
    if (employeeData) {
      console.log('👤 [AUTH] Employee data saved to localStorage:', employeeData.fullName);
    }
  };

  const logout = () => {
    setUser(null);
    setSalon(null);
    setEmployee(null);
    
    // Clear user data, salon data, employee data, and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('salon');
    localStorage.removeItem('employee');
    localStorage.removeItem('authToken');
    
    // Clear token from API service
    apiService.clearAuthToken();
    console.log('🔓 [AUTH] User logged out and data cleared');
  };

  const getSalonId = (): number | null => {
    // For salon owners, get from salon data
    if (salon?.salonId) {
      return salon.salonId;
    }
    // For reception staff, get from employee data
    if (employee?.salonId) {
      return employee.salonId;
    }
    return null;
  };

  const getSalonName = (): string | null => {
    // For salon owners, get from salon data
    if (salon?.name) {
      return salon.name;
    }
    // For reception staff, get from employee data
    if (employee?.salonName) {
      return employee.salonName;
    }
    return null;
  };

  const getBranchId = (): number | null => {
    // For reception staff, get from employee data
    if (employee?.branchId) {
      return employee.branchId;
    }
    // For salon owners, get from salon default branch (if available)
    if (salon?.defaultBranchId) {
      return salon.defaultBranchId;
    }
    return null;
  };

  const getOwnerInfo = (): { firstName: string; lastName: string; fullName: string } | null => {
    if (!salon) return null;
    
    return {
      firstName: salon.ownerFirstName,
      lastName: salon.ownerLastName,
      fullName: salon.fullOwnerName
    };
  };

  const getEmployeeInfo = (): EmployeeInfo | null => {
    return employee;
  };

  const isReceptionUser = (): boolean => {
    return user?.role === 'reception';
  };

  const isOwnerUser = (): boolean => {
    return user?.role === 'owner';
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const updateSalonInfo = (updatedSalon: Partial<SalonInfo>) => {
    if (salon) {
      const newSalonInfo = { ...salon, ...updatedSalon };
      setSalon(newSalonInfo);
      
      // Also update localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.salon = newSalonInfo;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
      
      console.log('Salon info updated in AuthContext:', newSalonInfo);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      salon,
      employee,
      login, 
      logout, 
      isProfileModalOpen, 
      openProfileModal, 
      closeProfileModal,
      getSalonId,
      getSalonName,
      getBranchId,
      getOwnerInfo,
      getEmployeeInfo,
      isReceptionUser,
      isOwnerUser,
      updateSalonInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};
