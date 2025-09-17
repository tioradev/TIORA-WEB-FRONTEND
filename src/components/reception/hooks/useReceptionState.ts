import { useState } from 'react';
import { Appointment } from '../../../types';

// Hook for managing reception dashboard state
export const useReceptionState = () => {
  // Notification count state
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Appointment states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });
  const [completeSessionModal, setCompleteSessionModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });
  const [cancelAppointmentModal, setCancelAppointmentModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  // Search states
  const [pendingPaymentsSearch, setPendingPaymentsSearch] = useState('');
  const [todayAppointmentsSearch, setTodayAppointmentsSearch] = useState('');
  const [allAppointmentsSearch, setAllAppointmentsSearch] = useState('');
  const [allAppointmentsDateFilter, setAllAppointmentsDateFilter] = useState('');

  // Success message state
  const [successMessage, setSuccessMessage] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  return {
    // Notification state
    notificationCount,
    setNotificationCount,
    
    // Appointment states
    appointments,
    setAppointments,
    todayAppointments,
    setTodayAppointments,
    pendingPayments,
    setPendingPayments,
    loading,
    setLoading,
    error,
    setError,
    
    // Modal states
    isBookingModalOpen,
    setIsBookingModalOpen,
    editingAppointment,
    setEditingAppointment,
    paymentConfirmModal,
    setPaymentConfirmModal,
    completeSessionModal,
    setCompleteSessionModal,
    cancelAppointmentModal,
    setCancelAppointmentModal,
    
    // Search states
    pendingPaymentsSearch,
    setPendingPaymentsSearch,
    todayAppointmentsSearch,
    setTodayAppointmentsSearch,
    allAppointmentsSearch,
    setAllAppointmentsSearch,
    allAppointmentsDateFilter,
    setAllAppointmentsDateFilter,
    
    // Success message state
    successMessage,
    setSuccessMessage,
  };
};
