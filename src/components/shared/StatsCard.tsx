import React from 'react';
import { LucideIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'red';
  change?: string;
  subtitle?: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, change, subtitle, loading = false }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <div className="flex items-center">
            {loading ? (
              <div className="flex items-center justify-center w-full">
                <LoadingSpinner size="md" className="text-gray-400" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            )}
          </div>
          {subtitle && !loading && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && !loading && (
            <p className="text-sm text-emerald-600 mt-2 font-medium">{change}</p>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center ${loading ? 'opacity-50' : ''}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;