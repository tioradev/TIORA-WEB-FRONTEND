import { apiService } from '../../../services/api';
import { Appointment } from '../../../types';
import { mockBarbers } from '../../../data/mockData';

export interface AppointmentActionHandlers {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
  triggerReceptionNotification: (type: string, name: string, timeOrAmount: string | number) => void;
  refreshAllAppointments: () => Promise<void>;
}

// Service for handling appointment actions
export class AppointmentActionService {
  
  static async handleBookAppointment(
    bookingData: any,
    editingAppointment: Appointment | null,
    handlers: AppointmentActionHandlers,
    setEditingAppointment: (appointment: Appointment | null) => void
  ) {
    if (editingAppointment) {
      handlers.showSuccessMessage(`Appointment for ${bookingData.customerName} has been updated successfully!`);
      // Show toast notification for editing
      handlers.showSuccess('Appointment Updated', `${bookingData.customerName}'s appointment updated successfully`);
      handlers.triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    } else {
      handlers.showSuccessMessage(`New appointment for ${bookingData.customerName} has been booked successfully!`);
      // Show toast notification for new booking
      handlers.showSuccess('Appointment Booked', `${bookingData.customerName} scheduled for ${bookingData.time}`);
      handlers.triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    }
    
    // WebSocket will automatically refresh the data when the backend broadcasts the update
    setEditingAppointment(null);
  }

  static handleEditAppointment(
    appointment: Appointment,
    setEditingAppointment: (appointment: Appointment | null) => void,
    setIsBookingModalOpen: (open: boolean) => void
  ) {
    setEditingAppointment(appointment);
    setIsBookingModalOpen(true);
  }

