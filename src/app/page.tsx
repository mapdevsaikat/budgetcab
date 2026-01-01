'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

import LocationSearch from '@/components/LocationSearch';
import UserLocation from '@/components/UserLocation';
import BottomSheet from '@/components/BottomSheet';
import { useBookingStore } from '@/store/useBookingStore';
import { Calendar, Clock, ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const { pickup, drop, setPickup, setDrop } = useBookingStore();
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Optional: clear any other local state
  };

  // Reverse geocode handler
  const handleConfirmLocation = async () => {
    if (!mapCenter) return;

    setLoadingAddress(true);
    try {
      const response = await fetch('/api/geocoding/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: mapCenter.lat, longitude: mapCenter.lng }),
      });
      const data = await response.json();

      const address = data.formatted_address ||
        (data.administrative_info ? `${data.administrative_info.locality}, ${data.administrative_info.district}` : 'Pinned Location');

      setPickup({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        address: address,
        digipin: data.digipin
      });

      // Optional: Auto-open destination search
      // setIsBookingSheetOpen(true); 
    } catch (error) {
      console.error('Error confirming location:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-gray-100">
      {/* Full-screen Map */}
      <div className="absolute inset-0 z-0">
        <Map
          onMoveEnd={(center) => setMapCenter(center)}
          onLoad={() => console.log('Map Loaded')}
        />

        {/* Center Pin for Selection */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 -mt-8">
          <div className="flex flex-col items-center">
            <div className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-full mb-1 shadow-lg">
              Set Pickup
            </div>
            <div className="relative">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-maahi-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-maahi-brand"></span>
              </span>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1 w-0.5 h-4 bg-black/50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating UI Elements */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex flex-col gap-3">
        {/* Header/Branding */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm pointer-events-auto">
            <img src="/android-chrome-192x192.png" alt="Logo" className="w-6 h-6 rounded-md" />
            <h1 className="text-xl font-bold text-maahi-brand leading-none">
              Maahi<span className="text-maahi-accent">Cabs</span>
            </h1>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                <UserIcon className="w-4 h-4 text-maahi-brand" />
                <span className="text-xs font-bold text-gray-800">
                  {profile?.first_name || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a href="/onboarding" className="text-xs font-bold text-maahi-brand bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                Login / Signup
              </a>
            )}
          </div>
        </div>

        {/* Search Inputs */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-2">
          <UserLocation />
          <LocationSearch
            placeholder="Search Pickup Location"
            onSelect={(loc) => setPickup(loc)}
          />
          <LocationSearch
            placeholder="Search Destination"
            onSelect={(loc) => {
              setDrop(loc);
              setIsBookingSheetOpen(true);
            }}
          />
        </div>
      </div>

      {/* Confirm Location Button (Uber-style) */}
      {!isBookingSheetOpen && (
        <div className="absolute bottom-8 left-4 right-4 z-30">
          <button
            onClick={handleConfirmLocation}
            disabled={loadingAddress}
            className="w-full bg-maahi-brand text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingAddress ? 'Getting Address...' : 'Confirm Pickup Location'}
            {!loadingAddress && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Booking Bottom Sheet */}
      <BottomSheet
        isOpen={isBookingSheetOpen}
        onClose={() => setIsBookingSheetOpen(false)}
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Booking</h2>
            <p className="text-sm text-gray-500">Select a slot to continue</p>
          </div>

          {/* Slot Selection (Placeholder) */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { time: '09:00 AM', status: 'Available' },
              { time: '10:30 AM', status: 'Available' },
              { time: '12:00 PM', status: 'Limited' },
              { time: '02:00 PM', status: 'Available' },
            ].map((slot, i) => (
              <button
                key={i}
                className="flex flex-col items-center p-3 rounded-xl border-2 border-gray-100 hover:border-maahi-accent transition-colors"
              >
                <Clock className="w-5 h-5 text-maahi-accent mb-1" />
                <span className="font-semibold text-gray-800">{slot.time}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{slot.status}</span>
              </button>
            ))}
          </div>

          {/* Price Estimate */}
          <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Estimated Fare</p>
              <p className="text-2xl font-bold text-gray-800">₹245.00</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Distancy</p>
              <p className="text-lg font-semibold text-gray-800">12.4 km</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="w-full bg-maahi-brand text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-[0.98]"
            onClick={() => {
              // TODO: Implement booking confirmation logic
              alert('Booking Logic to be implemented!');
            }}
          >
            Confirm Booking
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}
