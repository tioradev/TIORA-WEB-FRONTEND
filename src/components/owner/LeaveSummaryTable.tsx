import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Search, Filter, ChevronLeft, ChevronRight, 
  CheckCircle, XCircle, Clock, Eye, Download, FileText, 
  RefreshCw, AlertCircle 
} from 'lucide-react';
import { LeaveRequest, LeaveDetailApiResponse, LeaveDetailsPaginatedResponse } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLeaveWebSocket } from '../../hooks/useLeaveWebSocket';
import LoadingSpinner from '../shared/LoadingSpinner';
import LeaveUpdatesStatus from '../shared/LeaveUpdatesStatus';

interface LeaveSummaryTableProps {
  // Remove prop dependency, will fetch data internally
}

const LeaveSummaryTable: React.FC<LeaveSummaryTableProps> = () => {
  const { getSalonId, salon, employee, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based indexing

  // Create stable refresh function to avoid stale closures in WebSocket callbacks
  const refreshCurrentData = useCallback(() => {
    console.log('🔄 [REFRESH] Refreshing leave summary data via WebSocket');
    const salonId = getSalonId();
    if (salonId) {
      console.log('🔄 [REFRESH] Using current state:', { currentPage, searchTerm });
      // Call API directly to avoid dependency issues
      apiService.getEmployeeLeaveDetails(salonId, currentPage, 10, searchTerm || undefined)
        .then(response => {
          console.log('📊 [DEBUG] API Response for summary leaves (WebSocket refresh):', {
            totalElements: response.totalElements,
            content: response.content
          });
          setApiResponse(response);
        })
        .catch(err => {
          console.error('Error refreshing leave summary via WebSocket:', err);
        });
    }
  }, [getSalonId, currentPage, searchTerm]); // Use constant value instead of itemsPerPage

  // WebSocket connection for real-time leave request updates
  const { isConnected, isConnecting, retry } = useLeaveWebSocket({
    onLeaveRequestApproved: (leaveRequest) => {
      console.log('🔔 [LEAVE-SUMMARY] Leave request approved:', leaveRequest);
      // Refresh the data to show newly approved request
      refreshCurrentData();
    },
    onLeaveRequestRejected: (leaveRequest) => {
      console.log('🔔 [LEAVE-SUMMARY] Leave request rejected:', leaveRequest);
      // Refresh the data to show newly rejected request
      refreshCurrentData();
    },
    onAnyLeaveNotification: (rawMessage) => {
      console.log('🔔 [LEAVE-SUMMARY] Any leave notification:', rawMessage);
    }
  });
  const [selectedLeave, setSelectedLeave] = useState<LeaveDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<LeaveDetailsPaginatedResponse | null>(null);
  const itemsPerPage = 10;

  // Debug information
  const debugInfo = {
    salonId: getSalonId(),
    salon: salon ? { salonId: salon.salonId, name: salon.name } : null,
    employee: employee ? { salonId: employee.salonId, name: employee.firstName } : null,
    user: user ? { id: user.id, name: user.name } : null
  };
  
  console.log('🔍 [DEBUG] LeaveSummaryTable context:', debugInfo);

  // Fetch leave data from API (wrapped in useCallback for stability)
  const fetchLeaveData = useCallback(async (page: number = 0, search?: string) => {
    const salonId = getSalonId();
    console.log('🔍 [DEBUG] Fetching leave data:', { salonId, page, search });
    
    if (!salonId) {
      console.error('❌ [ERROR] Salon ID not found:', { salonId });
      setError('Salon ID not found. Please ensure you are logged in properly.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // For summary table, we want processed leaves (approved/rejected)
      // We could filter by status, but let's get all and filter client-side for now
      const response = await apiService.getEmployeeLeaveDetails(
        salonId,
        page,
        itemsPerPage,
        search
        // Note: Not filtering by status here, will filter client-side
      );
      
      // Handle both new (with page) and old (direct) API response structures
      const pageData = response.page || response;
      const content = pageData.content || response.content || [];
      
      console.log('📊 [DEBUG] API Response for summary leaves:', {
        totalElements: pageData.totalElements || response.totalElements,
        contentCount: content.length,
        totalApproved: response.totalApprovedCount || 0,
        totalRejected: response.totalRejectedCount || 0,
        statuses: content.map(item => ({
          id: item.id || 'undefined', // Leave request ID (may be undefined)
          employeeId: item.employeeId,
          status: item.status || 'NO_STATUS_FIELD'
        }))
      });
      
      setApiResponse(response);
    } catch (err: any) {
      console.error('Error fetching leave data:', err);
      setError(err.message || 'Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  }, [getSalonId, itemsPerPage]); // Dependencies for useCallback

  // Initial load
  useEffect(() => {
    const salonId = getSalonId();
    if (salonId) {
      fetchLeaveData(0, searchTerm);
    }
  }, [getSalonId()]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0);
      fetchLeaveData(0, searchTerm || undefined);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLeaveData(newPage, searchTerm || undefined);
  };

  // Convert API response to display format
  const convertApiLeaveToDisplay = (apiLeave: LeaveDetailApiResponse): LeaveRequest => {
    const salonId = getSalonId();
    
    // Convert API status to frontend format, default to approved for summary table
    let status: 'pending' | 'approved' | 'rejected' = 'approved';
    if (apiLeave.status) {
      switch (apiLeave.status) {
        case 'PENDING':
          status = 'pending';
          break;
        case 'APPROVED':
          status = 'approved';
          break;
        case 'REJECTED':
          status = 'rejected';
          break;
        default:
          status = 'approved'; // Default fallback
      }
    }
    
    return {
      id: (apiLeave.id || apiLeave.employeeId).toString(), // Use leave ID if available, fallback to employeeId
      salonId: salonId?.toString() || '',
      barberId: apiLeave.employeeId.toString(),
      barberName: apiLeave.employeeName,
      startDate: apiLeave.startDate,
      endDate: apiLeave.endDate,
      reason: apiLeave.reason,
      leaveType: 'other', // API doesn't provide this, defaulting
      status: status,
      createdAt: new Date(), // API doesn't provide this
      updatedAt: new Date()
    };
  };

  // Apply client-side status filter (since API doesn't filter by status)
  const getFilteredLeaves = (): LeaveRequest[] => {
    if (!apiResponse?.content) return [];
    
    // First filter out pending requests (we only want processed leaves in summary)
    const processedLeaves = apiResponse.content.filter(apiLeave => {
      // If status field exists, only include approved/rejected
      // If no status field, assume processed (this is the summary table)
      const isProcessed = !apiLeave.status || (apiLeave.status === 'APPROVED' || apiLeave.status === 'REJECTED');
      if (!isProcessed) {
        console.log('🚫 [SUMMARY] Filtering out pending leave from summary:', {
          id: apiLeave.id || 'undefined', // Leave request ID (may be undefined)
          employeeId: apiLeave.employeeId,
          status: apiLeave.status
        });
      }
      return isProcessed;
    });
    
    const converted = processedLeaves.map(convertApiLeaveToDisplay);
    
    console.log('📋 [SUMMARY DEBUG] Processed leaves:', {
      apiResponseCount: apiResponse.content.length,
      processedCount: processedLeaves.length,
      finalCount: converted.length,
      statusFilter
    });
    
    // Then apply the UI status filter (all/approved/rejected)
    if (statusFilter === 'all') {
      return converted;
    }
    
    return converted.filter(leave => leave.status === statusFilter);
  };

  const filteredLeaves = getFilteredLeaves();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-orange-100 text-orange-800`;
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const end = new Date(endDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return daysDiff;
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
    const csvData = filteredLeaves.map(leave => [
      leave.barberId,
      leave.barberName,
      leave.startDate,
      leave.endDate,
      calculateLeaveDays(leave.startDate, leave.endDate),
      leave.reason,
      leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
          <div className="flex-1">
            <h3 className="text-red-800 font-medium">Error Loading Leave Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            
            {/* Debug Information */}
            <div className="mt-4 p-3 bg-gray-100 rounded border text-xs">
              <h4 className="font-medium text-gray-800 mb-2">Debug Information:</h4>
              <pre className="text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <button
              onClick={() => fetchLeaveData(currentPage, searchTerm || undefined)}
              className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-purple-600" />
              Leave Summary
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Historical record of all approved and rejected leave requests
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <LeaveUpdatesStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              onRetry={retry}
              className="mr-2"
            />
            
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'rejected')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                Approved: {apiResponse?.totalApprovedCount || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">
                Rejected: {apiResponse?.totalRejectedCount || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                Total: {(apiResponse?.totalApprovedCount || 0) + (apiResponse?.totalRejectedCount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredLeaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No leave records found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Leave decisions will appear here once processed'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{leave.barberName}</div>
                          <div className="text-sm text-gray-500">ID: {leave.barberId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">{leave.leaveType}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={leave.reason}>
                            {leave.reason}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateRange(leave.startDate, leave.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateLeaveDays(leave.startDate, leave.endDate)} day{calculateLeaveDays(leave.startDate, leave.endDate) !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(leave.status)}
                          <span className={getStatusBadge(leave.status)}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            const content = apiResponse?.page?.content || apiResponse?.content || [];
                            const apiLeave = content.find(l => 
                              (l.id && l.id.toString() === leave.id) || 
                              l.employeeId.toString() === leave.id
                            );
                            setSelectedLeave(apiLeave || null);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {apiResponse && (apiResponse.page?.totalPages || apiResponse.totalPages || 0) > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage * itemsPerPage) + 1} to {Math.min((currentPage + 1) * itemsPerPage, (apiResponse.page?.totalElements || apiResponse.totalElements || 0))} of {(apiResponse.page?.totalElements || apiResponse.totalElements || 0)} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                      disabled={currentPage === 0}
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: (apiResponse.page?.totalPages || apiResponse.totalPages || 0) }, (_, i) => i).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, (apiResponse.page?.totalPages || apiResponse.totalPages || 1) - 1))}
                      disabled={currentPage === ((apiResponse.page?.totalPages || apiResponse.totalPages || 1) - 1)}
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Leave Request Details</h3>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Employee Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Employee Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedLeave.employeeName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employee ID</label>
                      <p className="text-gray-900">{selectedLeave.employeeId}</p>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Leave Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration (from API)</label>
                      <p className="text-gray-900">{selectedLeave.duration} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Calculated Duration</label>
                      <p className="text-gray-900">
                        {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} day{calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-gray-900">{new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Reason</label>
                    <p className="text-gray-900 mt-1">{selectedLeave.reason}</p>
                  </div>
                </div>

                {/* Status & Decision */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Leave Summary</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon('approved')}
                        <span className={getStatusBadge('approved')}>
                          Processed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  <p>Leave record from API response</p>
                  <p>Start Date: {new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                  <p>End Date: {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveSummaryTable;