  static handleDeleteAppointment(
    appointmentId: string,
    appointments: Appointment[],
    todayAppointments: Appointment[],
    pendingPayments: Appointment[],
    setCancelAppointmentModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setCancelAppointmentModal({ isOpen: true, appointment });
    }
  }

  static async confirmCancelAppointment(
    appointment: Appointment,
    handlers: AppointmentActionHandlers,
    setCancelAppointmentModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    try {
      console.log('🔄 [CANCEL] Starting appointment cancellation for appointment:', appointment.id);
      
      // Call API to cancel the appointment
      await apiService.cancelAppointment(
        parseInt(appointment.id),
        {
          userRole: 'RECEPTION',
          reason: 'Cancelled by reception'
        }
      );
      
      console.log('✅ [CANCEL] Appointment cancelled successfully via API');
      handlers.showSuccessMessage(`Appointment for ${appointment.customerName} has been cancelled successfully!`);
      setCancelAppointmentModal({ isOpen: false, appointment: null });
      
      // Refresh all appointment lists after cancellation
      console.log('🔄 [CANCEL] Refreshing appointment lists...');
      await handlers.refreshAllAppointments();
      
      console.log('🎯 [CANCEL] Appointment lists refreshed successfully');
    } catch (error) {
      console.error('❌ [CANCEL] Error cancelling appointment:', error);
      handlers.showErrorMessage(`Failed to cancel appointment for ${appointment.customerName}. Please try again.`);
    }
  }

  static handleAssignBarber(
    appointmentId: string,
    barberId: string,
    appointments: Appointment[],
    todayAppointments: Appointment[],
    pendingPayments: Appointment[],
    setAppointments: (appointments: Appointment[]) => void,
    setTodayAppointments: (appointments: Appointment[]) => void,
    setPendingPayments: (appointments: Appointment[]) => void,
    handlers: AppointmentActionHandlers
  ) {
    const barber = mockBarbers.find(b => b.id === barberId);
    if (barber) {
      const allAppointmentsList = [...appointments, ...todayAppointments, ...pendingPayments];
      const appointment = allAppointmentsList.find(app => app.id === appointmentId);
      
      // Update the appointment in the appropriate state array
      setAppointments(appointments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      setTodayAppointments(todayAppointments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      setPendingPayments(pendingPayments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      
      if (appointment) {
        handlers.showSuccessMessage(`${barber.firstName} ${barber.lastName} has been assigned to ${appointment.customerName}'s appointment!`);
        handlers.triggerReceptionNotification('appointmentConfirmed', `Barber assigned to ${appointment.customerName}`, '');
      }
    }
  }

  static handleMarkPaid(
    appointmentId: string,
    appointments: Appointment[],
    todayAppointments: Appointment[],
    pendingPayments: Appointment[],
    setPaymentConfirmModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setPaymentConfirmModal({ isOpen: true, appointment });
    }
  }

  static handleCompleteSession(
    appointmentId: string,
    appointments: Appointment[],
    todayAppointments: Appointment[],
    pendingPayments: Appointment[],
    setCompleteSessionModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    const appointment = [...appointments, ...todayAppointments, ...pendingPayments]
      .find(app => app.id === appointmentId);
    if (appointment) {
      setCompleteSessionModal({ isOpen: true, appointment });
    }
  }

  static async confirmCompleteSession(
    appointment: Appointment,
    handlers: AppointmentActionHandlers,
    setCompleteSessionModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    try {
      console.log('🔄 [COMPLETE SESSION] Starting session completion for appointment:', appointment.id);
      
      // Call API to complete the session
      await apiService.completeSession(
        parseInt(appointment.id),
        'RECEPTION' // userRole
      );
      
      console.log('✅ [COMPLETE SESSION] Session completed successfully via API');
      handlers.showSuccessMessage(`Session for ${appointment.customerName} has been completed successfully!`);
      // Show toast notification for session completion
      handlers.showSuccess('Session Complete', `${appointment.customerName}'s appointment finished`);
      handlers.triggerReceptionNotification('sessionCompleted', appointment.customerName, appointment.timeSlot);
      setCompleteSessionModal({ isOpen: false, appointment: null });
      
      // Refresh all appointment lists after session completion
      console.log('🔄 [COMPLETE SESSION] Refreshing appointment lists...');
      await handlers.refreshAllAppointments();
      
      console.log('🎯 [COMPLETE SESSION] Appointment lists refreshed successfully');
    } catch (error) {
      console.error('❌ [COMPLETE SESSION] Error completing session:', error);
      handlers.showErrorMessage(`Failed to complete session for ${appointment.customerName}. Please try again.`);
      // Show toast notification for session completion error
      handlers.showError('Session Error', `Failed to complete session for ${appointment.customerName}`);
    }
  }

  static async confirmPaymentReceived(
    appointment: Appointment,
    handlers: AppointmentActionHandlers,
    setPaymentConfirmModal: (modal: { isOpen: boolean; appointment: Appointment | null }) => void
  ) {
    try {
      console.log('🔄 [PAYMENT] Starting payment confirmation for appointment:', appointment.id);
      
      // Call API to confirm payment
      await apiService.confirmAppointmentPayment(
        parseInt(appointment.id),
        'RECEPTION' // userRole
      );
      
      console.log('✅ [PAYMENT] Payment confirmed successfully via API');
      handlers.showSuccessMessage(`Payment of LKR ${appointment.finalAmount} from ${appointment.customerName} has been received successfully!`);
      // Show toast notification for payment confirmation
      handlers.showSuccess('Payment Received', `LKR ${appointment.finalAmount} received from ${appointment.customerName}`);
      handlers.triggerReceptionNotification('paymentReceived', appointment.customerName, appointment.finalAmount.toString());
      setPaymentConfirmModal({ isOpen: false, appointment: null });
      
      // Refresh all appointment lists after payment confirmation
      console.log('🔄 [PAYMENT] Refreshing appointment lists...');
      await handlers.refreshAllAppointments();
      
      console.log('🎯 [PAYMENT] Appointment lists refreshed successfully');
    } catch (error) {
      console.error('❌ [PAYMENT] Error confirming payment:', error);
      handlers.showErrorMessage(`Failed to confirm payment for ${appointment.customerName}. Please try again.`);
      // Show toast notification for payment error
      handlers.showError('Payment Error', `Failed to confirm payment for ${appointment.customerName}`);
    }
  }

  static handleProfileSave(
    updatedProfile: any,
    handlers: AppointmentActionHandlers
  ) {
    // Profile updates should be handled through the AuthContext
    // For now, we'll just log the changes and show success message
    console.log('Reception profile updated:', updatedProfile);
    handlers.showSuccessMessage('Profile has been updated successfully!');
    handlers.triggerReceptionNotification('appointmentConfirmed', 'Profile updated successfully', '');
  }
}
