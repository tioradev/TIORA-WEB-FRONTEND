import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, MessageSquare, Star, 
  Plus, Search, Filter, Calendar,
  TrendingUp, Gift, Upload, X,
  Edit, Trash2, Eye, EyeOff, AlertCircle,
  Loader, ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';
import { PromotionResponse, PromotionRequest, PaginatedResponse } from '../../types';
import { apiService } from '../../services/api';
import { imageUploadService } from '../../services/imageUploadService';
import { useToast } from '../../contexts/ToastProvider';
import ConfirmationDialog from '../shared/ConfirmationDialog';

interface MarketingCommunicationProps {
  userRole?: 'owner' | 'super-admin';
}

const MarketingCommunication: React.FC<MarketingCommunicationProps> = ({ userRole = 'super-admin' }) => {
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
      
      // Debug logging for API submission
      console.log('🚀 Submitting new promotion to API:', {
        promotionName: apiData.promotionName,
        imageUrl: apiData.imageUrl,
        imageUrlType: apiData.imageUrl ? (
          apiData.imageUrl.startsWith('https://firebasestorage.googleapis.com') ? 'Firebase URL' : 
          apiData.imageUrl.startsWith('data:') ? 'Base64 Data' : 'Other'
        ) : 'No image'
      });
      
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
      
      // Debug logging for API submission
      console.log('🚀 Submitting promotion update to API:', {
        promotionId: editingPromotion.promotionId,
        promotionName: apiData.promotionName,
        imageUrl: apiData.imageUrl,
        imageUrlType: apiData.imageUrl ? (
          apiData.imageUrl.startsWith('https://firebasestorage.googleapis.com') ? 'Firebase URL' : 
          apiData.imageUrl.startsWith('data:') ? 'Base64 Data' : 'Other'
        ) : 'No image'
      });
      
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
        const response = await apiService.deletePromotion(confirmDialog.promotion.promotionId);
        
        // Handle the new API response format
        console.log('📧 [DELETE] API Response:', response);
        
        showSuccess('Promotion Deleted!', `"${confirmDialog.promotion.promotionName}" has been permanently removed from the system.`);
        setConfirmDialog({ isOpen: false, type: 'delete' });
        loadPromotions(); // Refresh the list
      } catch (error: any) {
        console.error('Failed to delete promotion:', error);
        
        // Handle specific error cases
        let errorMessage = 'Failed to delete promotion. Please try again.';
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        showError('Error', errorMessage);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleToggleStatus = (promotion: PromotionResponse) => {
    // Fix the logic: if currently active, we want to deactivate (set to INACTIVE)
    // If currently inactive, we want to activate (set to ACTIVE)
    const newStatus = promotion.active && promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
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
    key?: string; // Add key prop for better re-mounting control
  }> = ({ isOpen, onClose, onSubmit, promotion }) => {
    // Get a unique key for this modal session
    const modalSessionKey = `promotion-form-${promotion?.promotionId || 'new'}`;
    
    // Initialize form data based on promotion prop, avoiding useEffect
    const getInitialFormData = () => {
      console.log('🎯 Getting initial form data for promotion:', promotion?.promotionId);
      
      // First, try to get persisted data from sessionStorage
      if (isOpen) {
        try {
          const persistedData = sessionStorage.getItem(modalSessionKey);
          if (persistedData) {
            const parsed = JSON.parse(persistedData);
            console.log('📂 Found persisted form data:', parsed);
            console.log('🖼️ Image URL in persisted data:', {
              hasImageUrl: !!parsed.imageUrl,
              imageUrlLength: parsed.imageUrl?.length || 0,
              isFirebaseUrl: parsed.imageUrl?.startsWith('https://firebasestorage.googleapis.com'),
              isBase64: parsed.imageUrl?.startsWith('data:')
            });
            
            // Clean up any base64 image data that might be stale
            if (parsed.imageUrl && parsed.imageUrl.startsWith('data:')) {
              console.log('🧹 Cleaning up stale base64 image data from persisted form');
              parsed.imageUrl = ''; // Clear stale base64 data
            }
            
            // If we have a Firebase URL, use it immediately - don't reset to defaults
            if (parsed.imageUrl && parsed.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
              console.log('✅ Using persisted Firebase URL - preserving image data');
            }
            
            return parsed;
          }
        } catch (error) {
          console.warn('Failed to parse persisted form data:', error);
        }
      }
      
      // If no persisted data, use promotion data or defaults
      const defaultData = {
        name: promotion?.promotionName || '',
        description: promotion?.description || '',
        startDate: promotion?.startDate || '',
        endDate: promotion?.endDate || '',
        imageUrl: promotion?.imageUrl || '',
        isActive: promotion?.status === 'ACTIVE' && promotion?.active !== false,
        promotionId: promotion?.promotionId || null,
      };
      
      console.log('🆕 Using default form data:', defaultData);
      return defaultData;
    };

    // Define form data type
    type FormDataType = ReturnType<typeof getInitialFormData>;

    const [formData, setFormData] = useState<FormDataType>(getInitialFormData);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasUserDataRef = useRef<boolean>(false); // Track if user has entered data

    // Reset form function
    const resetForm = () => {
      console.log('🔄 Resetting promotion form data');
      
      // Clear sessionStorage for this modal session
      sessionStorage.removeItem(modalSessionKey);
      
      // Reset form data to defaults
      const defaultData = {
        name: '',
        description: '',
        imageUrl: '',
        discountPercentage: '',
        validFrom: '',
        validTo: '',
        termsConditions: '',
        isActive: true,
      };
      
      setFormData(defaultData);
      
      // Reset upload states
      setIsUploading(false);
      setUploadProgress(0);
      setIsDragOver(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset user data tracker
      hasUserDataRef.current = false;
      
      console.log('✅ Form reset completed');
    };

    // Helper function to check if form has actual user data
    const hasActualFormData = (data: FormDataType): boolean => {
      return !!(data.name.trim() || data.description.trim() || data.imageUrl);
    };

    // Helper function to persist form data
    const persistFormData = (data: FormDataType) => {
      if (isOpen) {
        try {
          // Only exclude base64 image data, but allow Firebase URLs to be persisted
          const dataToStore = { ...data };
          if (dataToStore.imageUrl && dataToStore.imageUrl.startsWith('data:')) {
            console.log('🚫 Not persisting base64 image data to sessionStorage');
            dataToStore.imageUrl = ''; // Clear base64 data from storage
          } else if (dataToStore.imageUrl && dataToStore.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            console.log('✅ Persisting Firebase URL to sessionStorage:', dataToStore.imageUrl);
          }
          
          sessionStorage.setItem(modalSessionKey, JSON.stringify(dataToStore));
          console.log('💾 Persisted form data to session storage (without base64 images):', dataToStore);
        } catch (error) {
          console.warn('Failed to persist form data:', error);
        }
      }
    };

    // Enhanced setFormData that also persists to sessionStorage
    const updateFormData = (newData: FormDataType | ((prev: FormDataType) => FormDataType)) => {
      setFormData((prev: FormDataType) => {
        const updatedData = typeof newData === 'function' ? newData(prev) : newData;
        persistFormData(updatedData);
        return updatedData;
      });
    };

    // Mark that user has entered data (prevent resets)
    const markUserDataEntered = () => {
      hasUserDataRef.current = true;
      console.log('🔒 User data entered - preventing future resets');
    };

    // Only reset form when promotion changes (not on every render)
    useEffect(() => {
      if (isOpen) {
        console.log('📋 Modal opened, checking if form needs reset');
        console.log('Current formData.promotionId:', formData.promotionId);
        console.log('New promotion?.promotionId:', promotion?.promotionId);
        console.log('Has user data ref:', hasUserDataRef.current);
        console.log('Has actual form data:', hasActualFormData(formData));
        console.log('Current form has data:', formData.name || formData.description);
        
        // Only reset if we're editing a different promotion AND user hasn't entered data AND form is actually empty
        const isDifferentPromotion = formData.promotionId !== (promotion?.promotionId || null);
        const hasUserInput = hasUserDataRef.current || hasActualFormData(formData);
        
        if (isDifferentPromotion && !hasUserInput) {
          console.log('🔄 Promotion changed and no user data entered, resetting form data');
          const newFormData = getInitialFormData();
          console.log('📝 Setting new form data:', newFormData);
          setFormData(newFormData);
          // DON'T reset hasUserDataRef here - preserve user input protection
        } else {
          console.log('✅ Keeping existing form data - hasUserData:', hasUserDataRef.current, 'hasActualFormData:', hasActualFormData(formData), 'isDifferentPromotion:', isDifferentPromotion);
        }
      } else {
        // ONLY reset user data flag when modal explicitly closes (add delay to prevent rapid resets)
        const timeoutId = setTimeout(() => {
          if (!isOpen) { // Double-check modal is still closed
            hasUserDataRef.current = false;
            console.log('🔓 Modal definitively closed, resetting user data flag after delay');
          }
        }, 200); // Small delay to avoid resetting during rapid re-renders
        
        return () => clearTimeout(timeoutId);
      }
    }, [isOpen, promotion?.promotionId]); // Clean dependencies

    // Simplified debug logging (removed the problematic useEffect)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check if an upload is in progress
      if (isUploading) {
        showError('Upload in Progress', 'Please wait for the image upload to complete before submitting.');
        return;
      }
      
      // Check if imageUrl contains base64 data (meaning Firebase upload didn't complete)
      if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
        showError('Image Upload Incomplete', 'Image is still being processed. Please wait for the upload to complete or remove the image.');
        return;
      }
      
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
      
      // Extract promotionId from formData before submitting (it's only for tracking)
      const { promotionId, ...submitData } = formData;
      
      onSubmit({
        ...submitData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      
      // Reset user data flag after successful submission
      hasUserDataRef.current = false;
      console.log('✅ Form submitted successfully, resetting user data flag');
      
      // Clean up persisted data after successful submission
      try {
        sessionStorage.removeItem(modalSessionKey);
        console.log('🗑️ Cleaned up persisted form data after successful submission');
      } catch (error) {
        console.warn('Failed to clean up persisted data:', error);
      }
      
      onClose();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('🖼️ Image upload started - preserving form data:', {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      if (userRole !== 'super-admin') {
        showError('Upload Restricted', 'Image upload is restricted to Super Admin users only. Please contact your Super Admin for assistance.');
        return;
      }
      
      const file = e.target.files?.[0];
      if (!file) return;

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

      try {
        setIsUploading(true);
        setUploadProgress(0);

        console.log('🚀 Starting Firebase upload for file:', file.name);
        console.log('📁 File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        // Create a preview immediately while uploading
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            console.log('🖼️ Setting temporary base64 preview (will be replaced by Firebase URL)');
            console.log('📏 Base64 preview length:', dataUrl.length);
            
            // CRITICAL: Only update the imageUrl, preserve ALL other form data
            updateFormData((prevData: FormDataType) => {
              console.log('🔒 PRESERVING form data during preview:', {
                name: prevData.name,
                description: prevData.description,
                startDate: prevData.startDate,
                endDate: prevData.endDate,
                isActive: prevData.isActive
              });
              
              // Don't trigger user data flag for image uploads
              return {
                ...prevData, // Spread ALL previous data first
                imageUrl: dataUrl // Only override imageUrl
              };
            });
          }
        };
        reader.readAsDataURL(file);

        console.log('⬆️ Initiating Firebase upload to imageUploadService...');
        
        // Upload to Firebase (using salonId 1 as default for super-admin)
        const firebaseUrl = await imageUploadService.uploadImage(
          file,
          'promotions',
          1, // Default salon ID for super-admin promotions
          (progress) => {
            setUploadProgress(progress.progress);
            console.log('📊 Upload progress:', progress.progress + '%');
            
            if (progress.error) {
              console.error('❌ Firebase upload progress error:', progress.error);
              showError('Upload Failed', progress.error);
              setIsUploading(false);
              return;
            }
          }
        );

        console.log('🎉 Firebase upload service returned URL:', firebaseUrl);

        console.log('✅ Firebase upload completed! URL received:', firebaseUrl);
        console.log('🔍 URL type check:', {
          isString: typeof firebaseUrl === 'string',
          length: firebaseUrl?.length || 0,
          startsWithHttps: firebaseUrl?.startsWith('https://'),
          isFirebaseUrl: firebaseUrl?.includes('firebasestorage.googleapis.com')
        });

        // CRITICAL: Update sessionStorage IMMEDIATELY before any state updates
        console.log('🚨 IMMEDIATELY persisting Firebase URL to sessionStorage to prevent data loss');
        try {
          const currentData = formData;
          const updatedDataForStorage = {
            ...currentData,
            imageUrl: firebaseUrl
          };
          sessionStorage.setItem(modalSessionKey, JSON.stringify(updatedDataForStorage));
          console.log('✅ Successfully persisted Firebase URL to sessionStorage:', updatedDataForStorage);
        } catch (error) {
          console.error('❌ CRITICAL: Failed to persist Firebase URL to sessionStorage:', error);
        }

        // Update form data with the actual Firebase URL
        updateFormData((prevData: FormDataType) => {
          console.log('🔥 Updating with Firebase URL:', firebaseUrl);
          console.log('🔒 PRESERVING form data during Firebase URL update:', {
            name: prevData.name,
            description: prevData.description,
            startDate: prevData.startDate,
            endDate: prevData.endDate,
            isActive: prevData.isActive
          });
          
          const updatedData = {
            ...prevData, // Spread ALL previous data first
            imageUrl: firebaseUrl // Only override imageUrl
          };
          
          // Force immediate persistence of Firebase URL (backup)
          console.log('💾 Force persisting Firebase URL immediately (backup)');
          try {
            sessionStorage.setItem(modalSessionKey, JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to force persist Firebase URL:', error);
          }
          
          return updatedData;
        });

        // Mark upload as complete
        setIsUploading(false);
        setUploadProgress(100);

        // Small delay to ensure sessionStorage update is processed
        setTimeout(() => {
          showSuccess('Image Uploaded', 'Image has been uploaded successfully to Firebase storage.');
        }, 100);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
      } catch (error) {
        console.error('Firebase upload error:', error);
        showError('Upload Failed', 'Failed to upload image to Firebase. Please try again.');
        
        // Clear the preview if upload failed
        updateFormData((prevData: FormDataType) => {
          console.log('🚫 PRESERVING form data during error cleanup:', {
            name: prevData.name,
            description: prevData.description,
            startDate: prevData.startDate,
            endDate: prevData.endDate,
            isActive: prevData.isActive
          });
          
          return {
            ...prevData, // Spread ALL previous data first
            imageUrl: '' // Only clear imageUrl
          };
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
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

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (userRole !== 'super-admin') {
        showError('Upload Restricted', 'Image upload is restricted to Super Admin users only. Please contact your Super Admin for assistance.');
        return;
      }

      const files = e.dataTransfer.files;
      if (!files || !files[0]) return;

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

      try {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Create a preview immediately while uploading
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            console.log('🎯 Drop: Setting temporary preview during upload');
            
            // CRITICAL: Only update the imageUrl, preserve ALL other form data
            updateFormData((prevData: FormDataType) => {
              console.log('🔒 Drop: PRESERVING form data during preview:', {
                name: prevData.name,
                description: prevData.description,
                startDate: prevData.startDate,
                endDate: prevData.endDate,
                isActive: prevData.isActive
              });
              
              return {
                ...prevData, // Spread ALL previous data first
                imageUrl: dataUrl // Only override imageUrl
              };
            });
          }
        };
        reader.readAsDataURL(file);

        // Upload to Firebase
        const firebaseUrl = await imageUploadService.uploadImage(
          file,
          'promotions',
          1, // Default salon ID for super-admin promotions
          (progress) => {
            setUploadProgress(progress.progress);
            console.log('Drop: Upload progress:', progress.progress + '%');
            
            if (progress.error) {
              showError('Upload Failed', progress.error);
              setIsUploading(false);
              return;
            }
          }
        );

        console.log('✅ Drop: Firebase upload completed! URL received:', firebaseUrl);
        console.log('🔍 Drop: URL type check:', {
          isString: typeof firebaseUrl === 'string',
          length: firebaseUrl?.length || 0,
          startsWithHttps: firebaseUrl?.startsWith('https://'),
          isFirebaseUrl: firebaseUrl?.includes('firebasestorage.googleapis.com')
        });

        // CRITICAL: Update sessionStorage IMMEDIATELY before any state updates
        console.log('🚨 Drop: IMMEDIATELY persisting Firebase URL to sessionStorage to prevent data loss');
        try {
          const currentData = formData;
          const updatedDataForStorage = {
            ...currentData,
            imageUrl: firebaseUrl
          };
          sessionStorage.setItem(modalSessionKey, JSON.stringify(updatedDataForStorage));
          console.log('✅ Drop: Successfully persisted Firebase URL to sessionStorage:', updatedDataForStorage);
        } catch (error) {
          console.error('❌ Drop: CRITICAL: Failed to persist Firebase URL to sessionStorage:', error);
        }

        // Update form data with the actual Firebase URL
        updateFormData((prevData: FormDataType) => {
          console.log('🔥 Drop: Updating with Firebase URL:', firebaseUrl);
          console.log('🔒 Drop: PRESERVING form data during Firebase URL update:', {
            name: prevData.name,
            description: prevData.description,
            startDate: prevData.startDate,
            endDate: prevData.endDate,
            isActive: prevData.isActive
          });
          
          const updatedData = {
            ...prevData, // Spread ALL previous data first
            imageUrl: firebaseUrl // Only override imageUrl
          };
          
          // Force immediate persistence of Firebase URL (backup)
          console.log('💾 Drop: Force persisting Firebase URL immediately (backup)');
          try {
            sessionStorage.setItem(modalSessionKey, JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Drop: Failed to force persist Firebase URL:', error);
          }
          
          return updatedData;
        });

        // Mark upload as complete
        setIsUploading(false);
        setUploadProgress(100);

        // Small delay to ensure sessionStorage update is processed
        setTimeout(() => {
          showSuccess('Image Uploaded', 'Image has been uploaded successfully to Firebase storage via drag & drop.');
        }, 100);
        
      } catch (error) {
        console.error('Drop: Firebase upload error:', error);
        showError('Upload Failed', 'Failed to upload dropped image to Firebase. Please try again.');
        
        // Clear the preview if upload failed
        updateFormData((prevData: FormDataType) => {
          console.log('🚫 Drop: PRESERVING form data during error cleanup:', {
            name: prevData.name,
            description: prevData.description,
            startDate: prevData.startDate,
            endDate: prevData.endDate,
            isActive: prevData.isActive
          });
          
          return {
            ...prevData, // Spread ALL previous data first
            imageUrl: '' // Only clear imageUrl
          };
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    // Clear any existing sessionStorage with base64 data when modal opens
    useEffect(() => {
      if (isOpen) {
        try {
          const existingData = sessionStorage.getItem(modalSessionKey);
          if (existingData) {
            const parsed = JSON.parse(existingData);
            if (parsed.imageUrl && parsed.imageUrl.startsWith('data:')) {
              console.log('🧹 Clearing stale base64 data from sessionStorage on modal open');
              sessionStorage.removeItem(modalSessionKey);
              // Also clear the current form data if it has base64 data
              if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
                console.log('🧹 Also clearing base64 data from current form state');
                updateFormData((prevData: FormDataType) => ({
                  ...prevData,
                  imageUrl: ''
                }));
              }
            }
          }
        } catch (error) {
          console.warn('Error checking sessionStorage for stale data:', error);
        }
      }
    }, [isOpen, modalSessionKey, formData.imageUrl]);

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
              onClick={() => {
                resetForm();
                onClose();
              }} 
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
                onChange={(e) => {
                  console.log('📝 Name input changed:', e.target.value);
                  markUserDataEntered();
                  updateFormData((prevData: FormDataType) => ({ ...prevData, name: e.target.value }));
                }}
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
                onChange={(e) => {
                  console.log('📝 Description input changed:', e.target.value);
                  markUserDataEntered();
                  updateFormData((prevData: FormDataType) => ({ ...prevData, description: e.target.value }));
                }}
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
                  onChange={(e) => {
                    markUserDataEntered();
                    updateFormData((prevData: FormDataType) => ({ ...prevData, startDate: e.target.value }));
                  }}
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
                  onChange={(e) => {
                    markUserDataEntered();
                    updateFormData((prevData: FormDataType) => ({ ...prevData, endDate: e.target.value }));
                  }}
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
                <div>
                  {/* Only show upload interface if no image is uploaded or upload is in progress */}
                  {(!formData.imageUrl || !formData.imageUrl.startsWith('https://firebasestorage.googleapis.com')) && (
                    <label 
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 block ${
                        isUploading 
                          ? 'border-blue-400 bg-blue-50 cursor-not-allowed'
                          : isDragOver 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
                          <p className="text-sm font-medium text-blue-600">Uploading to Firebase...</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-blue-500 mt-1">{Math.round(uploadProgress)}% complete</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                          <p className={`text-sm font-medium ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                            {isDragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB • Uploads to Firebase Storage</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}

                  {/* Show success message and change image option when Firebase URL exists */}
                  {formData.imageUrl && formData.imageUrl.startsWith('https://firebasestorage.googleapis.com') && (
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Image uploaded successfully!</p>
                            <p className="text-xs text-green-600">Stored securely in Firebase Storage</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🔄 User requested to change image - clearing current image');
                            updateFormData((prevData: FormDataType) => ({ ...prevData, imageUrl: '' }));
                            // Reset file input
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview - Show for all image types */}
              {formData.imageUrl && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                    {formData.imageUrl.startsWith('https://firebasestorage.googleapis.com') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        Firebase Storage
                      </span>
                    )}
                    {formData.imageUrl.startsWith('data:') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                        Uploading...
                      </span>
                    )}
                  </div>
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
                      onClick={() => {
                        console.log('🗑️ User clicked remove image button');
                        updateFormData((prevData: FormDataType) => ({ ...prevData, imageUrl: '' }));
                        // Reset file input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Status messages */}
                  {formData.imageUrl.startsWith('data:') && (
                    <div className="mt-2">
                      <p className="text-xs text-orange-600 font-medium">⚠️ Temporary preview - Firebase upload in progress</p>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🧹 Manually clearing base64 data and session storage');
                          sessionStorage.removeItem(modalSessionKey);
                          updateFormData((prevData: FormDataType) => ({ ...prevData, imageUrl: '' }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                      >
                        Clear cached image data
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => {
                  markUserDataEntered();
                  updateFormData((prevData: FormDataType) => ({ ...prevData, isActive: e.target.checked }));
                }}
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
                onClick={() => {
                  resetForm();
                  onClose();
                }}
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
        key={editingPromotion ? `edit-${editingPromotion.promotionId}` : 'new'}
        isOpen={showAddPromotionModal}
        onClose={() => {
          setShowAddPromotionModal(false);
          setEditingPromotion(null);
          // Note: resetForm will be called by the modal's internal handlers
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
