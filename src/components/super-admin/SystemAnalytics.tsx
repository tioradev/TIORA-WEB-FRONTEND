import React, { useState } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, CheckCircle, 
  Server, Users, Building, DollarSign, Globe,
  Clock, Zap, Shield, Database, Wifi, WifiOff
} from 'lucide-react';
import { mockSystemAnalytics, mockSalons } from '../../data/mockData';

const SystemAnalytics: React.FC = () => {
  const [analytics] = useState(mockSystemAnalytics);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');

  const systemHealth = [
    {
      metric: 'System Uptime',
      value: `${analytics.systemUptime}%`,
      status: analytics.systemUptime > 99 ? 'excellent' : analytics.systemUptime > 95 ? 'good' : 'warning',
      icon: Server,
      description: 'Overall system availability'
    },
    {
      metric: 'Error Rate',
      value: `${analytics.errorRate}%`,
      status: analytics.errorRate < 1 ? 'excellent' : analytics.errorRate < 5 ? 'good' : 'warning',
      icon: AlertTriangle,
      description: 'System error percentage'
    },
    {
      metric: 'Response Time',
      value: `${analytics.averageResponseTime}ms`,
      status: analytics.averageResponseTime < 300 ? 'excellent' : analytics.averageResponseTime < 500 ? 'good' : 'warning',
      icon: Zap,
      description: 'Average API response time'
    },
    {
      metric: 'Database Health',
      value: '98.5%',
      status: 'excellent',
      icon: Database,
      description: 'Database performance score'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-amber-600 bg-amber-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Analytics</h2>
          <p className="text-gray-600">Real-time system performance and business intelligence</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemHealth.map((item, index) => {
          const StatusIcon = getStatusIcon(item.status);
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(item.status)}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <StatusIcon className={`w-5 h-5 ${item.status === 'excellent' || item.status === 'good' ? 'text-green-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.value}</h3>
                <p className="text-sm font-medium text-gray-700">{item.metric}</p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalSalons}</h3>
            <p className="text-sm font-medium text-gray-700">Total Salons</p>
            <p className="text-xs text-green-600 mt-1">+{analytics.monthlyGrowth}% this month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalCustomers.toLocaleString()}</h3>
            <p className="text-sm font-medium text-gray-700">Total Customers</p>
            <p className="text-xs text-gray-500 mt-1">Across all salons</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Rs {analytics.totalRevenue.toLocaleString()}</h3>
            <p className="text-sm font-medium text-gray-700">Total Revenue</p>
            <p className="text-xs text-green-600 mt-1">Monthly recurring</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-amber-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.customerSatisfaction}</h3>
            <p className="text-sm font-medium text-gray-700">Customer Rating</p>
            <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
          </div>
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Basic Plan</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{analytics.subscriptionBreakdown.basic}</span>
                <span className="text-xs text-gray-500 ml-1">salons</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Premium Plan</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{analytics.subscriptionBreakdown.premium}</span>
                <span className="text-xs text-gray-500 ml-1">salons</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Enterprise Plan</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{analytics.subscriptionBreakdown.enterprise}</span>
                <span className="text-xs text-gray-500 ml-1">salons</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.geographicDistribution).map(([country, count]) => (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{country}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">salons</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Salon Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Salon Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockSalons.map((salon) => (
            <div key={salon.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{salon.name}</h4>
                <div className="flex items-center space-x-2">
                  {salon.systemStatus === 'online' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    salon.systemStatus === 'online' ? 'text-green-600' : 
                    salon.systemStatus === 'maintenance' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {salon.systemStatus.charAt(0).toUpperCase() + salon.systemStatus.slice(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Employees:</span>
                  <span>{salon.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customers:</span>
                  <span>{salon.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span>Rs {salon.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Active:</span>
                  <span>{salon.lastActiveDate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts & Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">All Systems Operational</p>
              <p className="text-xs text-green-700">All salon systems are running smoothly</p>
            </div>
            <span className="text-xs text-green-600">2 min ago</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Scheduled Maintenance</p>
              <p className="text-xs text-amber-700">Classic Barber Shop - System maintenance in progress</p>
            </div>
            <span className="text-xs text-amber-600">1 hour ago</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Security Update</p>
              <p className="text-xs text-blue-700">System security patches applied successfully</p>
            </div>
            <span className="text-xs text-blue-600">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;