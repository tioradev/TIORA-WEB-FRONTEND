import React, { useState } from 'react';
import { Scissors, User, Lock, Shield, Key, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'reception' | 'owner' | 'super-admin'>('reception');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
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

      // Mock login validation - in real app, this would be API call
      const mockUser = {
        id: '1',
        name: selectedRole === 'reception' ? 'Sarah Johnson' : 
              selectedRole === 'owner' ? 'Michael Davis' : 'Admin Smith',
        email: `${credentials.username}@salon.com`,
        role: selectedRole,
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      login(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!otpSent) {
        // Send OTP to email
        if (!forgotPasswordEmail.trim()) {
          throw new Error('Please enter your email address');
        }
        
        // Simulate OTP sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOtpSent(true);
        alert(`OTP sent to ${forgotPasswordEmail}. Please check your email.`);
      } else {
        // Verify OTP and reset password
        if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
          throw new Error('Please fill in all fields');
        }
        
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        
        // Simulate password reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Password reset successfully! You can now login with your new password.');
        
        // Reset form and go back to login
        setShowForgotPassword(false);
        setOtpSent(false);
        setForgotPasswordEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'reception',
      label: 'Reception',
      icon: User,
      color: 'blue',
      description: 'Manage appointments and payments'
    },
    {
      value: 'owner',
      label: 'Owner',
      icon: Lock,
      color: 'purple',
      description: 'Full salon management access'
    },
    {
      value: 'super-admin',
      label: 'Super Admin',
      icon: Shield,
      color: 'red',
      description: 'System-wide administration'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salon Manager</h1>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
          <div className="space-y-3">
            {roleOptions.map(role => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              const colorClasses = {
                blue: isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300',
                purple: isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300',
                red: isSelected ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-300',
              };

              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value as any)}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${colorClasses[role.color as keyof typeof colorClasses]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-6 h-6" />
                    <div className="flex-1">
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm opacity-75">{role.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : selectedRole === 'reception'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : selectedRole === 'owner'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                `Sign In as ${roleOptions.find(r => r.value === selectedRole)?.label}`
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setOtpSent(false);
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
            </div>
            
            {!otpSent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{!otpSent ? 'Sending OTP...' : 'Resetting Password...'}</span>
                </div>
              ) : (
                !otpSent ? 'Send OTP' : 'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Demo credentials: Any username/password combination will work
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;