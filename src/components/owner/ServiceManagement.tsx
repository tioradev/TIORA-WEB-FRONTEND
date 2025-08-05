import React, { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ServiceListView from './ServiceListView';
import ServiceManagementModal from './ServiceManagementModal';
import { Service } from '../../types';

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { getSalonId } = useAuth();

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const salonId = getSalonId();
      if (!salonId) {
        setError('Salon ID not found. Please ensure you are logged in.');
        return;
      }

      console.log('🔄 [SERVICE MANAGEMENT] Loading services for salon:', salonId);
      
      const response = await apiService.getActiveServices(salonId);
      
      console.log('📡 [SERVICE MANAGEMENT] API response received:', response);
      
      if (response.success !== false && response.services) {
        console.log('✅ [SERVICE MANAGEMENT] Services loaded successfully:', response.services.length, 'services');
        console.log('📋 [SERVICE MANAGEMENT] Raw service data:', response.services);
        
        // Map API category to internal category
        const mapApiCategory = (apiCategory: string): 'hair' | 'beard' | 'styling' | 'treatment' | 'coloring' | 'spa' => {
          switch (apiCategory) {
            case 'HAIRCUT':
            case 'HAIR_STYLING':
            case 'HAIR_COLOR':
            case 'HAIR_TREATMENT':
              return 'hair';
            case 'BEARD_TRIM':
            case 'BEARD_STYLING':
            case 'SHAVING':
              return 'beard';
            case 'FACIAL':
            case 'SKIN_CARE':
              return 'spa';
            case 'MASSAGE':
              return 'spa';
            case 'MANICURE':
            case 'PEDICURE':
            case 'EYEBROW':
            case 'MAKEUP':
              return 'treatment';
            case 'PACKAGE':
            case 'OTHER':
            default:
              return 'styling';
          }
        };
        
        // Convert API response to Service format
        const convertedServices: Service[] = response.services.map((apiService: any) => ({
          id: apiService.id?.toString() || Math.random().toString(),
          salonId: salonId.toString(),
          name: apiService.name || '',
          description: apiService.description || '',
          type: 'standard',
          category: mapApiCategory(apiService.category || 'OTHER'),
          duration: apiService.duration_minutes || 60,
          price: apiService.price || 0,
          discountPrice: apiService.discount_price || undefined,
          isActive: apiService.status === 'ACTIVE' || apiService.is_active === true,
          requiredSkills: [],
          availableForGender: (apiService.gender_availability === 'unisex' ? 'both' : 
                              apiService.gender_availability || 'both') as 'male' | 'female' | 'both',
          imageUrl: apiService.image_url || '',
          popularity: 1,
          createdAt: new Date(apiService.created_at || Date.now()),
          updatedAt: new Date(apiService.updated_at || Date.now()),
          createdBy: 'current-user-id',
          profitMargin: 75
        }));
        
        console.log('🔄 [SERVICE MANAGEMENT] Converted services:', convertedServices);
        setServices(convertedServices);
      } else {
        const errorMessage = response.message || 'Failed to load services';
        console.error('❌ [SERVICE MANAGEMENT] Failed to load services:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('❌ [SERVICE MANAGEMENT] Error loading services:', error);
      let errorMessage = 'Error loading services. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = (serviceData: Omit<Service, 'id'>) => {
    if (editingService) {
      // Update existing service in the local state
      setServices(prev => prev.map(service => 
        service.id === editingService.id 
          ? { ...serviceData, id: editingService.id }
          : service
      ));
    } else {
      // Add new service to local state
      const newService: Service = {
        ...serviceData,
        id: Math.random().toString() // Temporary ID, will be replaced by API response
      };
      setServices(prev => [...prev, newService]);
    }
    
    setIsModalOpen(false);
    setEditingService(null);
    
    // Reload services to get fresh data from API
    loadServices();
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      // Optimistically remove from UI
      setServices(prev => prev.filter(s => s.id !== serviceId));
      
      // Note: Delete logic is handled in ServiceListView component
      // This function is mainly for UI coordination
    } catch (error) {
      console.error('❌ [SERVICE MANAGEMENT] Error deleting service:', error);
      // Reload services to revert optimistic update
      loadServices();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Services</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadServices}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600 mt-1">Manage your salon services and pricing</p>
        </div>
        <button
          onClick={handleAddService}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </button>
      </div>

      {/* Services List */}
      <ServiceListView
        services={services}
        onEditService={handleEditService}
        onDeleteService={handleDeleteService}
        refreshServices={loadServices}
      />

      {/* Service Management Modal */}
      {isModalOpen && (
        <ServiceManagementModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingService(null);
          }}
          onSave={handleSaveService}
          editingService={editingService || undefined}
          refreshServices={loadServices}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
