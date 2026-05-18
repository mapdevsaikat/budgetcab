'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Users, Sparkles, Phone, MessageCircle, Clock, Car, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { containerVariants, itemVariants } = useMemo(() => {
    const ease = [0.22, 1, 0.36, 1] as const;
    const duration = prefersReducedMotion ? 0.01 : 0.48;
    const stagger = prefersReducedMotion ? 0 : 0.09;
    const delayChildren = prefersReducedMotion ? 0 : 0.04;

    return {
      containerVariants: {
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      },
      itemVariants: {
        hidden: {
          opacity: prefersReducedMotion ? 1 : 0,
          y: prefersReducedMotion ? 0 : 20,
        },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration, ease },
        },
      },
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
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

  const features = [
    { icon: Car, title: 'Clean Car', description: 'Well maintained', bgColor: 'bg-red-500/25' },
    { icon: Clock, title: 'On Time', description: 'Punctual service', bgColor: 'bg-teal-500/20' },
    { icon: Users, title: 'Courteous', description: 'Professional driver', bgColor: 'bg-amber-500/25' },
    { icon: DollarSign, title: 'Affordable', description: 'For every pocket', bgColor: 'bg-red-500/20' },
    { icon: Shield, title: 'Secure', description: 'Safe rides', bgColor: 'bg-stone-500/25' },
  ];

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
      setCurrentSlide((prev) => Math.min(prev + 1, Math.ceil(features.length / 2) - 1));
    } else if (distance < -minSwipeDistance) {
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

  const revealProps = {
    initial: 'hidden' as const,
    whileInView: 'show' as const,
    viewport: { once: true, margin: '-12% 0px' },
    variants: itemVariants,
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center lg:justify-start relative isolate pt-[max(2.75rem,calc(env(safe-area-inset-top,0px)+1.5rem))] pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] md:pt-10 lg:pt-12 xl:pt-14 lg:pb-8"
      style={{
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      {/* Midnight expressway: depth without purple-gradient cliché */}
      <div className="absolute inset-0 bg-[#07090d]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_-15%,rgba(185,28,28,0.5),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(118deg,rgba(13,148,136,0.14)_0%,transparent_42%,transparent_58%,rgba(245,158,11,0.08)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.035] bg-[repeating-linear-gradient(-12deg,transparent,transparent_2px,rgba(255,255,255,0.06)_2px,rgba(255,255,255,0.06)_3px)] mix-blend-overlay pointer-events-none"
        aria-hidden
      />

      <motion.div
        className="relative z-10 w-full max-w-full lg:max-w-6xl xl:max-w-7xl px-3 sm:px-4 md:px-8 lg:px-10 xl:px-12 flex flex-col items-center lg:items-stretch py-4 sm:py-6 md:py-8 overflow-y-auto scrollable-container"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-x-12 xl:gap-x-16 lg:gap-y-8 lg:items-start">
          <motion.div
            className="flex flex-col items-center lg:items-start space-y-5 sm:space-y-6 md:space-y-7 flex-shrink-0 mt-2 sm:mt-3 md:mt-4 lg:mt-0 lg:pr-2"
            variants={itemVariants}
          >
            <div className="relative pt-1 lg:pt-0">
              {/* Bright mobile “app icon” plate — toned down from md+ so it doesn’t read as a phone notch */}
              <div
                className="absolute inset-0 rounded-2xl -z-10 scale-90 opacity-90 blur-xl sm:blur-xl md:opacity-45 md:blur-lg md:scale-[0.92]"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.65), rgba(220,38,38,0.35))' }}
              />
              <motion.div
                className="relative border backdrop-blur-md p-3 sm:p-3.5 md:p-2.5 lg:p-3 rounded-2xl sm:rounded-3xl md:rounded-xl lg:rounded-2xl shadow-2xl max-md:bg-white/[0.97] max-md:border-white/45 md:bg-white/[0.09] md:border-white/25 md:shadow-lg"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                <img
                  src="/android-chrome-192x192.png"
                  alt="budgetcab Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] lg:w-24 lg:h-24 object-contain"
                />
              </motion.div>
            </div>

            <div className="text-center lg:text-left space-y-1 px-4 sm:px-6 md:px-8 lg:px-0 w-full">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-[0.95] tracking-wide uppercase">
                <span className="text-white">Budget</span>
                <span className="text-budget-warn"> Cab</span>
                <span className="text-white/95">s</span>
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-white/85">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300/90 shrink-0" />
                <p className="text-xs sm:text-sm md:text-base font-medium tracking-wide">Affordable & Reliable</p>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300/90 shrink-0" />
              </div>
            </div>

            <motion.div
              className="text-center lg:text-left space-y-2 max-w-2xl lg:max-w-none w-full mb-5 sm:mb-7 md:mb-9 lg:mb-0 px-4 sm:px-6 md:px-8 lg:px-0"
              variants={itemVariants}
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-teal-300/90 font-semibold">
                Nashik • Mumbai • Pune
              </p>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-white/95 leading-snug">
                Nashik taxi & airport transfer
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-white/80 max-w-md lg:max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Intercity routes, airport runs, Malegaon, and sharing cabs — book in a few taps.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="hidden lg:block w-full min-w-0 lg:row-span-1 lg:self-center"
            {...revealProps}
          >
            <div className="grid grid-cols-5 gap-2.5 xl:gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur-md rounded-lg xl:rounded-xl p-3 aspect-square border border-white/20 shadow-md hover:bg-white/[0.14] transition-colors flex flex-col items-center justify-center text-center"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  >
                    <div className={`w-10 h-10 xl:w-11 xl:h-11 ${feature.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon className="w-5 h-5 xl:w-6 xl:h-6 text-white" />
                    </div>
                    <h3 className="text-[11px] xl:text-xs font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-[10px] text-white/80 leading-tight">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="w-full px-4 sm:px-4 md:px-4 max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-none flex-shrink-0 lg:mt-2"
          {...revealProps}
        >
          <div className="lg:hidden relative">
            <div
              ref={carouselRef}
              className="overflow-hidden rounded-2xl relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentSlide > 0 && (
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/15 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all z-20 border border-white/35 focus-visible:outline-offset-4"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentSlide < Math.ceil(features.length / 2) - 1 && (
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/15 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all z-20 border border-white/35 focus-visible:outline-offset-4"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {Array.from({ length: Math.ceil(features.length / 2) }).map((_, slideIndex) => (
                  <div key={slideIndex} className="min-w-full flex gap-2 px-8 py-4">
                    {features.slice(slideIndex * 2, slideIndex * 2 + 2).map((feature, cardIndex) => {
                      const Icon = feature.icon;
                      const index = slideIndex * 2 + cardIndex;
                      return (
                        <motion.div
                          key={index}
                          className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-md flex flex-col items-center justify-center text-center"
                          whileHover={prefersReducedMotion ? undefined : { y: -3, borderColor: 'rgba(255,255,255,0.35)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        >
                          <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-2`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xs font-bold text-white mb-1">{feature.title}</h3>
                          <p className="text-[10px] text-white/80 leading-tight">{feature.description}</p>
                        </motion.div>
                      );
                    })}
                    {features.length % 2 !== 0 && slideIndex === Math.ceil(features.length / 2) - 1 && (
                      <div className="flex-1 opacity-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(features.length / 2) }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    currentSlide === index ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/40 hover:bg-white/65'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full max-w-md lg:max-w-2xl px-2 sm:px-4 space-y-2 sm:space-y-3 flex-shrink-0 mt-5 sm:mt-7 md:mt-9 lg:mt-10 mx-auto lg:mx-0"
          variants={itemVariants}
        >
          <motion.button
            type="button"
            onClick={handleGetStarted}
            className="w-full bg-white text-budget-brand font-bold py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-stone-50 active:scale-[0.98] transition-colors text-sm sm:text-base md:text-lg min-h-[48px] sm:min-h-[52px] md:min-h-[56px] group border border-white/50 focus-visible:outline-offset-4"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform motion-reduce:transform-none" />
          </motion.button>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <motion.button
              type="button"
              onClick={handleWhatsApp}
              className="bg-[#25D366] text-white font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-[#20bd5a] active:scale-[0.98] transition-colors text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] focus-visible:outline-offset-4"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>WhatsApp</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCall}
              className="bg-budget-warn text-stone-900 font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:brightness-105 active:scale-[0.98] transition-[filter] text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] focus-visible:outline-offset-4"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Call Us</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="w-full px-2 sm:px-4 pb-2 sm:pb-4 pt-4 sm:pt-6 flex-shrink-0 border-t border-white/10 mt-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => router.push('/about')}
              className="text-white/75 hover:text-white text-xs sm:text-sm font-medium transition-colors underline-offset-4 hover:underline"
            >
              About Us
            </button>
            <span className="text-white/35" aria-hidden>
              •
            </span>
            <button
              type="button"
              onClick={() => router.push('/contact')}
              className="text-white/75 hover:text-white text-xs sm:text-sm font-medium transition-colors underline-offset-4 hover:underline"
            >
              Contact
            </button>
          </div>
          <div className="text-center space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-xs md:text-sm text-white/65 font-medium">
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
            <p className="text-[10px] sm:text-xs md:text-sm text-white/55">
              Powered by{' '}
              <a
                href="https://www.quantaroute.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/85 hover:text-teal-300 transition-colors"
              >
                QuantaRoute
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute top-10 left-10 w-20 h-20 border border-white/[0.08] rounded-full hidden lg:block motion-reduce:opacity-50" aria-hidden />
      <div className="absolute bottom-10 right-10 w-16 h-16 border border-white/[0.08] rounded-full hidden lg:block motion-reduce:opacity-50" aria-hidden />
      <div className="absolute top-1/4 left-1/4 w-12 h-12 border border-white/[0.06] rounded-full hidden xl:block" aria-hidden />
      <div className="absolute bottom-1/4 right-1/4 w-10 h-10 border border-white/[0.06] rounded-full hidden xl:block" aria-hidden />
    </div>
  );
}
