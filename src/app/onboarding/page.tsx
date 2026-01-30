'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Phone, ArrowRight, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import SuccessRedirect from '@/components/SuccessRedirect';
import NotificationModal from '@/components/NotificationModal';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);
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
        password: '',
    });

    useEffect(() => {
        // Animate in after mount
        setTimeout(() => setIsAnimating(false), 300);
    }, []);

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
                    password: formData.password || `Budget${formData.mobile}`,
                });
            } else {
                // SIGNUP FLOW
                authResponse = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password || `Budget${formData.mobile}`,
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
        <div 
            className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden safe-area-insets"
            style={{ minHeight: '100dvh', maxHeight: '100dvh', overflowY: 'auto' }}
        >
            {/* Animated Background Gradient - Matching Welcome Page */}
            <div className="absolute inset-0 bg-gradient-to-br from-budget-brand via-[#3B3FA8] to-budget-accent opacity-95">
                {/* Animated circles for depth */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-budget-accent/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-budget-warn/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
                <div 
                    className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-white/50 p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 relative transition-all duration-700 ${
                        isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
                    }`}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => router.push('/booking')}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all z-10 active:scale-95"
                        type="button"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Header */}
                    <div className="text-center space-y-4 sm:space-y-5">
                        {/* Logo */}
                        <button
                            onClick={() => router.push('/')}
                            className="mx-auto block cursor-pointer hover:opacity-90 transition-opacity active:scale-95"
                        >
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4">
                                <div className="absolute inset-0 bg-budget-brand/10 rounded-2xl blur-xl"></div>
                                <div className="relative bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-100">
                                    <img
                                        src="/android-chrome-192x192.png"
                                        alt="budgetcab Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </button>

                        {/* Brand Name - Matching Booking Page Format */}
                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                <span className="text-budget-brand">Budget</span>
                                <span className="text-budget-warn">Cab</span>
                                <span className="text-white">s</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-gray-600">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                <p className="text-sm sm:text-base font-medium">
                                    {isLogin ? 'Welcome Back' : 'Join Us'}
                                </p>
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm px-2">
                                {isLogin ? 'Login to continue your affordable & reliable journey' : 'Create an account to book your ride'}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">First Name</label>
                                    <input
                                        name="first_name"
                                        required={!isLogin}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base text-gray-900"
                                        placeholder="Name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Last Name</label>
                                    <input
                                        name="last_name"
                                        required={!isLogin}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base text-gray-900"
                                        placeholder="Surname"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base text-gray-900"
                                    placeholder="user.name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        name="mobile"
                                        type="tel"
                                        required={!isLogin}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base text-gray-900"
                                        placeholder="+91 98765 43210"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/20 outline-none transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base text-gray-900"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-budget-brand transition-colors rounded-lg hover:bg-gray-100"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {!isLogin && (
                                <p className="text-xs text-gray-400 mt-1">
                                    If left blank, will default to "Budget" + Mobile
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-budget-brand text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-budget-brand/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 sm:mt-6 shadow-lg shadow-budget-brand/30 min-h-[56px] sm:min-h-[64px]"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                                    <ArrowRight className="w-5 h-5 flex-shrink-0" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="pt-4 sm:pt-6 text-center border-t border-gray-200">
                        <p className="text-sm sm:text-base text-gray-600">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="font-bold text-budget-brand hover:text-budget-accent transition-colors underline underline-offset-2"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Redirect Screen */}
            <SuccessRedirect
                isOpen={showSuccess}
                title={`${isLogin ? 'Login' : 'Registration'} Successful!`}
                message={`Welcome${!isLogin && formData.first_name ? `, ${formData.first_name}` : ''}! You're all set. Redirecting you to the app...`}
                redirectTo="/booking"
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
