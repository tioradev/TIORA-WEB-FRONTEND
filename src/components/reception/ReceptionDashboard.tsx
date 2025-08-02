import React, { useState, useRef } from 'react';
import { Calendar, DollarSign, Clock, Users, Plus, Download, ChevronLeft, ChevronRight, X, CheckCircle, Star, Search } from 'lucide-react';
import { mockAppointments, mockProfiles, mockBarbers } from '../../data/mockData';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationHelpers } from '../../utils/notificationHelpers';
import StatsCard from '../shared/StatsCard';
import AppointmentCard from '../appointments/AppointmentCard';
import BookingModal from '../appointments/BookingModal';
import ProfileModal from '../shared/ProfileModal';

const ReceptionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  const [completeSessionModal, setCompleteSessionModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  const [cancelAppointmentModal, setCancelAppointmentModal] = useState<{isOpen: boolean, appointment: Appointment | null}>({isOpen: false, appointment: null});
  const [userProfile, setUserProfile] = useState(mockProfiles.reception);
  const [successMessage, setSuccessMessage] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [pendingPaymentsSearch, setPendingPaymentsSearch] = useState('');
  const [todayAppointmentsSearch, setTodayAppointmentsSearch] = useState('');
  const [allAppointmentsSearch, setAllAppointmentsSearch] = useState('');
  const [allAppointmentsDateFilter, setAllAppointmentsDateFilter] = useState('');
  const { triggerReceptionNotification } = useNotificationHelpers();
  const { isProfileModalOpen, closeProfileModal } = useAuth();
  const allAppointmentsScrollRef = useRef<HTMLDivElement>(null);
  const todayAppointmentsScrollRef = useRef<HTMLDivElement>(null);

  const pendingPayments = appointments.filter(app => app.status === 'payment-pending');
  const todayAppointments = appointments.filter(app => app.date === new Date().toISOString().split('T')[0]);
  
  // Search function for appointments
  const searchAppointments = (appointments: Appointment[], searchTerm: string) => {
    if (!searchTerm.trim()) return appointments;
    const searchLower = searchTerm.toLowerCase();
    return appointments.filter(app => 
      app.customerName.toLowerCase().includes(searchLower) ||
      app.customerPhone.toLowerCase().includes(searchLower)
    );
  };

  // Filtered appointments based on search
  const filteredPendingPayments = searchAppointments(pendingPayments, pendingPaymentsSearch);
  const filteredTodayAppointments = searchAppointments(todayAppointments, todayAppointmentsSearch);
  
  // All appointments with search and date filtering
  let filteredAllAppointments = searchAppointments(appointments, allAppointmentsSearch);
  if (allAppointmentsDateFilter) {
    filteredAllAppointments = filteredAllAppointments.filter(app => app.date === allAppointmentsDateFilter);
  }
  
  // Calculate daily income from appointments with completed payments only
  const dailyIncomeFromPayments = appointments
    .filter(app => app.paymentStatus === 'completed' && app.date === new Date().toISOString().split('T')[0])
    .reduce((sum, app) => sum + app.finalAmount, 0);

  // Function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage({show: true, message});
    setTimeout(() => {
      setSuccessMessage({show: false, message: ''});
    }, 3000); // Hide after 3 seconds
  };

  const handleBookAppointment = (bookingData: any) => {
    if (editingAppointment) {
      setAppointments(appointments.map(app => 
        app.id === editingAppointment.id ? { ...app, ...bookingData } : app
      ));
      setEditingAppointment(null);
      showSuccessMessage(`Appointment for ${bookingData.customerName} has been updated successfully!`);
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    } else {
      setAppointments([...appointments, bookingData]);
      showSuccessMessage(`New appointment for ${bookingData.customerName} has been booked successfully!`);
      triggerReceptionNotification('appointmentConfirmed', bookingData.customerName, bookingData.time);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsBookingModalOpen(true);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setCancelAppointmentModal({isOpen: true, appointment});
    }
  };

  const confirmCancelAppointment = () => {
    if (cancelAppointmentModal.appointment) {
      const appointmentId = cancelAppointmentModal.appointment.id;
      setAppointments(appointments.filter(app => app.id !== appointmentId));
      showSuccessMessage(`Appointment for ${cancelAppointmentModal.appointment.customerName} has been cancelled successfully!`);
      setCancelAppointmentModal({isOpen: false, appointment: null});
    }
  };

  const handleAssignBarber = (appointmentId: string, barberId: string) => {
    const barber = mockBarbers.find(b => b.id === barberId);
    if (barber) {
      setAppointments(appointments.map(app => 
        app.id === appointmentId 
          ? { ...app, barberName: `${barber.firstName} ${barber.lastName}`, barberId: barber.id } 
          : app
      ));
      const appointment = appointments.find(app => app.id === appointmentId);
      if (appointment) {
        showSuccessMessage(`${barber.firstName} ${barber.lastName} has been assigned to ${appointment.customerName}'s appointment!`);
        triggerReceptionNotification('appointmentConfirmed', `Barber assigned to ${appointment.customerName}`, '');
      }
    }
  };

  const handleMarkPaid = (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setPaymentConfirmModal({isOpen: true, appointment});
    }
  };

  const handleCompleteSession = (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setCompleteSessionModal({isOpen: true, appointment});
    }
  };

  const confirmCompleteSession = () => {
    if (completeSessionModal.appointment) {
      const appointmentId = completeSessionModal.appointment.id;
      setAppointments(appointments.map(app => 
        app.id === appointmentId 
          ? { ...app, status: 'payment-pending', paymentStatus: 'pending' } 
          : app
      ));
      
      showSuccessMessage(`Session for ${completeSessionModal.appointment.customerName} has been completed successfully!`);
      triggerReceptionNotification('sessionCompleted', completeSessionModal.appointment.customerName, completeSessionModal.appointment.timeSlot);
      setCompleteSessionModal({isOpen: false, appointment: null});
    }
  };

  const confirmPaymentReceived = () => {
    if (paymentConfirmModal.appointment) {
      const appointmentId = paymentConfirmModal.appointment.id;
      setAppointments(appointments.map(app => 
        app.id === appointmentId 
          ? { ...app, status: 'paid', paymentStatus: 'completed', paymentMethod: 'cash' } 
          : app
      ));
      
      showSuccessMessage(`Payment of LKR ${paymentConfirmModal.appointment.finalAmount} from ${paymentConfirmModal.appointment.customerName} has been received successfully!`);
      triggerReceptionNotification('paymentReceived', paymentConfirmModal.appointment.finalAmount, paymentConfirmModal.appointment.customerName);
      setPaymentConfirmModal({isOpen: false, appointment: null});
    }
  };

  const downloadReport = () => {
    // Create PDF report content
    const reportContent = `
DAILY RECEPTION REPORT
Date: ${new Date().toLocaleDateString()}

TODAY'S APPOINTMENTS: ${todayAppointments.length}

PAYMENT STATUS:
- Completed Payments: ${appointments.filter(app => app.paymentStatus === 'completed' && app.date === new Date().toISOString().split('T')[0]).length}
- Pending Payments: ${pendingPayments.length}
- Total Income from Completed Payments: Rs. ${dailyIncomeFromPayments.toFixed(2)}

APPOINTMENT DETAILS:
${todayAppointments.map(app => 
  `- ${app.customerName} | ${app.serviceName} | ${app.timeSlot} | ${app.status} | Rs. ${app.finalAmount}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `.trim();
    
    // Create a simple text-based PDF content
    const blob = new Blob([reportContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reception-report-${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Scroll functions for all appointments carousel
  const scrollAllAppointments = (direction: 'left' | 'right') => {
    if (allAppointmentsScrollRef.current) {
      const scrollAmount = 408; // Width of one card (384px/w-96) plus gap (24px)
      const currentScroll = allAppointmentsScrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      allAppointmentsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleProfileSave = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
    showSuccessMessage('Profile has been updated successfully!');
    triggerReceptionNotification('appointmentConfirmed', 'Profile updated successfully', '');
  };

  // Scroll functions for today's appointments carousel
  const scrollTodayAppointments = (direction: 'left' | 'right') => {
    if (todayAppointmentsScrollRef.current) {
      const scrollAmount = 408; // Width of one card (384px/w-96) plus gap (24px)
      const currentScroll = todayAppointmentsScrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      todayAppointmentsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage.show && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 transform transition-all duration-300 ease-in-out max-w-md">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{successMessage.message}</span>
            <button
              onClick={() => setSuccessMessage({show: false, message: ''})}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Reception! 👋
              </h1>
              <p className="text-gray-600">Manage appointments and customer services efficiently</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Appointments"
          value={filteredTodayAppointments.length}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Pending Payments"
          value={filteredPendingPayments.length}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Daily Income"
          value={`Rs. ${dailyIncomeFromPayments.toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
          subtitle="From completed payments"
        />
        <StatsCard
          title="Total Customers"
          value={filteredAllAppointments.length}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Book Appointment</span>
        </button>
        <button
          onClick={downloadReport}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <Download className="w-5 h-5" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={pendingPaymentsSearch}
                onChange={(e) => setPendingPaymentsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPendingPayments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
               appointment={appointment}
                onMarkPaid={handleMarkPaid}
                onDelete={handleDeleteAppointment}
                onAssignBarber={handleAssignBarber}
                showActions={true}
                userRole="reception"
              />
            ))}
          </div>
          {filteredPendingPayments.length === 0 && pendingPaymentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No pending payments found for "{pendingPaymentsSearch}"
            </div>
          )}
        </div>
      )}

      {/* Today's Appointments Section */}
      {todayAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredTodayAppointments.length} appointments
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={todayAppointmentsSearch}
                  onChange={(e) => setTodayAppointmentsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>
              {filteredTodayAppointments.length > 3 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => scrollTodayAppointments('left')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollTodayAppointments('right')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div
              ref={todayAppointmentsScrollRef}
              className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
              style={{
                scrollbarWidth: 'thin',
                msOverflowStyle: 'auto',
              }}
            >
              {filteredTodayAppointments.map(appointment => (
                <div key={appointment.id} className="flex-none w-96">
                  <AppointmentCard
                    appointment={appointment}
                    onEdit={handleEditAppointment}
                    onMarkPaid={handleMarkPaid}
                    onCompleteSession={handleCompleteSession}
                    onDelete={handleDeleteAppointment}
                    onAssignBarber={handleAssignBarber}
                    showActions={true}
                    userRole="reception"
                  />
                </div>
              ))}
            </div>
          </div>
          {filteredTodayAppointments.length === 0 && todayAppointmentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No appointments found for "{todayAppointmentsSearch}"
            </div>
          )}
        </div>
      )}

      {/* All Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={allAppointmentsSearch}
                onChange={(e) => setAllAppointmentsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={allAppointmentsDateFilter}
                onChange={(e) => setAllAppointmentsDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44"
              />
            </div>
            {allAppointmentsDateFilter && (
              <button
                onClick={() => setAllAppointmentsDateFilter('')}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm"
              >
                Clear Date
              </button>
            )}
            {filteredAllAppointments.length > 3 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => scrollAllAppointments('left')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollAllAppointments('right')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div
            ref={allAppointmentsScrollRef}
            className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
            style={{
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto',
            }}
          >
            {filteredAllAppointments.map(appointment => (
              <div key={appointment.id} className="flex-none w-96">
                <AppointmentCard
                  appointment={appointment}
                  onEdit={handleEditAppointment}
                  onMarkPaid={handleMarkPaid}
                  onCompleteSession={handleCompleteSession}
                  onDelete={handleDeleteAppointment}
                  onAssignBarber={handleAssignBarber}
                  showActions={true}
                  userRole="reception"
                />
              </div>
            ))}
          </div>
          
          {/* Fade effect on edges */}
          {filteredAllAppointments.length > 3 && (
            <>
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
            </>
          )}
        </div>
        {filteredAllAppointments.length === 0 && (allAppointmentsSearch || allAppointmentsDateFilter) && (
          <div className="text-center py-8 text-gray-500">
            No appointments found for the current search criteria
          </div>
        )}
        </div>
      </div>

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
                  <span className="font-bold text-gray-900">LKR {paymentConfirmModal.appointment.finalAmount}</span>
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
                  <span className="text-gray-900">LKR {cancelAppointmentModal.appointment.finalAmount}</span>
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

      {/* Test Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white p-8 rounded-lg">
            <h2>Test Modal</h2>
            <p>If you can see this, the modal system is working</p>
            <button 
              onClick={closeProfileModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
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
      </div>
    </div>
  );
};

export default ReceptionDashboard;