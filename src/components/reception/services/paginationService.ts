import { PaginationState } from '../hooks/usePagination';

export interface PaginationHandlers {
  loadAppointments: (page: number, size: number) => Promise<void>;
  loadTodayAppointments: (page: number, size: number) => Promise<void>;
  loadPendingPayments: (page: number, size: number) => Promise<void>;
}

// Service for handling pagination actions
export class PaginationService {
  
  static handleAllAppointmentsPageChange(
    newPage: number,
    pagination: PaginationState,
    handlers: PaginationHandlers
  ) {
    console.log('🔄 [PAGINATION] All Appointments page change requested:', newPage);
    console.log('📊 [PAGINATION] Current pagination state:', pagination);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < pagination.totalPages) {
      console.log('✅ [PAGINATION] Loading page:', newPage);
      handlers.loadAppointments(newPage, pagination.size);
    // } else {
    //   console.log('⚠️ [PAGINATION] Page change blocked - out of bounds');
    // }
  }

  static handleTodayAppointmentsPageChange(
    newPage: number,
    pagination: PaginationState,
    handlers: PaginationHandlers
  ) {
    console.log('🔄 [PAGINATION] Today\'s Appointments page change requested:', newPage);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < pagination.totalPages) {
      handlers.loadTodayAppointments(newPage, pagination.size);
    // }
  }

  static handlePendingPaymentsPageChange(
    newPage: number,
    pagination: PaginationState,
    handlers: PaginationHandlers
  ) {
    console.log('🔄 [PAGINATION] Pending Payments page change requested:', newPage);
    // TEMPORARILY DISABLED bounds checking for testing
    // if (newPage >= 0 && newPage < pagination.totalPages) {
      handlers.loadPendingPayments(newPage, pagination.size);
    // }
  }
}
