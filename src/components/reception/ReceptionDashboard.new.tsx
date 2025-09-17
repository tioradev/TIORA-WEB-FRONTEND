import React from 'react';
import { useReceptionDashboard } from './hooks/useReceptionDashboard';
import { AppointmentActionService } from './services/appointmentActionService';
import { PaginationService } from './services/paginationService';
import DashboardLoading from './components/DashboardLoading';
import DashboardHeader from './components/DashboardHeader';
import StatsGrid from './components/StatsGrid';
import ActionButtons from './components/ActionButtons';
import ReceptionModals from './components/ReceptionModals';
import AppointmentSections from './components/AppointmentSections';

const ReceptionDashboard: React.FC = () => {
  const dashboard = useReceptionDashboard();

  // Pagination handlers
  const handleAllAppointmentsPageChange = (newPage: number) => {
    PaginationService.handleAllAppointmentsPageChange(
      newPage,
      dashboard.allAppointmentsPagination,
      {
        loadAppointments: dashboard.loadAppointments,
        loadTodayAppointments: dashboard.loadTodayAppointments,
        loadPendingPayments: dashboard.loadPendingPayments,
      }
    );
  };

  const handleTodayAppointmentsPageChange = (newPage: number) => {
    PaginationService.handleTodayAppointmentsPageChange(
      newPage,
      dashboard.todayAppointmentsPagination,
      {
        loadAppointments: dashboard.loadAppointments,
        loadTodayAppointments: dashboard.loadTodayAppointments,
        loadPendingPayments: dashboard.loadPendingPayments,
      }
    );
  };

  const handlePendingPaymentsPageChange = (newPage: number) => {
    PaginationService.handlePendingPaymentsPageChange(
      newPage,
      dashboard.pendingPaymentsPagination,
      {
        loadAppointments: dashboard.loadAppointments,
        loadTodayAppointments: dashboard.loadTodayAppointments,
        loadPendingPayments: dashboard.loadPendingPayments,
      }
    );
  };

  // Action handlers
  const actionHandlers = {
    showSuccess: dashboard.showSuccess,
    showError: dashboard.showError,
    showSuccessMessage: dashboard.showSuccessMessage,
    showErrorMessage: dashboard.showErrorMessage,
    triggerReceptionNotification: (type: string, name: string, timeOrAmount: string | number) =>
      dashboard.triggerReceptionNotification(type as any, name, timeOrAmount),
    refreshAllAppointments: dashboard.refreshAllAppointments,
  };

  const handleBookAppointment = (bookingData: any) => {
    AppointmentActionService.handleBookAppointment(
      bookingData,
      dashboard.editingAppointment,
      actionHandlers,
      dashboard.setEditingAppointment
    );
  };

  const handleEditAppointment = (appointment: any) => {
    AppointmentActionService.handleEditAppointment(
      appointment,
      dashboard.setEditingAppointment,
      dashboard.setIsBookingModalOpen
    );
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    AppointmentActionService.handleDeleteAppointment(
      appointmentId,
      dashboard.appointments,
      dashboard.todayAppointments,
      dashboard.pendingPayments,
      dashboard.setCancelAppointmentModal
    );
  };

  const confirmCancelAppointment = async () => {
    if (dashboard.cancelAppointmentModal.appointment) {
      await AppointmentActionService.confirmCancelAppointment(
        dashboard.cancelAppointmentModal.appointment,
        actionHandlers,
        dashboard.setCancelAppointmentModal
      );
    }
  };

  const handleAssignBarber = (appointmentId: string, barberId: string) => {
    AppointmentActionService.handleAssignBarber(
      appointmentId,
      barberId,
      dashboard.appointments,
      dashboard.todayAppointments,
      dashboard.pendingPayments,
      dashboard.setAppointments,
      dashboard.setTodayAppointments,
      dashboard.setPendingPayments,
      actionHandlers
    );
  };

  const handleMarkPaid = (appointmentId: string) => {
    AppointmentActionService.handleMarkPaid(
      appointmentId,
      dashboard.appointments,
      dashboard.todayAppointments,
      dashboard.pendingPayments,
      dashboard.setPaymentConfirmModal
    );
  };

  const handleCompleteSession = (appointmentId: string) => {
    AppointmentActionService.handleCompleteSession(
      appointmentId,
      dashboard.appointments,
      dashboard.todayAppointments,
      dashboard.pendingPayments,
      dashboard.setCompleteSessionModal
    );
  };

  const confirmCompleteSession = async () => {
    if (dashboard.completeSessionModal.appointment) {
      await AppointmentActionService.confirmCompleteSession(
        dashboard.completeSessionModal.appointment,
        actionHandlers,
        dashboard.setCompleteSessionModal
      );
    }
  };

  const confirmPaymentReceived = async () => {
    if (dashboard.paymentConfirmModal.appointment) {
      await AppointmentActionService.confirmPaymentReceived(
        dashboard.paymentConfirmModal.appointment,
        actionHandlers,
        dashboard.setPaymentConfirmModal
      );
    }
  };

  const handleProfileSave = (updatedProfile: any) => {
    AppointmentActionService.handleProfileSave(updatedProfile, actionHandlers);
  };

  // Filtered appointments based on search
  const filteredPendingPayments = dashboard.searchAppointments(dashboard.pendingPayments, dashboard.pendingPaymentsSearch);
  const filteredTodayAppointments = dashboard.searchAppointments(dashboard.todayAppointments, dashboard.todayAppointmentsSearch);
  
  // All appointments with search and date filtering
  let filteredAllAppointments = dashboard.searchAppointments(dashboard.appointments, dashboard.allAppointmentsSearch);
  if (dashboard.allAppointmentsDateFilter) {
    filteredAllAppointments = filteredAllAppointments.filter(app => app.date === dashboard.allAppointmentsDateFilter);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardLoading
          loading={dashboard.loading}
          error={dashboard.error}
          successMessage={dashboard.successMessage}
          setSuccessMessage={dashboard.setSuccessMessage}
        />

        {/* Main Content - Only show when not loading */}
        {!dashboard.loading && (
          <>
            <DashboardHeader
              wsConnected={dashboard.wsConnected}
              handleRetryConnection={dashboard.handleRetryConnection}
            />

            <div className="space-y-6">
              {/* Stats Grid */}
              <StatsGrid totalStatistics={dashboard.totalStatistics} />

              {/* Action Buttons */}
              <ActionButtons
                setIsBookingModalOpen={dashboard.setIsBookingModalOpen}
                downloadReport={dashboard.downloadReport}
              />

              {/* Appointment Sections */}
              <AppointmentSections
                // Pending Payments
                pendingPayments={dashboard.pendingPayments}
                filteredPendingPayments={filteredPendingPayments}
                pendingPaymentsSearch={dashboard.pendingPaymentsSearch}
                setPendingPaymentsSearch={dashboard.setPendingPaymentsSearch}
                pendingPaymentsPagination={dashboard.pendingPaymentsPagination}
                handlePendingPaymentsPageChange={handlePendingPaymentsPageChange}
                
                // Today's Appointments
                todayAppointments={dashboard.todayAppointments}
                filteredTodayAppointments={filteredTodayAppointments}
                todayAppointmentsSearch={dashboard.todayAppointmentsSearch}
                setTodayAppointmentsSearch={dashboard.setTodayAppointmentsSearch}
                todayAppointmentsPagination={dashboard.todayAppointmentsPagination}
                handleTodayAppointmentsPageChange={handleTodayAppointmentsPageChange}
                
                // All Appointments
                appointments={dashboard.appointments}
                filteredAllAppointments={filteredAllAppointments}
                allAppointmentsSearch={dashboard.allAppointmentsSearch}
                setAllAppointmentsSearch={dashboard.setAllAppointmentsSearch}
                allAppointmentsDateFilter={dashboard.allAppointmentsDateFilter}
                setAllAppointmentsDateFilter={dashboard.setAllAppointmentsDateFilter}
                allAppointmentsPagination={dashboard.allAppointmentsPagination}
                handleAllAppointmentsPageChange={handleAllAppointmentsPageChange}
                
                // Action handlers
                onEdit={handleEditAppointment}
                onMarkPaid={handleMarkPaid}
                onCompleteSession={handleCompleteSession}
                onDelete={handleDeleteAppointment}
                onAssignBarber={handleAssignBarber}
              />
            </div>
          </>
        )}

        {/* Modals */}
        <ReceptionModals
          isBookingModalOpen={dashboard.isBookingModalOpen}
          setIsBookingModalOpen={dashboard.setIsBookingModalOpen}
          editingAppointment={dashboard.editingAppointment}
          setEditingAppointment={dashboard.setEditingAppointment}
          handleBookAppointment={handleBookAppointment}
          paymentConfirmModal={dashboard.paymentConfirmModal}
          setPaymentConfirmModal={dashboard.setPaymentConfirmModal}
          confirmPaymentReceived={confirmPaymentReceived}
          completeSessionModal={dashboard.completeSessionModal}
          setCompleteSessionModal={dashboard.setCompleteSessionModal}
          confirmCompleteSession={confirmCompleteSession}
          cancelAppointmentModal={dashboard.cancelAppointmentModal}
          setCancelAppointmentModal={dashboard.setCancelAppointmentModal}
          confirmCancelAppointment={confirmCancelAppointment}
          isProfileModalOpen={dashboard.isProfileModalOpen}
          closeProfileModal={dashboard.closeProfileModal}
          userProfile={dashboard.userProfile}
          handleProfileSave={handleProfileSave}
        />
      </div>
    </div>
  );
};

export default ReceptionDashboard;
