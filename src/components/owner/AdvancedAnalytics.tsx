import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Users,
  BarChart3, Target, Award,
  ArrowUp, ArrowDown, Download
} from 'lucide-react';
import { RevenueAnalytics, CustomerAnalytics } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Branch analytics interfaces
interface BranchIncomeStats {
  branchId: number;
  branchName: string;
  appointmentRevenue: number;
  serviceCharges: number;
  netIncome: number;
}

interface BranchMonthlyStats {
  branchId: number;
  branchName: string;
  monthlyAppointments: number;
  monthlyRevenue: number;
  monthlyServiceCharges: number;
  monthlyNetIncome: number;
  paidServiceCharges: number;
  pendingServiceCharges: number;
}

interface AnalyticsData {
  salonId: number;
  analyticsDate: string;
  totalPendingAmount: number;
  todayStats: {
    totalAppointments: number;
    branchStats: any[];
  };
  todayIncome: {
    totalAppointmentRevenue: number;
    totalServiceCharges: number;
    netIncome: number;
    branchIncomeStats: BranchIncomeStats[];
  };
  monthlyIncome: {
    monthYear: string;
    totalMonthlyRevenue: number;
    totalMonthlyServiceCharges: number;
    totalMonthlyNetIncome: number;
    branchMonthlyStats: BranchMonthlyStats[];
  };
  serviceCharge: number;
}

