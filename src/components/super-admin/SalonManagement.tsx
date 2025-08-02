import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, 
  Eye, EyeOff, Building, Mail, Phone, MapPin,
  Calendar, DollarSign, Users, Activity, AlertTriangle,
  CheckCircle, Clock, Globe, CreditCard, Navigation, X
} from 'lucide-react';
import { mockSalons } from '../../data/mockData';
import { Salon } from '../../types';
import AddSalonModal from './AddSalonModal';

const SalonManagement: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>(mockSalons);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'trial'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'basic' | 'premium' | 'enterprise'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = 
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && salon.subscriptionStatus === 'active') ||
      (filterStatus === 'inactive' && salon.subscriptionStatus === 'inactive') ||
      (filterStatus === 'trial' && salon.subscriptionStatus === 'trial');

    const matchesPlan = 
      filterPlan === 'all' || salon.subscriptionPlan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleToggleStatus = (salonId: string) => {
    setSalons(salons.map(salon => 
      salon.id === salonId 
        ? { 
            ...salon, 
            isActive: !salon.isActive,
            subscriptionStatus: salon.isActive ? 'inactive' : 'active',
            updatedAt: new Date()
          }
        : salon
    ));
  };

  const handleDeleteSalon = (salonId: string) => {
    if (window.confirm('Are you sure you want to delete this salon? This action cannot be undone.')) {
      setSalons(salons.filter(salon => salon.id !== salonId));
    }
  };

  const downloadSalonReport = () => {
    const reportData = filteredSalons.map(salon => 
      `${salon.name},${salon.ownerName},${salon.ownerEmail},${salon.city},${salon.subscriptionPlan},${salon.subscriptionStatus},${salon.totalEmployees},${salon.totalCustomers},${salon.monthlyRevenue}`
    ).join('\n');
    
    const blob = new Blob([
      `Salon Name,Owner Name,Owner Email,City,Plan,Status,Employees,Customers,Monthly Revenue\n${reportData}`
    ], { type: 'text/csv' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salon-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewSalonDetails = (salon: Salon) => {
    setSelectedSalon(salon);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salon Management</h2>
          <p className="text-gray-600">Manage all registered salons and their subscriptions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadSalonReport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Register Salon</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Salons</p>
              <p className="text-2xl font-bold text-gray-900">{salons.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Salons</p>
              <p className="text-2xl font-bold text-gray-900">
                {salons.filter(s => s.subscriptionStatus === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${salons.reduce((sum, s) => sum + s.monthlyRevenue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {salons.reduce((sum, s) => sum + s.totalCustomers, 0).toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
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
                placeholder="Search salons by name, owner, email, or city..."
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
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredSalons.length} of {salons.length} salons
            </div>
          </div>
        </div>
      </div>

      {/* Salon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalons.map((salon) => (
          <div key={salon.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{salon.name}</h3>
                    <p className="text-sm text-gray-600">{salon.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className={`w-4 h-4 ${getSystemStatusColor(salon.systemStatus)}`} />
                  <span className={`text-xs font-medium ${getSystemStatusColor(salon.systemStatus)}`}>
                    {salon.systemStatus.charAt(0).toUpperCase() + salon.systemStatus.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(salon.subscriptionPlan)}`}>
                  {salon.subscriptionPlan.charAt(0).toUpperCase() + salon.subscriptionPlan.slice(1)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(salon.subscriptionStatus)}`}>
                  {salon.subscriptionStatus.charAt(0).toUpperCase() + salon.subscriptionStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Owner Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{salon.ownerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{salon.ownerEmail}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{salon.city}, {salon.state}</span>
                </div>
                {salon.latitude && salon.longitude && (
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {parseFloat(salon.latitude).toFixed(4)}, {parseFloat(salon.longitude).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{salon.totalEmployees}</div>
                  <div className="text-xs text-gray-600">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{salon.totalCustomers}</div>
                  <div className="text-xs text-gray-600">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">${salon.monthlyRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => viewSalonDetails(salon)}
                  className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleToggleStatus(salon.id)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                    salon.isActive 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {salon.isActive ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                  {salon.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteSalon(salon.id)}
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

      {/* Salon Detail Modal */}
      {showDetailModal && selectedSalon && (
        <SalonDetailModal
          salon={selectedSalon}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Add Salon Modal */}
      {showAddModal && (
        <AddSalonModal
          onClose={() => setShowAddModal(false)}
          onAdd={(salonData) => {
            const newSalon: Salon = {
              ...salonData,
              id: Date.now().toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'super-admin',
            };
            setSalons([...salons, newSalon]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// Salon Detail Modal Component
interface SalonDetailModalProps {
  salon: Salon;
  onClose: () => void;
}

const SalonDetailModal: React.FC<SalonDetailModalProps> = ({ salon, onClose }) => {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Salon Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{salon.name}</p>
                    <p className="text-sm text-gray-600">{salon.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{salon.ownerEmail}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{salon.ownerPhone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {salon.address}, {salon.city}, {salon.state} {salon.zipCode}
                  </span>
                </div>
                {salon.latitude && salon.longitude && (
                  <div className="flex items-center space-x-3">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Lat: {parseFloat(salon.latitude).toFixed(6)}, Lng: {parseFloat(salon.longitude).toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(salon.subscriptionPlan)}`}>
                      {salon.subscriptionPlan.charAt(0).toUpperCase() + salon.subscriptionPlan.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {salon.subscriptionStartDate.toLocaleDateString()} - {salon.subscriptionEndDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${getSystemStatusColor(salon.systemStatus)}`}>
                    {salon.systemStatus.charAt(0).toUpperCase() + salon.systemStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">{salon.totalEmployees}</div>
              <div className="text-sm text-blue-700">Employees</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">{salon.totalCustomers}</div>
              <div className="text-sm text-green-700">Customers</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900">${salon.monthlyRevenue.toLocaleString()}</div>
              <div className="text-sm text-purple-700">Monthly Revenue</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-900">{salon.branchCount}</div>
              <div className="text-sm text-amber-700">Branches</div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Enabled Features</h4>
            <div className="flex flex-wrap gap-2">
              {salon.features.map((feature, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonManagement;