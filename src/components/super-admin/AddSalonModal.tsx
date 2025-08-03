import React, { useState, useEffect } from 'react';
import { Mail, Navigation, X } from 'lucide-react';
import { Salon } from '../../types';
import { useToast } from '../../contexts/ToastProvider';
import { apiService, SalonRegistrationRequest, ENDPOINTS } from '../../services/api';
import { getCurrentConfig } from '../../config/environment';

interface AddSalonModalProps {
  onClose: () => void;
  onAdd: (salon: Omit<Salon, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
}

const AddSalonModal: React.FC<AddSalonModalProps> = ({ onClose, onAdd }) => {
  const { showSuccess, showError } = useToast();
  
  // Initialize logging
  useEffect(() => {
    console.log('🏢 [MODAL] Add Salon Modal opened');
    console.log('📋 [FORM] Form initialized with default values');
    console.log('🌍 [LOCATION] Location services available:', !!navigator.geolocation);
    console.log('⏰ [TIMESTAMP] Modal opened at:', new Date().toISOString());
    
    return () => {
      console.log('🚪 [MODAL] Add Salon Modal closed');
    };
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    salonEmail: '',
    branchName: '',
    branchEmail: '',
    branchPhoneNumber: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    username: '',
    defaultPassword: '',
    address: '',
    district: '',
    postalCode: '',
    brNumber: '',
    taxId: '',
    imageUrl: '', // For base64 image data
    latitude: null as number | null,
    longitude: null as number | null,
    isActive: true,
    systemStatus: 'online' as 'online' | 'offline' | 'maintenance' | 'error',
    lastActiveDate: new Date(),
    totalEmployees: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    features: ['appointment-booking', 'payment-processing'],
    branchCount: 1,
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Log form field changes for important fields
  const handleFormChange = (field: string, value: any) => {
    const importantFields = ['name', 'salonEmail', 'branchName', 'ownerEmail', 'username', 'province', 'district', 'ownerFirstName', 'ownerLastName'];
    if (importantFields.includes(field)) {
      console.log(`📝 [FORM CHANGE] ${field} updated:`, value);
    }
    setFormData({ ...formData, [field]: value });
  };

  // Helper function to calculate form completion percentage
  const getFormCompletionLevel = () => {
    const requiredFields = [
      formData.name, formData.salonEmail, formData.branchName,
      formData.ownerFirstName, formData.ownerLastName, formData.ownerEmail, formData.ownerPhone, 
      formData.username, formData.defaultPassword, formData.address, formData.district, 
      formData.postalCode, formData.branchEmail, formData.branchPhoneNumber, formData.brNumber, formData.taxId
    ];
    const completedFields = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // Sri Lankan districts
  const districts = [
    'Colombo', 'Gampaha', 'Kalutara',
    'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota',
    'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
    'Trincomalee', 'Batticaloa', 'Ampara',
    'Kurunegala', 'Puttalam',
    'Anuradhapura', 'Polonnaruwa',
    'Badulla', 'Monaragala',
    'Ratnapura', 'Kegalle'
  ];
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Please select an image smaller than 5MB');
      return;
    }

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Convert to base64 and store in form data
      const base64 = await convertImageToBase64(file);
      setFormData({ ...formData, imageUrl: base64 });
      
      showSuccess('Image Uploaded', 'Image uploaded successfully');
    } catch (error) {
      showError('Upload Failed', 'Failed to process image');
    }
  };

  // Helper function to format phone number
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Take only first 9 digits
    return digits.slice(0, 9);
  };

  // Helper function to handle phone number input
  const handlePhoneChange = (field: string, value: string) => {
    const formattedValue = formatPhoneNumber(value);
    setFormData({ ...formData, [field]: formattedValue });
  };

