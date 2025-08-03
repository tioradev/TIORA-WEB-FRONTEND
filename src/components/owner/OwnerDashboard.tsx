import React, { useState } from 'react';
import { 
  Coins, Users, Plus, UserPlus, Clock, Building, 
  BarChart3, CreditCard, AlertTriangle, Calendar,
  TrendingUp, Star, Search,
  Sparkles, Shield, Target, Briefcase
} from 'lucide-react';
import { mockAppointments, mockEarnings, mockLeaveRequests, mockBarbers, mockServices } from '../../data/mockData';
import { LeaveRequest, Service } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LeaveRequestCard from './LeaveRequestCard';
import ServiceManagementModal from './ServiceManagementModal';
import ServiceListView from './ServiceListView';
import ExpenseManagement from '../super-admin/ExpenseManagement';
import BranchManagement from '../super-admin/BranchManagement';
import EmployeeManagement from './EmployeeManagement';
import AdvancedAnalytics from './AdvancedAnalytics';
import PaymentBilling from './PaymentBilling';
import ProfileModal from '../shared/ProfileModal';

const OwnerDashboard: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'analytics' | 'payments' | 'services' | 'leaves' | 'expenses' | 'branches'>('overview');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [servicesSearch, setServicesSearch] = useState<string>('');
  const [leaveRequestsSearch, setLeaveRequestsSearch] = useState<string>('');
  const { isProfileModalOpen, closeProfileModal, user, salon } = useAuth();

  // Create user profile from real salon data instead of mock data
  const userProfile = {
    id: user?.id || '',
    name: salon?.fullOwnerName || user?.name || '',
    firstName: salon?.ownerFirstName || '',
    lastName: salon?.ownerLastName || '',
    fullOwnerName: salon?.fullOwnerName || '',
    email: salon?.email || user?.email || '',
    phone: salon?.phoneNumber || '',
    role: 'owner' as const,
    avatar: salon?.ownerImgUrl || salon?.imageUrl || user?.profilePicture || '',
    profilePicture: salon?.ownerImgUrl || user?.profilePicture || '',
    // Owner specific fields
    ownerFirstName: salon?.ownerFirstName || '',
    ownerLastName: salon?.ownerLastName || '',
    ownerPhone: salon?.ownerPhone || '',
    ownerEmail: salon?.ownerEmail || '',
    // Salon specific fields
    salonName: salon?.name || '',
    salonId: salon?.salonId?.toString() || '',
    address: salon?.address || '',
    district: salon?.district || '',
    postalCode: salon?.postalCode || '',
    brNumber: salon?.brNumber || '',
    salonImageUrl: salon?.imageUrl || '',
    ownerImgUrl: salon?.ownerImgUrl || '',
    // Business fields
    businessName: salon?.name || '',
    taxId: salon?.taxId || ''
  };

  const todayEarnings = mockEarnings.reduce((sum, earning) => sum + earning.finalAmount, 0);
  const pendingLeaves = leaveRequests.filter(req => req.status === 'pending');
  const activeBarbers = mockBarbers.filter(barber => barber.isActive);

  // Appointment charging calculations
  const todayAppointments = mockAppointments.filter(app => app.date === new Date().toISOString().split('T')[0]);
  const appointmentChargePerDay = todayAppointments.length * 50; // LKR 50 per appointment
  const pendingPaymentAmount = appointmentChargePerDay; // Mock pending payment
  const dailyIncomeFromCharges = appointmentChargePerDay; // Mock daily income

  // Group earnings by barber
  const earningsByBarber = mockEarnings.reduce((acc, earning) => {
    acc[earning.barberName] = (acc[earning.barberName] || 0) + earning.finalAmount;
    return acc;
  }, {} as Record<string, number>);

  // Search functions
  const searchServices = (services: Service[], searchTerm: string) => {
    if (!searchTerm.trim()) return services;
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const searchLeaveRequests = (requests: LeaveRequest[], searchTerm: string) => {
    if (!searchTerm.trim()) return requests;
    return requests.filter(request =>
      request.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleLeaveAction = (requestId: string, action: 'approved' | 'rejected', comment?: string) => {
    const request = leaveRequests.find(req => req.id === requestId);
    
    setLeaveRequests(leaveRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: action, comment, updatedAt: new Date() } 
        : req
    ));
    
    // Show success message based on action
    if (action === 'approved') {
      setSuccessMessage(`${request?.barberName}'s leave request has been approved successfully!`);
    } else {
      setSuccessMessage(`${request?.barberName}'s leave request has been rejected.`);
    }
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
    
    // Mock notification sent to barber
    console.log(`Leave request ${action} notification sent to barber`);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (serviceData: any) => {
    console.log('handleSaveService called with:', serviceData);
    
    if (editingService) {
      // Update existing service
      console.log('Updating service:', serviceData);
      setServices(services.map(service => 
        service.id === editingService.id ? { ...service, ...serviceData } : service
      ));
      setSuccessMessage('Service updated successfully!');
    } else {
      // Add new service
      console.log('Adding new service:', serviceData);
      const newService = {
        ...serviceData,
        id: Date.now().toString(),
        salonId: 'salon1',
        isActive: true,
        popularity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user-id',
        profitMargin: 75,
      };
      setServices([...services, newService]);
      setSuccessMessage('Service added successfully!');
    }
    
    console.log('Success message set, closing modal...');
    setEditingService(null);
    setIsServiceModalOpen(false);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      console.log('Auto-hiding success message');
      setSuccessMessage(null);
    }, 3000);
  };

  const handleProfileSave = (updatedProfile: any) => {
    // Profile updates should be handled through the AuthContext
    // For now, we'll just log the changes
    console.log('Owner profile updated:', updatedProfile);
  };

  const handleUpdateService = (service: Service) => {
    console.log('Service updated:', service);
    setServices(services.map(s => s.id === service.id ? { ...s, ...service } : s));
    setSuccessMessage('Service status updated successfully!');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteService = (serviceId: string) => {
    console.log('Service deleted:', serviceId);
    setServices(services.filter(s => s.id !== serviceId));
    setSuccessMessage('Service deleted successfully!');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteServiceFromModal = (service: any) => {
    handleDeleteService(service.id);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
    { id: 'staff', label: 'Staff Management', icon: Users, color: 'from-purple-500 to-purple-600' },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { id: 'services', label: 'Services', icon: Sparkles, color: 'from-cyan-500 to-cyan-600' },
    { id: 'branches', label: 'Branch Management', icon: Building, color: 'from-gray-500 to-gray-600' },
    { id: 'payments', label: 'Payments', icon: CreditCard, color: 'from-emerald-500 to-emerald-600' },
    { id: 'expenses', label: 'Expenses', icon: Briefcase, color: 'from-red-500 to-red-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Fixed Success Toast */}
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, Owner! 👋
                </h1>
                <p className="text-purple-100">Here's what's happening at your salon today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 relative">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-lg">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-white hover:text-gray-200 transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid - Moved here after welcome header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Earnings - First */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-emerald-300/30 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-200/50 rounded-xl">
                    <Coins className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-200/50 px-2 py-1 rounded-full">
                    TODAY
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-1">LKR {dailyIncomeFromCharges.toFixed(2)}</h3>
                <p className="text-emerald-700 text-sm font-medium mb-2">Today's Earnings</p>
                <p className="text-emerald-600 text-xs">From appointment charges</p>
              </div>
            </div>

            {/* Monthly Earnings - Second */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-blue-300/30 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-200/50 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-200/50 px-2 py-1 rounded-full">
                    +12%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-1">LKR {todayEarnings.toFixed(2)}</h3>
                <p className="text-blue-700 text-sm font-medium mb-2">Monthly Earnings</p>
                <p className="text-blue-600 text-xs">From yesterday</p>
              </div>
            </div>

            {/* Pending Payments - Third */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-orange-300/30 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-200/50 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-200/50 px-2 py-1 rounded-full">
                    PENDING
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-orange-900 mb-1">LKR {pendingPaymentAmount.toFixed(2)}</h3>
                <p className="text-orange-700 text-sm font-medium mb-2">Pending Payments</p>
                <p className="text-orange-600 text-xs">{todayAppointments.length} appointments today</p>
              </div>
            </div>

            {/* Active Staff - Fourth */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-purple-300/30 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-200/50 rounded-xl">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-200/50 px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-purple-900 mb-1">{activeBarbers.length}</h3>
                <p className="text-purple-700 text-sm font-medium mb-2">Active Staff</p>
                <p className="text-purple-600 text-xs">Ready to serve</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions - Moved here after stats */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-purple-600" />
              Quick Actions
            </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* First Row */}
              <button
                onClick={() => {
                  setActiveTab('services');
                  setEditingService(null);
                  setIsServiceModalOpen(true);
                }}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Add Service</span>
                  <p className="text-cyan-100 text-xs">Create new service</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('leaves')}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Leave Requests</span>
                  <p className="text-orange-100 text-xs">Manage staff leaves</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('expenses')}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Expenses</span>
                  <p className="text-red-100 text-xs">Manage expenses</p>
                </div>
              </button>
              
              {/* Second Row */}
              <button
                onClick={() => setActiveTab('payments')}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Manage Payments</span>
                  <p className="text-emerald-100 text-xs">View transactions</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('staff')}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Manage Staff</span>
                  <p className="text-blue-100 text-xs">Team management</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('branches')}
                className="group relative overflow-hidden flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10 p-2 bg-white/20 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-base font-semibold block">Branches</span>
                  <p className="text-gray-100 text-xs">Manage locations</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation - Moved to after Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group relative flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 whitespace-nowrap min-w-fit ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                      }`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-semibold transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-900'
                      }`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="w-full h-0.5 bg-white/30 rounded-full mt-1"></div>
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced Daily Income Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Daily Income Breakdown</h3>
                  <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Today's Appointments</span>
                    <span className="text-xl font-bold text-gray-900">{todayAppointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Total Appointment Charges</span>
                    <span className="text-lg font-bold text-green-600">LKR {appointmentChargePerDay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Service Charges</span>
                    <span className="text-lg font-bold text-red-600">-LKR {todayEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
                    <span className="text-gray-700 font-bold">Total Daily Income</span>
                    <span className="text-2xl font-bold text-purple-600">LKR {(appointmentChargePerDay - todayEarnings).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Top Performing Staff</h3>
                  <div className="p-2 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(earningsByBarber)
                    .sort(([,a], [,b]) => b - a)
                    .map(([barber, amount], index) => (
                    <div key={barber} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                          'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-gray-800 font-medium">{barber}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">LKR {amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Payment Schedule Info */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">Automated Payment Schedule</h3>
                  <p className="text-blue-700 text-base leading-relaxed">
                    System automatically charges LKR 50.00 per appointment daily at 10:00 PM. 
                    <br />
                    <span className="font-semibold">Today's charge: LKR {appointmentChargePerDay.toFixed(2)} for {todayAppointments.length} appointments.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Feature Tabs */}
        {activeTab === 'staff' && <EmployeeManagement />}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
        {activeTab === 'payments' && <PaymentBilling />}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Service Management</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services by name..."
                  value={servicesSearch}
                  onChange={(e) => setServicesSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {/* Add Service Button */}
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
            </div>
          </div>
          
          <ServiceListView 
            services={searchServices(services, servicesSearch)}
            onEditService={handleEditService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
          />
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by barber name or reason..."
                value={leaveRequestsSearch}
                onChange={(e) => setLeaveRequestsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {searchLeaveRequests(pendingLeaves, leaveRequestsSearch).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {leaveRequestsSearch ? 'No leave requests match your search.' : 'No pending leave requests'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchLeaveRequests(pendingLeaves, leaveRequestsSearch).map(request => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  onAction={handleLeaveAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense Management Tab */}
      {activeTab === 'expenses' && <ExpenseManagement />}

      {/* Branch Management Tab */}
      {activeTab === 'branches' && <BranchManagement />}

      {/* Modals */}
      <ServiceManagementModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        editingService={editingService || undefined}
        onDelete={handleDeleteServiceFromModal}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        profile={userProfile}
        onSave={handleProfileSave}
        userRole="owner"
      />
      </div>
    </div>
  );
};

export default OwnerDashboard;