const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'revenue' | 'customers' | 'services' | 'forecasting' | 'branches'>('revenue');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getSalonId } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    const salonId = getSalonId();
    if (!salonId) {
      setError('Salon information not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPaymentAnalytics(salonId);
      setAnalyticsData(data);
      console.log('Analytics data loaded:', data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock analytics data
  const revenueAnalytics: RevenueAnalytics = {
    salonId: 'salon1',
    period: '2024-01',
    totalRevenue: 45000,
    serviceRevenue: 38000,
    productRevenue: 7000,
    averageTicketSize: 85,
    customerCount: 529,
    appointmentCount: 642,
    topServices: [
      { serviceId: '1', serviceName: 'Premium Haircut & Styling', revenue: 15000, count: 375 },
      { serviceId: '2', serviceName: 'Basic Haircut', revenue: 12000, count: 480 },
      { serviceId: '3', serviceName: 'Beard Trim', revenue: 6000, count: 400 },
    ],
    topBarbers: [
      { barberId: '1', barberName: 'John Smith', revenue: 18000, appointmentCount: 240 },
      { barberId: '2', barberName: 'Mike Johnson', revenue: 15000, appointmentCount: 200 },
      { barberId: '3', barberName: 'David Brown', revenue: 12000, appointmentCount: 180 },
    ],
  };

  const customerAnalytics: CustomerAnalytics = {
    salonId: 'salon1',
    totalCustomers: 1250,
    newCustomers: 85,
    returningCustomers: 444,
    averageLifetimeValue: 420,
    retentionRate: 78,
    churnRate: 22,
    topCustomers: [
      { customerId: '1', customerName: 'Robert Wilson', totalSpent: 1200, visitCount: 24 },
      { customerId: '2', customerName: 'James Davis', totalSpent: 980, visitCount: 18 },
      { customerId: '3', customerName: 'Michael Brown', totalSpent: 850, visitCount: 16 },
    ],
  };

  const tabs = [
    { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
    { id: 'customers', label: 'Customer Analytics', icon: Users },
    { id: 'services', label: 'Service Performance', icon: BarChart3 },
    { id: 'branches', label: 'Branch Performance', icon: Target },
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${revenueAnalytics.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Count</p>
              <p className="text-2xl font-bold text-gray-900">{customerAnalytics.totalCustomers}</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+8.3%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Ticket Size</p>
              <p className="text-2xl font-bold text-gray-900">${revenueAnalytics.averageTicketSize}</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+3.7%</span>
              </div>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">{customerAnalytics.retentionRate}%</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">-2.1%</span>
              </div>
            </div>
            <Award className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenue Analytics Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service Revenue</span>
                  <span className="font-semibold text-gray-900">${revenueAnalytics.serviceRevenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(revenueAnalytics.serviceRevenue / revenueAnalytics.totalRevenue) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Product Revenue</span>
                  <span className="font-semibold text-gray-900">${revenueAnalytics.productRevenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(revenueAnalytics.productRevenue / revenueAnalytics.totalRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Barbers</h3>
              <div className="space-y-4">
                {revenueAnalytics.topBarbers.map((barber, index) => (
                  <div key={barber.barberId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{barber.barberName}</p>
                        <p className="text-sm text-gray-600">{barber.appointmentCount} appointments</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">${barber.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Service</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">Count</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">Avg Price</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueAnalytics.topServices.map((service) => (
                    <tr key={service.serviceId} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">{service.serviceName}</td>
                      <td className="py-3 px-4 text-right text-gray-900">${service.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{service.count}</td>
                      <td className="py-3 px-4 text-right text-gray-900">${(service.revenue / service.count).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {((service.revenue / revenueAnalytics.serviceRevenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Analytics Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Customers</span>
                  <span className="font-semibold text-green-600">{customerAnalytics.newCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Returning Customers</span>
                  <span className="font-semibold text-blue-600">{customerAnalytics.returningCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Lifetime Value</span>
                  <span className="font-semibold text-purple-600">${customerAnalytics.averageLifetimeValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Churn Rate</span>
                  <span className="font-semibold text-red-600">{customerAnalytics.churnRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
              <div className="space-y-4">
                {customerAnalytics.topCustomers.map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.customerName}</p>
                        <p className="text-sm text-gray-600">{customer.visitCount} visits</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">${customer.totalSpent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Performance Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Popularity</h3>
              <div className="space-y-4">
                {revenueAnalytics.topServices.map((service) => (
                  <div key={service.serviceId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{service.serviceName}</span>
                      <span className="text-sm text-gray-600">{service.count} bookings</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                        style={{ width: `${(service.count / Math.max(...revenueAnalytics.topServices.map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
              <div className="space-y-4">
                {revenueAnalytics.topServices.map((service) => {
                  const profitMargin = 65 + Math.random() * 20; // Mock profit margin
                  return (
                    <div key={service.serviceId} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{service.serviceName}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{profitMargin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">margin</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecasting Tab */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Next Month Projection</span>
                  <span className="font-semibold text-green-600">${(revenueAnalytics.totalRevenue * 1.08).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Next Quarter Projection</span>
                  <span className="font-semibold text-blue-600">${(revenueAnalytics.totalRevenue * 3.2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annual Projection</span>
                  <span className="font-semibold text-purple-600">${(revenueAnalytics.totalRevenue * 12.5).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Opportunities</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900">Increase Premium Services</h4>
                  <p className="text-sm text-green-700">Potential +15% revenue increase</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Customer Retention Program</h4>
                  <p className="text-sm text-blue-700">Potential +8% customer retention</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900">Product Sales</h4>
                  <p className="text-sm text-purple-700">Potential +25% product revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Performance Tab */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-purple-500 hover:bg-purple-400 transition ease-in-out duration-150 cursor-not-allowed">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading analytics data...
              </div>
            </div>
          ) : analyticsData ? (
            <div>
              {/* Today's Performance by Branch */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance by Branch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.todayIncome.branchIncomeStats.map((branch) => (
                    <div key={branch.branchId} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{branch.branchName}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Appointment Revenue</span>
                          <span className="font-medium text-green-600">
                            ${branch.appointmentRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Charges</span>
                          <span className="font-medium text-red-600">
                            -${branch.serviceCharges.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t pt-2">
                          <span className="text-gray-900">Net Income</span>
                          <span className="text-blue-600">
                            ${branch.netIncome.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Performance by Branch */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Performance by Branch ({analyticsData.monthlyIncome.monthYear})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {analyticsData.monthlyIncome.branchMonthlyStats.map((branch) => (
                    <div key={branch.branchId} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{branch.branchName}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Appointments</span>
                          <span className="font-medium text-gray-900">
                            {branch.monthlyAppointments}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Revenue</span>
                          <span className="font-medium text-green-600">
                            ${branch.monthlyRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Charges</span>
                          <span className="font-medium text-red-600">
                            -${branch.monthlyServiceCharges.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 ml-2">Paid</span>
                          <span className="text-green-600">
                            ${branch.paidServiceCharges.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 ml-2">Pending</span>
                          <span className="text-orange-600">
                            ${branch.pendingServiceCharges.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t pt-2">
                          <span className="text-gray-900">Net Income</span>
                          <span className="text-blue-600">
                            ${branch.monthlyNetIncome.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No branch performance data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;