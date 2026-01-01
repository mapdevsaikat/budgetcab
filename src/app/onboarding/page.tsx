'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Phone, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import SuccessRedirect from '@/components/SuccessRedirect';
import NotificationModal from '@/components/NotificationModal';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
        details?: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
    });
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        password: '', // Added for login
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showError = (title: string, message: string, details?: string) => {
        setNotification({
            isOpen: true,
            type: 'error',
            title,
            message,
            details,
        });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check if Supabase is configured
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
                showError(
                    'Configuration Error',
                    'Supabase is not configured.',
                    'Please set up your environment variables:\n\nRequired:\n- NEXT_PUBLIC_SUPABASE_URL\n- NEXT_PUBLIC_SUPABASE_ANON_KEY'
                );
                setLoading(false);
                return;
            }

            let authResponse;

            if (isLogin) {
                // LOGIN FLOW
                authResponse = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password || `Maahi${formData.mobile}`, // Fallback or strict
                });
            } else {
                // SIGNUP FLOW
                // 1. Sign Up the user. The database Trigger will create the profile.
                authResponse = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password || `Maahi${formData.mobile}`,
                    options: {
                        data: {
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            mobile: formData.mobile,
                        }
                    }
                });
            }

            const { data: authData, error: authError } = authResponse;

            if (authError) {
                showError('Authentication Error', authError.message);
                setLoading(false);
                return;
            }

            // Show success screen and redirect
            if (authData.user) {
                setLoading(false);
                setShowSuccess(true);
            }

        } catch (error) {
            console.error('Auth error:', error);
            setLoading(false);
            if (error instanceof Error) {
                showError(
                    'Unexpected Error',
                    error.message,
                    'Please check:\n1. Your internet connection\n2. Supabase credentials are configured\n3. Supabase project is active'
                );
            } else {
                showError('Unexpected Error', 'An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pt-32 sm:pt-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6 relative">

                {/* Close Button */}
                <button
                    onClick={() => router.push('/')}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                    type="button"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                        <img
                            src="/android-chrome-192x192.png"
                            alt="MaahiCabs Logo"
                            className="w-full h-full object-contain rounded-xl shadow-sm"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isLogin ? 'Welcome Back' : 'Join MaahiCabs'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isLogin ? 'Login to continue your journey' : 'Create an account to verify your profile'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">First Name</label>
                                <input
                                    name="first_name"
                                    required={!isLogin}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-maahi-brand focus:ring-2 focus:ring-maahi-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                                    placeholder="Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Last Name</label>
                                <input
                                    name="last_name"
                                    required={!isLogin}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-maahi-brand focus:ring-2 focus:ring-maahi-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                                    placeholder="Surname"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-maahi-brand focus:ring-2 focus:ring-maahi-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                                placeholder="user.name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    name="mobile"
                                    type="tel"
                                    required={!isLogin}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-maahi-brand focus:ring-2 focus:ring-maahi-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                                    placeholder="+91 98765 43210"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-maahi-brand focus:ring-2 focus:ring-maahi-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {/* Helper for prototype */}
                        {!isLogin && <p className="text-[10px] text-gray-400">If left blank, will default to "Maahi" + Mobile</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-maahi-brand text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-maahi-brand/30"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>

                {/* Toggle */}
                <div className="pt-2 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-bold text-maahi-brand hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>

            </div>

            {/* Success Redirect Screen */}
            <SuccessRedirect
                isOpen={showSuccess}
                title={`${isLogin ? 'Login' : 'Registration'} Successful!`}
                message={`Welcome${!isLogin && formData.first_name ? `, ${formData.first_name}` : ''}! You're all set. Redirecting you to the app...`}
                redirectTo="/"
                redirectDelay={2000}
            />

            {/* Error Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={closeNotification}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                details={notification.details}
            />
        </div>
    );
}
