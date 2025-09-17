import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  wsConnected: boolean;
  handleRetryConnection: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wsConnected,
  handleRetryConnection,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          {/* Header content can be added here */}
        </div>
        <div className="flex items-center gap-4">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            {wsConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Live Updates</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Connecting...</span>
                <button
                  onClick={handleRetryConnection}
                  className="text-xs text-blue-600 hover:text-blue-700 ml-2 underline"
                  title="Reconnect to live updates"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
