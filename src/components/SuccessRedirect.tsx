'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessRedirectProps {
  isOpen: boolean;
  title: string;
  message: string;
  redirectTo?: string;
  redirectDelay?: number;
}

const SuccessRedirect: React.FC<SuccessRedirectProps> = ({
  isOpen,
  title,
  message,
  redirectTo = '/',
  redirectDelay = 2000,
}) => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    if (!isOpen) return;

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after delay
    const timeout = setTimeout(() => {
      router.push(redirectTo);
    }, redirectDelay);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen, redirectTo, redirectDelay, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-budget-brand/95 via-budget-accent/95 to-teal-600/95 backdrop-blur-sm"></div>

      {/* Success Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-green-100 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>

        {/* Message */}
        <p className="text-gray-600 text-base mb-6 leading-relaxed">{message}</p>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-budget-brand animate-spin" />
          <p className="text-sm text-gray-500">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessRedirect;

