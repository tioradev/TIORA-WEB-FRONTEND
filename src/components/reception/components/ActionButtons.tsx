import React from 'react';
import { Plus, Download } from 'lucide-react';

interface ActionButtonsProps {
  setIsBookingModalOpen: (open: boolean) => void;
  downloadReport: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  setIsBookingModalOpen,
  downloadReport,
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => setIsBookingModalOpen(true)}
        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200"
      >
        <Plus className="w-5 h-5" />
        <span>Book Appointment</span>
      </button>
      <button
        onClick={downloadReport}
        className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
      >
        <Download className="w-5 h-5" />
        <span>Download Report</span>
      </button>
    </div>
  );
};

export default ActionButtons;
