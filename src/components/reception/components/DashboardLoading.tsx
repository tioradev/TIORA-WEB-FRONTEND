import React from 'react';
import { Loader2, X } from 'lucide-react';

interface DashboardLoadingProps {
  loading: boolean;
  error: string | null;
  successMessage: { show: boolean; message: string };
  setSuccessMessage: (state: { show: boolean; message: string }) => void;
}

const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  loading,
  error,
  successMessage,
  setSuccessMessage,
}) => {
  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600 font-medium">Loading appointments...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">Data will automatically refresh once the connection is restored.</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage.show && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 transform transition-all duration-300 ease-in-out max-w-md">
          <span className="flex-1">{successMessage.message}</span>
          <button
            onClick={() => setSuccessMessage({ show: false, message: '' })}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default DashboardLoading;
