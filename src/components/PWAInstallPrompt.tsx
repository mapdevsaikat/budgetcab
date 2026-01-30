'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running as standalone (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // Check if running in standalone mode on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a short delay for better UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // Show after 2 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      // Show manual installation instructions
      alert(
        'To install this app:\n\n' +
        'Android: Tap the menu (⋮) and select "Add to Home screen" or "Install app"\n\n' +
        'iOS: Tap the Share button and select "Add to Home Screen"'
      );
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    // Store dismissal timestamp
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-budget-brand/20 p-4 sm:p-5 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-budget-brand to-budget-accent rounded-xl flex items-center justify-center shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                Install Budget Cabs App
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Get quick access & better experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-budget-brand rounded-full"></div>
            <span>Faster access from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-budget-brand rounded-full"></div>
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-budget-brand rounded-full"></div>
            <span>No app store needed</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-budget-brand to-budget-accent hover:from-budget-brand/90 hover:to-budget-accent/90 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
