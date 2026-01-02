'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
    name: string;
    status: 'checking' | 'success' | 'error' | 'warning';
    message: string;
}

export default function DiagnosticsPage() {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Supabase URL', status: 'checking', message: 'Checking...' },
        { name: 'Supabase Anon Key', status: 'checking', message: 'Checking...' },
        { name: 'Supabase Connection', status: 'checking', message: 'Checking...' },
        { name: 'MapTiler API Key', status: 'checking', message: 'Checking...' },
    ]);

    const checkServices = async () => {
        const results: ServiceStatus[] = [];

        // Check Supabase URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
            results.push({
                name: 'Supabase URL',
                status: 'error',
                message: 'Missing or placeholder value. Set NEXT_PUBLIC_SUPABASE_URL in .env.local'
            });
        } else {
            results.push({
                name: 'Supabase URL',
                status: 'success',
                message: supabaseUrl
            });
        }

        // Check Supabase Anon Key
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseKey || supabaseKey === 'placeholder') {
            results.push({
                name: 'Supabase Anon Key',
                status: 'error',
                message: 'Missing or placeholder value. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
            });
        } else {
            results.push({
                name: 'Supabase Anon Key',
                status: 'success',
                message: `${supabaseKey.substring(0, 20)}...`
            });
        }

        // Test Supabase Connection
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                results.push({
                    name: 'Supabase Connection',
                    status: 'error',
                    message: `Connection failed: ${error.message}`
                });
            } else {
                results.push({
                    name: 'Supabase Connection',
                    status: 'success',
                    message: 'Connected successfully'
                });
            }
        } catch (error) {
            results.push({
                name: 'Supabase Connection',
                status: 'error',
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }

        // Check MapTiler Key
        const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
        if (!maptilerKey) {
            results.push({
                name: 'MapTiler API Key',
                status: 'warning',
                message: 'Not configured. Maps may not load. Set NEXT_PUBLIC_MAPTILER_API_KEY'
            });
        } else {
            results.push({
                name: 'MapTiler API Key',
                status: 'success',
                message: `${maptilerKey.substring(0, 15)}...`
            });
        }

        setServices(results);
    };

    useEffect(() => {
        checkServices();
    }, []);

    const getIcon = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'error':
                return <XCircle className="w-6 h-6 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-6 h-6 text-yellow-500" />;
            case 'checking':
                return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />;
        }
    };

    const getStatusColor = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'checking':
                return 'bg-blue-50 border-blue-200';
        }
    };

    const allGood = services.every(s => s.status === 'success');
    const hasErrors = services.some(s => s.status === 'error');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            MaahiCabs Diagnostics
                        </h1>
                        <p className="text-gray-600">
                            Environment configuration status
                        </p>
                    </div>
                </div>

                {/* Overall Status */}
                <div className={`rounded-2xl shadow-lg p-6 mb-6 ${
                    allGood ? 'bg-green-50 border-2 border-green-200' :
                    hasErrors ? 'bg-red-50 border-2 border-red-200' :
                    'bg-yellow-50 border-2 border-yellow-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                {allGood ? '✅ All Systems Operational' :
                                 hasErrors ? '❌ Configuration Errors Found' :
                                 '⚠️ Warnings Detected'}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {allGood ? 'Your application is properly configured' :
                                 hasErrors ? 'Please fix the errors below to use the application' :
                                 'Some features may not work correctly'}
                            </p>
                        </div>
                        <button
                            onClick={checkServices}
                            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recheck
                        </button>
                    </div>
                </div>

                {/* Service Status Cards */}
                <div className="space-y-4">
                    {services.map((service) => (
                        <div
                            key={service.name}
                            className={`bg-white rounded-xl shadow-md p-6 border-2 ${getStatusColor(service.status)}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    {getIcon(service.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 break-all">
                                        {service.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Help Section */}
                {hasErrors && (
                    <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">
                            📋 How to Fix
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                            <li>Create a file named <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> in the project root</li>
                            <li>Add the required environment variables (see SETUP.md)</li>
                            <li>Get your API keys from:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                    <li><a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Supabase Dashboard</a></li>
                                    <li><a href="https://cloud.maptiler.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">MapTiler Dashboard</a></li>
                                </ul>
                            </li>
                            <li>Restart your development server</li>
                            <li>Click "Recheck" above to verify</li>
                        </ol>
                        <div className="mt-4 p-4 bg-white rounded-lg">
                            <p className="text-xs font-mono text-gray-700">
                                📖 For complete setup instructions, see <a href="/SETUP.md" className="text-blue-600 underline">SETUP.md</a>
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex gap-4">
                    <a
                        href="/booking"
                        className="flex-1 bg-maahi-brand text-white py-3 px-6 rounded-xl font-semibold text-center hover:opacity-90 transition-opacity"
                    >
                        Go to App
                    </a>
                    <a
                        href="/onboarding"
                        className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold text-center hover:bg-gray-300 transition-colors"
                    >
                        Test Registration
                    </a>
                </div>
            </div>
        </div>
    );
}

