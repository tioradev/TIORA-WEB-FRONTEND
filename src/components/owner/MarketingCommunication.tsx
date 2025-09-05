import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, MessageSquare, Star, 
  Plus, Search, Filter, Calendar,
  TrendingUp, Gift, Upload, X,
  Edit, Trash2, Eye, EyeOff, AlertCircle,
  Loader, ChevronLeft, ChevronRight
} from 'lucide-react';
import { PromotionResponse, PromotionRequest, PaginatedResponse } from '../../types';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastProvider';
import ConfirmationDialog from '../shared/ConfirmationDialog';

interface MarketingCommunicationProps {
  userRole?: 'owner' | 'super-admin';
}

const MarketingCommunication: React.FC<MarketingCommunicationProps> = ({ userRole = 'owner' }) => {
  const [activeTab, setActiveTab] = useState<'promotions' | 'email' | 'sms' | 'reviews'>('promotions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPromotionModal, setShowAddPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionResponse | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    promotion?: PromotionResponse;
  }>({ isOpen: false, type: 'delete' });
  
  // API-driven state
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const { showSuccess, showError, showWarning } = useToast();

  // Load promotions from API
  useEffect(() => {
    if (activeTab === 'promotions') {
      loadPromotions();
    }
  }, [activeTab, currentPage, pageSize]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<PromotionResponse> = await apiService.getAllPromotions(currentPage, pageSize);
      setPromotions(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      console.log('Loaded promotions:', response);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      showError('Error', 'Failed to load promotions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'email', label: 'Email Marketing', icon: Mail },
    { id: 'sms', label: 'SMS Marketing', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const filteredPromotions = promotions.filter(promotion =>
    promotion.promotionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics from current page data
  const activePromotions = promotions.filter(p => p.status === 'ACTIVE' && p.active).length;
  const upcomingPromotions = promotions.filter(p => p.upcoming).length;
  const expiredPromotions = promotions.filter(p => p.expired).length;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Convert form data to API format
  const convertToApiFormat = (formData: any): PromotionRequest => ({
    promotionName: formData.name,
    description: formData.description,
    startDate: formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : formData.startDate,
    endDate: formData.endDate instanceof Date ? formData.endDate.toISOString().split('T')[0] : formData.endDate,
    imageUrl: formData.imageUrl || undefined,
    status: formData.isActive ? 'ACTIVE' : 'INACTIVE'
  });

  const handleAddPromotion = async (promotionData: any) => {
    try {
      setSubmitting(true);
      const apiData = convertToApiFormat(promotionData);
      await apiService.createPromotion(apiData);
      showSuccess('Promotion Created!', `"${promotionData.name}" has been created successfully.`);
      setShowAddPromotionModal(false);
      loadPromotions(); // Refresh the list
    } catch (error) {
      console.error('Failed to create promotion:', error);
      showError('Error', 'Failed to create promotion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPromotion = async (promotionData: any) => {
    if (!editingPromotion) return;
    
    try {
      setSubmitting(true);
      const apiData = convertToApiFormat(promotionData);
      await apiService.updatePromotion(editingPromotion.promotionId, apiData);
      showSuccess('Promotion Updated!', `"${promotionData.name}" has been updated successfully.`);
      setEditingPromotion(null);
      setShowAddPromotionModal(false);
      loadPromotions(); // Refresh the list
    } catch (error) {
      console.error('Failed to update promotion:', error);
      showError('Error', 'Failed to update promotion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromotion = (promotion: PromotionResponse) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      promotion
    });
  };

  const confirmDeletePromotion = async () => {
    if (confirmDialog.promotion) {
      try {
        setSubmitting(true);
        await apiService.deletePromotion(confirmDialog.promotion.promotionId);
        showSuccess('Promotion Deleted!', `"${confirmDialog.promotion.promotionName}" has been permanently removed from the system.`);
        setConfirmDialog({ isOpen: false, type: 'delete' });
        loadPromotions(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete promotion:', error);
        showError('Error', 'Failed to delete promotion. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleToggleStatus = (promotion: PromotionResponse) => {
    const newStatus = promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      promotion: { ...promotion, status: newStatus }
    });
  };

  const confirmToggleStatus = async () => {
    if (confirmDialog.promotion) {
      try {
        setSubmitting(true);
        const promotionData: PromotionRequest = {
          promotionName: confirmDialog.promotion.promotionName,
          description: confirmDialog.promotion.description,
          startDate: confirmDialog.promotion.startDate,
          endDate: confirmDialog.promotion.endDate,
          imageUrl: confirmDialog.promotion.imageUrl,
          status: confirmDialog.promotion.status
        };
        
        await apiService.updatePromotion(confirmDialog.promotion.promotionId, promotionData);
        
        if (confirmDialog.promotion.status === 'ACTIVE') {
          showSuccess('Promotion Activated!', `"${confirmDialog.promotion.promotionName}" is now active and visible to customers.`);
        } else {
          showWarning('Promotion Deactivated', `"${confirmDialog.promotion.promotionName}" has been deactivated and is no longer visible to customers.`);
        }
        
        setConfirmDialog({ isOpen: false, type: 'toggle' });
        loadPromotions(); // Refresh the list
      } catch (error) {
        console.error('Failed to toggle promotion status:', error);
        showError('Error', 'Failed to update promotion status. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getPromotionStatus = (promotion: PromotionResponse) => {
    if (!promotion.active || promotion.status === 'INACTIVE') {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    if (promotion.upcoming) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    }
    if (promotion.expired) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    if (promotion.currentlyValid) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const PromotionModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: (data: any) => void;
    promotion?: PromotionResponse;
  }> = ({ isOpen, onClose, onSubmit, promotion }) => {
    const [formData, setFormData] = useState({
      name: promotion?.promotionName || '',
      description: promotion?.description || '',
      startDate: promotion?.startDate || '',
      endDate: promotion?.endDate || '',
      imageUrl: promotion?.imageUrl || '',
      isActive: promotion?.status === 'ACTIVE' && promotion?.active,
    });

    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form data only when modal opens for a new promotion or when promotion changes
    useEffect(() => {
      if (isOpen) {
        setFormData({
          name: promotion?.promotionName || '',
          description: promotion?.description || '',
          startDate: promotion?.startDate || '',
          endDate: promotion?.endDate || '',
          imageUrl: promotion?.imageUrl || '',
          isActive: promotion?.status === 'ACTIVE' && promotion?.active,
        });
        setIsDragOver(false);
      }
    }, [isOpen, promotion?.promotionId]); // Only reset when modal opens or when editing a different promotion

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Check if start date is in the past (only for new promotions)
      if (!promotion && startDate < today) {
        showError('Invalid Start Date', 'Start date cannot be in the past. Please select a current or future date.');
        return;
      }
      
      // Check if end date is before start date
      if (endDate <= startDate) {
        showError('Invalid End Date', 'End date must be after the start date.');
        return;
      }
      
      // Check if required fields are filled
      if (!formData.name.trim() || !formData.description.trim()) {
        showError('Missing Information', 'Please fill in all required fields.');
        return;
      }
      
      onSubmit({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      onClose();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (userRole !== 'super-admin') {
        showError('Upload Restricted', 'Image upload is restricted to Super Admin users only. Please contact your Super Admin for assistance.');
        return;
      }
      
      const file = e.target.files?.[0];
      if (file) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showError('File Too Large', 'Please select an image smaller than 10MB.');
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          showError('Invalid File Type', 'Please select a valid image file (PNG, JPG, GIF).');
          return;
        }

        // Read file and create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            console.log('Image loaded successfully, data URL:', dataUrl.substring(0, 50) + '...');
            setFormData(prevData => ({ 
              ...prevData, 
              imageUrl: dataUrl 
            }));
            showSuccess('Image Selected', 'Image has been selected successfully. It will be saved when you create the promotion.');
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        reader.onerror = () => {
          console.error('FileReader error occurred');
          showError('Upload Failed', 'Failed to read the selected image. Please try again.');
        };
        console.log('Starting to read file:', file.name, 'Type:', file.type, 'Size:', file.size);
        reader.readAsDataURL(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (userRole === 'super-admin') {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (userRole !== 'super-admin') {
        showError('Upload Restricted', 'Image upload is restricted to Super Admin users only. Please contact your Super Admin for assistance.');
        return;
      }

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        const file = files[0];
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showError('File Too Large', 'Please select an image smaller than 10MB.');
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          showError('Invalid File Type', 'Please select a valid image file (PNG, JPG, GIF).');
          return;
        }

        // Read file and create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            console.log('Drop: Image loaded successfully, data URL:', dataUrl.substring(0, 50) + '...');
            setFormData(prevData => ({ 
              ...prevData, 
              imageUrl: dataUrl 
            }));
            showSuccess('Image Selected', 'Image has been dropped successfully. It will be saved when you create the promotion.');
          }
        };
        reader.onerror = () => {
          console.error('Drop: FileReader error occurred');
          showError('Upload Failed', 'Failed to read the dropped image. Please try again.');
        };
        console.log('Drop: Starting to read file:', file.name, 'Type:', file.type, 'Size:', file.size);
        reader.readAsDataURL(file);
      }
    };

    if (!isOpen) return null;

    // Get today's date in YYYY-MM-DD format for min date validation
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {promotion ? 'Edit Promotion' : 'Add New Promotion'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="promotion-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter promotion name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none transition-all"
                placeholder="Enter promotion description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  min={formData.startDate || today}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Must be after start date</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Upload
              </label>
              {userRole !== 'super-admin' ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Image upload restricted to Super Admin only</p>
                  <p className="text-xs text-gray-400 mt-1">Contact Super Admin for image upload permissions</p>
                </div>
              ) : (
                <label 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 block ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                    {isDragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}

              {/* Image Preview */}
              {formData.imageUrl ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Image Preview:</p>
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border">
                    <img 
                      src={formData.imageUrl} 
                      alt="Promotion preview" 
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Image preview loaded successfully')}
                      onError={(e) => console.error('Image preview failed to load:', e)}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prevData => ({ ...prevData, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">No image selected</p>
                  {/* Test button for debugging */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Test button clicked');
                      setFormData(prevData => ({ 
                        ...prevData, 
                        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdDwvdGV4dD48L3N2Zz4=' 
                      }));
                    }}
                    className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Test Image Preview
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                Active promotion
              </label>
              <div className="ml-auto">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  formData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="promotion-form"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                <span>{promotion ? 'Update' : 'Create'} Promotion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing & Communication</h1>
          <p className="text-gray-600 mt-1">Manage promotions, communications and customer engagement</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{activePromotions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingPromotions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{expiredPromotions}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'promotions' && (
            <div className="space-y-6">
              {/* Promotions Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Promotions Management</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowAddPromotionModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Promotion
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search promotions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              {/* Promotions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  return (
                    <div key={promotion.promotionId} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-200 relative">
                        <img 
                          src={promotion.imageUrl} 
                          alt={promotion.promotionName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{promotion.promotionName}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promotion.description}</p>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingPromotion(promotion);
                                setShowAddPromotionModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(promotion)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                              title={promotion.active && promotion.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            >
                              {promotion.active && promotion.status === 'ACTIVE' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeletePromotion(promotion)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            By {promotion.createdBy}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {!loading && totalElements > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} promotions
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Per page:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(0)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          const pageNum = Math.max(0, Math.min(totalPages - 3, currentPage - 1)) + i;
                          if (pageNum >= totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm rounded-lg ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredPromotions.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Start by creating your first promotion.'}
                  </p>
                  {!searchTerm && (
                    <button 
                      onClick={() => setShowAddPromotionModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Promotion
                    </button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading promotions...</span>
                </div>
              )}
            </div>
          )}

          {/* Other tabs content placeholder */}
          {activeTab === 'email' && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Marketing</h3>
              <p className="text-gray-600">Email marketing features coming soon...</p>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Marketing</h3>
              <p className="text-gray-600">SMS marketing features coming soon...</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Management</h3>
              <p className="text-gray-600">Reviews management features coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showAddPromotionModal}
        onClose={() => {
          setShowAddPromotionModal(false);
          setEditingPromotion(null);
        }}
        onSubmit={editingPromotion ? handleEditPromotion : handleAddPromotion}
        promotion={editingPromotion || undefined}
      />

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'delete'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={confirmDeletePromotion}
        title="Delete Promotion"
        message="This action cannot be undone. The promotion will be permanently removed from the system and will no longer be visible to customers."
        confirmText="Delete Promotion"
        cancelText="Keep Promotion"
        type="danger"
        itemName={confirmDialog.promotion?.promotionName}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'toggle'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'toggle' })}
        onConfirm={confirmToggleStatus}
        title={confirmDialog.promotion?.status === 'ACTIVE' ? 'Deactivate Promotion' : 'Activate Promotion'}
        message={
          confirmDialog.promotion?.status === 'ACTIVE'
            ? 'This promotion will be hidden from customers and they will no longer be able to access this offer.'
            : 'This promotion will become visible to customers and they will be able to take advantage of this offer.'
        }
        confirmText={confirmDialog.promotion?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        type={confirmDialog.promotion?.status === 'ACTIVE' ? 'warning' : 'info'}
        itemName={confirmDialog.promotion?.promotionName}
      />
    </div>
  );
};

export default MarketingCommunication;
