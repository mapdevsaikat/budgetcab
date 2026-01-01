'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';

export default function EnvWarningBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if environment is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const isConfigured = supabaseUrl && 
                            supabaseUrl !== 'https://placeholder.supabase.co' &&
                            !supabaseUrl.includes('your-project');

        // Check if user dismissed in this session
        const isDismissed = sessionStorage.getItem('env-warning-dismissed') === 'true';

        setShowBanner(!isConfigured && !isDismissed);
        setDismissed(isDismissed);
    }, []);

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem('env-warning-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold">
                                ⚠️ Environment Not Configured
                            </p>
                            <p className="text-xs opacity-90 mt-0.5">
                                Supabase credentials are missing. Features may not work correctly.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Link
                            href="/diagnostics"
                            className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-colors whitespace-nowrap"
                        >
                            <Settings className="w-4 h-4" />
                            Check Setup
                        </Link>
                        
                        <button
                            onClick={handleDismiss}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

