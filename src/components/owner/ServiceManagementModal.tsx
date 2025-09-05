import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Users, Scissors, Trash2, Upload, Loader, CheckCircle } from 'lucide-react';
import { Service } from '../../types';
import { apiService, ServiceCreateRequest, ServiceUpdateRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastProvider';
import { imageUploadService } from '../../services/imageUploadService';

interface ServiceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id'>) => void;
  editingService?: Service;
  onDelete?: (service: Service) => void;
  refreshServices?: () => void;
}

const ServiceManagementModal: React.FC<ServiceManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  editingService,
  onDelete,
  refreshServices
}) => {
  const { getSalonId } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    discountPrice: '',
    availableForGender: 'both',
    category: 'HAIRCUT',
    imageUrl: ''
  });

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || '',
        duration: editingService.duration.toString(),
        price: editingService.price.toString(),
        discountPrice: editingService.discountPrice?.toString() || '',
        availableForGender: editingService.availableForGender,
        category: 'HAIRCUT', // Default category for editing
        imageUrl: editingService.imageUrl || ''
      });
      // Set image preview if service has an image
      setImagePreview(editingService.imageUrl || null);
    } else {
      // Clear form when not editing
      setFormData({
        name: '',
        description: '',
        duration: '',
        price: '',
        discountPrice: '',
        availableForGender: 'both',
        category: 'HAIRCUT',
        imageUrl: ''
      });
      setImagePreview(null);
    }
  }, [editingService, isOpen]);

  // Handle image upload with Firebase
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🖼️ [SERVICE] Starting Firebase image upload:', file.name);
    await processImageFile(file);
  };

  // Process image file with Firebase upload (used by both file input and drag-drop)
  const processImageFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('File Too Large', 'Please select an image smaller than 10MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      console.log('🖼️ [SERVICE] Set temporary preview');

      // Get salon ID for upload path
      const salonId = getSalonId();
      if (!salonId) {
        showError('Upload Failed', 'Unable to determine salon ID');
        setUploading(false);
        return;
      }

      // Upload to Firebase
      console.log('⬆️ [SERVICE] Initiating Firebase upload...');
      const firebaseUrl = await imageUploadService.uploadImage(
        file,
        'service-images',
        parseInt(salonId.toString()),
        (progress) => {
          setUploadProgress(progress.progress);
          console.log('📊 [SERVICE] Upload progress:', progress.progress + '%');
          
          if (progress.error) {
            console.error('❌ [SERVICE] Upload error:', progress.error);
            showError('Upload Failed', progress.error);
            setUploading(false);
            return;
          }
        }
      );

      console.log('✅ [SERVICE] Firebase upload completed! URL:', firebaseUrl);

      // Update form data with Firebase URL
      setFormData({ ...formData, imageUrl: firebaseUrl });
      setUploading(false);
      setUploadProgress(100);

      showSuccess('Image Uploaded', 'Service image has been uploaded successfully to Firebase storage.');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('❌ [SERVICE] Firebase upload error:', error);
      showError('Upload Failed', 'Failed to upload image to Firebase. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      
      // Clear preview on error
      setImagePreview(null);
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log('📎 [SERVICE] File dropped:', file.name);
      await processImageFile(file);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const salonIdNum = getSalonId();
      
      if (!salonIdNum) {
        showError('Authentication Error', 'Salon ID not found. Please ensure you are logged in.');
        return;
      }

      const salonId = salonIdNum.toString(); // Convert to string for Service interface

      if (editingService) {
        // Update existing service
        console.log('✏️ [SERVICE] Updating service:', editingService.id);
        
        const updateData: ServiceUpdateRequest = {
          name: formData.name,
          description: formData.description,
          duration_minutes: parseInt(formData.duration),
          price: parseFloat(formData.price),
          discount_price: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
          category: formData.category, // Use selected category
          gender_availability: formData.availableForGender, // Send as-is (male, female, both)
          image_url: formData.imageUrl,
          status: 'ACTIVE',
          is_active: true,
          is_popular: false
        };

        if (formData.imageUrl) {
          if (formData.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            console.log('📸 [SERVICE] Sending Firebase image URL:', formData.imageUrl);
          } else if (formData.imageUrl.startsWith('data:')) {
            console.log('📸 [SERVICE] Sending base64 image data (length:', formData.imageUrl.length, 'characters)');
          }
        }

        console.log('📋 [SERVICE] Update data:', updateData);
        console.log('🏷️ [SERVICE] Category:', formData.category, 'Gender:', formData.availableForGender);
        
        const response = await apiService.updateService(editingService.id, updateData);
        
        if (response.success !== false) {
          console.log('✅ [SERVICE] Service updated successfully:', response);
          
          // Show success toast
          showSuccess(
            'Service updated',
            `"${formData.name}" has been successfully updated.`
          );
          
          // Convert API response back to Service format
          const serviceData = {
            name: formData.name,
            description: formData.description,
            duration: parseInt(formData.duration),
            price: parseFloat(formData.price),
            availableForGender: formData.availableForGender as 'male' | 'female' | 'both',
            discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
            imageUrl: formData.imageUrl,
            category: editingService.category,
            type: editingService.type,
            salonId: editingService.salonId, // Keep as string from existing service
            isActive: true,
            popularity: editingService.popularity,
            createdAt: editingService.createdAt,
            updatedAt: new Date(),
            createdBy: editingService.createdBy,
            profitMargin: editingService.profitMargin,
            requiredSkills: editingService.requiredSkills
          };

          onSave(serviceData);
          
          // Refresh services list if function provided
          if (refreshServices) {
            refreshServices();
          }
        } else {
          const errorMessage = response.message || 'Unknown error occurred';
          showError('Update failed', `Failed to update service: ${errorMessage}`);
          return;
        }
      } else {
        // Create new service
        console.log('🆕 [SERVICE] Creating new service');
        
        const createData: ServiceCreateRequest = {
          salon_id: salonIdNum, // Keep as number for API
          name: formData.name,
          description: formData.description,
          duration_minutes: parseInt(formData.duration),
          price: parseFloat(formData.price),
          discount_price: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
          category: formData.category, // Use selected category
          gender_availability: formData.availableForGender, // Send as-is (male, female, both)
          image_url: formData.imageUrl,
          is_active: true,
          is_popular: false
        };

        if (formData.imageUrl) {
          if (formData.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            console.log('📸 [SERVICE] Sending Firebase image URL:', formData.imageUrl);
          } else if (formData.imageUrl.startsWith('data:')) {
            console.log('📸 [SERVICE] Sending base64 image data (length:', formData.imageUrl.length, 'characters)');
          }
        }

        console.log('📋 [SERVICE] Create data:', createData);
        console.log('🏷️ [SERVICE] Category:', formData.category, 'Gender:', formData.availableForGender);
        
        const response = await apiService.createService(createData);
        
        if (response.success !== false) {
          console.log('✅ [SERVICE] Service created successfully:', response);
          
          // Show success toast
          showSuccess(
            'Service created',
            `"${formData.name}" has been successfully created.`
          );
          
          // Convert API response back to Service format
          const serviceData = {
            name: formData.name,
            description: formData.description,
            duration: parseInt(formData.duration),
            price: parseFloat(formData.price),
            availableForGender: formData.availableForGender as 'male' | 'female' | 'both',
            discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
            imageUrl: formData.imageUrl,
            category: 'hair' as 'hair' | 'beard' | 'styling' | 'treatment' | 'coloring' | 'spa',
            type: 'standard',
            salonId: salonId, // Now correctly as string
            isActive: true,
            popularity: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user-id',
            profitMargin: 75,
            requiredSkills: []
          };

          onSave(serviceData);
          
          // Clear form after successful save
          setFormData({
            name: '',
            description: '',
            duration: '',
            price: '',
            discountPrice: '',
            availableForGender: 'both',
            category: 'HAIRCUT',
            imageUrl: ''
          });
          
          // Refresh services list if function provided
          if (refreshServices) {
            refreshServices();
          }
        } else {
          const errorMessage = response.message || 'Unknown error occurred';
          showError('Creation failed', `Failed to create service: ${errorMessage}`);
          return;
        }
      }

      onClose();
    } catch (error) {
      console.error('❌ [SERVICE] Error saving service:', error);
      
      // Extract error message for user-friendly display
      let errorMessage = 'Error saving service. Please try again.';
      
      if (error instanceof Error) {
        try {
          // Try to parse error response if it's a JSON response
          const errorData = JSON.parse(error.message);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      showError('Save failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (editingService && onDelete) {
      onDelete(editingService);
      setShowDeleteConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <div className="flex items-center space-x-2">
            {editingService && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete Service"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter service name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Brief description of the service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <optgroup label="Hair Services">
                    <option value="HAIRCUT">Haircut</option>
                    <option value="HAIR_STYLING">Hair Styling</option>
                    <option value="HAIR_COLOR">Hair Color</option>
                    <option value="HAIR_TREATMENT">Hair Treatment</option>
                  </optgroup>
                  <optgroup label="Beard Services">
                    <option value="BEARD_TRIM">Beard Trim</option>
                    <option value="BEARD_STYLING">Beard Styling</option>
                    <option value="SHAVING">Shaving</option>
                  </optgroup>
                  <optgroup label="Face & Body">
                    <option value="FACIAL">Facial</option>
                    <option value="MASSAGE">Massage</option>
                    <option value="MANICURE">Manicure</option>
                    <option value="PEDICURE">Pedicure</option>
                  </optgroup>
                  <optgroup label="Beauty Services">
                    <option value="EYEBROW">Eyebrow</option>
                    <option value="MAKEUP">Makeup</option>
                    <option value="SKIN_CARE">Skin Care</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="PACKAGE">Package</option>
                    <option value="OTHER">Other</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing & Duration</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Duration"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">LKR</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Regular price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">LKR</span>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Optional"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available For</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.availableForGender}
                  onChange={(e) => setFormData({ ...formData, availableForGender: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="both">Both Male & Female</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Image</label>
              <div className="space-y-3">
                {/* Image Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dragOver 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {formData.imageUrl ? (
                    /* Image Preview with Success State */
                    <div className="relative">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Service preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                      />
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-100 text-green-600 p-1 rounded-full shadow-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-sm text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          <span>Uploaded successfully</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Area */
                    <div className="text-center">
                      {uploading ? (
                        <div className="space-y-3">
                          <div className="mx-auto w-8 h-8 text-blue-500">
                            <Loader className="w-full h-full animate-spin" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Uploading to Firebase...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <div className="text-sm text-gray-600 mb-2">
                            <label htmlFor="image-upload" className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                              Click to upload
                            </label>
                            <span> or drag and drop</span>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>
                  )}
                </div>
                
                {/* Upload Status */}
                {uploading && (
                  <div className="flex items-center space-x-2 text-sm text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span>Converting image...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (editingService ? 'Update' : 'Add')} Service
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Service</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{editingService?.name}"? This action cannot be undone and will permanently remove the service from your salon.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementModal;