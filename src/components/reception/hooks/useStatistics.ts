import { useState } from 'react';

export interface TotalStatistics {
  totalCustomers: number;
  totalTodayAppointments: number;
  totalPendingPayments: number;
  totalDailyIncome: number;
  loading: boolean;
}

// Hook for managing statistics state
export const useStatistics = () => {
  const [totalStatistics, setTotalStatistics] = useState<TotalStatistics>({
    totalCustomers: 0,
    totalTodayAppointments: 0,
    totalPendingPayments: 0,
    totalDailyIncome: 0,
    loading: true
  });

  return {
    totalStatistics,
    setTotalStatistics,
  };
};
