import React, { useState } from 'react';
import { AlertTriangle, X, Loader } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  requireTyping?: boolean;
  typeToConfirm?: string;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  requireTyping = false,
  typeToConfirm = 'DELETE',
  loading = false
}) => {
  const [typedText, setTypedText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireTyping && typedText !== typeToConfirm) {
      return;
    }
    onConfirm();
    setTypedText('');
  };

  const handleClose = () => {
    setTypedText('');
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-200'
        };
    }
  };

  const styles = getTypeStyles();
  const isTypingValid = !requireTyping || typedText === typeToConfirm;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-gray-100 ${styles.iconColor}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 whitespace-pre-line">{message}</p>
          </div>

          {requireTyping && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{typeToConfirm}" to confirm:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isTypingValid 
                    ? 'border-gray-300 focus:ring-blue-500' 
                    : 'border-red-300 focus:ring-red-500'
                }`}
                placeholder={`Type "${typeToConfirm}" here`}
              />
              {requireTyping && typedText && !isTypingValid && (
                <p className="text-red-600 text-sm mt-1">
                  Please type "{typeToConfirm}" exactly to confirm
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isTypingValid || loading}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-2 ${
                styles.buttonColor
              } ${
                (!isTypingValid || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Processing...' : confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
