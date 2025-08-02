import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  icon?: string;
  color?: 'purple' | 'red' | 'blue' | 'green';
  rightContent?: {
    value: string | number;
    label: string;
  };
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon = '👋',
  color = 'purple',
  rightContent
}) => {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 text-purple-100',
    red: 'from-red-500 to-red-600 text-red-100',
    blue: 'from-blue-500 to-blue-600 text-blue-100',
    green: 'from-green-500 to-green-600 text-green-100'
  };

  return (
    <div className="mb-8">
      <div className={`bg-gradient-to-r ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} rounded-2xl p-8 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {title} {icon}
            </h1>
            <p className={colorClasses[color].split(' ')[2]}>{subtitle}</p>
          </div>
          {rightContent && (
            <div className="text-right">
              <div className="text-3xl font-bold">{rightContent.value}</div>
              <div className={`${colorClasses[color].split(' ')[2]} text-sm`}>{rightContent.label}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
