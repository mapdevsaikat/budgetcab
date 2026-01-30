'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Users, MapPin, Sparkles, Phone, MessageCircle, Clock, Car, DollarSign } from 'lucide-react';
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

  const handleWhatsApp = () => {
    window.open('https://wa.me/918600829292?text=Hi%20Budget%20Cabs%20Service,%20I%20want%20to%20book%20a%20ride', '_blank');
  };

  const handleCall = () => {
    window.open('tel:+918600829292', '_blank');
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ 
        minHeight: '100dvh',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-budget-brand via-[#B91C1C] to-budget-accent opacity-95">
        {/* Animated circles for depth */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-budget-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-budget-warn/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-budget-warn/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content Container - Scrollable with safe area */}
      <div 
        className={`relative z-10 w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col items-center justify-center py-2 sm:py-4 transition-all duration-700 overflow-y-auto scrollable-container ${
          isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        }`}
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Logo Section - Compact */}
        <div className="flex flex-col items-center space-y-2 sm:space-y-3 flex-shrink-0">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 rounded-2xl blur-xl scale-80" style={{ backgroundColor: 'rgba(255, 193, 7, 0.6)' }}></div>
            <div className="relative bg-white/95 backdrop-blur-md p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white/50">
              <img
                src="/android-chrome-192x192.png"
                alt="budgetcab Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain"
              />
            </div>
          </div>
          
          {/* Brand Name */}
          <div className="text-center space-y-1 px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              <span className="text-white">Budget</span>
              <span className="text-budget-warn">Cab</span>
              <span className="text-white">s</span>
            </h1>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-white/90">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <p className="text-xs sm:text-sm md:text-base font-medium">Affordable & Reliable</p>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

        {/* Tagline - Compact */}
        <div className="text-center space-y-1 max-w-2xl flex-shrink-0 mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white leading-tight">
            Nashik Taxi Service | Airport Transfer
          </h2>
          <p className="text-xs sm:text-sm text-white/80">
            Nashik-Mumbai-Pune • Airport Transfer • Malegaon • Sharing Cabs
          </p>
        </div>

        {/* Features Grid - 5 Square Cards - Compact */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 px-4 sm:px-4 md:px-4 max-w-[400px] sm:max-w-[500px] md:max-w-[600px] flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-2 md:p-2 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-budget-brand/20 rounded-lg flex items-center justify-center mb-1">
              <Car className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-none" />
            </div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white mb-0.5">Clean Car</h3>
            <p className="text-[8px] sm:text-[9px] text-white/80 leading-tight">Well maintained</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-2 md:p-2 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-budget-accent/20 rounded-lg flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-none" />
            </div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white mb-0.5">On Time</h3>
            <p className="text-[8px] sm:text-[9px] text-white/80 leading-tight">Punctual service</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-2 md:p-2 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-budget-warn/20 rounded-lg flex items-center justify-center mb-1">
              <Users className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-none" />
            </div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white mb-0.5">Courteous</h3>
            <p className="text-[8px] sm:text-[9px] text-white/80 leading-tight">Professional driver</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-2 md:p-2 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-budget-brand/20 rounded-lg flex items-center justify-center mb-1">
              <DollarSign className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-none" />
            </div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white mb-0.5">Affordable</h3>
            <p className="text-[8px] sm:text-[9px] text-white/80 leading-tight">For every pocket</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-2 md:p-2 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-budget-accent/20 rounded-lg flex items-center justify-center mb-1">
              <Shield className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-none" />
            </div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white mb-0.5">Secure</h3>
            <p className="text-[8px] sm:text-[9px] text-white/80 leading-tight">Safe rides</p>
          </div>
        </div>

        {/* CTA Buttons - Compact */}
        <div className="w-full max-w-md px-2 sm:px-4 space-y-2 sm:space-y-3 flex-shrink-0 mt-4 sm:mt-6 md:mt-8">
          <button
            onClick={handleGetStarted}
            className="w-full bg-white text-budget-brand font-bold py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-white/95 active:scale-[0.98] transition-all text-sm sm:text-base md:text-lg min-h-[48px] sm:min-h-[52px] md:min-h-[56px] group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Contact Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={handleWhatsApp}
              className="bg-budget-accent text-white font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-budget-accent/90 active:scale-[0.98] transition-all text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCall}
              className="bg-budget-warn text-white font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-budget-warn/90 active:scale-[0.98] transition-all text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px]"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Call Us</span>
            </button>
          </div>
        </div>

        {/* Credits Footer - Compact */}
        <div className="w-full px-2 sm:px-4 pb-2 sm:pb-4 pt-2 sm:pt-4 flex-shrink-0">
          <div className="text-center space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-xs md:text-sm text-white/70 font-medium">
              Built by{' '}
              <a
                href="https://sequens.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-budget-warn underline transition-colors font-semibold"
              >
                Sequens LLP
              </a>
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-white/60">
              Powered by{' '}
              <a
                href="https://www.quantaroute.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-budget-accent underline transition-colors"
              >
                QuantaRoute
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements - Hidden on mobile, visible on larger screens */}
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/10 rounded-full hidden lg:block"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 border-2 border-white/10 rounded-full hidden lg:block"></div>
      <div className="absolute top-1/4 left-1/4 w-12 h-12 border-2 border-white/5 rounded-full hidden xl:block"></div>
      <div className="absolute bottom-1/4 right-1/4 w-10 h-10 border-2 border-white/5 rounded-full hidden xl:block"></div>
    </div>
  );
}

