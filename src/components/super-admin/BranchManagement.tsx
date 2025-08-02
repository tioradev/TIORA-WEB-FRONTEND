import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, MapPin, Phone, Mail, 
  Clock, Users, Building, Eye, EyeOff, X, Save
} from 'lucide-react';
import { SalonBranch } from '../../types';

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<SalonBranch[]>([
    {
      id: '1',
      salonId: 'salon1',
      name: 'Downtown Branch',
      address: '123 Main Street, Downtown, Colombo 03',
      phone: '+94771234567',
      email: 'downtown@salon.com',
      isActive: true,
      openingHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '20:00', isOpen: true },
        saturday: { open: '08:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: false },
      },
      createdAt: new Date('2023-01-15'),
    },
    {
      id: '2',
      salonId: 'salon1',
      name: 'Mall Branch',
      address: '456 Shopping Mall, Level 2, Kandy',
      phone: '+94771234568',
      email: 'mall@salon.com',
      isActive: true,
      openingHours: {
        monday: { open: '10:00', close: '21:00', isOpen: true },
        tuesday: { open: '10:00', close: '21:00', isOpen: true },
        wednesday: { open: '10:00', close: '21:00', isOpen: true },
        thursday: { open: '10:00', close: '21:00', isOpen: true },
        friday: { open: '10:00', close: '22:00', isOpen: true },
        saturday: { open: '10:00', close: '22:00', isOpen: true },
        sunday: { open: '11:00', close: '20:00', isOpen: true },
      },
      createdAt: new Date('2023-06-20'),
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<SalonBranch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<SalonBranch | null>(null);

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRUD Functions
  const handleAddBranch = () => {
    setEditingBranch(null);
    setShowAddModal(true);
  };

  const handleEditBranch = (branch: SalonBranch) => {
    setEditingBranch(branch);
    setShowAddModal(true);
  };

  const handleSaveBranch = (branchData: Omit<SalonBranch, 'id' | 'salonId' | 'createdAt'>) => {
    try {
      if (editingBranch) {
        // Update existing branch
        setBranches(branches.map(b => 
          b.id === editingBranch.id 
            ? { ...b, ...branchData }
            : b
        ));
        setShowSuccessPopup(true);
      } else {
        // Add new branch
        const newBranch: SalonBranch = {
          ...branchData,
          id: Date.now().toString(),
          salonId: 'salon1',
          createdAt: new Date(),
        };
        setBranches([...branches, newBranch]);
        setShowSuccessPopup(true);
      }
      setShowAddModal(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error saving branch. Please try again.');
    }
  };

  const handleToggleStatus = (branchId: string) => {
    try {
      setBranches(branches.map(branch =>
        branch.id === branchId
          ? { ...branch, isActive: !branch.isActive }
          : branch
      ));
    } catch (error) {
      console.error('Error updating branch status:', error);
      alert('Error updating branch status. Please try again.');
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setBranchToDelete(branch);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteBranch = () => {
    if (branchToDelete) {
      try {
        setBranches(branches.filter(branch => branch.id !== branchToDelete.id));
        setShowSuccessPopup(true);
        setShowDeleteConfirm(false);
        setBranchToDelete(null);
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Error deleting branch. Please try again.');
      }
    }
  };

  const cancelDeleteBranch = () => {
    setShowDeleteConfirm(false);
    setBranchToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Branch Management</h2>
          <p className="text-gray-600">Manage all salon branches and locations</p>
        </div>
        <button
          onClick={handleAddBranch}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.filter(b => b.isActive).length}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.filter(b => !b.isActive).length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        {/* Removed Avg Revenue card and updated grid to 3 columns for proper alignment */}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-600">{branch.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    branch.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit branch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(branch.id)}
                      className={`p-1 ${branch.isActive ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                      title={branch.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {branch.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">{branch.address}</span>
                    {(branch as any).latitude && (branch as any).longitude && (
                      <span className="text-xs text-gray-400">
                        {(branch as any).latitude.toFixed(6)}, {(branch as any).longitude.toFixed(6)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{branch.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{branch.email}</span>
                </div>
              </div>

              {/* Opening Hours */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Opening Hours</span>
                </h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(branch.openingHours).map(([day, hours]) => (
                    <div key={day} className={`flex justify-between ${!hours.isOpen ? 'text-gray-400' : ''}`}>
                      <span className="capitalize">{day.slice(0, 3)}</span>
                      <span>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">12</div>
                  <div className="text-xs text-gray-600">Employees</div>
                </div>
                <div className="text-center">
                  {/* Removed Monthly Revenue as requested */}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
          <p className="text-gray-600">Try adjusting your search or add a new branch.</p>
        </div>
      )}

      {/* Add/Edit Branch Modal */}
      {showAddModal && (
        <BranchModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingBranch(null);
          }}
          onSave={handleSaveBranch}
          editingBranch={editingBranch}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {editingBranch ? 'Branch Updated Successfully!' : 
               branchToDelete ? 'Branch Deleted Successfully!' : 'Branch Added Successfully!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {editingBranch ? 'The branch has been updated successfully.' : 
               branchToDelete ? `${branchToDelete.name} has been removed from your salon network.` : 
               'New branch has been added to your salon network.'}
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && branchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Branch
              </h3>
              <p className="text-gray-600 mb-1">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{branchToDelete.name}"</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone and will permanently remove all branch data.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteBranch}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBranch}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Delete Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Branch Modal Component
interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Omit<SalonBranch, 'id' | 'salonId' | 'createdAt'>) => void;
  editingBranch: SalonBranch | null;
}

const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBranch
}) => {
  const [formData, setFormData] = useState({
    name: editingBranch?.name || '',
    address: editingBranch?.address || '',
    phone: editingBranch?.phone || '',
    email: editingBranch?.email || '',
    isActive: editingBranch?.isActive ?? true,
    latitude: (editingBranch as any)?.latitude || null,
    longitude: (editingBranch as any)?.longitude || null,
    openingHours: editingBranch?.openingHours || {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false },
    },
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted;
            setFormData({
              ...formData,
              address,
              latitude,
              longitude,
            });
          } else {
            // Fallback to coordinates if reverse geocoding fails
            setFormData({
              ...formData,
              address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
              latitude,
              longitude,
            });
          }
        } catch (error) {
          // Fallback to coordinates if API fails
          setFormData({
            ...formData,
            address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            latitude,
            longitude,
          });
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Function to open Google Maps for location selection
  const openLocationPicker = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${formData.latitude || 6.9271},${formData.longitude || 79.8612}`;
    window.open(googleMapsUrl, '_blank');
    alert('Select your location on Google Maps, then copy the coordinates back to this form.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Please enter a branch name');
      return;
    }
    
    // Always save phone with +94 prefix
    onSave({ ...formData, phone: `+94${formData.phone.replace(/^\+94/, '')}` });
  };

  const updateOpeningHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day as keyof typeof formData.openingHours],
          [field]: value,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingBranch ? 'Edit Branch' : 'Add New Branch'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="space-y-3">
                {/* Location Services */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 rounded-lg transition-colors duration-200"
                  >
                    {isLoadingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={openLocationPicker}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors duration-200"
                  >
                    <Search className="w-4 h-4" />
                    <span>Pick on Maps</span>
                  </button>
                </div>
                
                {/* Coordinates Display */}
                {(formData.latitude && formData.longitude) && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                )}
                
                {/* Manual Coordinate Input */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                      placeholder="6.9271"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                      placeholder="79.8612"
                    />
                  </div>
                </div>
                
                {/* Location Error */}
                {locationError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {locationError}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 select-none">+94</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{9}"
                    maxLength={9}
                    minLength={9}
                    value={formData.phone.replace(/^\+94/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                      setFormData({ ...formData, phone: val });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Opening Hours</h4>
            <div className="space-y-3">
              {Object.entries(formData.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-20">
                    <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      onChange={(e) => updateOpeningHours(day, 'isOpen', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                  </div>
                  {hours.isOpen && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingBranch ? 'Update' : 'Add'} Branch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchManagement;