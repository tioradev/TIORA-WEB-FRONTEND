import React from 'react';
import { Calendar, DollarSign, Clock, Users } from 'lucide-react';
import StatsCard from '../../shared/StatsCard';
import { TotalStatistics } from '../hooks/useStatistics';

interface StatsGridProps {
  totalStatistics: TotalStatistics;
}

const StatsGrid: React.FC<StatsGridProps> = ({ totalStatistics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Today's Appointments"
        value={totalStatistics.totalTodayAppointments}
        icon={Calendar}
        color="blue"
        loading={totalStatistics.loading}
      />
      <StatsCard
        title="Pending Payments"
        value={totalStatistics.totalPendingPayments}
        icon={Clock}
        color="amber"
        loading={totalStatistics.loading}
      />
      <StatsCard
        title="Daily Income"
        value={`Rs. ${totalStatistics.totalDailyIncome.toFixed(2)}`}
        icon={DollarSign}
        color="emerald"
        subtitle="From completed payments"
        loading={totalStatistics.loading}
      />
      <StatsCard
        title="Total Customers"
        value={totalStatistics.totalCustomers}
        icon={Users}
        color="purple"
        loading={totalStatistics.loading}
      />
    </div>
  );
};

export default StatsGrid;
