import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Plus, Trash2, 
  Eye, EyeOff, Mail, Phone, Award,
  Users, Star, X
} from 'lucide-react';
import RupeeIcon from '../shared/RupeeIcon';
import { useToast } from '../../contexts/ToastProvider';
import { useAuth } from '../../contexts/AuthContext';
import AddEmployeeModal from './AddEmployeeModal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'RECEPTIONIST' | 'BARBER';
  address: string;
  specializations: string[];
  baseSalary: number;
  ratings: number;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  isActive: boolean;
  salonId: string;
  branchId: string;
  createdAt: Date;
}

interface EmployeeManagementProps {
  // No longer need these props as we'll get them from AuthContext
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = () => {
  const { showSuccess, showError } = useToast();
  const { getSalonId, getBranchId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'RECEPTIONIST' | 'BARBER'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get salon data from context
  const salonId = getSalonId();
  const contextBranchId = getBranchId();
  
  // For now, use context branch ID if available, otherwise use default
  const branchId = contextBranchId || 1;

  // Load employees on component mount
  useEffect(() => {
    if (salonId) {
      loadEmployees();
    }
  }, [salonId]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      
      // Ensure we have a valid salon ID
      if (!salonId) {
        showError('Error', 'Salon information not available. Please login again.');
        return;
      }
      
      // For now, use mock data until API is ready
      const mockEmployees: Employee[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '9876543210',
          role: 'BARBER',
          address: '123 Main St, City',
          specializations: ['Hair Cutting', 'Beard Styling', 'Hair Coloring'],
          baseSalary: 30000,
          ratings: 4.8,
          emergencyContact: 'Jane Doe',
          emergencyPhone: '9876543211',
          emergencyRelationship: 'Spouse',
          isActive: true,
          salonId: salonId.toString(),
          branchId: branchId.toString(),
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@example.com',
          phoneNumber: '9876543212',
          role: 'RECEPTIONIST',
          address: '456 Oak Ave, City',
          specializations: ['Customer Service', 'Appointment Management', 'Payment Processing'],
          baseSalary: 25000,
          ratings: 4.9,
          emergencyContact: 'Mike Wilson',
          emergencyPhone: '9876543213',
          emergencyRelationship: 'Brother',
          isActive: true,
          salonId: salonId.toString(),
          branchId: branchId.toString(),
          createdAt: new Date('2024-02-01'),
        },
      ];
      
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showError('Error', 'Failed to load employees. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phoneNumber.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && employee.isActive) ||
      (filterStatus === 'inactive' && !employee.isActive);

    const matchesRole = 
      filterRole === 'all' || employee.role === filterRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleToggleStatus = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      // Update local state immediately for better UX
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, isActive: !emp.isActive }
          : emp
      ));

      showSuccess(
        'Status Updated',
        `${employee.firstName} ${employee.lastName} is now ${employee.isActive ? 'inactive' : 'active'}`
      );

      // TODO: Call API to update employee status
      // await apiService.updateEmployee(parseInt(employeeId), { isActive: !employee.isActive });

    } catch (error) {
      console.error('Failed to toggle employee status:', error);
      showError('Error', 'Failed to update employee status');
      // Revert the change
      loadEmployees();
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    if (!window.confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      showSuccess('Employee Deleted', `${employee.firstName} ${employee.lastName} has been removed`);

      // TODO: Call API to delete employee
      // await apiService.deleteEmployee(parseInt(employeeId));

    } catch (error) {
      console.error('Failed to delete employee:', error);
      showError('Error', 'Failed to delete employee');
      // Revert the change
      loadEmployees();
    }
  };

  const handleAddEmployee = (newEmployee: Employee) => {
    setEmployees(prev => [...prev, newEmployee]);
    setShowAddModal(false);
  };

  const downloadEmployeeReport = () => {
    const headers = 'ID,First Name,Last Name,Email,Phone,Role,Specializations,Salary,Rating,Status,Created Date';
    const reportData = filteredEmployees.map(emp => 
      `${emp.id},${emp.firstName},${emp.lastName},${emp.email},${emp.phoneNumber},${emp.role},"${emp.specializations.join(', ')}",${emp.baseSalary},${emp.ratings},${emp.isActive ? 'Active' : 'Inactive'},${emp.createdAt.toLocaleDateString()}`
    ).join('\n');
    
    const csvContent = `${headers}\n${reportData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showSuccess('Report Downloaded', 'Employee report has been downloaded successfully');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'BARBER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RECEPTIONIST': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Debug: log modal and salonId state
  console.log('showAddModal:', showAddModal, 'salonId:', salonId);

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-7 h-7 mr-3 text-blue-600" />
              Employee Management
            </h2>
            <p className="text-gray-600 mt-1">Manage your salon staff and their information</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={downloadEmployeeReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'all' | 'RECEPTIONIST' | 'BARBER')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="BARBER">Barber</option>
              <option value="RECEPTIONIST">Receptionist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="p-6">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No employees match your search criteria.' : 'Get started by adding your first employee.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>

                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(employee.role)}`}>
                            {employee.role}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(employee.isActive)}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {employee.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {employee.phoneNumber}
                          </div>
                          <div className="flex items-center">
                            <RupeeIcon className="w-4 h-4 mr-2" />
                            Rs {employee.baseSalary.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            {renderStarRating(employee.ratings)}
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-2 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {employee.specializations.slice(0, 3).map((spec, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {spec}
                                </span>
                              ))}
                              {employee.specializations.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  +{employee.specializations.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(employee.id)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        employee.isActive 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={employee.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {employee.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && salonId && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEmployee}
          salonId={salonId}
          branchId={branchId}
        />
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Employee Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-gray-900">{selectedEmployee.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedEmployee.phoneNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{selectedEmployee.address}</p>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                    <p className="text-gray-900">Rs {selectedEmployee.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center">
                      {renderStarRating(selectedEmployee.ratings)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.specializations.map((spec, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                    <p className="text-gray-900">{selectedEmployee.emergencyContact}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <p className="text-gray-900">{selectedEmployee.emergencyPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relationship</label>
                    <p className="text-gray-900">{selectedEmployee.emergencyRelationship}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedEmployee.isActive)}`}>
                      {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
