import React, { useState, useEffect, useCallback } from 'react';

// Config for API base URL (Vite uses import.meta.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api/v1';
import { X, User, Mail, Phone, MapPin, DollarSign, Clock, Users, Shield } from 'lucide-react';
import { apiService, EmployeeRegistrationRequest, EmployeeWeeklySchedule, BranchResponse } from '../../services/api';
import { useToast } from '../../contexts/ToastProvider';

interface AddEmployeeModalProps {
  onClose: () => void;
  onAdd: (employee: any) => void;
  salonId: number;
  branchId: number; // Keep for now, but will be replaced by selected branch
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onAdd, salonId, branchId }) => {
  const { showSuccess, showError } = useToast();
  
  // Branch state
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(branchId);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    role: 'BARBER' as 'RECEPTIONIST' | 'BARBER',
    address: '',
    specializations: [] as string[],
    baseSalary: 25000,
    ratings: 3,
    experienceYears: 1,
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    notes: '',
    username: '', // Only for reception
    password: '', // Only for reception
  });

  const [weeklySchedule, setWeeklySchedule] = useState<EmployeeWeeklySchedule>({
    monday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
    tuesday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
    wednesday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
    thursday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
    friday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
    saturday: { openTime: '10:00', closeTime: '16:00', isOpen: true },
    sunday: { openTime: '10:00', closeTime: '16:00', isOpen: false },
  });

  const [specializationInput, setSpecializationInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load branches when component mounts
  useEffect(() => {
    loadBranches();
  }, [salonId]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const branchData = await apiService.getActiveBranches(salonId);
      setBranches(branchData);
      
      // If current branchId is not in the list, select the first available branch
      if (branchData.length > 0 && !branchData.find(b => b.branchId === branchId)) {
        setSelectedBranchId(branchData[0].branchId);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      showError('Error', 'Failed to load branch information. Please try again.');
    } finally {
      setLoadingBranches(false);
    }
  };

  // Predefined specializations for receptionist only
  const receptionistSpecializations = [
    'Customer Service',
    'Appointment Management',
    'Phone Handling',
    'Payment Processing',
    'Reception Management',
    'Customer Relations',
    'Administrative Tasks'
  ];

  // State for dynamic barber services (specializations) and gender options
  const [barberServices, setBarberServices] = useState<{ id: number; name: string }[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch barber services from API based on gender and extract available gender options
  const fetchBarberServices = useCallback(async (gender: string) => {
    setLoadingServices(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/services/booking?salonId=${salonId}&gender=${gender}`
      );
      const data = await response.json();
      setBarberServices(Array.isArray(data) ? data.map((service: any) => ({ id: service.id, name: service.name })) : []);
      // Extract unique gender_availability from API response for gender dropdown
      if (Array.isArray(data)) {
        const uniqueGenders = Array.from(new Set(data.map((s: any) => s.gender_availability?.toUpperCase()))).filter(Boolean);
        const genderDropdownOptions = uniqueGenders.map(g => ({
          value: g,
          label: g.charAt(0) + g.slice(1).toLowerCase()
        }));
        setGenderOptions(genderDropdownOptions);
      }
    } catch (error) {
      setBarberServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, [salonId]);

  // Fetch services when role or gender changes
  // Only clear specializations when gender changes, not on every render
  useEffect(() => {
    if (formData.role === 'BARBER') {
      fetchBarberServices(formData.gender);
      setFormData(prev => ({ ...prev, specializations: [] }));
    }
    // eslint-disable-next-line
  }, [formData.gender, formData.role, fetchBarberServices]);

  const getCurrentSpecializations = () => {
    if (formData.role === 'RECEPTIONIST') return receptionistSpecializations;
    // For BARBER, only show API-fetched services, never fallback to any hardcoded values
    if (formData.role === 'BARBER') {
      if (loadingServices) return [];
      return barberServices.map(s => s.name);
    }
    return [];
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day: keyof EmployeeWeeklySchedule, field: keyof EmployeeWeeklySchedule['monday'], value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        [field]: value
      }
    }));
  };

  const addSpecialization = () => {
    if (specializationInput.trim() && !formData.specializations.includes(specializationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specializationInput.trim()]
      }));
      setSpecializationInput('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const addPredefinedSpecialization = (spec: string) => {
    if (!formData.specializations.includes(spec)) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, spec]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Debug: Check authentication status
      const authToken = apiService.getAuthToken();
      const localStorageToken = localStorage.getItem('authToken');
      
      console.log('🔐 [DEBUG] Auth token from apiService:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
      console.log('🔐 [DEBUG] Auth token from localStorage:', localStorageToken ? `${localStorageToken.substring(0, 20)}...` : 'null');
      console.log('🔐 [DEBUG] Tokens match:', authToken === localStorageToken);
      console.log('🔐 [DEBUG] Auth token length:', authToken?.length || 0);
      
      if (!authToken) {
        console.error('❌ [AUTH] No authentication token found');
        throw new Error('Authentication required. Please login again.');
      }

      // Validation
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        throw new Error('First name and last name are required');
      }

      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      if (!formData.phoneNumber.trim() || formData.phoneNumber.length !== 9) {
        throw new Error('Phone number must be exactly 9 digits');
      }

      if (formData.role === 'RECEPTIONIST' && (!formData.username.trim() || !formData.password.trim())) {
        throw new Error('Username and password are required for reception staff');
      }

      if (formData.specializations.length === 0) {
        throw new Error('At least one specialization is required');
      }

      if (!selectedBranchId) {
        throw new Error('Please select a branch for the employee');
      }

      // Prepare API request data
      const employeeData: EmployeeRegistrationRequest = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        role: formData.role,
        branch_id: selectedBranchId,
        address: formData.address,
        specializations: formData.specializations,
        base_salary: formData.baseSalary,
        ratings: formData.ratings,
        experience_years: formData.experienceYears,
        emergency_contact_name: formData.emergencyContact,
        emergency_contact_phone: formData.emergencyPhone,
        emergency_relationship: formData.emergencyRelationship,
        weekly_schedule: JSON.stringify(weeklySchedule),
        salon_id: salonId,
        ...(formData.role === 'RECEPTIONIST' && {
          username: formData.username,
          password: formData.password,
        }),
      };

      console.log('🧑‍💼 [EMPLOYEE] Creating employee:', employeeData);

      // Debug: Check if authentication token is available
      const token = apiService.getAuthToken();
      console.log('🔐 [AUTH DEBUG] Token available:', !!token);
      if (!token) {
        throw new Error('No authentication token available. Please login again.');
      }

      console.log('🌐 [API DEBUG] About to call createEmployee');
      console.log('📋 [API DEBUG] Employee data:', {
        ...employeeData,
        password: employeeData.password ? '[HIDDEN]' : undefined
      });
      console.log('🔐 [API DEBUG] Token being used:', token.substring(0, 30) + '...');

      // Call API
      const response = await apiService.createEmployee(employeeData);

      console.log('✅ [EMPLOYEE] Employee created successfully:', response);

      // Show success message
      showSuccess(
        'Employee Added Successfully!',
        `${formData.firstName} ${formData.lastName} has been added as ${formData.role.toLowerCase()}`
      );

      // Call the onAdd callback to update local state
      onAdd({
        id: response.employee_id?.toString() || Math.random().toString(36).substr(2, 9),
        ...formData,
        salonId: salonId.toString(),
        branchId: selectedBranchId.toString(),
        isActive: true,
        createdAt: new Date(),
      });

      // Close modal
      onClose();

    } catch (error) {
      console.error('❌ [EMPLOYEE] Failed to create employee:', error);
      
      let errorMessage = 'Failed to add employee. Please try again.';
      if (error instanceof Error) {
        console.error('❌ [ERROR DETAILS]:', error.message);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
          errorMessage = 'Authentication failed. Please check your login status and try again.';
        } else if (error.message.includes('No authentication token')) {
          errorMessage = 'Session expired. Please login again to continue.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid employee data. Please check all fields and try again.';
        } else if (error.message.includes('409')) {
          errorMessage = 'An employee with this email already exists.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection and server status.';
        }
      }
      
      showError('Employee Creation Failed', errorMessage);
      // Modal stays open so user can retry or make corrections
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 9);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Add New Employee</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</div>
              <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={genderOptions.length === 0}
                >
                  {genderOptions.length === 0 ? (
                    <option value="">No gender options available</option>
                  ) : (
                    genderOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    handleInputChange('role', e.target.value as 'RECEPTIONIST' | 'BARBER');
                    // Clear specializations when role changes
                    setFormData(prev => ({ ...prev, specializations: [] }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="BARBER">Barber</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
                {loadingBranches ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="animate-pulse text-gray-500">Loading branches...</div>
                  </div>
                ) : (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">2</div>
              <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="employee@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                    +94
                  </span>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="123456789"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 9 digits only (without +94)</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter full address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Any additional notes about the employee"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Credentials (Only for Reception) */}
          {formData.role === 'RECEPTIONIST' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">3</div>
                <h4 className="text-lg font-semibold text-gray-900">Login Credentials</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                    minLength={8}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Professional Details */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {formData.role === 'RECEPTIONIST' ? '4' : '3'}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Professional Details</h4>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Base Salary *
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleInputChange('baseSalary', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="25000"
                    min={0}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="1"
                    min={0}
                    max={50}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Specializations *
                </label>
                
                {/* Quick Add Buttons */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Quick add {formData.role.toLowerCase()} specializations:</p>
                  {formData.role === 'BARBER' && loadingServices ? (
                    <div className="text-sm text-gray-500">Loading services...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getCurrentSpecializations().map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => addPredefinedSpecialization(spec)}
                          disabled={formData.specializations.includes(spec)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            formData.specializations.includes(spec)
                              ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                          }`}
                        >
                          {spec} {formData.specializations.includes(spec) && '✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Add */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Add custom specialization"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                  />
                  <button
                    type="button"
                    onClick={addSpecialization}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Specializations */}
                <div className="flex flex-wrap gap-2">
                  {formData.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {formData.specializations.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">At least one specialization is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Emergency Contact */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {formData.role === 'RECEPTIONIST' ? '5' : '4'}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Emergency Contact</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Emergency contact name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                    +94
                  </span>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', formatPhoneNumber(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="123456789"
                    maxLength={9}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 9 digits only (without +94)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                <input
                  type="text"
                  value={formData.emergencyRelationship}
                  onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Spouse, Parent, Sibling"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 6: Weekly Schedule */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {formData.role === 'RECEPTIONIST' ? '6' : '5'}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">
                <Clock className="w-5 h-5 inline mr-2" />
                Weekly Schedule
              </h4>
            </div>
            
            <div className="space-y-4">
              {daysOfWeek.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-20">
                    <span className="font-medium text-gray-700">{label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={weeklySchedule[key].isOpen}
                      onChange={(e) => handleScheduleChange(key, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Working</span>
                  </div>
                  
                  {weeklySchedule[key].isOpen && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Open Time</label>
                        <input
                          type="time"
                          value={weeklySchedule[key].openTime}
                          onChange={(e) => handleScheduleChange(key, 'openTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Close Time</label>
                        <input
                          type="time"
                          value={weeklySchedule[key].closeTime}
                          onChange={(e) => handleScheduleChange(key, 'closeTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.specializations.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                  Adding Employee...
                </div>
              ) : (
                'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
