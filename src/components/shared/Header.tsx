import React from 'react';
import { LogOut, User, Scissors } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

const Header: React.FC = () => {
  const { user, salon, logout, openProfileModal } = useAuth();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'reception':
        return 'from-blue-500 to-blue-600';
      case 'owner':
        return 'from-purple-500 to-purple-600';
      case 'super-admin':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIndicatorColor = () => {
    switch (user?.role) {
      case 'reception':
        return 'bg-blue-400';
      case 'owner':
        return 'bg-purple-400';
      case 'super-admin':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getProfileGradient = () => {
    switch (user?.role) {
      case 'reception':
        return 'from-blue-400 to-blue-500';
      case 'owner':
        return 'from-purple-400 to-purple-500';
      case 'super-admin':
        return 'from-red-400 to-red-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          {/* Logo and Brand Section */}
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${getRoleColor()} rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200`}>
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Salon Manager</h1>
              <p className="text-sm text-gray-500 capitalize flex items-center mt-1">
                <span className={`inline-block w-2.5 h-2.5 ${getRoleIndicatorColor()} rounded-full mr-2 animate-pulse`}></span>
                {user?.role?.replace('-', ' ')} Dashboard
              </p>
            </div>
          </div>

          {/* Right Section - Notifications, Profile, Logout */}
          <div className="flex items-center space-x-2">
            {/* Enhanced Notification Panel */}
            {user && (
              <div className="relative">
                <NotificationPanel />
              </div>
            )}
            
            {/* Enhanced Profile Section */}
            <button
              onClick={openProfileModal}
              className="flex items-center space-x-4 bg-gray-50/70 rounded-2xl px-4 py-2 border border-gray-200/50 hover:bg-gray-100/70 transition-all duration-200 cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 overflow-hidden`}>
                {/* For salon owners, prioritize ownerImgUrl, for others use profilePicture */}
                {(() => {
                  const profileImageUrl = user?.role === 'owner' 
                    ? (salon?.ownerImgUrl || user?.profilePicture) 
                    : user?.profilePicture;
                  
                  return profileImageUrl ? (
                    <img 
                      src={profileImageUrl}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load header profile image:', profileImageUrl);
                        // Fallback to gradient background with User icon
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.className = `w-10 h-10 bg-gradient-to-r ${getProfileGradient()} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200`;
                          parent.innerHTML = '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                        }
                      }}
                      onLoad={() => {
                        console.log('Header profile image loaded successfully:', profileImageUrl);
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${getProfileGradient()} rounded-xl flex items-center justify-center`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                  );
                })()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
              </div>
            </button>

            {/* Enhanced Separator */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            
            {/* Enhanced Logout Button */}
            <button
              onClick={logout}
              className="group flex items-center space-x-3 px-5 py-3 text-gray-600 hover:text-red-600 bg-gray-50/50 hover:bg-red-50 rounded-2xl transition-all duration-300 border border-gray-200/50 hover:border-red-200 transform hover:scale-105 shadow-sm hover:shadow-md"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-500 transition-colors duration-200" />
              <span className="hidden sm:inline font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;