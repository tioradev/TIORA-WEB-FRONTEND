import React, { useState, useEffect, useRef } from 'react';
import { Clock, User, Scissors, Edit, CheckCircle, Star, Calendar, ClipboardCheck, XCircle, ChevronDown } from 'lucide-react';
import { Appointment } from '../../types';
import { mockBarbers } from '../../data/mockData';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastProvider';
import RupeeIcon from '../shared/RupeeIcon';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onMarkPaid?: (appointmentId: string) => void;
  onCompleteSession?: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
  onAssignBarber?: (appointmentId: string, barberId: string) => void;
  onRefresh?: () => void; // Add refresh callback
  showActions?: boolean;
  userRole?: 'reception' | 'owner' | 'super-admin';
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onMarkPaid,
  onCompleteSession,
  onDelete,
  onAssignBarber,
  onRefresh,
  showActions = true,
  userRole = 'reception',
}) => {
  const [showBarberDropdown, setShowBarberDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useToast();
  const { isReceptionUser, isOwnerUser } = useAuth();
  
  // Get available barbers (filter out inactive ones)
  const availableBarbers = mockBarbers.filter(barber => barber.isActive);

  // Convert userRole to API format
  const getApiUserRole = (): 'RECEPTION' | 'OWNER' | 'ADMIN' => {
    if (isReceptionUser() || userRole === 'reception') return 'RECEPTION';
    if (isOwnerUser() || userRole === 'owner') return 'OWNER';
    return 'ADMIN'; // for super-admin
  };

  // Handle API-based appointment cancellation
  const handleCancelAppointment = async () => {
    try {
      setLoading(true);
      const appointmentId = parseInt(appointment.id);
      const apiUserRole = getApiUserRole();
      
      console.log('❌ [APPOINTMENT] Cancelling appointment:', appointmentId);
      console.log('👤 [APPOINTMENT] User role:', apiUserRole);
      
      const response = await apiService.cancelAppointment(appointmentId, {
        userRole: apiUserRole,
        reason: 'Cancelled from appointment card',
        cancelledBy: apiUserRole
      });
      
      console.log('✅ [APPOINTMENT] Appointment cancelled:', response);
      
      showSuccess('Appointment Cancelled', response.message || `Appointment cancelled successfully`);
      
      // Call the parent's onDelete if provided, or refresh
      if (onDelete) {
        onDelete(appointment.id);
      } else if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('❌ [APPOINTMENT] Error cancelling appointment:', error);
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
      setLoading(false);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBarberDropdown(false);
      }
    };

    if (showBarberDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBarberDropdown]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
      case 'in-progress': return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300';
      case 'completed': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300';
      case 'payment-pending': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'paid': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'payment-pending': return 'border-red-300 shadow-red-100 bg-gradient-to-br from-red-50/50 to-white';
      case 'in-progress': return 'border-amber-300 shadow-amber-100 bg-gradient-to-br from-amber-50/50 to-white';
      case 'completed': return 'border-emerald-300 shadow-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white';
      case 'paid': return 'border-green-300 shadow-green-100 bg-gradient-to-br from-green-50/50 to-white';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'payment-pending': return 'Payment Pending';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return <Calendar className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'payment-pending': return <RupeeIcon className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${getCardBorderColor(appointment.status)} ${
      appointment.status === 'payment-pending' ? 'shadow-xl animate-slow-pulse' : ''
    }`}>
      {/* Enhanced Payment Pending Banner */}
      {appointment.status === 'payment-pending' && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 via-red-600 to-red-500 text-white px-6 py-3 flex items-center space-x-3 shadow-lg">
          <RupeeIcon className="w-5 h-5 animate-bounce" />
          <span className="text-sm font-semibold">Payment Required</span>
          <div className="flex-1"></div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Urgent</span>
        </div>
      )}

      {/* Header Section */}
      <div className={`flex items-start justify-between ${appointment.status === 'payment-pending' ? 'mt-8' : ''} mb-6`}>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{appointment.customerName}</h3>
              <p className="text-sm text-gray-600 font-medium">{appointment.customerPhone}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-md ${getStatusColor(appointment.status)}`}>
            {getStatusIcon(appointment.status)}
            <span>{getStatusText(appointment.status)}</span>
          </span>
        </div>
      </div>

      {/* Enhanced Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div ref={dropdownRef} className={`relative flex items-center space-x-3 p-3 rounded-xl transition-colors duration-200 ${
          (!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned') && onAssignBarber
            ? 'bg-orange-50/70 hover:bg-orange-100/70 cursor-pointer border border-orange-200' 
            : 'bg-gray-50/70 hover:bg-gray-100/70'
        }`}
        onClick={() => {
          if ((!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned') && onAssignBarber) {
            setShowBarberDropdown(!showBarberDropdown);
          }
        }}>
          <div className={`p-2 rounded-lg ${
            (!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned')
              ? 'bg-orange-100' 
              : 'bg-purple-100'
          }`}>
            <User className={`w-4 h-4 ${
              (!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned')
                ? 'text-orange-600' 
                : 'text-purple-600'
            }`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Barber</p>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${
                (!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned')
                  ? 'text-orange-600' 
                  : 'text-gray-900'
              }`}>
                {appointment.barberName || 'To be assigned'}
              </span>
              {(!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned') && onAssignBarber && (
                <ChevronDown className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </div>
          {showBarberDropdown && onAssignBarber && (!appointment.barberName || appointment.barberName === 'Unassigned' || appointment.barberName === 'To be assigned') && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-2">
                <p className="text-xs text-gray-500 font-medium mb-2">Select Barber:</p>
                {availableBarbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignBarber(appointment.id, barber.id);
                      setShowBarberDropdown(false);
                    }}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center justify-between"
                  >
                    <span>{barber.firstName} {barber.lastName}</span>
                    <span className="text-xs text-gray-500">{barber.specializedArea}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition-colors duration-200">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Scissors className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Service</p>
            <span className="text-sm text-gray-900 font-semibold">{appointment.serviceName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition-colors duration-200">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Schedule</p>
            <span className="text-sm text-gray-900 font-semibold">{appointment.date} at {appointment.timeSlot}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors duration-200">
          <div className="p-2 bg-green-100 rounded-lg">
            <RupeeIcon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Amount</p>
            <span className="text-sm text-gray-900 font-bold">LKR {appointment.amount}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Status Information */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 mb-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 font-medium">Current Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${
                appointment.status === 'payment-pending' ? 'bg-red-100' :
                appointment.status === 'in-progress' ? 'bg-amber-100' :
                appointment.status === 'completed' ? 'bg-emerald-100' :
                appointment.status === 'paid' ? 'bg-green-100' :
                'bg-blue-100'
              }`}>
                {getStatusIcon(appointment.status)}
              </div>
              <span className="font-semibold text-gray-900">{getStatusText(appointment.status)}</span>
            </div>
          </div>
          {appointment.status === 'paid' && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600 font-medium">Complete</span>
            </div>
          )}
        </div>
        
        {/* Status Messages */}
        {appointment.status === 'payment-pending' && (
          <div className="mt-3 flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-slow-pulse"></div>
            <span className="text-xs text-red-700 font-medium">⚠️ Waiting for payment to complete the appointment</span>
          </div>
        )}
        {appointment.status === 'in-progress' && (
          <div className="mt-3 flex items-center space-x-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-slow-pulse"></div>
            <span className="text-xs text-amber-700 font-medium">🔄 Service is currently being provided</span>
          </div>
        )}
        {appointment.status === 'completed' && (
          <div className="mt-3 flex items-center space-x-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-emerald-700 font-medium">✅ Service completed successfully</span>
          </div>
        )}
        {appointment.status === 'paid' && (
          <div className="mt-3 flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-700 font-medium">💳 Payment completed - Thank you!</span>
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      {showActions && userRole !== 'reception' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {/* Edit Appointment Button - First in order */}
          {appointment.status === 'booked' && onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-200 flex-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          
          {/* Payment Received Button - For payment pending appointments */}
          {appointment.status === 'payment-pending' && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(appointment.id)}
              className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Payment</span>
            </button>
          )}

          {/* Cancel Appointment Button - Last in order, only for booked appointments */}
          {appointment.status === 'booked' && onDelete && (
            <button
              onClick={() => onDelete(appointment.id)}
              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-red-200 flex-1"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* Enhanced Reception View */}
      {showActions && userRole === 'reception' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {/* Edit Appointment Button - First in order */}
          {(appointment.status === 'booked') && onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-200 flex-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          
          {/* Complete Session Button - Second in order */}
          {(appointment.status === 'booked' || appointment.status === 'in-progress') && 
           appointment.date === new Date().toISOString().split('T')[0] && 
           onCompleteSession && (
            <button
              onClick={() => onCompleteSession?.(appointment.id)}
              disabled={loading}
              className={`flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{loading ? 'Completing...' : 'Complete'}</span>
            </button>
          )}
          
          {/* Payment Received Button - For payment pending appointments */}
          {appointment.status === 'payment-pending' && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(appointment.id)}
              disabled={loading}
              className={`flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Payment'}</span>
            </button>
          )}
          
          {/* Session Completed Status - For completed appointments */}
          {(appointment.status === 'completed') && (
            <div className="flex-1 px-3 py-2 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Awaiting Payment</span>
              </div>
            </div>
          )}

          {/* Cancel Appointment Button - Last in order, only for booked appointments */}
          {appointment.status === 'booked' && onDelete && (
            <button
              onClick={handleCancelAppointment}
              disabled={loading}
              className={`flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-red-200 flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>{loading ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;