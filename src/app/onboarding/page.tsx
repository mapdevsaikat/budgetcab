'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Phone, ArrowRight, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import SuccessRedirect from '@/components/SuccessRedirect';
import NotificationModal from '@/components/NotificationModal';
import {
  validateName,
  validateEmail,
  validateMobile,
  validatePassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  type FormErrors,
} from '@/lib/validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns Tailwind classes for an input, swapping to red-toned styles on error. */
function inputCls(hasError: boolean, extra = ''): string {
  const base =
    'w-full rounded-xl outline-none transition-all placeholder:text-gray-300 text-sm text-gray-900';
  const ok =
    'bg-gray-50 border border-gray-200 focus:border-budget-brand focus:ring-2 focus:ring-budget-brand/15';
  const err =
    'bg-red-50 border border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100';
  return [base, hasError ? err : ok, extra].filter(Boolean).join(' ');
}

/** Inline field error message. */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] leading-tight text-red-500">
      {msg}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

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

  // Animate card in on mount
  useEffect(() => {
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // Restore any active rate-limit lockout from localStorage
  useEffect(() => {
    const { limited, secondsLeft } = checkRateLimit();
    if (limited) setRateLimitSeconds(secondsLeft);
  }, []);

  // Countdown timer for rate-limit lockout
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  // Clear field errors when the user switches between login and signup
  useEffect(() => {
    setFieldErrors({});
  }, [isLogin]);

  // -------------------------------------------------------------------------
  // Input handlers
  // -------------------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field as soon as the user starts correcting it
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /** Validate a single field when focus leaves it (on-blur). */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error: string | undefined;

    switch (name) {
      case 'first_name':
      case 'last_name': {
        if (!isLogin) {
          const r = validateName(value);
          if (!r.ok) error = r.error;
        }
        break;
      }
      case 'email': {
        const r = validateEmail(value);
        if (!r.ok) error = r.error;
        break;
      }
      case 'mobile': {
        if (!isLogin) {
          const r = validateMobile(value);
          if (!r.ok) error = r.error;
        }
        break;
      }
      case 'password': {
        // In signup, a blank password is valid (auto-generated); validate only if non-empty
        const required = isLogin || value.length > 0;
        const r = validatePassword(value, required);
        if (!r.ok) error = r.error;
        break;
      }
    }

    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const showError = (title: string, message: string, details?: string) => {
    setNotification({ isOpen: true, type: 'error', title, message, details });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // -------------------------------------------------------------------------
  // Form submission
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // UX-level rate limit guard
    const rl = checkRateLimit();
    if (rl.limited) {
      setRateLimitSeconds(rl.secondsLeft);
      return;
    }

    // Supabase configuration check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      showError(
        'Configuration Error',
        'Supabase is not configured.',
        'Please set up your environment variables:\n\nRequired:\n- NEXT_PUBLIC_SUPABASE_URL\n- NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
      return;
    }

    // Full form validation
    const errors: FormErrors = {};

    const emailResult = validateEmail(formData.email);
    if (!emailResult.ok) errors.email = emailResult.error;

    const pwRequired = isLogin || formData.password.length > 0;
    const pwResult = validatePassword(formData.password, pwRequired);
    if (!pwResult.ok) errors.password = pwResult.error;

    // Sanitized values (updated below if signup)
    let firstNameSanitized = formData.first_name.trim();
    let lastNameSanitized = formData.last_name.trim();
    let mobileSanitized = formData.mobile.trim();

    if (!isLogin) {
      const fnResult = validateName(formData.first_name);
      if (!fnResult.ok) errors.first_name = fnResult.error;
      else firstNameSanitized = fnResult.value;

      const lnResult = validateName(formData.last_name);
      if (!lnResult.ok) errors.last_name = lnResult.error;
      else lastNameSanitized = lnResult.value;

      const mobileResult = validateMobile(formData.mobile);
      if (!mobileResult.ok) errors.mobile = mobileResult.error;
      else mobileSanitized = mobileResult.value;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const sanitizedEmail = emailResult.ok ? emailResult.value : formData.email;

    try {
      let authResponse;

      if (isLogin) {
        authResponse = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: formData.password || `Budget${formData.mobile}`,
        });
      } else {
        authResponse = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: formData.password || `Budget${mobileSanitized}`,
          options: {
            data: {
              first_name: firstNameSanitized,
              last_name: lastNameSanitized,
              mobile: mobileSanitized,
            },
          },
        });
      }

      const { data: authData, error: authError } = authResponse;

      if (authError) {
        const rlState = recordFailedAttempt();
        if (rlState.limited) setRateLimitSeconds(rlState.secondsLeft);
        showError('Authentication Error', authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        resetRateLimit();
        setLoading(false);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      const rlState = recordFailedAttempt();
      if (rlState.limited) setRateLimitSeconds(rlState.secondsLeft);
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isLocked = rateLimitSeconds > 0;

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-start overflow-x-hidden scrollable-container px-4 sm:px-6
                pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))]
                pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))]"
    >
      {/* Fixed background — stays in place while card scrolls */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#180808] via-budget-accent to-[#111]">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-budget-brand/25 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-72 h-72 bg-budget-warn/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]"></div>
      </div>

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div
          className={`relative rounded-3xl border border-white/20 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.4)] transition-all duration-500 ${
            isAnimating ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={() => router.push('/booking')}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 active:scale-95"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-5 sm:px-8 sm:pt-10 text-center space-y-4">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="mx-auto block cursor-pointer hover:opacity-90 transition-opacity active:scale-95"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="absolute inset-0 bg-budget-brand/15 rounded-2xl blur-lg"></div>
                <div className="relative bg-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-gray-100">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Budget Cabs Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </button>

            {/* Brand Name */}
            <div>
              <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-wide">
                <span className="text-budget-brand">Budget</span>
                <span className="text-budget-warn"> Cab</span>
                <span className="text-gray-900">s</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-500">
                <Sparkles className="w-3.5 h-3.5 text-budget-warn" />
                <p className="text-sm font-semibold tracking-widest uppercase text-gray-500">
                  {isLogin ? 'Welcome Back' : 'Join Us'}
                </p>
                <Sparkles className="w-3.5 h-3.5 text-budget-warn" />
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-400 leading-relaxed">
                {isLogin
                  ? 'Log in to continue your journey'
                  : 'Create an account to book your ride'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 sm:mx-8 border-t border-gray-100" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-8 space-y-4" noValidate>

            {/* First Name + Last Name (signup only) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    First Name
                  </label>
                  <input
                    name="first_name"
                    required={!isLogin}
                    className={inputCls(!!fieldErrors.first_name, 'px-3.5 py-3')}
                    placeholder="Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="given-name"
                  />
                  <FieldError msg={fieldErrors.first_name} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    required={!isLogin}
                    className={inputCls(!!fieldErrors.last_name, 'px-3.5 py-3')}
                    placeholder="Surname"
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="family-name"
                  />
                  <FieldError msg={fieldErrors.last_name} />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                <input
                  name="email"
                  type="email"
                  required
                  className={inputCls(!!fieldErrors.email, 'pl-10 pr-4 py-3')}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Mobile (signup only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                  <input
                    name="mobile"
                    type="tel"
                    required={!isLogin}
                    className={inputCls(!!fieldErrors.mobile, 'pl-10 pr-4 py-3')}
                    placeholder="+91 98765 43210"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <FieldError msg={fieldErrors.mobile} />
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={inputCls(!!fieldErrors.password, 'px-3.5 py-3 pr-11')}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-budget-brand transition-colors rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={fieldErrors.password} />
              {!isLogin && !fieldErrors.password && (
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Leave blank to auto-set as &quot;Budget&quot; + your mobile number
                </p>
              )}
            </div>

            {/* Rate-limit lockout notice */}
            {isLocked && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700"
              >
                <span className="text-lg leading-none">🔒</span>
                <span>
                  Too many failed attempts. Please wait{' '}
                  <span className="font-bold tabular-nums">{rateLimitSeconds}s</span> before trying
                  again.
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 bg-budget-brand text-white py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-budget-brand/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-budget-brand/25 min-h-[52px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  <span>Processing…</span>
                </>
              ) : isLocked ? (
                <span>Try again in {rateLimitSeconds}s</span>
              ) : (
                <>
                  <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>

            {/* Toggle login ↔ signup */}
            <p className="text-center text-xs sm:text-sm text-gray-400 pt-1">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-budget-brand hover:text-budget-brand/80 transition-colors underline underline-offset-2"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </form>
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

      {/* Error Notification Modal (server/auth errors only) */}
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
