import React, { useState } from 'react';
import { 
  Download, Calendar, FileText, DollarSign, 
  Users, Activity,
  Building
} from 'lucide-react';
import { mockEarnings, mockAppointments, mockBarbers, mockSalons } from '../../data/mockData';

const AuditReports: React.FC = () => {
  const [reportType, setReportType] = useState<'income' | 'expense' | 'employee' | 'customer' | 'salon-overview' | 'system-analytics' | 'comprehensive'>('comprehensive');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedSalon, setSelectedSalon] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', icon: FileText, description: 'Complete system overview' },
    { value: 'salon-overview', label: 'Salon Overview', icon: Building, description: 'All salon performance metrics' },
    { value: 'system-analytics', label: 'System Analytics', icon: Activity, description: 'Technical system performance' },
    { value: 'income', label: 'Income Report', icon: DollarSign, description: 'Revenue and earnings analysis' },
    { value: 'employee', label: 'Employee Report', icon: Users, description: 'Staff performance across salons' },
    { value: 'customer', label: 'Customer Report', icon: Activity, description: 'Client analytics and trends' },
  ];

  const generateReport = async (format: 'excel' | 'pdf' = 'excel') => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reportData = generateReportData();
    downloadReport(reportData, format);
    
    setIsGenerating(false);
  };

  const generateReportData = () => {
    const filteredSalons = selectedSalon === 'all' ? mockSalons : mockSalons.filter(s => s.id === selectedSalon);
    const totalIncome = mockEarnings.reduce((sum, earning) => sum + earning.finalAmount, 0);
    const totalAppointments = mockAppointments.length;
    const totalEmployees = mockBarbers.length;
    
    const reportData = {
      reportType,
      dateRange,
      selectedSalon,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSalons: filteredSalons.length,
        totalIncome,
        totalAppointments,
        totalEmployees,
        averageTransactionValue: totalIncome / totalAppointments,
        systemUptime: 99.2,
      },
      details: {
        salons: filteredSalons,
        income: mockEarnings,
        appointments: mockAppointments,
        employees: mockBarbers,
      }
    };

    return reportData;
  };

  const downloadReport = (data: any, format: 'excel' | 'pdf' = 'excel') => {
    if (format === 'pdf') {
      downloadPDFReport(data);
    } else {
      downloadExcelReport(data);
    }
  };

  const downloadPDFReport = (data: any) => {
    // Simulate PDF generation - in a real app, you'd use a library like jsPDF
    const pdfContent = generatePDFContent(data);
    const filename = `${reportType}-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
    
    // Create a blob and download
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generatePDFContent = (data: any) => {
    // This is a simplified PDF content generator
    // In a real application, you would use jsPDF or similar library
    const reportData = JSON.stringify(data, null, 2);
    return `PDF Report Content for ${reportType}\nGenerated on: ${new Date().toLocaleString()}\n\nData Summary:\n${reportData}`;
  };

  const downloadExcelReport = (data: any) => {
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'salon-overview':
        csvContent = generateSalonOverviewCSV(data);
        filename = `salon-overview-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      case 'system-analytics':
        csvContent = generateSystemAnalyticsCSV(data);
        filename = `system-analytics-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      case 'income':
        csvContent = generateIncomeCSV(data);
        filename = `income-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      case 'employee':
        csvContent = generateEmployeeCSV(data);
        filename = `employee-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      case 'customer':
        csvContent = generateCustomerCSV(data);
        filename = `customer-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      case 'comprehensive':
        csvContent = generateComprehensiveCSV(data);
        filename = `comprehensive-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
        break;
      default:
        csvContent = generateComprehensiveCSV(data);
        filename = `audit-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`;
    }

    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSalonOverviewCSV = (data: any) => {
    const headers = 'Salon ID,Salon Name,Owner Name,City,State,Plan,Status,Employees,Customers,Monthly Revenue,System Status,Last Active\n';
    const rows = data.details.salons.map((salon: any) => {
      const ownerFullName = `${salon.ownerFirstName} ${salon.ownerLastName}`;
      return `${salon.id},${salon.name},${ownerFullName},${salon.city},${salon.state},${salon.subscriptionPlan},${salon.subscriptionStatus},${salon.totalEmployees},${salon.totalCustomers},${salon.monthlyRevenue},${salon.systemStatus},${salon.lastActiveDate}`;
    }).join('\n');
    
    const summary = `\n\nSUMMARY\nTotal Salons,${data.summary.totalSalons}\nTotal Revenue,${data.details.salons.reduce((sum: number, s: any) => sum + s.monthlyRevenue, 0)}\nTotal Customers,${data.details.salons.reduce((sum: number, s: any) => sum + s.totalCustomers, 0)}\nTotal Employees,${data.details.salons.reduce((sum: number, s: any) => sum + s.totalEmployees, 0)}\n`;
    
    return headers + rows + summary;
  };

  const generateSystemAnalyticsCSV = (data: any) => {
    const headers = 'Metric,Value,Status,Description\n';
    const systemMetrics = [
      'System Uptime,99.2%,Excellent,Overall system availability',
      'Error Rate,0.8%,Good,System error percentage',
      'Response Time,245ms,Excellent,Average API response time',
      'Database Health,98.5%,Excellent,Database performance score',
      'Active Salons,' + data.details.salons.filter((s: any) => s.isActive).length + ',Good,Currently active salons',
      'Total Users,' + (data.summary.totalEmployees + data.details.salons.reduce((sum: number, s: any) => sum + s.totalCustomers, 0)) + ',Good,Total system users'
    ];
    
    const rows = systemMetrics.join('\n');
    const summary = `\n\nSYSTEM HEALTH SUMMARY\nOverall Status,Operational\nUptime Target,99%\nCurrent Uptime,${data.summary.systemUptime}%\nPerformance,Excellent\n`;
    
    return headers + rows + summary;
  };

  const generateIncomeCSV = (data: any) => {
    const headers = 'Date,Salon ID,Barber Name,Service Name,Amount,Discount,Final Amount,Payment Method,Commission %,Salon Earning\n';
    const rows = data.details.income.map((earning: any) => 
      `${earning.date},${earning.salonId},${earning.barberName},${earning.serviceName},${earning.amount},${earning.discountAmount || 0},${earning.finalAmount},${earning.paymentMethod},${earning.commission || 0},${earning.salonEarning || 0}`
    ).join('\n');
    
    const summary = `\n\nSUMMARY\nTotal Income,${data.summary.totalIncome}\nTotal Transactions,${data.summary.totalAppointments}\nAverage Transaction Value,${data.summary.averageTransactionValue.toFixed(2)}\n`;
    
    return headers + rows + summary;
  };

  const generateEmployeeCSV = (data: any) => {
    const headers = 'Employee ID,Salon ID,First Name,Last Name,Email,Mobile,Specialization,Experience,Status,Joining Date,Salary\n';
    const rows = data.details.employees.map((emp: any) => 
      `${emp.employeeId || emp.id},${emp.salonId},${emp.firstName},${emp.lastName},${emp.email},${emp.mobile},${emp.specializedArea},${emp.experience},${emp.isActive ? 'Active' : 'Inactive'},${emp.joiningDate || emp.createdAt},${emp.salary || 'N/A'}`
    ).join('\n');
    
    const summary = `\n\nSUMMARY\nTotal Employees,${data.details.employees.length}\nActive Employees,${data.details.employees.filter((e: any) => e.isActive).length}\nInactive Employees,${data.details.employees.filter((e: any) => !e.isActive).length}\n`;
    
    return headers + rows + summary;
  };

  const generateCustomerCSV = (data: any) => {
    const headers = 'Customer Name,Phone,Email,Salon ID,Service,Barber,Date,Amount,Status\n';
    const rows = data.details.appointments.map((apt: any) => 
      `${apt.customerName},${apt.customerPhone},${apt.customerEmail || 'N/A'},${apt.salonId},${apt.serviceName},${apt.barberName},${apt.date},${apt.finalAmount},${apt.status}`
    ).join('\n');
    
    const uniqueCustomers = new Set(data.details.appointments.map((apt: any) => apt.customerPhone)).size;
    const summary = `\n\nSUMMARY\nTotal Appointments,${data.summary.totalAppointments}\nUnique Customers,${uniqueCustomers}\nAverage Spend per Customer,${(data.summary.totalIncome / uniqueCustomers).toFixed(2)}\n`;
    
    return headers + rows + summary;
  };

  const generateComprehensiveCSV = (data: any) => {
    let content = `TRINEXA SALON MANAGEMENT SYSTEM - COMPREHENSIVE AUDIT REPORT\nGenerated: ${new Date(data.generatedAt).toLocaleString()}\nPeriod: ${data.dateRange.startDate} to ${data.dateRange.endDate}\nScope: ${data.selectedSalon === 'all' ? 'All Salons' : 'Selected Salon'}\n\n`;
    
    content += `EXECUTIVE SUMMARY\n`;
    content += `Total Salons,${data.summary.totalSalons}\n`;
    content += `Total Revenue,${data.summary.totalIncome}\n`;
    content += `Total Appointments,${data.summary.totalAppointments}\n`;
    content += `Total Employees,${data.summary.totalEmployees}\n`;
    content += `Average Transaction Value,${data.summary.averageTransactionValue.toFixed(2)}\n`;
    content += `System Uptime,${data.summary.systemUptime}%\n\n`;
    
    content += `SALON OVERVIEW\n`;
    content += generateSalonOverviewCSV(data);
    
    content += `\n\nINCOME BREAKDOWN\n`;
    content += generateIncomeCSV(data);
    
    content += `\n\nEMPLOYEE DETAILS\n`;
    content += generateEmployeeCSV(data);
    
    content += `\n\nCUSTOMER ANALYTICS\n`;
    content += generateCustomerCSV(data);
    
    content += `\n\nSYSTEM ANALYTICS\n`;
    content += generateSystemAnalyticsCSV(data);
    
    return content;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Reports</h2>
        <p className="text-gray-600">Generate comprehensive business reports for audit and analysis</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            <div className="space-y-3">
              {reportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    onClick={() => setReportType(type.value as any)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      reportType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${reportType === type.value ? 'text-red-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className={`font-medium ${reportType === type.value ? 'text-red-900' : 'text-gray-900'}`}>
                          {type.label}
                        </h4>
                        <p className={`text-sm ${reportType === type.value ? 'text-red-700' : 'text-gray-600'}`}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters and Date Range */}
          <div className="space-y-6">
            {/* Salon Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Salon Filter</label>
              <select
                value={selectedSalon}
                onChange={(e) => setSelectedSalon(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Salons</option>
                {mockSalons.map(salon => (
                  <option key={salon.id} value={salon.id}>{salon.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Last 7 Days', days: 7 },
                    { label: 'Last 30 Days', days: 30 },
                    { label: 'Last 90 Days', days: 90 },
                    { label: 'This Year', days: 365 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const endDate = new Date();
                        const startDate = new Date(endDate.getTime() - preset.days * 24 * 60 * 60 * 1000);
                        setDateRange({
                          startDate: startDate.toISOString().split('T')[0],
                          endDate: endDate.toISOString().split('T')[0]
                        });
                      }}
                      className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => generateReport('excel')}
              disabled={isGenerating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              } text-white`}
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? 'Generating...' : 'Download Excel Report'}</span>
            </button>
            
            <button
              onClick={() => generateReport('pdf')}
              disabled={isGenerating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              } text-white`}
            >
              <FileText className="w-5 h-5" />
              <span>{isGenerating ? 'Generating...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Salons</p>
                <p className="text-2xl font-bold">{selectedSalon === 'all' ? mockSalons.length : 1}</p>
              </div>
              <Building className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Total Revenue</p>
                <p className="text-2xl font-bold">${mockEarnings.reduce((sum, e) => sum + e.finalAmount, 0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Employees</p>
                <p className="text-2xl font-bold">{mockBarbers.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100">Total Customers</p>
                <p className="text-2xl font-bold">{mockSalons.reduce((sum, s) => sum + s.totalCustomers, 0)}</p>
              </div>
              <Activity className="w-8 h-8 text-amber-200" />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Report will include:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {reportType === 'comprehensive' && (
              <>
                <li>• Executive summary with key metrics across all salons</li>
                <li>• Detailed salon performance breakdown</li>
                <li>• System-wide income and expense analysis</li>
                <li>• Employee performance analytics across salons</li>
                <li>• Customer behavior insights and trends</li>
                <li>• System health and technical performance metrics</li>
              </>
            )}
            {reportType === 'salon-overview' && (
              <>
                <li>• Individual salon performance metrics</li>
                <li>• Subscription status and plan details</li>
                <li>• Employee and customer counts per salon</li>
                <li>• Revenue breakdown by salon</li>
                <li>• System status for each salon</li>
              </>
            )}
            {reportType === 'system-analytics' && (
              <>
                <li>• System uptime and performance metrics</li>
                <li>• Error rates and response times</li>
                <li>• Database health indicators</li>
                <li>• User activity and engagement stats</li>
                <li>• Technical infrastructure status</li>
              </>
            )}
            {reportType === 'income' && (
              <>
                <li>• Revenue by salon and service type</li>
                <li>• Payment method breakdown</li>
                <li>• Commission calculations across salons</li>
                <li>• Daily/weekly/monthly trends</li>
              </>
            )}
            {reportType === 'employee' && (
              <>
                <li>• Complete employee directory across all salons</li>
                <li>• Performance metrics by salon</li>
                <li>• Salary and commission details</li>
                <li>• Employee status and activity tracking</li>
              </>
            )}
            {reportType === 'customer' && (
              <>
                <li>• Customer demographics across salons</li>
                <li>• Visit frequency analysis</li>
                <li>• Service preferences by location</li>
                <li>• Revenue per customer by salon</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuditReports;