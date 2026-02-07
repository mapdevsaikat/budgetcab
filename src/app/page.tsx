'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Users, MapPin, Sparkles, Phone, MessageCircle, Clock, Car, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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
    window.open('https://wa.me/919860689292?text=Hi%20Budget%20Cabs%20Service,%20I%20want%20to%20book%20a%20ride', '_blank');
  };

  const handleCall = () => {
    window.open('tel:+919860689292', '_blank');
  };

  // Features data
  const features = [
    { icon: Car, title: 'Clean Car', description: 'Well maintained', bgColor: 'bg-budget-brand/20' },
    { icon: Clock, title: 'On Time', description: 'Punctual service', bgColor: 'bg-budget-accent/20' },
    { icon: Users, title: 'Courteous', description: 'Professional driver', bgColor: 'bg-budget-warn/20' },
    { icon: DollarSign, title: 'Affordable', description: 'For every pocket', bgColor: 'bg-budget-brand/20' },
    { icon: Shield, title: 'Secure', description: 'Safe rides', bgColor: 'bg-budget-accent/20' },
  ];

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left - next slide
      setCurrentSlide((prev) => Math.min(prev + 1, Math.ceil(features.length / 2) - 1));
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous slide
      setCurrentSlide((prev) => Math.max(prev - 1, 0));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, Math.ceil(features.length / 2) - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ 
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        paddingTop: 'max(2rem, calc(env(safe-area-inset-top, 0px) + 2rem))',
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
        className={`relative z-10 w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col items-center justify-center py-4 sm:py-6 md:py-8 transition-all duration-700 overflow-y-auto scrollable-container ${
          isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        }`}
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Logo Section - Compact */}
        <div className="flex flex-col items-center space-y-2 sm:space-y-3 flex-shrink-0 mt-4 sm:mt-6 md:mt-8">
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

        {/* Features - Mobile: Carousel, Desktop: Grid */}
        <div className="w-full px-4 sm:px-4 md:px-4 max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-5xl flex-shrink-0">
          
          {/* Mobile: Carousel layout */}
          <div className="lg:hidden relative">
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="overflow-hidden rounded-2xl relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Navigation Arrows */}
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all z-20 border border-white/30"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentSlide < Math.ceil(features.length / 2) - 1 && (
                <button
                  onClick={nextSlide}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all z-20 border border-white/30"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {/* Group features into pairs (2 per slide) */}
                {Array.from({ length: Math.ceil(features.length / 2) }).map((_, slideIndex) => (
                  <div
                    key={slideIndex}
                    className="min-w-full flex gap-2 px-8 py-4"
                  >
                    {features.slice(slideIndex * 2, slideIndex * 2 + 2).map((feature, cardIndex) => {
                      const Icon = feature.icon;
                      const index = slideIndex * 2 + cardIndex;
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-md flex flex-col items-center justify-center text-center"
                        >
                          <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-2`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xs font-bold text-white mb-1">{feature.title}</h3>
                          <p className="text-[10px] text-white/80 leading-tight">{feature.description}</p>
                        </div>
                      );
                    })}
                    {/* Fill empty slot if odd number of features */}
                    {features.length % 2 !== 0 && slideIndex === Math.ceil(features.length / 2) - 1 && (
                      <div className="flex-1 opacity-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(features.length / 2) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? 'w-6 bg-white shadow-md'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: Original Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-2.5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-3 aspect-square border border-white/20 shadow-md hover:bg-white/15 transition-all flex flex-col items-center justify-center text-center"
                >
                  <div className={`w-10 h-10 ${feature.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-[10px] text-white/80 leading-tight">{feature.description}</p>
                </div>
              );
            })}
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
              className="bg-[#25D366] text-white font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-[#22c35e] active:scale-[0.98] transition-all text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px]"
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

        {/* Navigation Links */}
        <div className="w-full px-2 sm:px-4 pb-2 sm:pb-4 pt-2 sm:pt-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
            <button
              onClick={() => router.push('/about')}
              className="text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              About Us
            </button>
            <span className="text-white/40">•</span>
            <button
              onClick={() => router.push('/contact')}
              className="text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Contact
            </button>
          </div>
          <div className="text-center space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-xs md:text-sm text-white/70 font-medium">
              Built by{' '}
              <a
                href="https://sequens.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-budget-warn transition-colors font-semibold"
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
                className="text-white/80 hover:text-budget-accent transition-colors"
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

