'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Users, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Animate in after mount
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push('/booking');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden safe-area-insets"
      style={{ minHeight: '100dvh', maxHeight: '100dvh' }}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-maahi-brand via-[#3B3FA8] to-maahi-accent opacity-95">
        {/* Animated circles for depth */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-maahi-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-maahi-warn/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Content Container */}
      <div 
        className={`relative z-10 w-full max-w-md px-6 sm:px-8 flex flex-col items-center justify-center space-y-8 sm:space-y-10 transition-all duration-700 ${
          isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Logo Section */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center space-y-4 sm:space-y-6 cursor-pointer hover:opacity-90 transition-opacity active:scale-95 transition-transform"
        >
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-white/30 rounded-3xl blur-2xl scale-110"></div>
            <div className="relative bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-white/50">
              <img
                src="/android-chrome-192x192.png"
                alt="MaahiCabs Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
          </div>
          
          {/* Brand Name */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              <span className="text-white">Maah</span>
              <span className="text-maahi-warn">iC</span>
              <span className="text-maahi-accent">abs</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <p className="text-sm sm:text-base font-medium">Safe & Reliable</p>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </button>

        {/* Tagline */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight px-4">
            Female-Only Cab Service
          </h2>
          <p className="text-base sm:text-lg text-white/90 px-4 font-medium">
            Empowering Women's Travel in Bengaluru
          </p>
        </div>

        {/* Features Grid */}
        <div className="w-full grid grid-cols-1 gap-4 sm:gap-5 px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-maahi-brand/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Safe & Secure</h3>
                <p className="text-sm sm:text-base text-white/80">Verified woman partners for your peace of mind</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-maahi-accent/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">By Women, For Women</h3>
                <p className="text-sm sm:text-base text-white/80">Founded by Maahi Narender</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-maahi-warn/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">24/7 Available</h3>
                <p className="text-sm sm:text-base text-white/80">Book your ride anytime, anywhere in Bengaluru</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full px-4 pt-2">
          <button
            onClick={handleGetStarted}
            className="w-full bg-white text-maahi-brand font-bold py-4 sm:py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-white/95 active:scale-[0.98] transition-all text-base sm:text-lg min-h-[56px] sm:min-h-[64px] group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Credits Footer */}
        <div className="w-full px-4 pb-8 sm:pb-10 pt-4">
          <div className="text-center space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              Built by{' '}
              <a
                href="https://sequens.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-maahi-warn underline transition-colors font-semibold"
              >
                Sequens LLP
              </a>
            </p>
            <p className="text-xs sm:text-sm text-white/60">
              Powered by{' '}
              <a
                href="https://www.quantaroute.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-maahi-accent underline transition-colors"
              >
                QuantaRoute
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/10 rounded-full hidden sm:block"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 border-2 border-white/10 rounded-full hidden sm:block"></div>
    </div>
  );
}

