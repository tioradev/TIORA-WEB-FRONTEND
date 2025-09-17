import { useState } from 'react';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

// Hook for managing pagination state
export const usePagination = (initialSize: number = 9) => {
  // Pagination state for different appointment types
  const [allAppointmentsPagination, setAllAppointmentsPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: initialSize
  });
  
  const [todayAppointmentsPagination, setTodayAppointmentsPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: initialSize
  });
  
  const [pendingPaymentsPagination, setPendingPaymentsPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: initialSize
  });

  return {
    allAppointmentsPagination,
    setAllAppointmentsPagination,
    todayAppointmentsPagination,
    setTodayAppointmentsPagination,
    pendingPaymentsPagination,
    setPendingPaymentsPagination,
  };
};
