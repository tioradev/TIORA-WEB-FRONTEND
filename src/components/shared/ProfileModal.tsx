import React, { useState, useEffect } from 'react';
import { 
  X, User, Briefcase, Save, Edit, Camera, Shield
} from 'lucide-react';

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
  useEffect(() => {
    setFormData(profile);
    console.log('ProfileModal received profile:', profile);
    console.log('ProfileModal isOpen:', isOpen);
  }, [profile, isOpen]);

  const handleSave = () => {
    // Don't allow changing the primary key (id)
    const updatedProfile = { ...formData, id: profile.id };
    onSave(updatedProfile);
    setIsEditing(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ 
          ...prev, 
          profilePicture: e.target?.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
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
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {formData.profilePicture ? (
                  <img 
                    src={formData.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors duration-200">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{formData.name}</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleColor(userRole)} text-white`}>
                <Shield className="w-4 h-4 mr-1" />
                {getRoleLabel(userRole)}
              </div>
            </div>
          </div>

          {/* Basic Information */}
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

          {/* Role-specific Information */}
          {userRole === 'owner' && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Business Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salon Name
                  </label>
                  <input
                    type="text"
                    value={formData.salonName || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
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
