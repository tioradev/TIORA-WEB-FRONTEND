import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertCircle, Clock, Users } from 'lucide-react';
import { LeaveRequest, LeaveDetailApiResponse, LeaveDetailsPaginatedResponse } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLeaveWebSocket } from '../../hooks/useLeaveWebSocket';
import LoadingSpinner from '../shared/LoadingSpinner';
import LeaveRequestCard from './LeaveRequestCard';
import LeaveUpdatesStatus from '../shared/LeaveUpdatesStatus';

interface PendingLeaveRequestsProps {
  onAction: (requestId: string, action: 'approved' | 'rejected', comment?: string) => void;
}

const PendingLeaveRequests: React.FC<PendingLeaveRequestsProps> = ({ onAction }) => {
  const { getSalonId, salon, employee, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<LeaveDetailsPaginatedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Create stable refresh function to avoid stale closures in WebSocket callbacks
  const refreshCurrentData = useCallback(() => {
    console.log('🔄 [REFRESH] Refreshing pending leaves data via WebSocket');
    const salonId = getSalonId();
    if (salonId) {
      console.log('🔄 [REFRESH] Using current state:', { currentPage, searchTerm });
      // Call API directly to avoid dependency issues
      apiService.getEmployeeLeaveDetails(salonId, currentPage, 10, searchTerm || undefined, 'PENDING')
        .then(response => {
          console.log('📊 [DEBUG] API Response for pending leaves (WebSocket refresh):', {
            totalElements: response.totalElements,
            content: response.content
          });
          setApiResponse(response);
        })
        .catch(err => {
          console.error('Error refreshing pending leaves via WebSocket:', err);
        });
    }
  }, [getSalonId, currentPage, searchTerm]); // Use constant value instead of itemsPerPage

  // WebSocket connection for real-time leave request updates
  const { isConnected, isConnecting, retry } = useLeaveWebSocket({
    onLeaveRequestSubmitted: (leaveRequest) => {
      console.log('🎯 [PENDING-LEAVES] ======= CALLBACK TRIGGERED =======');
      console.log('🔔 [PENDING-LEAVES] New leave request submitted:', leaveRequest);
      console.log('🔔 [PENDING-LEAVES] Current component state:', { currentPage, searchTerm });
      // Refresh the data to show new request
      refreshCurrentData();
      console.log('🎯 [PENDING-LEAVES] ======= REFRESH CALLED =======');
    },
    onLeaveRequestApproved: (leaveRequest) => {
      console.log('🎯 [PENDING-LEAVES] ======= CALLBACK TRIGGERED =======');
      console.log('🔔 [PENDING-LEAVES] Leave request approved:', leaveRequest);
      console.log('🔔 [PENDING-LEAVES] Current component state:', { currentPage, searchTerm });
      // Refresh the data to remove approved request from pending list
      refreshCurrentData();
      console.log('🎯 [PENDING-LEAVES] ======= REFRESH CALLED =======');
    },
    onLeaveRequestRejected: (leaveRequest) => {
      console.log('🎯 [PENDING-LEAVES] ======= CALLBACK TRIGGERED =======');
      console.log('🔔 [PENDING-LEAVES] Leave request rejected:', leaveRequest);
      console.log('🔔 [PENDING-LEAVES] Current component state:', { currentPage, searchTerm });
      // Refresh the data to remove rejected request from pending list
      refreshCurrentData();
      console.log('🎯 [PENDING-LEAVES] ======= REFRESH CALLED =======');
    },
    onAnyLeaveNotification: (rawMessage) => {
      console.log('🎯 [PENDING-LEAVES] ======= ANY NOTIFICATION CALLBACK =======');
      console.log('🔔 [PENDING-LEAVES] Any leave notification raw message:', rawMessage);
      console.log('🔔 [PENDING-LEAVES] Message type:', rawMessage?.type);
      console.log('🔔 [PENDING-LEAVES] Current component state:', { currentPage, searchTerm });
      
      // FALLBACK: If specific callbacks didn't trigger, refresh anyway
      console.log('🎯 [PENDING-LEAVES] ======= FALLBACK REFRESH =======');
      refreshCurrentData();
      console.log('🎯 [PENDING-LEAVES] ======= FALLBACK REFRESH CALLED =======');
    }
  });

  // Debug information
  const debugInfo = {
    salonId: getSalonId(),
    salon: salon ? { salonId: salon.salonId, name: salon.name } : null,
    employee: employee ? { salonId: employee.salonId, name: employee.firstName } : null,
    user: user ? { id: user.id, name: user.name } : null
  };
  
  console.log('🔍 [DEBUG] PendingLeaveRequests context:', debugInfo);

  // Fetch pending leave data from API (wrapped in useCallback for stability)
  const fetchPendingLeaves = useCallback(async (page: number = 0, search?: string) => {
    const salonId = getSalonId();
    console.log('🔍 [DEBUG] Fetching pending leaves:', { salonId, page, search });
    
    if (!salonId) {
      console.error('❌ [ERROR] Salon ID not found:', { salonId });
      setError('Salon ID not found. Please ensure you are logged in properly.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch only pending leave requests
      const response = await apiService.getEmployeeLeaveDetails(
        salonId,
        page,
        itemsPerPage,
        search,
        'PENDING' // Filter for pending status only
      );
      
      console.log('📊 [DEBUG] API Response for pending leaves:', {
        totalElements: response.totalElements,
        content: response.content,
        contentWithStatus: response.content.map(item => ({
          id: item.id || 'undefined', // Leave request ID (may be undefined)
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          status: item.status || 'NO_STATUS_FIELD'
        }))
      });
      
      setApiResponse(response);
    } catch (err: any) {
      console.error('Error fetching pending leaves:', err);
      setError(err.message || 'Failed to fetch pending leave requests');
    } finally {
      setLoading(false);
    }
  }, [getSalonId, itemsPerPage]); // Dependencies for useCallback

  // Initial load
  useEffect(() => {
    const salonId = getSalonId();
    if (salonId) {
      fetchPendingLeaves(0, searchTerm);
    }
  }, [getSalonId()]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0);
      fetchPendingLeaves(0, searchTerm || undefined);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchPendingLeaves(newPage, searchTerm || undefined);
  };

  // Convert API response to display format
  const convertApiLeaveToDisplay = (apiLeave: LeaveDetailApiResponse): LeaveRequest => {
    const salonId = getSalonId();
    
    // Convert API status to frontend format, prioritizing pending status
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
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
          console.warn(`Unknown API status: ${apiLeave.status}, defaulting to pending`);
          status = 'pending'; // Default to pending for unknown statuses
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

  // Get converted leave requests with additional client-side filtering for pending only
  const pendingLeaves = (apiResponse?.content || [])
    .filter(apiLeave => {
      // If API response includes status, only show PENDING ones
      // If no status field, assume they are pending (since we requested PENDING filter)
      const isPending = !apiLeave.status || apiLeave.status === 'PENDING';
      if (!isPending) {
        console.log('🚫 [DEBUG] Filtering out non-pending leave:', {
          id: apiLeave.id || 'undefined', // Leave request ID (may be undefined)
          employeeId: apiLeave.employeeId,
          employeeName: apiLeave.employeeName,
          status: apiLeave.status
        });
      }
      return isPending;
    })
    .map(convertApiLeaveToDisplay);
    
  console.log('📋 [DEBUG] Final pending leaves count:', {
    apiResponseCount: apiResponse?.content?.length || 0,
    filteredCount: pendingLeaves.length,
    totalElements: apiResponse?.totalElements || 0
  });

  // Handle action and refresh data
  const handleActionWithRefresh = (requestId: string, action: 'approved' | 'rejected', comment?: string) => {
    console.log('🔄 [DEBUG] Leave action taken:', { requestId, action, comment });
    
    // Call the parent onAction handler first
    onAction(requestId, action, comment);
    
    // Immediately refresh the data to remove the processed request
    // Use a short delay to allow the API call to complete
    setTimeout(() => {
      console.log('🔄 [DEBUG] Refreshing pending leaves after action');
      fetchPendingLeaves(currentPage, searchTerm || undefined);
    }, 500); // Reduced delay from 1000ms to 500ms for faster refresh
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
            <h3 className="text-red-800 font-medium">Error Loading Pending Leave Requests</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            
            {/* Debug Information */}
            <div className="mt-4 p-3 bg-gray-100 rounded border text-xs">
              <h4 className="font-medium text-gray-800 mb-2">Debug Information:</h4>
              <pre className="text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <button
              onClick={() => fetchPendingLeaves(currentPage, searchTerm || undefined)}
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
      {/* Header and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-orange-600" />
              Pending Leave Requests
            </h3>
            <p className="text-gray-600 mt-1">
              Review and respond to staff leave requests requiring approval
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <LeaveUpdatesStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              onRetry={retry}
              className="mr-2"
            />
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by employee name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>
            
            <button
              onClick={() => fetchPendingLeaves(currentPage, searchTerm || undefined)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">
              Pending: {apiResponse?.totalElements || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Current Page: {pendingLeaves.length} requests
            </span>
          </div>
        </div>
      </div>

      {/* Pending Requests Grid */}
      {pendingLeaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No pending leave requests found matching "${searchTerm}"`
              : "All leave requests have been processed or there are no current requests."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingLeaves.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              onAction={handleActionWithRefresh}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {apiResponse && apiResponse.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage * itemsPerPage) + 1} to {Math.min((currentPage + 1) * itemsPerPage, apiResponse.totalElements)} of {apiResponse.totalElements} requests
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                disabled={currentPage === 0}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: apiResponse.totalPages }, (_, i) => i).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded-md ${
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
                onClick={() => handlePageChange(Math.min(currentPage + 1, apiResponse.totalPages - 1))}
                disabled={currentPage === apiResponse.totalPages - 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingLeaveRequests;
