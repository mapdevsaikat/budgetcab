'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, MapPin, Home, ArrowLeft, Clock, ChevronRight, LogOut, ChevronDown, Calendar, MapPin as MapPinIcon, DollarSign } from 'lucide-react';
import { BookingStatusLabels, BookingStatusColors } from '@/types/booking';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Format: 'YYYY-MM'
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/onboarding');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/onboarding');
      return;
    }

    setUser(session.user);
    await fetchProfile(session.user.id);
    await checkActiveBooking(session.user.id);
    await fetchAddressCount(session.user.id);
    await fetchBookings(session.user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  const checkActiveBooking = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_ref, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking active booking:', error);
        return;
      }

      if (data) {
        setActiveBooking(data);
      }
    } catch (error) {
      console.error('Failed to check active booking:', error);
    }
  };

  const fetchAddressCount = async (userId: string) => {
    const { count } = await supabase
      .from('user_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    setAddressCount(count || 0);
  };

  // Get available months (last 3 months including current)
  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthKey, label: monthLabel });
    }
    
    return months;
  };

  const fetchBookings = async (userId: string, month?: string) => {
    setLoadingBookings(true);
    try {
      // Calculate date range (3 months from now)
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', threeMonthsAgo.toISOString())
        .order('created_at', { ascending: false });

      // If month is selected, filter by that month
      if (month) {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
        
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (user) {
      fetchBookings(user.id, month);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-maahi-brand to-maahi-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 safe-area-insets">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-maahi-brand to-maahi-accent text-white p-4 sm:p-5 md:p-6 flex-shrink-0">
        {activeBooking ? (
          <button
            onClick={() => router.push(`/profile/booking-status?ref=${activeBooking.booking_ref}`)}
            className="mb-3 sm:mb-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-full transition-colors text-sm sm:text-base"
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold">Check Booking Status</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/booking')}
            className="mb-3 sm:mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold">Back to Home</span>
          </button>
        )}

        {/* Single User Profile Button with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 sm:gap-3 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full transition-colors w-full"
          >
            <div className="bg-white/30 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">My Profile</h1>
              <p className="text-white/80 text-xs truncate">{profile?.first_name || 'User'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 sm:p-4 border-b border-gray-100">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">{profile?.email}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{profile?.mobile}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-red-600 hover:bg-red-50 transition-colors text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollable-container px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">

        {/* Saved Addresses Quick Link */}
        <button
          onClick={() => router.push('/profile/address')}
          className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 text-left hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-maahi-brand/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-maahi-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">Saved Addresses</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {addressCount === 0 
                    ? 'No addresses saved yet' 
                    : `${addressCount} address${addressCount > 1 ? 'es' : ''} saved`
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
          </div>
        </button>

        {/* Quick Add Address if no addresses */}
        {addressCount === 0 && (
          <div className="bg-gradient-to-br from-maahi-brand/5 to-maahi-accent/5 border-2 border-maahi-brand/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-maahi-brand flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Add Your Home Address</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Save your home address for faster bookings and personalized experience.
            </p>
            <button
              onClick={() => router.push('/profile/address?mode=add')}
              className="w-full bg-maahi-brand text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-maahi-brand/90 transition-all text-sm sm:text-base"
            >
              Add Home Address
            </button>
          </div>
        )}

        {/* Booking History */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Booking History</h2>
            </div>
          </div>

          {/* Date Filter - Last 3 Months */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Filter by Month (Last 3 Months)
            </label>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedMonth('');
                  if (user) fetchBookings(user.id);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedMonth === ''
                    ? 'bg-maahi-brand text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {getAvailableMonths().map((month) => (
                <button
                  key={month.value}
                  onClick={() => handleMonthChange(month.value)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedMonth === month.value
                      ? 'bg-maahi-brand text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {loadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maahi-brand"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {selectedMonth ? 'No bookings found for this month' : 'No bookings found in the last 3 months'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const statusColor = BookingStatusColors[booking.status as keyof typeof BookingStatusColors] || BookingStatusColors.completed;
                const statusLabel = BookingStatusLabels[booking.status as keyof typeof BookingStatusLabels] || booking.status;
                
                return (
                  <button
                    key={booking.id}
                    onClick={() => router.push(`/profile/booking-status?ref=${booking.booking_ref}`)}
                    className="w-full text-left border-2 border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-maahi-accent/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-mono font-semibold text-maahi-brand truncate">
                            {booking.booking_ref}
                          </span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${statusColor.bg} ${statusColor.text} whitespace-nowrap`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2">
                          {formatDate(booking.created_at)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-gray-800">
                          ₹{booking.price_total?.toFixed(2) || '0.00'}
                        </p>
                        {booking.distance_km && (
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {booking.distance_km.toFixed(1)} km
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Pickup</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                            {booking.pickup_address || booking.pickup_digipin || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Drop</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                            {booking.drop_address || booking.drop_digipin || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* End Scrollable Content */}
    </div>
  );
}
