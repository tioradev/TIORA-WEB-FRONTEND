import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, EyeOff, Users, Clock, DollarSign } from 'lucide-react';
import { mockServices } from '../../data/mockData';
import { Service } from '../../types';

interface ServiceListViewProps {
  services?: Service[];
  onEditService: (service: Service) => void;
  onUpdateService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
}

const ServiceListView: React.FC<ServiceListViewProps> = ({ 
  services: propServices,
  onEditService, 
  onUpdateService,
  onDeleteService 
}) => {
  const [services, setServices] = useState<Service[]>(propServices || mockServices);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Update local services when prop changes
  useEffect(() => {
    if (propServices) {
      setServices(propServices);
    }
  }, [propServices]);

  const handleToggleActive = (serviceId: string) => {
    const updatedServices = services.map(service => 
      service.id === serviceId 
        ? { ...service, isActive: !service.isActive, updatedAt: new Date() }
        : service
    );
    setServices(updatedServices);
    
    // Call the parent update function if provided
    const updatedService = updatedServices.find(s => s.id === serviceId);
    if (updatedService && onUpdateService) {
      onUpdateService(updatedService);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (window.confirm(`Are you sure you want to delete "${service?.name}"? This action cannot be undone.`)) {
      setServices(services.filter(service => service.id !== serviceId));
      
      // Call the parent delete function if provided
      if (onDeleteService) {
        onDeleteService(serviceId);
      }
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
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      {service.discountPrice ? (
                        <>
                          <span className="text-lg font-semibold text-gray-900">${service.discountPrice}</span>
                          <span className="text-sm text-gray-500 line-through">${service.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">${service.price}</span>
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
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No services found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default ServiceListView;