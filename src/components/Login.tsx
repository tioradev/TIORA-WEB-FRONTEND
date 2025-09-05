import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { envLog } from '../config/environment';
import TioraLogo from '../assets/images/Tiora black png.png';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Validate credentials
      if (!credentials.username.trim() || !credentials.password.trim()) {
        throw new Error('Please enter both username and password');
      }

      envLog.info('🔐 [LOGIN] Attempting login for:', credentials.username);
      
      // Call the authentication API
      const response = await apiService.login({
        usernameOrEmail: credentials.username,
        password: credentials.password
      });
      
      envLog.info('✅ [LOGIN] Login successful:', {
        role: response.role,
        username: response.username,
        tokenType: response.tokenType
      });

      if (response.role && response.username) {
        // Map API roles to our internal role structure
        let userRole: 'reception' | 'owner' | 'super-admin';
        switch (response.role) {
          case 'SALON_RECEPTION':
            userRole = 'reception';
            break;
          case 'SALON_OWNER':
            userRole = 'owner';
            break;
          case 'SUPER_ADMIN':
            userRole = 'super-admin';
            break;
          default:
            throw new Error('Unknown user role');
        }

        // Create user object for the auth context using the response structure
        const user = {
          id: response.employee?.employeeId?.toString() || response.username || 'temp-id',
          name: response.employee?.fullName || response.username, 
          email: response.employee?.email || '', 
          role: userRole,
        };
        
        // Extract salon data if user is a salon owner
        let salonData = undefined;
        if (userRole === 'owner' && response.salon) {
          salonData = {
            salonId: response.salon.salonId,
            name: response.salon.name,
            address: response.salon.address,
            district: response.salon.district,
            postalCode: response.salon.postalCode,
            phoneNumber: response.salon.phoneNumber,
            email: response.salon.email,
            ownerFirstName: response.salon.ownerFirstName,
            ownerLastName: response.salon.ownerLastName,
            ownerPhone: response.salon.ownerPhone,
            ownerEmail: response.salon.ownerEmail,
            brNumber: response.salon.brNumber,
            taxId: response.salon.taxId,
            imageUrl: response.salon.imageUrl,
            ownerImgUrl: response.salon.ownerImgUrl || '',
            status: response.salon.status,
            createdAt: response.salon.createdAt,
            updatedAt: response.salon.updatedAt,
            username: response.salon.username,
            userRole: response.salon.userRole,
            defaultBranchId: response.salon.defaultBranchId,
            defaultBranchName: response.salon.defaultBranchName,
            fullOwnerName: response.salon.fullOwnerName,
          };
        }
        
        // Extract employee data if user is reception staff
        let employeeData = undefined;
        if (userRole === 'reception' && response.employee) {
          employeeData = {
            employeeId: response.employee.employeeId,
            firstName: response.employee.firstName,
            lastName: response.employee.lastName,
            email: response.employee.email,
            username: response.employee.username,
            phoneNumber: response.employee.phoneNumber,
            dateOfBirth: response.employee.dateOfBirth,
            gender: response.employee.gender,
            address: response.employee.address,
            city: response.employee.city,
            role: response.employee.role,
            status: response.employee.status,
            hireDate: response.employee.hireDate,
            terminationDate: response.employee.terminationDate,
            baseSalary: response.employee.baseSalary,
            experience: response.employee.experience,
            specializations: response.employee.specializations,
            emergencyContact: response.employee.emergencyContact,
            emergencyPhone: response.employee.emergencyPhone,
            emergencyRelationship: response.employee.emergencyRelationship,
            ratings: response.employee.ratings,
            experienceYears: response.employee.experienceYears,
            notes: response.employee.notes,
            profileImageUrl: response.employee.profileImageUrl,
            salonName: response.employee.salonName,
            salonId: response.employee.salonId,
            branchId: response.employee.branchId,
            employeeWeeklySchedule: response.employee.employeeWeeklySchedule,
            createdAt: response.employee.createdAt,
            updatedAt: response.employee.updatedAt,
            active: response.employee.active,
            fullName: response.employee.fullName,
          };
        }

        envLog.info('👤 [LOGIN] User object created:', user);
        if (salonData) {
          envLog.info('🏢 [LOGIN] Salon data extracted:', salonData.name);
        }
        if (employeeData) {
          envLog.info('👨‍💼 [LOGIN] Employee data extracted:', employeeData.fullName);
        }

        // Store in auth context
        login(user, response.token, salonData, employeeData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      envLog.error('❌ [LOGIN] Login failed:', errorMessage);
      
      // Provide user-friendly error messages
      let userError = errorMessage;
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userError = 'Invalid username or password';
      } else if (errorMessage.includes('Failed to fetch')) {
        userError = 'Cannot connect to server. Please check your internet connection.';
      }
      
      setError(userError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement forgot password with API
    console.log('Forgot password for:', forgotPasswordEmail);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset with API
    console.log('Reset password with OTP:', otp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          {/* Logo - Replace with your actual logo */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src={TioraLogo} 
                alt="Tiora Manager Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            Tiora Manager
          </h1>
          <p className="text-gray-600 text-xs font-medium leading-relaxed">Professional Salon & Skin Care Management System</p>
          <div className="mt-2 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur border border-red-200/50 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username or Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter your username or email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full pl-11 pr-11 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="mr-3 p-2 hover:bg-gray-100/50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
            </div>

            {!otpSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Send Reset Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter 6-digit code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Reset Password
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Powered by Tiora Manager</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-500">
            Need help? Contact support at{' '}
            <a href="mailto:support@tioramanager.com" className="text-blue-600 hover:text-blue-700 font-medium">
              support@tioramanager.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
