import React from 'react';
import { DollarSign, CheckCircle, Star, X } from 'lucide-react';
import { Appointment } from '../../../types';
import BookingModal from '../../appointments/BookingModal';
import ProfileModal from '../../shared/ProfileModal';

interface ModalProps {
  // Booking Modal
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  editingAppointment: Appointment | null;
  setEditingAppointment: (appointment: Appointment | null) => void;
  handleBookAppointment: (bookingData: any) => void;
  
  // Payment Confirm Modal
  paymentConfirmModal: { isOpen: boolean; appointment: Appointment | null };
  setPaymentConfirmModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void;
  confirmPaymentReceived: () => Promise<void>;
  
  // Complete Session Modal
  completeSessionModal: { isOpen: boolean; appointment: Appointment | null };
  setCompleteSessionModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void;
  confirmCompleteSession: () => Promise<void>;
  
  // Cancel Appointment Modal
  cancelAppointmentModal: { isOpen: boolean; appointment: Appointment | null };
  setCancelAppointmentModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void;
  confirmCancelAppointment: () => Promise<void>;
  
  // Profile Modal
  isProfileModalOpen: boolean;
  closeProfileModal: () => void;
  userProfile: any;
  handleProfileSave: (profile: any) => void;
}

const ReceptionModals: React.FC<ModalProps> = ({
  isBookingModalOpen,
  setIsBookingModalOpen,
  editingAppointment,
  setEditingAppointment,
  handleBookAppointment,
  paymentConfirmModal,
  setPaymentConfirmModal,
  confirmPaymentReceived,
  completeSessionModal,
  setCompleteSessionModal,
  confirmCompleteSession,
  cancelAppointmentModal,
  setCancelAppointmentModal,
  confirmCancelAppointment,
  isProfileModalOpen,
  closeProfileModal,
  userProfile,
  handleProfileSave,
}) => {
  return (
    <>
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingAppointment(null);
        }}
        onBook={handleBookAppointment}
        editingAppointment={editingAppointment}
        userRole="reception"
      />

      {/* Payment Confirmation Modal */}
      {paymentConfirmModal.isOpen && paymentConfirmModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment Received</h2>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to mark the payment as received for{' '}
                <span className="font-semibold text-gray-900">{paymentConfirmModal.appointment.customerName}</span>?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-gray-900">Rs {paymentConfirmModal.appointment.finalAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{paymentConfirmModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-gray-900">{paymentConfirmModal.appointment.date} at {paymentConfirmModal.appointment.timeSlot}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setPaymentConfirmModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPaymentReceived}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Confirmation Modal */}
      {completeSessionModal.isOpen && completeSessionModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Session</h2>
              
              <p className="text-gray-600 mb-6">
                You are going to complete the barber session for{' '}
                <span className="font-semibold text-gray-900">{completeSessionModal.appointment.customerName}</span>
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Barber:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.barberName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-gray-900">{completeSessionModal.appointment.timeSlot}</span>
                </div>
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-200">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-600">Mark session as completed</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCompleteSessionModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button
                  onClick={confirmCompleteSession}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Confirmation Modal */}
      {cancelAppointmentModal.isOpen && cancelAppointmentModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment</h2>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel the appointment for{' '}
                <span className="font-semibold text-gray-900">{cancelAppointmentModal.appointment.customerName}</span>?
                <br />
                <span className="text-sm text-gray-500 mt-1 block">Only booked appointments can be cancelled.</span>
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{cancelAppointmentModal.appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-gray-900">{cancelAppointmentModal.appointment.date} at {cancelAppointmentModal.appointment.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900">Rs {cancelAppointmentModal.appointment.finalAmount}</span>
                </div>
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-red-200">
                  <X className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-600 font-medium">This action cannot be undone</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCancelAppointmentModal({isOpen: false, appointment: null})}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 font-medium"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          console.log('Closing profile modal');
          closeProfileModal();
        }}
        profile={userProfile}
        onSave={handleProfileSave}
        userRole="reception"
      />
    </>
  );
};

export default ReceptionModals;
