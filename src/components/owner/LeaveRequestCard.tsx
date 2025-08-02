import React, { useState } from 'react';
import { Calendar, MessageSquare, Check, X } from 'lucide-react';
import { LeaveRequest } from '../../types';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onAction: (requestId: string, action: 'approved' | 'rejected', comment?: string) => void;
}

const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ request, onAction }) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const handleApprove = () => {
    onAction(request.id, 'approved');
    setShowApprovalModal(false);
  };

  const handleReject = () => {
    if (rejectComment.trim()) {
      onAction(request.id, 'rejected', rejectComment);
      setShowRejectModal(false);
      setRejectComment('');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">{request.barberName}</h4>
            <p className="text-sm text-gray-600 mt-1">Leave Request</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            Pending
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {request.startDate} to {request.endDate}
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-sm text-gray-600">{request.reason}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowApprovalModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors duration-200 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors duration-200 text-sm"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Approve Leave Request</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to approve <span className="font-semibold text-gray-900">{request.barberName}'s</span> leave request 
                from <span className="font-medium">{request.startDate}</span> to <span className="font-medium">{request.endDate}</span>?
                <br /><br />
                <span className="text-sm">This will notify the staff member of the approval and update their schedule accordingly.</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors duration-200 font-medium"
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Leave Request</h3>
                <p className="text-gray-600">
                  You are about to reject <span className="font-semibold text-gray-900">{request.barberName}'s</span> leave request 
                  from <span className="font-medium">{request.startDate}</span> to <span className="font-medium">{request.endDate}</span>.
                </p>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Please provide a clear reason for rejecting this leave request..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This reason will be sent to the staff member.</p>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectComment('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectComment.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 font-medium"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequestCard;