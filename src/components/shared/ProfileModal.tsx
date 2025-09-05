import React, { useState, useEffect } from 'react';
import { 
  X, User, Briefcase, Save, Edit, Shield, Building
} from 'lucide-react';
import { apiService, SalonOwnerProfileUpdateRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ImageUploader from './ImageUploader';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'reception' | 'owner' | 'super-admin';
  profilePicture?: string;
  address?: string;
  joinDate?: string;
  salonId?: string;
  salonName?: string;
  // Owner specific fields
  businessName?: string;
  taxId?: string;
  // Salon owner additional fields from API
  district?: string;
  postalCode?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  brNumber?: string;
  fullOwnerName?: string;
  salonImageUrl?: string;
  ownerImgUrl?: string;
  // Super Admin specific fields
  department?: string;
  permissions?: string[];
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
  userRole: 'reception' | 'owner' | 'super-admin';
  viewOnly?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  onSave, 
  userRole,
  viewOnly = false 
}) => {
  const [isEditing, setIsEditing] = useState(!viewOnly);
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Sync form data with profile prop changes
  const { updateSalonInfo, getBranchId } = useAuth();

  useEffect(() => {
    setFormData(profile);
    console.log('ProfileModal received profile:', profile);
    console.log('ProfileModal isOpen:', isOpen);
    
    // Debug: Check authentication status when modal opens
    if (isOpen && userRole === 'owner') {
      console.log('🔍 [PROFILE] Modal opened for owner - checking auth status...');
      console.log('🔍 [PROFILE] LocalStorage token:', localStorage.getItem('authToken')?.substring(0, 30) + '...');
      console.log('🔍 [PROFILE] API Service token status:', apiService.getTokenStatus());
    }
  }, [profile, isOpen, userRole]);

  const handleSave = async () => {
    try {
      // Don't allow changing the primary key (id)
      const updatedProfile = { ...formData, id: profile.id };
      
      // Debug: Check if we have the required data
      console.log('🔍 [PROFILE] Starting profile save...');
      console.log('🔍 [PROFILE] User role:', userRole);
      console.log('🔍 [PROFILE] Salon ID:', formData.salonId);
      console.log('🔍 [PROFILE] Auth token exists:', !!localStorage.getItem('authToken'));
      console.log('🔍 [PROFILE] API Service token status:', apiService.getTokenStatus());
      
      // For salon owners, make API call to update profile
      if (userRole === 'owner' && formData.salonId) {
        const salonUpdateData: SalonOwnerProfileUpdateRequest = {
          name: formData.salonName || '',
          address: formData.address || '',
          district: formData.district || '',
          postalCode: formData.postalCode || '',
          phoneNumber: formData.phone || '',
          email: formData.email || '',
          ownerFirstName: formData.ownerFirstName || '',
          ownerLastName: formData.ownerLastName || '',
          ownerPhone: formData.ownerPhone || '',
          ownerEmail: formData.ownerEmail || '',
          brNumber: formData.brNumber || '',
          taxId: formData.taxId || '',
          imageUrl: formData.salonImageUrl || '',
          ownerImgUrl: formData.ownerImgUrl || formData.profilePicture || ''
        };

        console.log('🚀 [PROFILE] Making API call to update salon owner profile...');
        console.log('📋 [PROFILE] Update data:', salonUpdateData);
        console.log('🔐 [PROFILE] API service has token:', !!apiService['authToken']);
        
        // Get branch ID for the API call
        const branchId = getBranchId();
        console.log('🌿 [PROFILE] Branch ID:', branchId);
        
        const response = await apiService.updateSalonOwnerProfile(formData.salonId, salonUpdateData, branchId || undefined);
        console.log('✅ [PROFILE] Salon owner profile update response:', response);
        
        // Update the salon data in AuthContext
        if (updateSalonInfo) {
          updateSalonInfo({
            ...salonUpdateData,
            salonId: parseInt(formData.salonId),
            fullOwnerName: `${salonUpdateData.ownerFirstName} ${salonUpdateData.ownerLastName}`.trim()
          });
        }
      }
      
      onSave(updatedProfile);
      setIsEditing(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('❌ [PROFILE] Error updating profile:', error);
      console.error('❌ [PROFILE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Still call the onSave callback to update local state
      onSave({ ...formData, id: profile.id });
      setIsEditing(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  // Firebase image upload handlers
  const handleOwnerProfileImageUpload = (downloadURL: string) => {
    console.log('✅ [PROFILE] Owner profile image uploaded:', downloadURL);
    setFormData(prev => ({
      ...prev,
      profilePicture: downloadURL,
      ownerImgUrl: downloadURL
    }));
  };

  const handleSalonImageUpload = (downloadURL: string) => {
    console.log('✅ [PROFILE] Salon image uploaded:', downloadURL);
    setFormData(prev => ({
      ...prev,
      salonImageUrl: downloadURL
    }));
  };

  const handleEmployeeProfileImageUpload = (downloadURL: string) => {
    console.log('✅ [PROFILE] Employee profile image uploaded:', downloadURL);
    setFormData(prev => ({
      ...prev,
      profilePicture: downloadURL
    }));
  };

  const handleImageUploadError = (error: string) => {
    console.error('❌ [PROFILE] Image upload error:', error);
    alert(`Image upload failed: ${error}`);
  };

  const handleOwnerProfileImageDelete = () => {
    console.log('🗑️ [PROFILE] Owner profile image deleted');
    setFormData(prev => ({
      ...prev,
      profilePicture: '',
      ownerImgUrl: ''
    }));
  };

  const handleSalonImageDelete = () => {
    console.log('🗑️ [PROFILE] Salon image deleted');
    setFormData(prev => ({
      ...prev,
      salonImageUrl: ''
    }));
  };

  const handleEmployeeProfileImageDelete = () => {
    console.log('🗑️ [PROFILE] Employee profile image deleted');
    setFormData(prev => ({
      ...prev,
      profilePicture: ''
    }));
  };

  if (!isOpen) {
    console.log('ProfileModal not open, isOpen:', isOpen);
    return null;
  }

  console.log('ProfileModal rendering, isOpen:', isOpen, 'userRole:', userRole);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'from-red-500 to-red-600';
      case 'owner':
        return 'from-blue-500 to-blue-600';
      case 'reception':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'Super Administrator';
      case 'owner':
        return 'Salon Owner';
      case 'reception':
        return 'Reception Staff';
      default:
        return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r ${getRoleColor(userRole)} text-white rounded-t-2xl`}>
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6" />
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Profile' : 'View Profile'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {!viewOnly && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            Profile updated successfully!
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Picture Section - Enhanced with Firebase Storage */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.name}</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleColor(userRole)} text-white mb-4`}>
                <Shield className="w-4 h-4 mr-1" />
                {getRoleLabel(userRole)}
              </div>
            </div>

            {isEditing && userRole === 'owner' && (
              <div className="w-full space-y-6">
                {/* Owner Profile Picture Upload */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Owner Profile Picture</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Upload your professional profile picture. This will be displayed in your salon profile.</p>
                  <ImageUploader
                    category="owner-profiles"
                    salonId={parseInt(formData.salonId || '1')}
                    onUploadComplete={handleOwnerProfileImageUpload}
                    onUploadError={handleImageUploadError}
                    currentImage={formData.ownerImgUrl || formData.profilePicture || ''}
                    onImageDelete={handleOwnerProfileImageDelete}
                    placeholder="Upload Owner Photo"
                    className="max-w-md mx-auto"
                    maxWidth={300}
                    maxHeight={200}
                    employeeId={formData.id} // Use owner ID for consistent naming
                  />
                </div>

                {/* Salon Image Upload */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      <Building className="w-4 h-4" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Salon Image</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Upload an image that represents your salon. This will be displayed to customers when they browse salons.</p>
                  <ImageUploader
                    category="salon-logos"
                    salonId={parseInt(formData.salonId || '1')}
                    onUploadComplete={handleSalonImageUpload}
                    onUploadError={handleImageUploadError}
                    currentImage={formData.salonImageUrl || ''}
                    onImageDelete={handleSalonImageDelete}
                    placeholder="Upload Salon Image"
                    className="max-w-md mx-auto"
                    maxWidth={400}
                    maxHeight={300}
                  />
                </div>
              </div>
            )}

            {/* Read-only profile display for non-editing or non-owner */}
            {(!isEditing || userRole !== 'owner') && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                    {/* For salon owners, prioritize ownerImgUrl, for others use profilePicture */}
                    {(() => {
                      const imageUrl = userRole === 'owner' 
                        ? (formData.ownerImgUrl || formData.profilePicture) 
                        : formData.profilePicture;
                      
                      return imageUrl ? (
                        <img 
                          src={imageUrl}
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load profile image:', imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Profile image loaded successfully:', imageUrl);
                          }}
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced profile image upload for non-owner employees */}
            {isEditing && userRole !== 'owner' && (
              <div className="w-full">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Profile Picture</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Upload your professional profile picture. This will be displayed in your profile.</p>
                  <ImageUploader
                    category="employee-profiles"
                    salonId={parseInt(formData.salonId || '1')}
                    onUploadComplete={handleEmployeeProfileImageUpload}
                    onUploadError={handleImageUploadError}
                    currentImage={formData.profilePicture || ''}
                    onImageDelete={handleEmployeeProfileImageDelete}
                    placeholder="Upload Profile Photo"
                    className="max-w-md mx-auto"
                    maxWidth={300}
                    maxHeight={200}
                    employeeId={formData.id} // Use employee ID for consistent naming
                  />
                </div>
              </div>
            )}
          </div>

          {/* Basic Information - Only show for non-owner roles */}
          {userRole !== 'owner' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name - Always disabled for primary key protection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                      isEditing 
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                      isEditing 
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                      isEditing 
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  />
                </div>

                {/* Join Date - Read only */}
                {formData.joinDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Join Date
                    </label>
                    <input
                      type="text"
                      value={new Date(formData.joinDate).toLocaleDateString()}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                    isEditing 
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Enter full address"
                />
              </div>
            </div>
          )}

          {/* Role-specific Information */}
          {userRole === 'owner' && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Salon Owner & Business Information
              </h4>
              
              {/* Owner Personal Information */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-800 mb-3">Owner Information</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner First Name
                    </label>
                    <input
                      type="text"
                      value={formData.ownerFirstName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerFirstName: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.ownerLastName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerLastName: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.ownerPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={formData.ownerEmail || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Salon Information */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-800 mb-3">Salon Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salon Name
                    </label>
                    <input
                      type="text"
                      value={formData.salonName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, salonName: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salon Email
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salon Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      value={formData.district || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Business Registration */}
              <div>
                <h5 className="text-md font-medium text-gray-800 mb-3">Business Registration</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.brNumber || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, brNumber: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Salon Image */}
              {formData.salonImageUrl && (
                <div className="mt-6">
                  <h5 className="text-md font-medium text-gray-800 mb-3">Salon Image</h5>
                  <div className="flex justify-center">
                    <img
                      src={formData.salonImageUrl}
                      alt="Salon"
                      className="max-w-xs max-h-48 rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {userRole === 'super-admin' && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Administrative Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                      isEditing 
                        ? 'focus:ring-2 focus:ring-red-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <option value="">Select Department</option>
                    <option value="system-administration">System Administration</option>
                    <option value="customer-support">Customer Support</option>
                    <option value="business-development">Business Development</option>
                    <option value="technical-support">Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Level
                  </label>
                  <input
                    type="text"
                    value="Full System Access"
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>
          )}

          {userRole === 'reception' && formData.salonName && (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-green-600" />
                Workplace Information
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Salon
                </label>
                <input
                  type="text"
                  value={formData.salonName || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!viewOnly && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`px-6 py-3 bg-gradient-to-r ${getRoleColor(userRole)} text-white hover:shadow-lg rounded-xl transition-all duration-200 font-medium flex items-center space-x-2`}
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`px-6 py-3 bg-gradient-to-r ${getRoleColor(userRole)} text-white hover:shadow-lg rounded-xl transition-all duration-200 font-medium flex items-center space-x-2`}
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
