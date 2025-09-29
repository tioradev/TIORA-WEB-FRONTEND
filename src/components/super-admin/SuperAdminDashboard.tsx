import React, { useState } from 'react';
import { 
  BarChart3, Building, FileText, Settings, 
  TrendingUp, Shield, Download,
  Activity, CheckCircle, Users,
  DollarSign, Server, Megaphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from '../shared/StatsCard';
import SalonManagement from './SalonManagement';
import AuditReports from './AuditReports';
import SystemSettings from './SystemSettings';
import SystemAnalytics from './SystemAnalytics';
import MarketingCommunication from './MarketingCommunication';
import ProfileModal from '../shared/ProfileModal';
import { mockSalons, mockSystemAnalytics, mockProfiles } from '../../data/mockData';

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'salons' | 'analytics' | 'reports' | 'settings' | 'marketing'>('overview');
  const [userProfile, setUserProfile] = useState(mockProfiles.superAdmin);
  const { isProfileModalOpen, closeProfileModal } = useAuth();

  const handleProfileSave = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
    console.log('Super Admin profile updated:', updatedProfile);
  };

  // Calculate overview statistics
  const totalSalons = mockSalons.length;
  const activeSalons = mockSalons.filter(s => s.subscriptionStatus === 'active').length;
  const totalRevenue = mockSalons.reduce((sum, salon) => sum + salon.monthlyRevenue, 0);
  const totalCustomers = mockSalons.reduce((sum, salon) => sum + salon.totalCustomers, 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'salons', label: 'Salon Management', icon: Building },
    { id: 'analytics', label: 'System Analytics', icon: Activity },
    { id: 'marketing', label: 'Marketing & Communication', icon: Megaphone },
    { id: 'reports', label: 'Audit Reports', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, Super Admin! 🚀
                </h1>
                <p className="text-red-100">Trinexa Salon Management System - System-wide Control</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics - Moved here */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Salons"
              value={totalSalons}
              icon={Building}
              color="blue"
              subtitle={`${activeSalons} active`}
            />
            <StatsCard
              title="System Revenue"
              value={`Rs ${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              change="+15% from last month"
            />
            <StatsCard
              title="Total Customers"
              value={totalCustomers.toLocaleString()}
              icon={Users}
              color="purple"
              subtitle="Across all salons"
            />
            <StatsCard
              title="System Uptime"
              value={`${mockSystemAnalytics.systemUptime}%`}
              icon={Server}
              color="emerald"
              subtitle="Last 30 days"
            />
          </div>
        </div>

        {/* Quick Actions - Moved here */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('salons')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200"
            >
              <Building className="w-5 h-5" />
              <span>Manage Salons</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <Download className="w-5 h-5" />
              <span>Generate Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <Activity className="w-5 h-5" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">

      {/* Enhanced Tab Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 whitespace-nowrap min-w-fit ${
                    isActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                    }`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="w-full h-0.5 bg-white/30 rounded-full mt-1"></div>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Enhanced Top Performing Salons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Top Performing Salons</h3>
                <p className="text-sm text-gray-600 mt-1">Leading revenue generators this month</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-5">
              {mockSalons.slice(0, 3).map((salon, index) => (
                <div key={salon.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                      'bg-gradient-to-r from-amber-500 to-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{salon.name}</p>
                      <p className="text-sm text-gray-600">{salon.city}, {salon.state}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          salon.subscriptionPlan === 'premium' ? 'bg-purple-100 text-purple-800' :
                          salon.subscriptionPlan === 'enterprise' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {salon.subscriptionPlan.charAt(0).toUpperCase() + salon.subscriptionPlan.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-900">Rs {salon.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{salon.totalCustomers} customers</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">+{Math.floor(Math.random() * 20 + 5)}% growth</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setActiveTab('salons')}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium"
              >
                View All Salons
              </button>
            </div>
          </div>

          {/* Enhanced System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">System Status & Health</h3>
                <p className="text-sm text-gray-600 mt-1">Real-time system monitoring and alerts</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full transform translate-x-10 -translate-y-10"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-lg">System Operational</p>
                    <p className="text-sm text-green-700">All services running normally</p>
                    <p className="text-xs text-green-600 font-medium mt-1">100% uptime today</p>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full transform translate-x-10 -translate-y-10"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Performance</p>
                    <p className="text-sm text-blue-700">{mockSystemAnalytics.averageResponseTime}ms avg response</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">Excellent performance</p>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-violet-200/30 rounded-full transform translate-x-10 -translate-y-10"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 text-lg">Security</p>
                    <p className="text-sm text-purple-700">All systems secure</p>
                    <p className="text-xs text-purple-600 font-medium mt-1">No threats detected</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional System Metrics */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{mockSystemAnalytics.totalEmployees}</p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{mockSystemAnalytics.totalCustomers}</p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{mockSystemAnalytics.systemUptime}%</p>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{mockSystemAnalytics.errorRate}%</p>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon Management Tab */}
      {activeTab === 'salons' && <SalonManagement />}

      {/* System Analytics Tab */}
      {activeTab === 'analytics' && <SystemAnalytics />}

      {/* Marketing & Communication Tab */}
      {activeTab === 'marketing' && <MarketingCommunication userRole="super-admin" />}

      {/* Audit Reports Tab */}
      {activeTab === 'reports' && <AuditReports />}

      {/* System Settings Tab */}
      {activeTab === 'settings' && <SystemSettings />}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        profile={userProfile}
        onSave={handleProfileSave}
        userRole="super-admin"
      />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;