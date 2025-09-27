/**
 * Live Updates Status Component for Leave Requests
 * Shows WebSocket connection status with visual indicators
 */

import React from 'react';
import { Wifi, WifiOff, RotateCw } from 'lucide-react';

interface LeaveUpdatesStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  onRetry: () => void;
  className?: string;
}

const LeaveUpdatesStatus: React.FC<LeaveUpdatesStatusProps> = ({
  isConnected,
  isConnecting,
  onRetry,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (isConnecting) {
      return <RotateCw className="w-4 h-4 animate-spin" />;
    } else if (isConnected) {
      return <Wifi className="w-4 h-4" />;
    } else {
      return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    if (isConnecting) {
      return 'text-blue-600';
    } else if (isConnected) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const getStatusText = () => {
    if (isConnecting) {
      return 'Connecting...';
    } else if (isConnected) {
      return 'Live Updates';
    } else {
      return 'Disconnected';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium hidden sm:inline">
          {getStatusText()}
        </span>
      </div>
      
      {!isConnected && !isConnecting && (
        <button
          onClick={onRetry}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
          title="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default LeaveUpdatesStatus;