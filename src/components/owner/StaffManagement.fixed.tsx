import React, { useState } from 'react';
import { 
  User, Phone, Clock, DollarSign, Key, X, Save,
  MessageSquare, Star
} from 'lucide-react';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  role: 'barber' | 'reception';
  branchId: string;
  specialties: string[];
  schedule: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  monthlySalary: number;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  username: string;
  password: string;
  salonId: string;
  performanceRating?: number;
  profileImage?: string;
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff;
  onSave: (staff: Omit<Staff, 'id'>) => void;
  branches: Array<{ id: string; name: string }>;
  isSaving?: boolean;
  currentSalonId?: string | number; // Pass the current salon ID
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, staff, onSave, branches, isSaving = false, currentSalonId }) => {
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
    firstName: staff?.firstName || '',
    lastName: staff?.lastName || '',
    gender: staff?.gender || 'male',
    email: staff?.email || '',
    phone: staff?.phone ? (staff.phone.startsWith('+94') ? staff.phone.slice(3) : staff.phone) : '',
    role: staff?.role || 'barber',
    branchId: staff?.branchId || '',
    specialties: staff?.specialties || [],
    schedule: staff?.schedule || {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    monthlySalary: staff?.monthlySalary || 3000,
    status: staff?.status || 'active',
    joinDate: staff?.joinDate || new Date().toISOString().split('T')[0],
    address: staff?.address || '',
    emergencyContact: staff?.emergencyContact || {
      name: '',
      phone: '',
      relationship: ''
    },
    username: staff?.username || '',
    password: staff?.password || '',
    salonId: staff?.salonId || currentSalonId?.toString() || '1',
    performanceRating: staff?.performanceRating || 3
  });

  const [showCredentials, setShowCredentials] = useState(!!staff?.username);
  const isEditMode = !!staff; // Determine if we're editing

  // Reset form when modal opens with different staff data
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: staff?.firstName || '',
        lastName: staff?.lastName || '',
        gender: staff?.gender || 'male',
        email: staff?.email || '',
        phone: staff?.phone ? (staff.phone.startsWith('+94') ? staff.phone.slice(3) : staff.phone) : '',
        role: staff?.role || 'barber',
        branchId: staff?.branchId || '',
        specialties: staff?.specialties || [],
        schedule: staff?.schedule || {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '15:00', available: true },
          sunday: { start: '10:00', end: '14:00', available: false }
        },
        monthlySalary: staff?.monthlySalary || 3000,
        status: staff?.status || 'active',
        joinDate: staff?.joinDate || new Date().toISOString().split('T')[0],
        address: staff?.address || '',
        emergencyContact: staff?.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        username: staff?.username || '',
        password: staff?.password || '',
        salonId: staff?.salonId || currentSalonId?.toString() || '1',
        performanceRating: staff?.performanceRating || 3
      });
      setShowCredentials(!!staff?.username);
    }
  }, [isOpen, staff]);

  const generateUsername = (firstName: string, lastName: string) => {
    const fullName = `${firstName} ${lastName}`;
    return fullName.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateCredentials = () => {
    const username = generateUsername(formData.firstName, formData.lastName);
    const password = generatePassword();
    setFormData(prev => ({ ...prev, username, password }));
    setShowCredentials(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate branch selection
    if (!formData.branchId) {
      alert('Please select a branch for the staff member.');
      return;
    }
    
    // Only require credentials for non-barber roles and only when adding new staff
    if (formData.role !== 'barber' && !isEditMode) {
      if (!formData.username || !formData.password) {
        alert('Please generate login credentials before saving.');
        return;
      }
    }
    
    // Ensure phone number has +94 prefix
    const phoneWithPrefix = formData.phone.startsWith('+94') ? formData.phone : `+94${formData.phone}`;
    
    onSave({
      ...formData,
      phone: phoneWithPrefix
    });
    onClose();
  };

  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters and limit to 9 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, phone: cleanValue }));
  };

  const handleSpecialtyChange = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleScheduleChange = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  if (!isOpen) return null;

  const specialtyOptions = ['Hair Cutting', 'Hair Coloring', 'Styling', 'Beard Grooming', 'Facial', 'Massage', 'Eyebrow Threading'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                    +94
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter 9 digits (e.g., 771234567)"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter 9 digits without the country code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role {isEditMode && <span className="text-xs text-gray-500">(Read-only)</span>}
                </label>
                {isEditMode ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {formData.role === 'barber' ? 'Barber' : 'Reception'}
                  </div>
                ) : (
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Staff['role'] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="barber">Barber</option>
                    <option value="reception">Reception</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                rows={2}
                placeholder="Enter full address"
              />
            </div>
          </div>

          {/* Specialties - Only for barbers */}
          {formData.role === 'barber' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-green-600" />
                Specialties & Skills
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyChange(specialty)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Compensation */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
              Compensation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Salary (LKR)
                </label>
                <input
                  type="number"
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  min="0"
                  step="100"
                  placeholder="Enter monthly salary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Rating (Default)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <div
                      key={rating}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rating <= 3
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </div>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    3/5 (Default Rating)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  New staff members start with a default rating of 3/5
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-red-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Emergency contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                    +94
                  </span>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone.startsWith('+94') ? formData.emergencyContact.phone.slice(3) : formData.emergencyContact.phone}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: `+94${cleanValue}` }
                      }));
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter 9 digits"
                    maxLength={9}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials - Only for Reception and only when adding new staff */}
          {formData.role !== 'barber' && !isEditMode && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Key className="w-5 h-5 mr-2 text-indigo-600" />
                  <span>Login Credentials</span>
                </h3>
                <button
                  type="button"
                  onClick={generateCredentials}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>
              
              {showCredentials && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Barber Login Info */}
          {formData.role === 'barber' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Barber Login Method</h3>
              </div>
              <p className="text-green-700 text-sm">
                Barbers will login using OTP verification sent to their mobile number. No username or password required.
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Mobile:</strong> {formData.phone}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  OTP will be sent to this number for login verification
                </p>
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-teal-600" />
              Weekly Schedule
            </h3>
            <div className="space-y-3">
              {days.map(day => (
                <div key={day} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-teal-200">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.schedule[day]?.available || false}
                      onChange={(e) => handleScheduleChange(day, 'available', e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-medium">Available</span>
                  </label>
                  {formData.schedule[day]?.available && (
                    <>
                      <input
                        type="time"
                        value={formData.schedule[day]?.start || '09:00'}
                        onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                      />
                      <span className="text-gray-500 font-medium">to</span>
                      <input
                        type="time"
                        value={formData.schedule[day]?.end || '17:00'}
                        onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>
                {isSaving 
                  ? (staff ? 'Updating...' : 'Adding...') 
                  : (staff ? 'Update Staff' : 'Add Staff')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;
