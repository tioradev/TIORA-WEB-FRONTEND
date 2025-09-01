import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, User, Phone, 
  DollarSign, Star, Building, RotateCcw
} from 'lucide-react';
import { 
  apiService, 
  EmployeeUpdateRequest,
  EmployeeRegistrationRequest
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastProvider';
import AddEmployeeModal from './AddEmployeeModal';
import ConfirmationModal from '../shared/ConfirmationModal';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  role: 'barber' | 'reception';
  branchId: string;
  specialties: Array<{id: number, name: string}>; // Change to array of objects
  schedule: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  monthlySalary: number;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  dateOfBirth?: string; // Add date of birth field
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
  notes?: string; // Add notes field
  servesGender?: 'male' | 'female' | 'both'; // Gender preference for barber services
}

interface StaffManagementProps {
  onAddStaffClick?: () => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ onAddStaffClick }) => {
  const { getSalonId } = useAuth();
  const { showSuccess, showError } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<'all' | 'barber' | 'reception'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    staffId: string;
    staffName: string;
  }>({
    isOpen: false,
    staffId: '',
    staffName: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [staff, selectedRole, selectedBranch, selectedStatus, searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the actual salon ID from the logged-in user
      const salonId = getSalonId();
      if (!salonId) {
        setError('No salon ID found for the current user');
        return;
      }
      
      // Load branches first
      const branchesResponse = await apiService.getComprehensiveBranches(salonId);
      if (branchesResponse.branches) {
        setBranches(branchesResponse.branches.map(branch => ({
          id: branch.branchId.toString(),
          name: branch.branchName
        })));
        
        // Load staff data
        await loadStaffData();
      } else {
        setError('Failed to load branches');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async () => {
    try {
      setError(null);
      
      // Get the actual salon ID from the logged-in user
      const salonId = getSalonId();
      if (!salonId) {
        setError('No salon ID found for the current user');
        return;
      }
      
      // Load receptionists and barbers
      const [receptionistsResponse, barbersResponse] = await Promise.all([
        apiService.getSalonReceptionists(salonId),
        apiService.getSalonBarbers(salonId)
      ]);

      const allStaff: Staff[] = [];

      // Process receptionists
      if (Array.isArray(receptionistsResponse)) {
        const receptionists = receptionistsResponse.map((emp: any) => ({
          id: emp.id || emp.employee_id || Math.random().toString(),
          firstName: emp.first_name || emp.firstName || '',
          lastName: emp.last_name || emp.lastName || '',
          gender: emp.gender || 'male',
          email: emp.email || '',
          phone: emp.phone_number || emp.phone || '',
          role: 'reception' as const,
          branchId: emp.branch_id?.toString() || 'default',
          specialties: [], // Receptionists don't have specialties
          schedule: emp.schedule || getDefaultSchedule(),
          monthlySalary: emp.base_salary || emp.salary || 3000,
          status: emp.status?.toLowerCase() || 'active',
          joinDate: emp.hire_date || emp.joined_date || new Date().toISOString().split('T')[0],
          dateOfBirth: emp.date_of_birth || emp.dateOfBirth || '',
          address: emp.address || '',
          emergencyContact: {
            name: emp.emergency_contact_name || emp.emergencyContact || '',
            phone: emp.emergency_contact_phone || emp.emergencyPhone || '',
            relationship: emp.emergency_relationship || emp.emergencyRelationship || ''
          },
          username: emp.username || '',
          password: emp.password || '',
          salonId: emp.salon_id?.toString() || salonId.toString(),
          performanceRating: emp.ratings || emp.performance_rating || 3,
          profileImage: emp.profile_image_url || emp.profileImageUrl || emp.profileImage || emp.imageUrl || '', // Map profile image from API
          notes: emp.notes || ''
        }));
        allStaff.push(...receptionists);
      }

      // Process barbers
      if (Array.isArray(barbersResponse)) {
        const barbers = barbersResponse.map((emp: any) => ({
          id: emp.id || emp.employee_id || Math.random().toString(),
          firstName: emp.first_name || emp.firstName || '',
          lastName: emp.last_name || emp.lastName || '',
          gender: emp.gender || 'male',
          email: emp.email || '',
          phone: emp.phone_number || emp.phone || '',
          role: 'barber' as const,
          branchId: emp.branch_id?.toString() || 'default',
          specialties: Array.isArray(emp.specializations) 
            ? emp.specializations.map((spec: any) => 
                typeof spec === 'string' 
                  ? { id: 0, name: spec } // Convert string to object
                  : { id: spec.id || 0, name: spec.name || spec } // Handle object format
              )
            : Array.isArray(emp.specialties)
            ? emp.specialties.map((spec: any) => 
                typeof spec === 'string' 
                  ? { id: 0, name: spec } 
                  : { id: spec.id || 0, name: spec.name || spec }
              )
            : [],
          schedule: emp.schedule || getDefaultSchedule(),
          monthlySalary: emp.base_salary || emp.salary || 3000,
          status: emp.status?.toLowerCase() || 'active',
          joinDate: emp.hire_date || emp.joined_date || new Date().toISOString().split('T')[0],
          dateOfBirth: emp.date_of_birth || emp.dateOfBirth || '',
          address: emp.address || '',
          emergencyContact: {
            name: emp.emergency_contact_name || emp.emergencyContact || '',
            phone: emp.emergency_contact_phone || emp.emergencyPhone || '',
            relationship: emp.emergency_relationship || emp.emergencyRelationship || ''
          },
          username: '', // Barbers don't have username/password
          password: '',
          salonId: emp.salon_id?.toString() || salonId.toString(),
          performanceRating: emp.ratings || emp.performance_rating || 3,
          profileImage: emp.profile_image_url || emp.profileImageUrl || emp.profileImage || emp.imageUrl || '', // Map profile image from API
          notes: emp.notes || '',
          servesGender: emp.serves_gender ? emp.serves_gender.toLowerCase() as 'male' | 'female' | 'both' : 'both'
        }));
        allStaff.push(...barbers);
      }

      setStaff(allStaff);
    } catch (error) {
      console.error('Error loading staff data:', error);
      setError('Failed to load staff data');
    }
  };

  const getDefaultSchedule = () => ({
    monday: { start: '09:00', end: '17:00', available: true },
    tuesday: { start: '09:00', end: '17:00', available: true },
    wednesday: { start: '09:00', end: '17:00', available: true },
    thursday: { start: '09:00', end: '17:00', available: true },
    friday: { start: '09:00', end: '17:00', available: true },
    saturday: { start: '09:00', end: '15:00', available: true },
    sunday: { start: '10:00', end: '14:00', available: false }
  });

  const applyFilters = () => {
    let filtered = [...staff];

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(s => s.role === selectedRole);
    }

    // Filter by branch
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(s => s.branchId === selectedBranch);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.phone.includes(query)
      );
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setIsModalOpen(true);
  };

  const handleEditStaff = async (staffMember: Staff) => {
    try {
      // Fetch complete employee details from API
      const fullEmployeeData = await apiService.getEmployeeDetails(staffMember.id);
      console.log('Full employee data:', fullEmployeeData);
      
      // Map API response to the expected format
      const mappedEmployee: Staff = {
        ...staffMember,
        profileImage: fullEmployeeData.profile_image_url || staffMember.profileImage || '',
        specialties: fullEmployeeData.specializations 
          ? fullEmployeeData.specializations.map((spec, index) => ({
              id: index + 1,
              name: spec
            })) 
          : staffMember.specialties || [],
        servesGender: (fullEmployeeData.notes && fullEmployeeData.notes.includes('serves_gender:'))
          ? fullEmployeeData.notes.split('serves_gender:')[1]?.split(',')[0]?.trim() as 'male' | 'female' | 'both' || 'both'
          : staffMember.servesGender || 'both',
        emergencyContact: {
          name: fullEmployeeData.emergency_contact_name || staffMember.emergencyContact?.name || '',
          phone: fullEmployeeData.emergency_contact_phone || staffMember.emergencyContact?.phone || '',
          relationship: fullEmployeeData.emergency_relationship || staffMember.emergencyContact?.relationship || '',
        },
        notes: fullEmployeeData.notes || staffMember.notes || '',
        dateOfBirth: fullEmployeeData.date_of_birth || staffMember.dateOfBirth || '',
        address: fullEmployeeData.address || staffMember.address || '',
        monthlySalary: fullEmployeeData.base_salary || staffMember.monthlySalary || 25000,
        performanceRating: fullEmployeeData.ratings || staffMember.performanceRating || 3,
      };
      
      setEditingStaff(mappedEmployee);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
      // Fallback to basic staff data if API call fails
      setEditingStaff(staffMember);
      setIsModalOpen(true);
      
      // Show error message
      if (setError) {
        setError('Failed to load employee details. Some information may not be available.');
      }
    }
  };

  const handleSaveStaff = async (staffData: Omit<Staff, 'id'>) => {
    try {
      setSaving(true);
      setError(null);

      if (editingStaff) {
        // Update existing staff
        const updateRequest: EmployeeUpdateRequest = {
          first_name: staffData.firstName,
          last_name: staffData.lastName,
          email: staffData.email,
          phone_number: staffData.phone,
          gender: staffData.gender.toUpperCase() as 'MALE' | 'FEMALE',
          address: staffData.address || '',
          branch_id: staffData.branchId ? parseInt(staffData.branchId) : undefined,
          base_salary: staffData.monthlySalary,
          status: staffData.status.toUpperCase() as 'ACTIVE' | 'INACTIVE',
          emergency_contact_name: staffData.emergencyContact.name,
          emergency_contact_phone: staffData.emergencyContact.phone,
          emergency_relationship: staffData.emergencyContact.relationship,
          username: staffData.username || undefined,
          ratings: staffData.performanceRating,
          serves_gender: staffData.servesGender ? 
            staffData.servesGender.toUpperCase() as 'MALE' | 'FEMALE' | 'BOTH' : 'BOTH'
        };

        const response = await apiService.updateEmployee(editingStaff.id, updateRequest);
        if (response.employee_id) {
          console.log('Staff updated successfully:', response);
          showSuccess(
            'Employee Updated',
            `${staffData.firstName} ${staffData.lastName} has been updated successfully.`
          );
          await loadStaffData(); // Reload data
        } else {
          setError('Failed to update staff');
          showError(
            'Update Failed',
            'Failed to update employee. Please try again.'
          );
        }
      } else {
        // Create new staff
        const salonId = getSalonId();
        if (!salonId) {
          setError('No salon ID found for the current user');
          return;
        }

        const employeeRequest: EmployeeRegistrationRequest = {
          first_name: staffData.firstName,
          last_name: staffData.lastName,
          email: staffData.email,
          phone_number: staffData.phone,
          gender: staffData.gender.toUpperCase() as 'MALE' | 'FEMALE',
          date_of_birth: staffData.dateOfBirth || '1990-01-01', // Use actual date or default
          address: staffData.address || '',
          salon_id: salonId,
          branch_id: staffData.branchId ? parseInt(staffData.branchId) : undefined,
          role: staffData.role === 'reception' ? 'RECEPTIONIST' : 'BARBER',
          base_salary: staffData.monthlySalary,
          experience_years: 1, // Default value
          emergency_contact_name: staffData.emergencyContact.name || '',
          emergency_contact_phone: staffData.emergencyContact.phone || '',
          emergency_relationship: staffData.emergencyContact.relationship || '',
          username: staffData.username || undefined,
          password: staffData.password || undefined,
          specializations: staffData.specialties.length > 0 ? 
            staffData.specialties : undefined,
          weekly_schedule: JSON.stringify(staffData.schedule),
          ratings: staffData.performanceRating || 3,
          serves_gender: staffData.role === 'barber' && staffData.servesGender ? 
            staffData.servesGender.toUpperCase() as 'MALE' | 'FEMALE' | 'BOTH' : 'BOTH'
        };

        const response = await apiService.createEmployee(employeeRequest);
        if (response.employee_id) {
          console.log('Staff created successfully:', response);
          showSuccess(
            'Employee Added',
            `${staffData.firstName} ${staffData.lastName} has been successfully added to your team.`
          );
          await loadStaffData(); // Reload data
        } else {
          setError('Failed to create staff');
          showError(
            'Addition Failed',
            'Failed to add new employee. Please try again.'
          );
        }
      }

      setIsModalOpen(false);
      setEditingStaff(undefined);
    } catch (error) {
      console.error('Error saving staff:', error);
      const action = editingStaff ? 'update' : 'add';
      setError(`Failed to ${action} staff`);
      showError(
        `${editingStaff ? 'Update' : 'Addition'} Failed`,
        `An error occurred while ${action}ing the employee. Please check your connection and try again.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'this employee';
    
    setDeleteConfirmation({
      isOpen: true,
      staffId,
      staffName
    });
  };

  const confirmDeleteStaff = async () => {
    try {
      setError(null);
      const { staffId, staffName } = deleteConfirmation;
      const response = await apiService.deleteEmployee(staffId);
      if (response.success) {
        console.log('Staff deleted successfully');
        showSuccess(
          'Employee Deleted',
          `${staffName} has been permanently removed from your salon.`
        );
        await loadStaffData(); // Reload data
      } else {
        setError('Failed to delete staff');
        showError(
          'Deletion Failed',
          `Failed to delete ${staffName}. Please try again.`
        );
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff');
      showError(
        'Deletion Error',
        `An error occurred while deleting ${deleteConfirmation.staffName}. Please check your connection and try again.`
      );
    } finally {
      setDeleteConfirmation({ isOpen: false, staffId: '', staffName: '' });
    }
  };

  const handleToggleStatus = async (staffMember: Staff) => {
    const newStatus = staffMember.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
    const staffName = `${staffMember.firstName} ${staffMember.lastName}`;
    
    try {
      setError(null);
      const updateRequest: EmployeeUpdateRequest = {
        status: newStatus
      };

      const response = await apiService.updateEmployee(staffMember.id, updateRequest);
      if (response.employee_id) {
        console.log('Staff status updated successfully');
        showSuccess(
          `Employee ${action === 'activated' ? 'Activated' : 'Deactivated'}`,
          `${staffName} has been ${action} successfully.`
        );
        await loadStaffData(); // Reload data
      } else {
        setError('Failed to update staff status');
        showError(
          'Status Update Failed',
          `Failed to ${action === 'activated' ? 'activate' : 'deactivate'} ${staffName}. Please try again.`
        );
      }
    } catch (error) {
      console.error('Error updating staff status:', error);
      setError('Failed to update staff status');
      showError(
        'Status Update Error',
        `An error occurred while updating ${staffName}'s status. Please check your connection and try again.`
      );
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'barber':
        return <Star className="w-4 h-4" />;
      case 'reception':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading staff data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your salon staff and their information</p>
        </div>
        <button
          onClick={() => {
            if (typeof onAddStaffClick === 'function') {
              onAddStaffClick();
            } else {
              handleAddStaff();
            }
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      {/* Floating Add Staff Button */}
      <button
        onClick={() => {
          if (typeof onAddStaffClick === 'function') {
            onAddStaffClick();
          } else {
            handleAddStaff();
          }
        }}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 100,
          background: 'linear-gradient(90deg, #a78bfa, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
          cursor: 'pointer',
          fontSize: 24
        }}
        title="Add Staff"
      >
        <Plus className="w-7 h-7" />
      </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm underline mt-1 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'all' | 'barber' | 'reception')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="barber">Barbers</option>
            <option value="reception">Reception</option>
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(staffMember => (
          <div key={staffMember.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {staffMember.profileImage ? (
                      <img 
                        src={staffMember.profileImage} 
                        alt={`${staffMember.firstName} ${staffMember.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${staffMember.profileImage ? 'hidden' : 'flex'}`}>
                      {staffMember.firstName.charAt(0)}{staffMember.lastName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {staffMember.firstName} {staffMember.lastName}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      {getRoleIcon(staffMember.role)}
                      <span className="capitalize">{staffMember.role}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(staffMember.status)}`}>
                  {staffMember.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{staffMember.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{branches.find(b => b.id === staffMember.branchId)?.name || 'Unknown Branch'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>LKR {staffMember.monthlySalary.toLocaleString()}/month</span>
                </div>
                {staffMember.specialties.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>{staffMember.specialties.slice(0, 2).map(spec => spec.name).join(', ')}</span>
                    {staffMember.specialties.length > 2 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        +{staffMember.specialties.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditStaff(staffMember)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleStatus(staffMember)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{staffMember.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </button>
                <button
                  onClick={() => handleDeleteStaff(staffMember.id)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedRole !== 'all' || selectedBranch !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first staff member.'}
          </p>
          {(!searchQuery && selectedRole === 'all' && selectedBranch === 'all' && selectedStatus === 'all') && (
            <button
              onClick={handleAddStaff}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Staff Member</span>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <AddEmployeeModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingStaff(undefined);
          }}
          onAdd={handleSaveStaff}
          salonId={getSalonId() || 1}
          branchId={1} // You may want to make this dynamic based on selected branch
          editingEmployee={editingStaff}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, staffId: '', staffName: '' })}
        onConfirm={confirmDeleteStaff}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete ${deleteConfirmation.staffName}?

⚠️ This action cannot be undone and will remove:
• All employee records
• Historical data
• Login credentials (if applicable)
• Performance data

This will permanently remove the employee from your salon system.`}
        confirmText="Delete Employee"
        cancelText="Cancel"
        type="danger"
        requireTyping={false}
      />

      {/* Floating Add Staff Button */}
      <button
        onClick={() => {
          if (typeof onAddStaffClick === 'function') {
            onAddStaffClick();
          } else {
            handleAddStaff();
          }
        }}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 100,
          background: 'linear-gradient(90deg, #a78bfa, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
          cursor: 'pointer',
          fontSize: 24
        }}
        title="Add Staff"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default StaffManagement;
