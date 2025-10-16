import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, EyeOff, Users, Clock } from 'lucide-react';
import RupeeIcon from '../shared/RupeeIcon';
import { mockServices } from '../../data/mockData';
import { Service } from '../../types';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastProvider';

interface ServiceListViewProps {
  services?: Service[];
  onEditService: (service: Service) => void;
  onUpdateService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
  refreshServices?: () => void;
}

const ServiceListView: React.FC<ServiceListViewProps> = ({ 
  services: propServices,
  onEditService, 
  onUpdateService,
  onDeleteService,
  refreshServices
}) => {
  const { showSuccess, showError } = useToast();
  const [services, setServices] = useState<Service[]>(propServices || mockServices);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; service: Service | null }>({
    show: false,
    service: null
  });

  // Update local services when prop changes
  useEffect(() => {
    if (propServices) {
      setServices(propServices);
    }
  }, [propServices]);

  const handleToggleActive = async (serviceId: string) => {
    try {
      setLoading(true);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        showError('Service not found', 'Unable to find the service to update.');
        return;
      }

      // Map internal category to API category
      const mapToApiCategory = (category: string): string => {
        switch (category) {
          case 'hair': return 'HAIRCUT';
          case 'beard': return 'BEARD_TRIM';
          case 'styling': return 'HAIR_STYLING';
          case 'treatment': return 'FACIAL';
          case 'coloring': return 'HAIR_COLOR';
          case 'spa': return 'MASSAGE';
          default: return 'OTHER';
        }
      };

      // Convert Service to API format for update
      const updateData = {
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration,
        price: service.price,
        discount_price: service.discountPrice || 0,
        category: mapToApiCategory(service.category),
        gender_availability: service.availableForGender === 'both' ? 'unisex' : service.availableForGender,
        image_url: service.imageUrl,
        status: !service.isActive ? 'ACTIVE' : 'INACTIVE',
        is_active: !service.isActive,
        is_popular: false
      };

      console.log('🔄 [SERVICE] Toggling service status:', serviceId, updateData);
      
      const response = await apiService.updateService(serviceId, updateData);
      
      console.log('📡 [SERVICE] Update response:', response);
      
      if (response.success !== false) {
        // Update local state
        const updatedServices = services.map(s => 
          s.id === serviceId 
            ? { ...s, isActive: !s.isActive, updatedAt: new Date() }
            : s
        );
        setServices(updatedServices);
        
        // Show success toast
        const action = !service.isActive ? 'activated' : 'deactivated';
        showSuccess(
          `Service ${action}`,
          `"${service.name}" has been successfully ${action}.`
        );
        
        // Call the parent update function if provided
        const updatedService = updatedServices.find(s => s.id === serviceId);
        if (updatedService && onUpdateService) {
          onUpdateService(updatedService);
        }
        
        // Refresh services list if function provided
        if (refreshServices) {
          refreshServices();
        }
      } else {
        const errorMessage = response.message || 'Unknown error occurred';
        showError('Update failed', `Failed to update service status: ${errorMessage}`);
        console.error('❌ [SERVICE] API returned error:', response);
      }
    } catch (error) {
      console.error('❌ [SERVICE] Error toggling service status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError('Update failed', `Error updating service status: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      showError('Service not found', 'Unable to find the service to delete.');
      return;
    }
    
    setShowDeleteConfirm({ show: true, service });
  };

  const confirmDeleteService = async () => {
    const service = showDeleteConfirm.service;
    if (!service) return;

    try {
      setLoading(true);
      console.log('🗑️ [SERVICE] Deleting service:', service.id);
      
      const response = await apiService.deleteService(service.id);
      
      console.log('📡 [SERVICE] Delete response:', response);
      
      if (response.success) {
        // Update local state
        setServices(services.filter(s => s.id !== service.id));
        
        // Show success toast
        showSuccess(
          'Service deleted',
          `"${service.name}" has been permanently deleted.`
        );
        
        // Call the parent delete function if provided
        if (onDeleteService) {
          onDeleteService(service.id);
        }
        
        // Refresh services list if function provided
        if (refreshServices) {
          refreshServices();
        }
      } else {
        const errorMessage = response.message || 'Unknown error occurred';
        showError('Delete failed', `Failed to delete service: ${errorMessage}`);
        console.error('❌ [SERVICE] API returned error:', response);
      }
    } catch (error) {
      console.error('❌ [SERVICE] Error deleting service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError('Delete failed', `Error deleting service: ${errorMessage}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm({ show: false, service: null });
    }
  };

  const filteredServices = services.filter(service => {
    const statusMatch = filter === 'all' || 
      (filter === 'active' && service.isActive) || 
      (filter === 'inactive' && !service.isActive);
    
    return statusMatch;
  });

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '♂';
      case 'female': return '♀';
      case 'both': return '⚥';
      default: return '⚥';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredServices.length} of {services.length} services
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Service Image */}
            {service.imageUrl && (
              <div className="h-32 bg-gray-200 overflow-hidden">
                <img 
                  src={service.imageUrl} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{service.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
              )}

              {/* Service Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{service.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{getGenderIcon(service.availableForGender)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RupeeIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      {service.discountPrice ? (
                        <>
                          <span className="text-lg font-semibold text-gray-900">Rs {service.discountPrice}</span>
                          <span className="text-sm text-gray-500 line-through">Rs {service.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">Rs {service.price}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < service.popularity ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {service.requiredSkills && service.requiredSkills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {service.requiredSkills.slice(0, 2).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {service.requiredSkills.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{service.requiredSkills.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onEditService(service)}
                  className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleToggleActive(service.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                    service.isActive 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {service.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{service.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
                
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <RupeeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No services found matching your filters.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && showDeleteConfirm.service && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Service</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to permanently delete <strong>"{showDeleteConfirm.service.name}"</strong>? 
                This will remove the service from your salon's offerings and cannot be reversed.
              </p>
              
              {showDeleteConfirm.service.isActive && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ This service is currently active and may be visible to customers. 
                    Consider deactivating it first if you want to keep the service data.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm({ show: false, service: null })}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteService}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceListView;