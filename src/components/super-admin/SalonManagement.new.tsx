import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Trash2, 
  Eye, Building, Mail, Phone, MapPin,
  Calendar, DollarSign, Users, Activity,
  CheckCircle, Navigation, X, Loader
} from 'lucide-react';
import { apiService, SalonResponse } from '../../services/api';
import { useToast } from '../../contexts/ToastProvider';
import AddSalonModal from './AddSalonModal';

const SalonManagement: React.FC = () => {
  const [salons, setSalons] = useState<SalonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<SalonResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { showSuccess, showError } = useToast();

  // Load salons from API
  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const salonData = await apiService.getAllSalons();
      setSalons(salonData);
      console.log('Loaded salons:', salonData);
    } catch (error) {
      console.error('Failed to load salons:', error);
      showError('Error', 'Failed to load salon data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = 
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.fullOwnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.mainBranchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && salon.status === 'ACTIVE' && salon.active) ||
      (filterStatus === 'inactive' && (salon.status === 'INACTIVE' || !salon.active));

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (salonId: number) => {
    try {
      // Here you would call an API to toggle salon status
      // For now, just update locally
      setSalons(salons.map(salon => 
        salon.salonId === salonId 
          ? { 
              ...salon, 
              active: !salon.active,
              status: salon.active ? 'INACTIVE' : 'ACTIVE',
              updatedAt: new Date().toISOString()
            }
          : salon
      ));
      showSuccess('Success', 'Salon status updated successfully!');
    } catch (error) {
      showError('Error', 'Failed to update salon status. Please try again.');
    }
  };

  const handleDeleteSalon = async (salonId: number) => {
    if (window.confirm('Are you sure you want to delete this salon? This action cannot be undone.')) {
      try {
        // Here you would call an API to delete salon
        // For now, just remove locally
        setSalons(salons.filter(salon => salon.salonId !== salonId));
        showSuccess('Success', 'Salon deleted successfully!');
      } catch (error) {
        showError('Error', 'Failed to delete salon. Please try again.');
      }
    }
  };

  const downloadSalonReport = () => {
    const reportData = filteredSalons.map(salon => {
      return `${salon.name},${salon.fullOwnerName},${salon.ownerEmail},${salon.email},${salon.mainBranchName},${salon.district},${salon.status},${salon.totalEmployees},${salon.totalCustomers},${salon.totalIncome}`;
    }).join('\n');
    
    const blob = new Blob([
      `Salon Name,Owner Name,Owner Email,Salon Email,Branch Name,District,Status,Employees,Customers,Total Income\n${reportData}`
    ], { type: 'text/csv' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salon-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewSalonDetails = (salon: SalonResponse) => {
    setSelectedSalon(salon);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddSalon = () => {
    setShowAddModal(true);
  };

  const handleSalonAdded = () => {
    setShowAddModal(false);
    loadSalons(); // Reload salons after adding
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading salons...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salon Management</h2>
          <p className="text-gray-600">Manage and monitor all registered salons</p>
        </div>
        <button
          onClick={handleAddSalon}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Salon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Salons</p>
              <p className="text-2xl font-bold text-gray-900">{salons.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Salons</p>
              <p className="text-2xl font-bold text-green-600">
                {salons.filter(s => s.status === 'ACTIVE' && s.active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-purple-600">
                {salons.reduce((sum, s) => sum + s.totalEmployees, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">
                LKR {salons.reduce((sum, s) => sum + s.totalIncome, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search salons, owners, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={downloadSalonReport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Salons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSalons.map(salon => (
          <div key={salon.salonId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Salon Image */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
              {salon.imageUrl ? (
                <img 
                  src={salon.imageUrl} 
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(salon.status)}`}>
                  {salon.status}
                </span>
              </div>
            </div>

            {/* Salon Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{salon.name}</h3>
                  <p className="text-sm text-gray-600">{salon.mainBranchName}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className={`w-4 h-4 ${salon.active ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-xs font-medium ${salon.active ? 'text-green-600' : 'text-red-600'}`}>
                    {salon.active ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{salon.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{salon.phoneNumber}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{salon.address}, {salon.district}</span>
                </div>
              </div>

              {/* Owner Info */}
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Owner Information</h4>
                <div className="flex items-center space-x-3">
                  {salon.ownerImgUrl ? (
                    <img 
                      src={salon.ownerImgUrl} 
                      alt={salon.fullOwnerName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {salon.ownerFirstName[0]}{salon.ownerLastName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{salon.fullOwnerName}</p>
                    <p className="text-xs text-gray-600">{salon.ownerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{salon.totalEmployees}</p>
                  <p className="text-xs text-gray-600">Employees</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{salon.totalCustomers}</p>
                  <p className="text-xs text-gray-600">Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">LKR {salon.totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Revenue</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => viewSalonDetails(salon)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(salon.salonId)}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center transition-colors text-sm ${
                    salon.active 
                      ? 'bg-red-50 hover:bg-red-100 text-red-700' 
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}
                >
                  {salon.active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleDeleteSalon(salon.salonId)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg flex items-center justify-center transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSalons.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No salons match your criteria' : 'No salons registered yet'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Add the first salon to get started'}
          </p>
        </div>
      )}

      {/* Add Salon Modal */}
      {showAddModal && (
        <AddSalonModal
          onClose={() => setShowAddModal(false)}
          onSalonAdded={handleSalonAdded}
        />
      )}

      {/* Salon Details Modal */}
      {showDetailModal && selectedSalon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedSalon.imageUrl ? (
                    <img 
                      src={selectedSalon.imageUrl} 
                      alt={selectedSalon.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedSalon.name}</h3>
                    <p className="text-gray-600">{selectedSalon.mainBranchName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Salon Name</p>
                      <p className="text-gray-900">{selectedSalon.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-900">{selectedSalon.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">District</p>
                      <p className="text-gray-900">{selectedSalon.district}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Postal Code</p>
                      <p className="text-gray-900">{selectedSalon.postalCode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900">{selectedSalon.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{selectedSalon.email}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 mb-4">
                      {selectedSalon.ownerImgUrl ? (
                        <img 
                          src={selectedSalon.ownerImgUrl} 
                          alt={selectedSalon.fullOwnerName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {selectedSalon.ownerFirstName[0]}{selectedSalon.ownerLastName[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedSalon.fullOwnerName}</p>
                        <p className="text-sm text-gray-600">Salon Owner</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Owner Email</p>
                      <p className="text-gray-900">{selectedSalon.ownerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Owner Phone</p>
                      <p className="text-gray-900">{selectedSalon.ownerPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Business Registration</p>
                      <p className="text-gray-900">{selectedSalon.brNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tax ID</p>
                      <p className="text-gray-900">{selectedSalon.taxId}</p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedSalon.totalEmployees}</p>
                      <p className="text-sm text-gray-600">Total Employees</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedSalon.totalCustomers}</p>
                      <p className="text-sm text-gray-600">Total Customers</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">LKR {selectedSalon.totalIncome.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Income</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedSalon.totalSalonCount}</p>
                      <p className="text-sm text-gray-600">Total Branches</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="md:col-span-2 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Created</p>
                      <p className="text-gray-600">{new Date(selectedSalon.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">by {selectedSalon.createdBy}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Last Updated</p>
                      <p className="text-gray-600">{new Date(selectedSalon.updatedAt).toLocaleString()}</p>
                    </div>
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

export default SalonManagement;
