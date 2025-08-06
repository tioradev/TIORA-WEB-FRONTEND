import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, DollarSign, Phone, Scissors, CheckCircle, XCircle } from 'lucide-react';
import { apiService, AppointmentDetails } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  userRole?: 'reception' | 'owner' | 'super-admin';
  onRefresh?: () => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  userRole = 'reception',
  onRefresh
}) => {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { addNotification } = useNotifications();
  const { isReceptionUser, isOwnerUser } = useAuth();

  // Helper functions for notifications
  const showSuccess = (title: string, message: string) => {
    addNotification({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addNotification({ type: 'error', title, message });
  };

  // Convert userRole to API format
  const getApiUserRole = (): 'RECEPTION' | 'OWNER' | 'ADMIN' => {
    if (isReceptionUser() || userRole === 'reception') return 'RECEPTION';
    if (isOwnerUser() || userRole === 'owner') return 'OWNER';
    return 'ADMIN'; // for super-admin
  };

  // Load appointment details with role-based actions
  const loadAppointmentDetails = async () => {
    if (!appointmentId) return;
    
    try {
      setLoading(true);
      const apiUserRole = getApiUserRole();
      
      console.log('📋 [APPOINTMENT DETAILS] Loading appointment:', appointmentId);
      console.log('👤 [APPOINTMENT DETAILS] User role:', apiUserRole);
      
      const response = await apiService.getAppointmentDetails(appointmentId, apiUserRole);
      console.log('✅ [APPOINTMENT DETAILS] Loaded:', response);
      
      setAppointment(response);
    } catch (error) {
      console.error('❌ [APPOINTMENT DETAILS] Error loading:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load appointment details';
      showError('Loading Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!appointment) return;
    
    try {
      setActionLoading(true);
      const apiUserRole = getApiUserRole();
      
      console.log('💳 [APPOINTMENT DETAILS] Confirming payment for:', appointment.id);
      console.log('👤 [APPOINTMENT DETAILS] User role:', apiUserRole);
      
      const response = await apiService.confirmAppointmentPayment(appointment.id, apiUserRole);
      console.log('✅ [APPOINTMENT DETAILS] Payment confirmed:', response);
      
      showSuccess('Payment Confirmed', response.message || 'Payment confirmed successfully');
      
      // Refresh appointment details
      await loadAppointmentDetails();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('❌ [APPOINTMENT DETAILS] Payment confirmation failed:', error);
      let errorMessage = 'Failed to confirm payment';
      
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'You do not have permission to confirm payments';
        } else if (error.message.includes('INVALID_STATUS')) {
          errorMessage = 'Payment can only be confirmed for pending payments';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError('Payment Failed', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle appointment completion
  const handleCompleteAppointment = async () => {
    if (!appointment) return;
    
    try {
      setActionLoading(true);
      const apiUserRole = getApiUserRole();
      
      console.log('✅ [APPOINTMENT DETAILS] Completing appointment:', appointment.id);
      console.log('👤 [APPOINTMENT DETAILS] User role:', apiUserRole);
      
      const response = await apiService.completeSession(appointment.id, apiUserRole);
      console.log('✅ [APPOINTMENT DETAILS] Appointment completed:', response);
      
      showSuccess('Session Completed', response.message || 'Session completed successfully');
      
      // Refresh appointment details
      await loadAppointmentDetails();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('❌ [APPOINTMENT DETAILS] Completion failed:', error);
      let errorMessage = 'Failed to complete appointment';
      
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'Only reception staff can complete sessions';
        } else if (error.message.includes('BUSINESS_RULE_VIOLATION')) {
          errorMessage = 'Can only complete appointments scheduled for today';
        } else if (error.message.includes('INVALID_STATUS')) {
          errorMessage = 'Can only complete scheduled appointments';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError('Completion Failed', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (!appointment) return;
    
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const apiUserRole = getApiUserRole();
      
      console.log('❌ [APPOINTMENT DETAILS] Cancelling appointment:', appointment.id);
      console.log('👤 [APPOINTMENT DETAILS] User role:', apiUserRole);
      
      const response = await apiService.cancelAppointment(appointment.id, {
        userRole: apiUserRole,
        reason: 'Cancelled from appointment details',
        cancelledBy: apiUserRole
      });
      console.log('✅ [APPOINTMENT DETAILS] Appointment cancelled:', response);
      
      showSuccess('Appointment Cancelled', response.message || 'Appointment cancelled successfully');
      
      // Refresh appointment details
      await loadAppointmentDetails();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('❌ [APPOINTMENT DETAILS] Cancellation failed:', error);
      let errorMessage = 'Failed to cancel appointment';
      
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'You do not have permission to cancel this appointment';
        } else if (error.message.includes('INVALID_STATUS')) {
          errorMessage = 'Cannot cancel completed or already cancelled appointments';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError('Cancellation Failed', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Load appointment details when modal opens
  useEffect(() => {
    if (isOpen && appointmentId) {
      loadAppointmentDetails();
    }
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            {appointment && (
              <p className="text-sm text-gray-600 mt-1">#{appointment.appointmentNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading appointment details...</span>
            </div>
          ) : appointment ? (
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                  Payment: {appointment.paymentStatus.toUpperCase()}
                </span>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{appointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {appointment.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Scissors className="w-5 h-5 mr-2" />
                  Service & Staff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium text-gray-900">{appointment.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Staff Member</p>
                    <p className="font-medium text-gray-900">{appointment.employeeName}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Timing */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Time</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(appointment.appointmentDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated End Time</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(appointment.estimatedEndTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Service Price</p>
                    <p className="font-medium text-gray-900">LKR {appointment.servicePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium text-gray-900">LKR {appointment.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid Amount</p>
                    <p className="font-medium text-gray-900">LKR {appointment.paidAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {appointment?.availableActions && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {appointment.availableActions.canConfirmPayment && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={actionLoading}
                      className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Processing...' : 'Confirm Payment'}</span>
                    </button>
                  )}

                  {appointment.availableActions.canComplete && (
                    <button
                      onClick={handleCompleteAppointment}
                      disabled={actionLoading}
                      className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Completing...' : 'Complete Session'}</span>
                    </button>
                  )}

                  {appointment.availableActions.canCancel && (
                    <button
                      onClick={handleCancelAppointment}
                      disabled={actionLoading}
                      className={`flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Cancelling...' : 'Cancel Appointment'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load appointment details</p>
              <button
                onClick={loadAppointmentDetails}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
