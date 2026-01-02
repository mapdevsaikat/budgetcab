'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, User as UserIcon, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

export default function BookingStatusPage() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-maahi-brand to-maahi-accent text-white p-6 pb-8">
        <button
          onClick={() => router.push('/profile')}
          className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Profile</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Booking Status</h1>
            <p className="text-white/80 text-sm">Ref: {booking.booking_ref}</p>
          </div>
          <div className={`px-4 py-2 rounded-full border-2 ${statusColors[booking.status as keyof typeof statusColors] || statusColors.pending}`}>
            <span className="font-bold uppercase text-sm">{booking.status}</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Countdown Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 border-2 border-maahi-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-maahi-accent/10 p-3 rounded-full">
              <Clock className="w-6 h-6 text-maahi-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Until Pickup</p>
              <p className="text-3xl font-bold text-maahi-brand">{timeRemaining}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-maahi-accent" />
            Trip Details
          </h2>

          {/* Pickup */}
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-maahi-brand"></div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">PICKUP</p>
                <p className="text-sm font-semibold text-gray-800">{booking.pickup_address}</p>
                <p className="text-xs text-gray-400 mt-1">DigiPin: {booking.pickup_digipin}</p>
              </div>
            </div>
          </div>

          {/* Drop */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-maahi-accent"></div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">DROP-OFF</p>
                <p className="text-sm font-semibold text-gray-800">{booking.drop_address}</p>
                <p className="text-xs text-gray-400 mt-1">DigiPin: {booking.drop_digipin}</p>
              </div>
            </div>
          </div>

          {/* Distance & Price */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-1">Distance</p>
              <p className="text-xl font-bold text-gray-800">{booking.distance_km} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Fare</p>
              <p className="text-xl font-bold text-green-600">₹{booking.price_total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-maahi-accent" />
            Your Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-semibold text-gray-800">{booking.user_first_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Phone className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-sm font-semibold text-gray-800">{booking.user_mobile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Booking Confirmed</p>
                <p className="text-sm text-yellow-700">
                  Your booking is confirmed. Our driver will reach you shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 mb-1">Driver Assigned</p>
                <p className="text-sm text-green-700">
                  Your driver has been assigned and will contact you soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

