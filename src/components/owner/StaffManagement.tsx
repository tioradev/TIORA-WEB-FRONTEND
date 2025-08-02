import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, Calendar, User, Phone, 
  Clock, DollarSign, Key, Eye, EyeOff, X, Save,
  MessageSquare, Briefcase, Award, Star, Building
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
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
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff;
  onSave: (staff: Omit<Staff, 'id'>) => void;
  branches: Array<{ id: string; name: string }>;
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, staff, onSave, branches }) => {
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
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
    salonId: staff?.salonId || 'salon1',
    performanceRating: staff?.performanceRating || 3
  });

  const [showCredentials, setShowCredentials] = useState(!!staff?.username);

  // Reset form when modal opens with different staff data
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: staff?.name || '',
        email: staff?.email || '',
        phone: staff?.phone || '',
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
        salonId: staff?.salonId || 'salon1',
        performanceRating: staff?.performanceRating || 3
      });
      setShowCredentials(!!staff?.username);
    }
  }, [isOpen, staff]);

  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100);
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
    const username = generateUsername(formData.name);
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
    
    // Only require credentials for non-barber roles
    if (formData.role !== 'barber') {
      if (!formData.username || !formData.password) {
        alert('Please generate login credentials before saving.');
        return;
      }
    }
    
    onSave(formData);
    onClose();
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Staff['role'] }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="barber">Barber</option>
                  <option value="reception">Reception</option>
                </select>
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
                    <span className="text-sm text-gray-700 font-medium">{specialty}</span>
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
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Emergency contact phone"
                />
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

          {/* Login Credentials */}
          {/* Login Credentials - Only for Reception and Branch Manager */}
          {formData.role !== 'barber' && (
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
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{staff ? 'Update Staff' : 'Add Staff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@salon.com',
      phone: '+94771234567',
      role: 'barber',
      branchId: '1',
      specialties: ['Hair Cutting', 'Hair Coloring'],
      schedule: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '15:00', available: true },
        sunday: { start: '10:00', end: '14:00', available: false }
      },
      monthlySalary: 3500,
      status: 'active',
      joinDate: '2023-01-15',
      address: '123 Main St, Colombo 03',
      emergencyContact: {
        name: 'John Johnson',
        phone: '+94771234566',
        relationship: 'Spouse'
      },
      username: 'sarah.johnson',
      password: 'temp123',
      salonId: 'salon1',
      performanceRating: 5
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@salon.com',
      phone: '+94771234568',
      role: 'reception',
      branchId: '2',
      specialties: [],
      schedule: {
        monday: { start: '08:00', end: '16:00', available: true },
        tuesday: { start: '08:00', end: '16:00', available: true },
        wednesday: { start: '08:00', end: '16:00', available: true },
        thursday: { start: '08:00', end: '16:00', available: true },
        friday: { start: '08:00', end: '16:00', available: true },
        saturday: { start: '09:00', end: '17:00', available: true },
        sunday: { start: '10:00', end: '14:00', available: false }
      },
      monthlySalary: 2800,
      status: 'active',
      joinDate: '2023-03-01',
      address: '456 Oak Ave, Kandy',
      emergencyContact: {
        name: 'Lisa Chen',
        phone: '+94771234565',
        relationship: 'Sister'
      },
      username: 'mike.chen',
      password: 'temp456',
      salonId: 'salon1',
      performanceRating: 4
    }
  ]);

  // Mock branch data for dropdown
  const mockBranches = [
    { id: '1', name: 'Downtown Branch' },
    { id: '2', name: 'Mall Branch' },
    { id: '3', name: 'Airport Branch' }
  ];

  const getBranchName = (branchId: string) => {
    const branch = mockBranches.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; staff: Staff | null }>({ isOpen: false, staff: null });

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // CRUD Functions
  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (staffData: Omit<Staff, 'id'>) => {
    try {
      if (editingStaff) {
        // Update existing staff
        setStaff(prev => prev.map(s => 
          s.id === editingStaff.id 
            ? { ...staffData, id: editingStaff.id } 
            : s
        ));
        setSuccessMessage(`${staffData.name} has been updated successfully!`);
      } else {
        // Add new staff
        const newStaff: Staff = {
          ...staffData,
          id: Date.now().toString()
        };
        setStaff(prev => [...prev, newStaff]);
        setSuccessMessage(`${staffData.name} has been added to the team successfully!`);
      }
      
      // Close modal and reset editing state
      setIsModalOpen(false);
      setEditingStaff(undefined);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error saving staff member. Please try again.');
    }
  };

  const handleDeleteStaff = (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      setDeleteConfirmation({ isOpen: true, staff: staffMember });
    }
  };

  const confirmDeleteStaff = () => {
    if (deleteConfirmation.staff) {
      try {
        setStaff(prev => prev.filter(s => s.id !== deleteConfirmation.staff!.id));
        setSuccessMessage(`${deleteConfirmation.staff.name} has been removed from the team.`);
        setDeleteConfirmation({ isOpen: false, staff: null });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error removing staff member. Please try again.');
      }
    }
  };

  const handleToggleStatus = (id: string) => {
    try {
      setStaff(prev => prev.map(s => 
        s.id === id 
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
          : s
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const getRoleColor = (role: Staff['role']) => {
    const colors = {
      barber: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200',
      reception: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200'
    };
    return colors[role];
  };

  const getStatusColor = (status: Staff['status']) => {
    const colors = {
      active: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200',
      inactive: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200',
      'on-leave': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200'
    };
    return colors[status];
  };

  const getRoleDisplayName = (role: Staff['role']) => {
    const names = {
      barber: 'Barber',
      reception: 'Reception'
    };
    return names[role];
  };

  const getRoleIcon = (role: Staff['role']) => {
    const icons = {
      barber: <Briefcase className="w-5 h-5" />,
      reception: <User className="w-5 h-5" />
    };
    return icons[role];
  };

  const totalSalary = staff.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlySalary, 0);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-lg flex-1">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-white hover:text-gray-200 transition-colors ml-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your salon staff and their schedules</p>
        </div>
        <button
          onClick={handleAddStaff}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Staff</p>
              <p className="text-3xl font-bold">{staff.length}</p>
            </div>
            <User className="w-10 h-10 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Active Staff</p>
              <p className="text-3xl font-bold">{staff.filter(s => s.status === 'active').length}</p>
            </div>
            <Eye className="w-10 h-10 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Barbers</p>
              <p className="text-3xl font-bold">{staff.filter(s => s.role === 'barber').length}</p>
            </div>
            <Briefcase className="w-10 h-10 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Salary</p>
              <p className="text-3xl font-bold">LKR {totalSalary.toLocaleString()}</p>
            </div>
            <DollarSign className="w-10 h-10 text-amber-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Roles</option>
              <option value="barber">Barber</option>
              <option value="reception">Reception</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  {getRoleIcon(member.role)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStaff(member)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  title="Edit staff member"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(member.id)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    member.status === 'active' 
                      ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {member.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Delete staff member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{member.phone}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{getBranchName(member.branchId)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleColor(member.role)}`}>
                  {getRoleDisplayName(member.role)}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(member.status)}`}>
                  {member.status.replace('-', ' ').charAt(0).toUpperCase() + member.status.replace('-', ' ').slice(1)}
                </span>
              </div>

              {member.specialties.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.slice(0, 2).map(specialty => (
                      <span key={specialty} className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                        {specialty}
                      </span>
                    ))}
                    {member.specialties.length > 2 && (
                      <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                        +{member.specialties.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-gray-900 font-semibold">LKR {member.monthlySalary.toLocaleString()}/mo</span>
                </div>
                {member.performanceRating && (
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600 text-sm font-medium">{member.performanceRating}/5</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Joined: {new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-600">Try adjusting your search or filters, or add a new staff member.</p>
        </div>
      )}

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(undefined);
        }}
        staff={editingStaff}
        onSave={handleSaveStaff}
        branches={mockBranches}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.staff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Staff Member</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold text-gray-900">{deleteConfirmation.staff.name}</span> from your team? 
                This action cannot be undone and will permanently delete their profile and access to the system.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, staff: null })}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStaff}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                >
                  Remove Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;