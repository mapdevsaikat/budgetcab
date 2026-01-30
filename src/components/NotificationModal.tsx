'use client';

import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  details?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  details,
}) => {
  if (!isOpen) return null;

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
  };

  const borderColors = {
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${bgColors[type]} ${borderColors[type]} border-b-2 rounded-t-2xl p-6`}>
          <div className="flex items-start gap-4">
            <Icon className={`w-8 h-8 ${iconColors[type]} flex-shrink-0`} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
          {details && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {details}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-budget-brand to-budget-accent text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