  // Helper function to open Google Maps for location browsing
  const openGoogleMaps = () => {
    const query = formData.address ? encodeURIComponent(formData.address) : 'Sri Lanka';
    const url = `https://maps.google.com/?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Helper function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation Error', 'Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          latitude: latitude,
          longitude: longitude
        });
        setIsGettingLocation(false);
        showSuccess('Location Retrieved', `Coordinates set to ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        console.log('📍 [LOCATION] Current location retrieved:', { latitude, longitude });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        showError('Location Error', errorMessage);
        console.error('❌ [LOCATION] Failed to get current location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🏢 [SALON REGISTRATION] Starting registration process...');
    console.log('📝 [FORM DATA] Validating form data:', {
      salonName: formData.name,
      salonEmail: formData.salonEmail,
      branchName: formData.branchName,
      branchEmail: formData.branchEmail,
      branchPhoneNumber: formData.branchPhoneNumber,
      ownerFirstName: formData.ownerFirstName,
      ownerLastName: formData.ownerLastName,
      ownerEmail: formData.ownerEmail,
      ownerPhone: formData.ownerPhone,
      username: formData.username,
      passwordLength: formData.defaultPassword.length,
      address: formData.address,
      district: formData.district,
      postalCode: formData.postalCode,
      hasLocation: !!(formData.latitude && formData.longitude),
      brNumber: formData.brNumber,
      taxId: formData.taxId
    });
    
    // Validate password strength
    if (formData.defaultPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters long.';
      console.error('❌ [VALIDATION ERROR] Password too short:', formData.defaultPassword.length);
      showError('Validation Error', errorMsg);
      return;
    }
    
    console.log('✅ [VALIDATION] All form validations passed');
    
    try {
      // Prepare API request data
      const apiRequestData: SalonRegistrationRequest = {
        name: formData.name,
        address: formData.address,
        district: formData.district,
        postalCode: formData.postalCode,
        phoneNumber: formData.ownerPhone, // Remove +94 prefix to match your example
        email: formData.salonEmail,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        ownerPhone: formData.ownerPhone, // Remove +94 prefix to match your example
        ownerEmail: formData.ownerEmail,
        brNumber: formData.brNumber,
        taxId: formData.taxId,
        imageUrl: formData.imageUrl || '',
        latitude: formData.latitude ? formData.latitude.toString() : undefined,
        longitude: formData.longitude ? formData.longitude.toString() : undefined,
        username: formData.username,
        password: formData.defaultPassword,
        defaultBranchName: formData.branchName,
        branchEmail: formData.branchEmail,
        branchPhoneNumber: formData.branchPhoneNumber // Remove +94 prefix to match your example
      };
      
      console.log('🌐 [API CALL] Sending request to backend:', {
        endpoint: 'POST /api/v1/salons/comprehensive',
        data: {
          ...apiRequestData,
          password: '[HIDDEN]' // Don't log password
        }
      });
      
      // Call the API
      const response = await apiService.registerSalon(apiRequestData);
      
      console.log('✅ [API SUCCESS] Salon registered successfully:', response);
      
      // Prepare salon data for local state (if needed)
      const salonData = {
        ...formData,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        businessName: formData.name, // Use salon name as business name
        zipCode: formData.postalCode, // Map postalCode to zipCode
        country: 'Sri Lanka', // Default country
        latitude: formData.latitude?.toString() || undefined, // Convert to string
        longitude: formData.longitude?.toString() || undefined, // Convert to string
        subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise',
        subscriptionStatus: 'trial' as 'active' | 'inactive' | 'suspended' | 'trial',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        city: formData.district, // Use district as city for compatibility
        state: 'Sri Lanka', // Default state
      };
      
      console.log('🔧 [DATA PROCESSING] Salon data prepared for local state:', {
        id: response.id || 'api-generated',
        name: salonData.name,
        subscriptionPlan: salonData.subscriptionPlan,
        subscriptionStatus: salonData.subscriptionStatus,
        trialEndDate: salonData.subscriptionEndDate.toISOString(),
        hasCredentials: !!(salonData.username && salonData.defaultPassword)
      });
      
      // Call the onAdd callback to update local state
      onAdd(salonData);
      
      console.log('� [EMAIL] Backend will handle credential email sending');
      
      // Show success toast
      showSuccess(
        'Salon Registered Successfully!',
        `${formData.name} has been registered. Credentials will be sent to ${formData.ownerEmail}`
      );
      
      console.log('✅ [REGISTRATION SUCCESS] Salon registration completed successfully');
      console.log('🎉 [SUMMARY] Registration Summary:', {
        salonName: formData.name,
        ownerName: `${formData.ownerFirstName} ${formData.ownerLastName}`,
        ownerEmail: formData.ownerEmail,
        username: formData.username,
        location: `${formData.district}, Sri Lanka`,
        coordinates: formData.latitude && formData.longitude ? 
          `${formData.latitude}, ${formData.longitude}` : 'Not provided',
        registrationTime: new Date().toISOString(),
        trialEndDate: salonData.subscriptionEndDate.toISOString(),
        apiResponse: response
      });
      
      // Close modal after brief delay to show toast
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ [REGISTRATION ERROR] Failed to register salon:', error);
      
      // Show appropriate error message based on error type
      let errorMessage = 'Failed to register salon. Please try again or contact support.';
      let detailedError = '';
      
      if (error instanceof Error) {
        detailedError = error.message;
        console.error('❌ [ERROR DETAILS]:', {
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes('HTTP error! status: 400')) {
          errorMessage = 'Invalid salon data. Please check all fields and try again.';
        } else if (error.message.includes('HTTP error! status: 401')) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.message.includes('HTTP error! status: 409')) {
          errorMessage = 'A salon with this email or username already exists.';
        } else if (error.message.includes('HTTP error! status: 500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection and server status.';
        }
      }
      
      // Add more debugging information
      console.error('❌ [DEBUG INFO]:', {
        apiUrl: getCurrentConfig().API_BASE_URL,
        endpoint: ENDPOINTS.SALONS.REGISTER,
        fullUrl: `${getCurrentConfig().API_BASE_URL}${ENDPOINTS.SALONS.REGISTER}`,
        errorType: typeof error,
        errorMessage: detailedError
      });
      
      showError('Registration Failed', errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Register New Salon</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Registration Progress</span>
              <span className="font-medium">{getFormCompletionLevel()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getFormCompletionLevel()}%` }}
              ></div>
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</div>
              <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salon Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter salon name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salon Email *</label>
                  <input
                    type="email"
                    value={formData.salonEmail}
                    onChange={(e) => handleFormChange('salonEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="salon@example.com"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salon Image</label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white"
                      id="salon-image"
                    />
                    <p className="text-xs text-gray-500 mt-2">Maximum 5MB • JPG, PNG, GIF formats supported</p>
                  </div>
                  {imagePreview && (
                    <div className="w-24 h-24 border-2 border-red-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <img 
                        src={imagePreview} 
                        alt="Salon Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Branch & Owner Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">2</div>
              <h4 className="text-lg font-semibold text-gray-900">Branch & Owner Information</h4>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => handleFormChange('branchName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Main Branch, Downtown Branch, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Email</label>
                  <input
                    type="email"
                    value={formData.branchEmail}
                    onChange={(e) => setFormData({ ...formData, branchEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="branch@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                      +94
                    </span>
                    <input
                      type="tel"
                      value={formData.branchPhoneNumber}
                      onChange={(e) => handlePhoneChange('branchPhoneNumber', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="123456789"
                      maxLength={9}
                      pattern="[0-9]{9}"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter 9 digits only (without +94)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner First Name</label>
                  <input
                    type="text"
                    value={formData.ownerFirstName}
                    onChange={(e) => handleFormChange('ownerFirstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Last Name</label>
                  <input
                    type="text"
                    value={formData.ownerLastName}
                    onChange={(e) => handleFormChange('ownerLastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => handleFormChange('ownerEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                      +94
                    </span>
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => handlePhoneChange('ownerPhone', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="123456789"
                      maxLength={9}
                      pattern="[0-9]{9}"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter 9 digits only (without +94)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Owner Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">3</div>
              <h4 className="text-lg font-semibold text-gray-900">Salon Owner Login Credentials</h4>
            </div>
            <p className="text-sm text-gray-600">These credentials will be used by the salon owner to access the salon management system.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleFormChange('username', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter username for salon owner"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will be used to login to the salon management portal</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Password</label>
                <input
                  type="password"
                  value={formData.defaultPassword}
                  onChange={(e) => setFormData({ ...formData, defaultPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter default password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters. Owner will be prompted to change on first login.</p>
              </div>
            </div>
            
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Automatic Email Notification</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Login credentials will be automatically sent to the owner's email address after successful registration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Location Information */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">4</div>
              <h4 className="text-lg font-semibold text-gray-900">Location Information</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select District</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., 10100"
                  required
                />
              </div>
            </div>

            {/* Google Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">Location & Coordinates</h5>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isGettingLocation
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isGettingLocation ? 'Getting Location...' : 'Get Current Location'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Browse on Google Maps</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 6.9271"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 79.8612"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                Click "Get Current Location" to automatically detect your coordinates, use "Browse on Google Maps" to find exact coordinates, or enter them manually if known.
              </p>
            </div>
          </div>

          {/* Section 5: Business Registration */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">5</div>
              <h4 className="text-lg font-semibold text-gray-900">Business Registration</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Registration Number</label>
                <input
                  type="text"
                  value={formData.brNumber}
                  onChange={(e) => setFormData({ ...formData, brNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="BR/XXX/XXXX"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Identification Number</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="TIN Number"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                console.log('❌ [MODAL] User cancelled salon registration');
                console.log('📊 [FORM STATE] Form data at cancellation:', {
                  hasBasicInfo: !!(formData.name && formData.ownerEmail),
                  hasCredentials: !!(formData.username && formData.defaultPassword),
                  hasLocation: !!(formData.latitude && formData.longitude),
                  completionLevel: `${getFormCompletionLevel()}%`
                });
                onClose();
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200"
            >
              Register Salon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalonModal;