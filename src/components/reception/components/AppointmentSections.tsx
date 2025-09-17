import React from 'react';
import { Search, Calendar, X } from 'lucide-react';
import AppointmentCard from '../../appointments/AppointmentCard';
import { Appointment } from '../../../types';
import { PaginationState } from '../hooks/usePagination';

interface AppointmentSectionsProps {
  // Pending Payments
  pendingPayments: Appointment[];
  filteredPendingPayments: Appointment[];
  pendingPaymentsSearch: string;
  setPendingPaymentsSearch: (search: string) => void;
  pendingPaymentsPagination: PaginationState;
  handlePendingPaymentsPageChange: (page: number) => void;
  
  // Today's Appointments
  todayAppointments: Appointment[];
  filteredTodayAppointments: Appointment[];
  todayAppointmentsSearch: string;
  setTodayAppointmentsSearch: (search: string) => void;
  todayAppointmentsPagination: PaginationState;
  handleTodayAppointmentsPageChange: (page: number) => void;
  
  // All Appointments
  appointments: Appointment[];
  filteredAllAppointments: Appointment[];
  allAppointmentsSearch: string;
  setAllAppointmentsSearch: (search: string) => void;
  allAppointmentsDateFilter: string;
  setAllAppointmentsDateFilter: (filter: string) => void;
  allAppointmentsPagination: PaginationState;
  handleAllAppointmentsPageChange: (page: number) => void;
  
  // Action handlers
  onEdit: (appointment: Appointment) => void;
  onMarkPaid: (appointmentId: string) => void;
  onCompleteSession: (appointmentId: string) => void;
  onDelete: (appointmentId: string) => void;
  onAssignBarber: (appointmentId: string, barberId: string) => void;
}

const AppointmentSections: React.FC<AppointmentSectionsProps> = ({
  pendingPayments,
  filteredPendingPayments,
  pendingPaymentsSearch,
  setPendingPaymentsSearch,
  pendingPaymentsPagination,
  handlePendingPaymentsPageChange,
  todayAppointments,
  filteredTodayAppointments,
  todayAppointmentsSearch,
  setTodayAppointmentsSearch,
  todayAppointmentsPagination,
  handleTodayAppointmentsPageChange,
  // appointments, // Available for future use
  filteredAllAppointments,
  allAppointmentsSearch,
  setAllAppointmentsSearch,
  allAppointmentsDateFilter,
  setAllAppointmentsDateFilter,
  allAppointmentsPagination,
  handleAllAppointmentsPageChange,
  onEdit,
  onMarkPaid,
  onCompleteSession,
  onDelete,
  onAssignBarber,
}) => {
  return (
    <>
      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredPendingPayments.length} pending
              </div>
            </div>
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
                onEdit={onEdit}
                onMarkPaid={onMarkPaid}
                onCompleteSession={onCompleteSession}
                onDelete={onDelete}
                onAssignBarber={onAssignBarber}
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
          
          {/* Pagination for Pending Payments */}
          {pendingPaymentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <p className="text-sm text-gray-600">
                Showing {(pendingPaymentsPagination.currentPage * pendingPaymentsPagination.size) + 1} to {Math.min((pendingPaymentsPagination.currentPage + 1) * pendingPaymentsPagination.size, pendingPaymentsPagination.totalElements)} of {pendingPaymentsPagination.totalElements} payments
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePendingPaymentsPageChange(pendingPaymentsPagination.currentPage - 1)}
                  disabled={pendingPaymentsPagination.currentPage <= 0}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePendingPaymentsPageChange(pendingPaymentsPagination.currentPage + 1)}
                  disabled={pendingPaymentsPagination.currentPage >= pendingPaymentsPagination.totalPages - 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
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
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTodayAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={onEdit}
                onMarkPaid={onMarkPaid}
                onCompleteSession={onCompleteSession}
                onDelete={onDelete}
                onAssignBarber={onAssignBarber}
                showActions={true}
                userRole="reception"
              />
            ))}
          </div>
          {filteredTodayAppointments.length === 0 && todayAppointmentsSearch && (
            <div className="text-center py-8 text-gray-500">
              No appointments found for "{todayAppointmentsSearch}"
            </div>
          )}
          
          {/* Pagination for Today's Appointments */}
          {todayAppointmentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <p className="text-sm text-gray-600">
                Showing {(todayAppointmentsPagination.currentPage * todayAppointmentsPagination.size) + 1} to {Math.min((todayAppointmentsPagination.currentPage + 1) * todayAppointmentsPagination.size, todayAppointmentsPagination.totalElements)} of {todayAppointmentsPagination.totalElements} appointments
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTodayAppointmentsPageChange(todayAppointmentsPagination.currentPage - 1)}
                  disabled={todayAppointmentsPagination.currentPage <= 0}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleTodayAppointmentsPageChange(todayAppointmentsPagination.currentPage + 1)}
                  disabled={todayAppointmentsPagination.currentPage >= todayAppointmentsPagination.totalPages - 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
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
                className="px-3 py-2 text-red-600 hover:text-red-700 text-sm"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAllAppointments.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onEdit={onEdit}
              onMarkPaid={onMarkPaid}
              onCompleteSession={onCompleteSession}
              onDelete={onDelete}
              onAssignBarber={onAssignBarber}
              showActions={true}
              userRole="reception"
            />
          ))}
        </div>
        {filteredAllAppointments.length === 0 && (allAppointmentsSearch || allAppointmentsDateFilter) && (
          <div className="text-center py-8 text-gray-500">
            No appointments found for the current search criteria
          </div>
        )}
        
        {/* Pagination for All Appointments */}
        {allAppointmentsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <p className="text-sm text-gray-600">
              Showing {(allAppointmentsPagination.currentPage * allAppointmentsPagination.size) + 1} to {Math.min((allAppointmentsPagination.currentPage + 1) * allAppointmentsPagination.size, allAppointmentsPagination.totalElements)} of {allAppointmentsPagination.totalElements} appointments
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAllAppointmentsPageChange(allAppointmentsPagination.currentPage - 1)}
                disabled={allAppointmentsPagination.currentPage <= 0}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({length: Math.min(5, allAppointmentsPagination.totalPages)}, (_, index) => {
                const page = allAppointmentsPagination.currentPage <= 2 
                  ? index 
                  : allAppointmentsPagination.currentPage + index - 2;
                
                if (page >= allAppointmentsPagination.totalPages || page < 0) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handleAllAppointmentsPageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      allAppointmentsPagination.currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handleAllAppointmentsPageChange(allAppointmentsPagination.currentPage + 1)}
                disabled={allAppointmentsPagination.currentPage >= allAppointmentsPagination.totalPages - 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AppointmentSections;
