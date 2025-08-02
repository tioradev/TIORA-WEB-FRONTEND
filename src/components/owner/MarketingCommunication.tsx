import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, MessageSquare, Star, 
  Plus, Search, Filter, Calendar,
  TrendingUp, Gift, Upload, X,
  Edit, Trash2, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { Promotion } from '../../types';
import { useToast } from '../../contexts/ToastProvider';
import ConfirmationDialog from '../shared/ConfirmationDialog';

interface MarketingCommunicationProps {
  userRole?: 'owner' | 'super-admin';
}

const MarketingCommunication: React.FC<MarketingCommunicationProps> = ({ userRole = 'owner' }) => {
  const [activeTab, setActiveTab] = useState<'promotions' | 'email' | 'sms' | 'reviews'>('promotions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPromotionModal, setShowAddPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    promotion?: Promotion;
  }>({ isOpen: false, type: 'delete' });
  
  const { showSuccess, showError, showWarning } = useToast();

  // Mock promotions data
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      salonId: 'salon1',
      name: 'New Year Special Offer',
      description: 'Get 20% off on all hair services this New Year! Book your appointment now and enjoy our premium services at discounted rates.',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      imageUrl: '/api/placeholder/400/200',
      isActive: true,
      createdAt: new Date('2023-12-28'),
      createdBy: 'admin',
    },
    {
      id: '2',
      salonId: 'salon1',
      name: 'Valentine\'s Day Special',
      description: 'Couple packages available with 30% discount. Perfect for celebrating love with a romantic makeover session.',
      startDate: new Date('2024-02-10'),
      endDate: new Date('2024-02-14'),
      imageUrl: '/api/placeholder/400/200',
      isActive: false,
      createdAt: new Date('2024-01-15'),
      createdBy: 'admin',
    },
    {
      id: '3',
      salonId: 'salon1',
      name: 'Spring Hair Makeover',
      description: 'Refresh your look this spring! Complete hair makeover packages starting from Rs. 5,000. Includes cut, color, and styling.',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-31'),
      imageUrl: '/api/placeholder/400/200',
      isActive: true,
      createdAt: new Date('2024-02-25'),
      createdBy: 'admin',
    },
  ]);

  const tabs = [
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'email', label: 'Email Marketing', icon: Mail },
    { id: 'sms', label: 'SMS Marketing', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const filteredPromotions = promotions.filter(promotion =>
    promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePromotions = promotions.filter(p => p.isActive).length;
  const totalPromotions = promotions.length;
  const upcomingPromotions = promotions.filter(p => new Date(p.startDate) > new Date()).length;
  const expiredPromotions = promotions.filter(p => new Date(p.endDate) < new Date()).length;

  const handleAddPromotion = (promotionData: Omit<Promotion, 'id' | 'salonId' | 'createdAt' | 'createdBy'>) => {
    const newPromotion: Promotion = {
      ...promotionData,
      id: Date.now().toString(),
      salonId: 'salon1',
      createdAt: new Date(),
      createdBy: userRole === 'super-admin' ? 'Super Admin' : 'admin',
    };
    setPromotions([...promotions, newPromotion]);
    setShowAddPromotionModal(false);
    showSuccess('Promotion Created!', `"${promotionData.name}" has been created successfully and is now ${promotionData.isActive ? 'active' : 'inactive'}.`);
  };

  const handleEditPromotion = (promotionData: Omit<Promotion, 'id' | 'salonId' | 'createdAt' | 'createdBy'>) => {
    if (editingPromotion) {
      setPromotions(promotions.map(promotion =>
        promotion.id === editingPromotion.id
          ? { ...promotion, ...promotionData }
          : promotion
      ));
      setEditingPromotion(null);
      setShowAddPromotionModal(false);
      showSuccess('Promotion Updated!', `"${promotionData.name}" has been updated successfully.`);
    }
  };

  const handleDeletePromotion = (promotion: Promotion) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      promotion
    });
  };

  const confirmDeletePromotion = () => {
    if (confirmDialog.promotion) {
      setPromotions(promotions.filter(p => p.id !== confirmDialog.promotion!.id));
      showSuccess('Promotion Deleted!', `"${confirmDialog.promotion.name}" has been permanently removed from the system.`);
      setConfirmDialog({ isOpen: false, type: 'delete' });
    }
  };

  const handleToggleStatus = (promotion: Promotion) => {
    const newStatus = !promotion.isActive;
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      promotion: { ...promotion, isActive: newStatus }
    });
  };

  const confirmToggleStatus = () => {
    if (confirmDialog.promotion) {
      const newStatus = confirmDialog.promotion.isActive;
      setPromotions(promotions.map(p =>
        p.id === confirmDialog.promotion!.id
          ? { ...p, isActive: newStatus }
          : p
      ));
      
      if (newStatus) {
        showSuccess('Promotion Activated!', `"${confirmDialog.promotion.name}" is now active and visible to customers.`);
      } else {
        showWarning('Promotion Deactivated', `"${confirmDialog.promotion.name}" has been deactivated and is no longer visible to customers.`);
      }
      
      setConfirmDialog({ isOpen: false, type: 'toggle' });
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    
    if (!promotion.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const PromotionModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: (data: Omit<Promotion, 'id' | 'salonId' | 'createdAt' | 'createdBy'>) => void;
    promotion?: Promotion;
  }> = ({ isOpen, onClose, onSubmit, promotion }) => {
    const [formData, setFormData] = useState({
      name: promotion?.name || '',
      description: promotion?.description || '',
      startDate: promotion?.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion?.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
      imageUrl: promotion?.imageUrl || '',
      isActive: promotion?.isActive ?? true,
    });

    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form data only when modal opens for the first time or when promotion changes
    useEffect(() => {
      if (isOpen) {
        setFormData({
          name: promotion?.name || '',
          description: promotion?.description || '',
          startDate: promotion?.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
          endDate: promotion?.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
          imageUrl: promotion?.imageUrl || '',
          isActive: promotion?.isActive ?? true,
        });
        setIsDragOver(false);
      }
    }, [promotion]); // Remove isOpen from dependencies to prevent form reset on re-renders

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {promotion ? 'Edit Promotion' : 'Add New Promotion'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter promotion name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                placeholder="Enter promotion description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Upload
              </label>
              {userRole !== 'super-admin' ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Image upload restricted to Super Admin only</p>
                  <p className="text-xs text-gray-400 mt-1">Contact Super Admin for image upload permissions</p>
                </div>
              ) : (
                <label 
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all block ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
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
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
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
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active promotion
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {promotion ? 'Update' : 'Create'} Promotion
              </button>
            </div>
          </form>
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
              <p className="text-2xl font-bold text-gray-900">{totalPromotions}</p>
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
                    <div key={promotion.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-200 relative">
                        <img 
                          src={promotion.imageUrl} 
                          alt={promotion.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{promotion.name}</h3>
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
                              title={promotion.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {promotion.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

              {filteredPromotions.length === 0 && (
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
        itemName={confirmDialog.promotion?.name}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'toggle'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'toggle' })}
        onConfirm={confirmToggleStatus}
        title={confirmDialog.promotion?.isActive ? 'Activate Promotion' : 'Deactivate Promotion'}
        message={
          confirmDialog.promotion?.isActive 
            ? 'This promotion will become visible to customers and they will be able to take advantage of this offer.'
            : 'This promotion will be hidden from customers and they will no longer be able to access this offer.'
        }
        confirmText={confirmDialog.promotion?.isActive ? 'Activate' : 'Deactivate'}
        cancelText="Cancel"
        type={confirmDialog.promotion?.isActive ? 'info' : 'warning'}
        itemName={confirmDialog.promotion?.name}
      />
    </div>
  );
};

export default MarketingCommunication;
