import React, { useState } from 'react';
import { 
  Search, Filter, Download, Plus, Trash2, 
  Eye, EyeOff, Mail, Phone, Calendar, Award,
  User, MapPin, Clock, DollarSign, X
} from 'lucide-react';
import { mockBarbers } from '../../data/mockData';
import { Barber } from '../../types';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Barber[]>(mockBarbers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Barber | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.mobile.includes(searchTerm) ||
      (employee.employeeId && employee.employeeId.includes(searchTerm));
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && employee.isActive) ||
      (filterStatus === 'inactive' && !employee.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (employeeId: string) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, isActive: !emp.isActive, lastActiveDate: new Date() }
        : emp
    ));
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    }
  };

  const downloadEmployeeReport = () => {
    const reportData = filteredEmployees.map(emp => 
      `${emp.employeeId || emp.id},${emp.firstName},${emp.lastName},${emp.email},${emp.mobile},${emp.specializedArea},${emp.experience},${emp.isActive ? 'Active' : 'Inactive'},${emp.salary || 'N/A'}`
    ).join('\n');
    
    const blob = new Blob([
      `Employee ID,First Name,Last Name,Email,Mobile,Specialization,Experience,Status,Salary\n${reportData}`
    ], { type: 'text/csv' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewEmployeeDetails = (employee: Barber) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage all salon employees and their details</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadEmployeeReport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200">
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Employees</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredEmployees.length} of {employees.length} employees
            </div>
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">ID: {employee.employeeId || employee.id}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  employee.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">{employee.specializedArea}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{employee.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{employee.mobile}</span>
                </div>
                {employee.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{employee.address}</span>
                  </div>
                )}
              </div>

              {/* Professional Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{employee.experience}</div>
                  <div className="text-xs text-gray-600">Years Exp.</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {employee.salary ? `Rs ${employee.salary.toLocaleString()}` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Salary</div>
                </div>
              </div>

              {/* Additional Info */}
              {employee.joiningDate && (
                <div className="flex items-center space-x-2 pt-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Joined: {employee.joiningDate.toLocaleDateString()}
                  </span>
                </div>
              )}

              {employee.lastActiveDate && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Last Active: {employee.lastActiveDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => viewEmployeeDetails(employee)}
                  className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleToggleStatus(employee.id)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                    employee.isActive 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {employee.isActive ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                  {employee.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteEmployee(employee.id)}
                  className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              {/* Profile Section */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h4>
                  <p className="text-gray-600">{selectedEmployee.specializedArea}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedEmployee.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedEmployee.mobile}</span>
                    </div>
                    {selectedEmployee.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedEmployee.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Professional Details</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedEmployee.experience} years experience</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Joined: {selectedEmployee.joiningDate?.toLocaleDateString() || selectedEmployee.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    {selectedEmployee.salary && (
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Rs {selectedEmployee.salary}/month</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedEmployee.emergencyContact && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Emergency Contact</h5>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedEmployee.emergencyContact}</span>
                  </div>
                </div>
              )}

              {/* Last Activity */}
              {selectedEmployee.lastActiveDate && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Last Activity</h5>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedEmployee.lastActiveDate.toLocaleDateString()} at {selectedEmployee.lastActiveDate.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;