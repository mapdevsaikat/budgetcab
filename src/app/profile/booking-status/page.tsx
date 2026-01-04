'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, User as UserIcon, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

function BookingStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get('ref');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!bookingRef) {
      router.push('/booking');
      return;
    }

    fetchBooking();
  }, [bookingRef]);

  // Countdown timer
  useEffect(() => {
    if (!booking?.scheduled_time) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const scheduledTime = new Date(booking.scheduled_time).getTime();
      const difference = scheduledTime - now;

      if (difference <= 0) {
        setTimeRemaining('Your ride is here!');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_ref', bookingRef)
        .single();

      if (error) throw error;

      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      router.push('/booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-maahi-brand to-maahi-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 safe-area-insets">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-maahi-brand to-maahi-accent text-white p-4 sm:p-5 md:p-6 pb-6 sm:pb-7 md:pb-8 flex-shrink-0">
        <button
          onClick={() => router.push('/profile')}
          className="mb-3 sm:mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold">Back to Profile</span>
        </button>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">Booking Status</h1>
            <p className="text-white/80 text-xs sm:text-sm truncate">Ref: {booking.booking_ref}</p>
          </div>
          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 flex-shrink-0 ${statusColors[booking.status as keyof typeof statusColors] || statusColors.pending}`}>
            <span className="font-bold uppercase text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{booking.status}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollable-container px-3 sm:px-4 md:px-6 -mt-4 sm:-mt-5 md:-mt-6 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6">
        {/* Countdown Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 mb-3 sm:mb-4 border-2 border-maahi-accent/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-maahi-accent/10 p-2 sm:p-3 rounded-full flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-maahi-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Time Until Pickup</p>
              <p className="text-2xl sm:text-3xl font-bold text-maahi-brand break-words">{timeRemaining}</p>
            </div>
          </div>

          <div className="border-t pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm text-gray-600 break-words">
              Scheduled Time:{' '}
              <span className="font-semibold text-gray-800">
                {new Date(booking.scheduled_time).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent flex-shrink-0" />
            Trip Details
          </h2>

          {/* Pickup */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-maahi-brand"></div>
                <div className="w-0.5 h-10 sm:h-12 bg-gray-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1">PICKUP</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 break-words">{booking.pickup_address}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 break-all">DigiPin: {booking.pickup_digipin}</p>
              </div>
            </div>
          </div>

          {/* Drop */}
          <div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-maahi-accent"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1">DROP-OFF</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 break-words">{booking.drop_address}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 break-all">DigiPin: {booking.drop_digipin}</p>
              </div>
            </div>
          </div>

          {/* Distance & Price */}
          <div className={`grid ${booking.status === 'completed' ? 'grid-cols-2' : 'grid-cols-1'} gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t`}>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Distance</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{booking.distance_km} km</p>
            </div>
            {booking.status === 'completed' && (
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Total Fare</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">₹{booking.price_total.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent flex-shrink-0" />
            Your Information
          </h2>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500">Name</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{booking.user_first_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500">Mobile</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{booking.user_mobile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
            <div className="flex gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold text-yellow-800 mb-1">Booking Confirmed</p>
                <p className="text-xs sm:text-sm text-yellow-700 break-words">
                  Your booking is confirmed. Our driver will reach you shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
            <div className="flex gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold text-green-800 mb-1">Driver Assigned</p>
                <p className="text-xs sm:text-sm text-green-700 break-words">
                  Your driver has been assigned and will contact you soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* End Scrollable Content */}
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-maahi-brand to-maahi-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    }>
      <BookingStatusContent />
    </Suspense>
  );
}

