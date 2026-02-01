'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import * as digipin from 'digipin';
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

import LocationSearch from '@/components/LocationSearch';
import BottomSheet from '@/components/BottomSheet';
import NotificationModal from '@/components/NotificationModal';
import { useBookingStore } from '@/store/useBookingStore';
import { Calendar, Clock, ArrowRight, LogOut, User as UserIcon, Navigation, ChevronDown, X, Edit2, Home as HomeIcon, Briefcase, Car, Route } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import L from 'leaflet';
import { generateBookingRef, calculateFare, calculateNights } from '@/lib/booking';

// Feature flag: Show pricing to users (set to false to hide pricing)
const SHOW_PRICING_TO_USERS = false;

// Helper function to get today's date in YYYY-MM-DD format (local timezone, IST for Indian users)
const getTodayDateString = (): string => {
  const now = new Date();
  // Get local date string in YYYY-MM-DD format
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get minimum allowed date (today if 3+ hours remain, otherwise tomorrow)
const getMinDateString = (): string => {
  const now = new Date();
  
  // Check if there are at least 3 hours remaining today
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  
  // If 3 hours from now is still today, allow today; otherwise require tomorrow
  if (threeHoursFromNow <= endOfToday) {
    return getTodayDateString();
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// Helper function to get minimum allowed time (3 hours from now in local timezone)
const getMinTimeString = (selectedDate: string): string => {
  const now = new Date();
  const todayString = getTodayDateString();
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  // If selected date is today, return 3 hours from now
  if (selectedDate === todayString) {
    const hours = String(threeHoursFromNow.getHours()).padStart(2, '0');
    const minutes = String(threeHoursFromNow.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Otherwise, allow any time from 00:00
  return '00:00';
};

export default function Home() {
  const router = useRouter();
  const { pickup, drop, setPickup, setDrop, pickupLocked, lockPickup, unlockPickup, reset } = useBookingStore();
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [tempPickupDigipin, setTempPickupDigipin] = useState<string>(''); // Real-time DigiPin display
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Safe helper function to fly to a location
  const safeFlyTo = (lat: number, lng: number, zoom: number = 16, options?: { duration?: number; easeLinearity?: number }) => {
    if (!mapInstanceRef.current || !mapReady) {
      console.warn('Map not ready, cannot fly to location');
      return;
    }

    try {
      const map = mapInstanceRef.current;
      
      // Check if map is properly initialized
      if (!map || !map.getContainer || typeof map.getContainer !== 'function') {
        console.warn('Map instance is not properly initialized');
        return;
      }

      // Use setView with animation (native Leaflet method)
      map.setView([lat, lng], zoom, {
        animate: true,
        duration: options?.duration || 1.5,
        easeLinearity: options?.easeLinearity || 0.25
      });
    } catch (error) {
      console.error('Error flying to location:', error);
      // Fallback to simple setView without animation
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], zoom);
        }
      } catch (fallbackError) {
        console.error('Fallback setView also failed:', fallbackError);
      }
    }
  };

  // Destination adjustment state
  const [isAdjustingDestination, setIsAdjustingDestination] = useState(false);
  const [tempDestination, setTempDestination] = useState<any>(null);
  const [highlightDropoff, setHighlightDropoff] = useState(false);
  
  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<{
    home: any | null;
    work: any | null;
  }>({ home: null, work: null });

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Booking State
  const [distance, setDistance] = useState<number | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [nightStayRate] = useState<number>(500); // Fixed at 500 per night
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');
  
  // Booking options state
  const [selectedCabType, setSelectedCabType] = useState<string>('');
  const [selectedTripType, setSelectedTripType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Vehicle types state (from database)
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ 
    name: string; 
    display_order: number 
  }>>([]);
  
  // Pricing map: key is "cab_type|trip_type", value is base_fare
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});
  
  // Number of nights for Outstation trips
  const [numberOfNights, setNumberOfNights] = useState<number>(0);

  // Notification Modal State
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

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSavedAddresses(session.user.id);
        checkActiveBooking(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSavedAddresses(session.user.id);
        checkActiveBooking(session.user.id);
      } else {
        setProfile(null);
        setSavedAddresses({ home: null, work: null });
      }
    });

    // Fetch vehicle types and pricing
    fetchVehicleTypes();
    fetchPricing();

    return () => subscription.unsubscribe();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
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

  // Real-time DigiPin generation as map moves
  useEffect(() => {
    if (mapCenter && !pickupLocked && !isAdjustingDestination) {
      // Show real-time DigiPin for pickup selection
      const realtimeDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      setTempPickupDigipin(realtimeDigipin);
      console.log('Real-time DigiPin (preview):', realtimeDigipin);
    } else if (mapCenter && isAdjustingDestination) {
      // Update temp destination as map moves during adjustment
      const destinationDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      setTempDestination({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        address: destinationDigipin,
        digipin: destinationDigipin,
      });
      console.log('Adjusting destination DigiPin:', destinationDigipin);
    }
  }, [mapCenter, pickupLocked, isAdjustingDestination]); // Triggers on every map move

  // Calculate route when both pickup and drop are set
  useEffect(() => {
    if (pickup && drop && pickup.latitude && drop.latitude && pickupLocked) {
      calculateRoute();
    }
  }, [pickup, drop, pickupLocked]);

  // Simplified fare calculation based on cab type + trip type pricing
  useEffect(() => {
    console.log('🔄 Fare recalculation triggered:', {
      selectedCabType,
      selectedTripType,
      numberOfNights,
    });

    // Don't calculate if cab type or trip type is not selected yet
    if (!selectedCabType || !selectedTripType) {
      console.log('⚠️ Cab type or trip type not selected');
      setCalculatedFare(null);
      return;
    }

    // Get pricing for cab_type + trip_type combination
    const pricingKey = `${selectedCabType}|${selectedTripType}`;
    const baseFare = pricingMap[pricingKey];
    
    if (!baseFare || baseFare === 0) {
      console.log('⚠️ Pricing not found for:', pricingKey);
      console.log('Available pricing keys:', Object.keys(pricingMap));
      setCalculatedFare(null);
      return;
    }

    try {
      console.log('💰 Base fare for', pricingKey, ':', baseFare);
      console.log('🌙 Number of nights:', numberOfNights);
      
      // Calculate fare: base_fare + (nights × 500) for Outstation trips
      const nights = selectedTripType === 'Outstation' ? numberOfNights : 0;
      const fare = calculateFare(baseFare, nights, nightStayRate);
      
      console.log('✅ Calculated fare:', fare);
      setCalculatedFare(fare);
    } catch (error) {
      console.error('❌ Error recalculating fare:', error);
      setCalculatedFare(null);
    }
  }, [selectedCabType, selectedTripType, numberOfNights, pricingMap, nightStayRate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchSavedAddresses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .in('address_type', ['home', 'work'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching saved addresses:', error);
        return;
      }

      if (data) {
        const addresses = {
          home: data.find((addr) => addr.address_type === 'home') || null,
          work: data.find((addr) => addr.address_type === 'work') || null,
        };
        setSavedAddresses(addresses);
      }
    } catch (error) {
      console.error('Failed to fetch saved addresses:', error);
    }
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
        // User has an active booking, redirect to booking status
        console.log('Active booking found:', data.booking_ref);
        router.push(`/profile/booking-status?ref=${data.booking_ref}`);
      }
    } catch (error) {
      console.error('Failed to check active booking:', error);
    }
  };

  const fetchVehicleTypes = async () => {
    const fallbackVehicles = [
      { name: 'Maruti Swift Dzire Or Similar CNG', display_order: 1 },
      { name: 'Maruti Swift Dzire Or Similar Diesel', display_order: 2 },
      { name: 'Maruti Ertiga Or Similar', display_order: 3 },
      { name: 'Toyota Innova | Mahindra Marazzo', display_order: 4 },
      { name: 'Toyota Innova Crysta', display_order: 5 },
      { name: 'Tempo Traveller 17 Seater', display_order: 6 },
      { name: 'Tempo Traveller 26 Seater', display_order: 7 },
    ];

    try {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('name, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching vehicle types:', error);
        setVehicleTypes(fallbackVehicles);
        return;
      }

      if (data && data.length > 0) {
        setVehicleTypes(data);
        console.log('Vehicle types loaded from database:', data);
      } else {
        console.warn('No vehicle types found in database. Using defaults.');
        setVehicleTypes(fallbackVehicles);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error);
      setVehicleTypes(fallbackVehicles);
    }
  };

  const fetchPricing = async () => {
    try {
      console.log('🔄 Fetching pricing from database...');
      
      // Fetch pricing from pricing table: cab_type + trip_type -> base_fare
      const { data, error } = await supabase
        .from('pricing')
        .select('cab_type, trip_type, base_fare')
        .order('cab_type', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching pricing from database:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Show user-friendly error but don't break the app
        console.warn('⚠️ Using fallback pricing. Please check your pricing table in Supabase.');
        
        // Minimal fallback - empty map, will show error when user tries to book
        setPricingMap({});
        return;
      }

      if (data && data.length > 0) {
        const pricing: Record<string, number> = {};
        data.forEach((item: any) => {
          if (item.cab_type && item.trip_type && item.base_fare) {
            const key = `${item.cab_type}|${item.trip_type}`;
            pricing[key] = item.base_fare;
          }
        });
        
        setPricingMap(pricing);
        console.log('✅ Pricing loaded from database:', {
          count: Object.keys(pricing).length,
          sample: Object.keys(pricing).slice(0, 3)
        });
        console.log('📋 Full pricing map:', pricing);
      } else {
        console.warn('⚠️ No pricing records found in database.');
        console.warn('Please add pricing records to the pricing table with columns: cab_type, trip_type, base_fare');
        setPricingMap({});
      }
    } catch (error) {
      console.error('❌ Failed to fetch pricing:', error);
      setPricingMap({});
    }
  };


  // Helper function to show notifications
  const showNotification = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    details?: string
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      details,
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const calculateRoute = async () => {
    if (!pickup || !drop) return;

    setLoadingRoute(true);
    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
          drop: { latitude: drop.latitude, longitude: drop.longitude }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate route');
      }

      const data = await response.json();
      setDistance(data.distance);
      setRouteGeometry(data.route);
      
      // Fare will be recalculated by useEffect when distance changes
      console.log('Route calculated:', {
        distance: data.distance,
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      showNotification('error', 'Route Error', 'Failed to calculate route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setShowUserMenu(false);
      router.push('/onboarding');
    } catch (error) {
      console.error('Error logging out:', error);
      showNotification('error', 'Logout Failed', 'Failed to logout. Please try again.');
    }
  };

  // Initialize date and time when booking sheet opens (minimum 3 hours in advance)
  useEffect(() => {
    if (isBookingSheetOpen && !selectedDate) {
      const minDate = getMinDateString();
      setSelectedDate(minDate);
      // Set default time to 3 hours from now (minimum booking window)
      const minTime = getMinTimeString(minDate);
      setSelectedTime(minTime);
      const [hours] = minTime.split(':');
      setSelectedAmPm(parseInt(hours) >= 12 ? 'PM' : 'AM');
      // Initialize start_date with selectedDate
      if (!startDate) {
        setStartDate(minDate);
      }
    }
  }, [isBookingSheetOpen, selectedDate]);

  // Sync startDate with selectedDate when selectedDate changes
  useEffect(() => {
    if (selectedDate && !startDate) {
      setStartDate(selectedDate);
    }
  }, [selectedDate]);

  // Update minimum time and validate selected time when date changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const minTime = getMinTimeString(selectedDate);
      const [minHours, minMinutes] = minTime.split(':').map(Number);
      const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
      
      // If selected time is before minimum time, update it to minimum time
      if (selectedHours < minHours || (selectedHours === minHours && selectedMinutes < minMinutes)) {
        setSelectedTime(minTime);
        const [hours] = minTime.split(':');
        setSelectedAmPm(parseInt(hours) >= 12 ? 'PM' : 'AM');
      }
    }
  }, [selectedDate]);

  // Get minimum time based on selected date (3 hours from now if today, otherwise 00:00)
  const getMinTime = () => {
    if (!selectedDate) return '00:00';
    return getMinTimeString(selectedDate);
  };

  // Check if selected datetime is at least 3 hours in the future
  const isTimeAtLeast3HoursAway = (): boolean => {
    if (!selectedDate || !selectedTime) return false;
    
    try {
      const [hours, minutes] = selectedTime.split(':');
      if (!hours || !minutes) return false;

      const hour24 = parseInt(hours);
      if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return false;

      let dateString = selectedDate;
      if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) return false;
        dateString = parsedDate.toISOString().split('T')[0];
      }

      const dateTimeString = `${dateString}T${String(hour24).padStart(2, '0')}:${minutes}:00`;
      const selectedDateTime = new Date(dateTimeString);
      
      if (isNaN(selectedDateTime.getTime())) return false;
      
      const now = new Date();
      const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      
      return selectedDateTime >= threeHoursFromNow;
    } catch (error) {
      console.error('Error checking time:', error);
      return false;
    }
  };

  // Validate if selected datetime is at least 3 hours in the future (local timezone, IST for Indian users)
  const isValidDateTime = () => {
    return isTimeAtLeast3HoursAway();
  };


  const formatDateTimeDisplay = () => {
    if (!selectedDate || !selectedTime) return '';
    
    const date = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    const hour24 = hours;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    const time12 = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateLabel = 'Tomorrow';
    } else {
      dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return `${dateLabel}, ${time12}`;
  };

  const handleConfirmBooking = async () => {
    if (!user || !profile) {
      showNotification('info', 'Login Required', 'Please login to book a ride');
      window.location.href = '/onboarding';
      return;
    }

    if (!pickup || !drop || !distance) {
      showNotification('error', 'Missing Information', 'Please select both pickup and drop locations');
      return;
    }

    if (!selectedCabType || !selectedTripType || !startDate) {
      showNotification('error', 'Missing Information', 'Please select cab type, trip type, and start date');
      setBookingInProgress(false);
      return;
    }

    // Validate nights for Outstation trips
    if (selectedTripType === 'Outstation' && (!numberOfNights || numberOfNights <= 0)) {
      showNotification('error', 'Missing Information', 'Please specify number of nights for Outstation trips');
      setBookingInProgress(false);
      return;
    }

    setBookingInProgress(true);

    try {
      // Generate booking reference
      const bookingRef = generateBookingRef();
      
      // Use startDate and selectedTime to create scheduled time
      // Ensure we have valid date and time
      if (!startDate || !selectedTime) {
        showNotification('error', 'Missing Information', 'Please select both start date and time');
        setBookingInProgress(false);
        return;
      }

      // selectedTime is already in 24-hour format from the time input
      const [hours, minutes] = selectedTime.split(':');
      if (!hours || !minutes) {
        showNotification('error', 'Invalid Time', 'Please select a valid time');
        setBookingInProgress(false);
        return;
      }

      const hour24 = parseInt(hours);
      if (isNaN(hour24) || hour24 < 0 || hour24 > 23) {
        showNotification('error', 'Invalid Time', 'Please select a valid time');
        setBookingInProgress(false);
        return;
      }

      // Create date string in ISO format (YYYY-MM-DD)
      // Ensure startDate is in correct format
      let dateString = startDate;
      if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If not in YYYY-MM-DD format, try to parse it
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          showNotification('error', 'Invalid Date', 'Please select a valid date');
          setBookingInProgress(false);
          return;
        }
        dateString = parsedDate.toISOString().split('T')[0];
      }

      // Create scheduled time in IST (local timezone)
      // Use local timezone to avoid timezone conversion issues
      const scheduledTimeString = `${dateString}T${String(hour24).padStart(2, '0')}:${minutes}:00`;
      const scheduledTime = new Date(scheduledTimeString);
      
      // Validate that the date is valid
      if (isNaN(scheduledTime.getTime())) {
        showNotification('error', 'Invalid Date/Time', 'The selected date and time combination is invalid. Please try again.');
        setBookingInProgress(false);
        return;
      }
      
      // Validate that scheduled time is at least 3 hours in the future (local timezone, IST for Indian users)
      const now = new Date();
      const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      
      if (scheduledTime < threeHoursFromNow) {
        showNotification('error', 'Invalid Time', 'Bookings must be made at least 3 hours in advance. Please select a later time.');
        setBookingInProgress(false);
        return;
      }

      // Use the already calculated fare (which is based on cab type + trip type)
      const totalPrice = calculatedFare || (() => {
        // Fallback calculation if calculatedFare is null
        const pricingKey = `${selectedCabType}|${selectedTripType}`;
        const baseFare = pricingMap[pricingKey];
        
        if (!baseFare || baseFare === 0) {
          showNotification('error', 'Pricing Not Found', `Pricing not configured for ${selectedCabType} - ${selectedTripType}. Please contact support.`, 'The pricing table may need to be updated in the database.');
          setBookingInProgress(false);
          return 0;
        }
        
        const nights = selectedTripType === 'Outstation' ? numberOfNights : 0;
        return calculateFare(baseFare, nights, nightStayRate);
      })();
      
      if (totalPrice === 0) {
        return; // Error already shown
      }

      // Create booking record
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          booking_ref: bookingRef,
          user_id: user.id,
          user_first_name: profile.first_name,
          user_mobile: profile.mobile,
          pickup_lat: pickup.latitude,
          pickup_lng: pickup.longitude,
          pickup_digipin: pickup.digipin || '',
          pickup_address: pickup.address || '',
          drop_lat: drop.latitude,
          drop_lng: drop.longitude,
          drop_digipin: drop.digipin || '',
          drop_address: drop.address || '',
          distance_km: distance,
          price_total: totalPrice,
          status: 'pending',
          scheduled_time: scheduledTime.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Create booking options record
        const bookingOptionsData: any = {
          booking_id: data.id,
          cab_type: selectedCabType,
          trip_type: selectedTripType,
          start_date: startDate,
        };
        
        // Only add end_date if it exists
        if (endDate) {
          bookingOptionsData.end_date = endDate;
        }
        
        // Only add number_of_nights for Outstation trips
        if (selectedTripType === 'Outstation' && numberOfNights > 0) {
          bookingOptionsData.number_of_nights = numberOfNights;
        }
        
        console.log('📝 Creating booking options with data:', bookingOptionsData);
        
        const { error: optionsError, data: optionsData } = await supabase
          .from('booking_options')
          .insert(bookingOptionsData)
          .select();

        if (optionsError) {
          console.error('❌ Error creating booking options:', optionsError);
          console.error('Error details:', {
            message: optionsError.message,
            details: optionsError.details,
            hint: optionsError.hint,
            code: optionsError.code
          });
          console.error('Attempted to insert:', bookingOptionsData);
          
          // Check if it's a column error (missing column)
          if (optionsError.code === '42703' || optionsError.message?.includes('column') || optionsError.message?.includes('does not exist')) {
            console.error('⚠️ Column error detected. The booking_options table may be missing required columns.');
            console.error('Please ensure the booking_options table has: booking_id, cab_type, trip_type, start_date, end_date, number_of_nights');
          }
          
          // Don't fail the booking if options fail, but log it
          showNotification('info', 'Booking Created', 'Booking created successfully, but some options may not have been saved. Please contact support if this persists.');
        } else {
          console.log('✅ Booking options created successfully:', optionsData);
        }

        // Reset booking state
        setIsBookingSheetOpen(false);
        setPickup(null);
        setDrop(null);
        setDistance(null);
        setRouteGeometry(null);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedAmPm('AM');
        setSelectedCabType('');
        setSelectedTripType('');
        setStartDate('');
        setEndDate('');
        setNumberOfNights(0);
        
        // Redirect to booking status page
        router.push(`/profile/booking-status?ref=${bookingRef}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error instanceof Error) {
        showNotification('error', 'Booking Failed', error.message, 'Please try again.');
      } else {
        showNotification('error', 'Booking Failed', 'An error occurred while creating your booking.', 'Please try again.');
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  // Unlock pickup location and reset booking state
  const handleUnlockPickup = () => {
    // Unlock pickup
    unlockPickup();
    
    // Clear pickup
    setPickup(null);
    setTempPickupDigipin('');
    
    // Clear destination and related state
    setDrop(null);
    setTempDestination(null);
    setIsAdjustingDestination(false);
    setDistance(null);
    setRouteGeometry(null);
    setHighlightDropoff(false);
    
    // Close booking sheet if open
    setIsBookingSheetOpen(false);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedAmPm('AM');
    setSelectedCabType('');
    setSelectedTripType('');
    setStartDate('');
    setEndDate('');
    setNumberOfNights(0);
    
    // Fly back to pickup location if it exists, otherwise keep current view
    if (pickup) {
      safeFlyTo(pickup.latitude, pickup.longitude, 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
    
    console.log('Pickup location unlocked - user can now edit');
  };

  // Edit destination - allow user to change destination even after confirmation
  const handleEditDestination = () => {
    if (!drop) return;
    
    // Store current destination location before clearing
    const currentDrop = { ...drop };
    
    // Set current destination as temp destination for adjustment
    setTempDestination(currentDrop);
    setIsAdjustingDestination(true);
    
    // Clear the confirmed destination temporarily
    setDrop(null);
    setDistance(null);
    setRouteGeometry(null);
    
    // Close booking sheet if open
    setIsBookingSheetOpen(false);
    
    // Fly to destination location for editing
    safeFlyTo(currentDrop.latitude, currentDrop.longitude, 16, {
      duration: 1.5,
      easeLinearity: 0.25
    });
    // Update map center to the destination location
    setMapCenter({ lat: currentDrop.latitude, lng: currentDrop.longitude });
    
    console.log('Destination editing enabled - user can now adjust');
  };

  // Confirm PICKUP location - NO API call, just use DigiPin
  const handleConfirmPickupLocation = async () => {
    if (!mapCenter) return;

    // Check if user is logged in
    if (!user) {
      console.log('User not logged in, redirecting to onboarding...');
      window.location.href = '/onboarding';
      return;
    }

    setLoadingAddress(true);
    try {
      // Generate DigiPin offline using the digipin package
      const generatedDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      console.log('Confirming pickup with DigiPin:', generatedDigipin);

      // NO API CALL - DigiPin package works offline
      // Store pickup with DigiPin as address
      setPickup({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        address: generatedDigipin, // Use DigiPin as address
        digipin: generatedDigipin,
        // Administrative info not available without API, set to empty
        locality: undefined,
        pincode: undefined,
        district: undefined,
        state: undefined,
      });

      // LOCK the pickup location
      lockPickup();

      // Refresh saved addresses when pickup is locked (in case user added/updated them)
      if (user) {
        fetchSavedAddresses(user.id);
      }

      // Highlight drop-off field to guide user
      setHighlightDropoff(true);
      // Auto-remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightDropoff(false);
      }, 5000);

      console.log('Pickup location confirmed and locked (offline):', {
        digipin: generatedDigipin,
        coordinates: { lat: mapCenter.lat, lng: mapCenter.lng }
      });

    } catch (error) {
      console.error('❌ Error confirming pickup location:', error);
      showNotification('error', 'Location Error', 'Unable to confirm pickup location.', 'Please try again.');
    } finally {
      setLoadingAddress(false);
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-gray-100 safe-area-insets" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {/* Full-screen Map */}
      <div className="absolute inset-0 z-0">
        <Map
          onMoveEnd={(center) => setMapCenter(center)}
          onLoad={() => console.log('Map Loaded')}
          onMapReady={(mapInstance) => {
            mapInstanceRef.current = mapInstance;
            setMapReady(true);
            console.log('Map instance ready for control');
          }}
        />

        {/* Center Pin for Selection - Mobile Optimized */}
        {/* Show different pin colors based on mode */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999] -mt-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Outer pulsing ring - Green for destination adjustment, Orange for pickup */}
              <span className="relative flex h-5 w-5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAdjustingDestination ? 'bg-green-500' : 'bg-budget-accent'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-5 w-5 ${isAdjustingDestination ? 'bg-green-500' : 'bg-budget-accent'} border-2 border-white shadow-xl`}></span>
              </span>
              {/* Pin stem */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0.5 w-1 h-6 ${isAdjustingDestination ? 'bg-green-600' : 'bg-budget-brand/80'} rounded-full shadow-lg`}></div>
              {/* Pin tip shadow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/15 rounded-full blur-sm"></div>
            </div>
            {/* Adjustment mode label */}
          </div>
        </div>
      </div>

      {/* Floating UI Elements with Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        {/* Gradient Overlay Background - adjusted for smaller UI */}
        <div className="absolute inset-0 pointer-events-none" 
             style={{ 
               background: 'linear-gradient(to bottom, rgb(0, 169, 157) 0%, rgba(128, 255, 246,0.40) 40%, rgba(255,255,255,0.20) 70%, rgba(255,255,255,0.1) 90%, transparent 100%)',
               height: 'clamp(200px, 30vh, 280px)'
             }}>
        </div>
        
        {/* Content - with safe area top inset and responsive padding */}
        <div className="relative px-3 pt-4 pb-1 sm:px-4 sm:pt-10 sm:pb-1.5 flex flex-col gap-1 sm:gap-2 pointer-events-auto max-h-[100dvh]">
          {/* Header/Branding */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md border border-white/50 flex-shrink-0 hover:bg-white transition-colors cursor-pointer active:scale-95 transition-transform"
            >
              <img src="/android-chrome-192x192.png" alt="Logo" className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex-shrink-0" />
              <h1 className="text-sm sm:text-base font-bold leading-none whitespace-nowrap">
                <span className="text-budget-brand">Budget</span><span className="text-budget-warn">Cab</span><span className="text-white">s</span>
              </h1>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => router.push('/about')}
                className="hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md border border-white/50 hover:bg-white transition-colors text-xs sm:text-sm font-medium text-gray-700"
              >
                About
              </button>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-md border border-white/50 hover:bg-white transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-budget-brand flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800 whitespace-nowrap hidden xs:inline">
                      {profile?.first_name || 'User'}
                    </span>
                    <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600 transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100">
                      <button
                        onClick={() => {
                          router.push('/about');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100"
                      >
                        <span>About Us</span>
                      </button>
                      <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{profile?.email}</p>
                        {profile?.mobile && (
                          <p className="text-xs text-gray-500 mt-1">{profile.mobile}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span className="font-semibold">My Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <a href="/onboarding" className="text-xs font-bold text-budget-brand bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-white/50 hover:bg-white transition-colors">
                  Login / Signup
                </a>
              )}
            </div>
          </div>

          {/* Search Section */}
          <div className="w-full max-w-md mx-auto flex flex-col gap-1.5 sm:gap-2 mt-1 sm:mt-2">
            {/* Pickup Location with Locate Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <LocationSearch
                  placeholder={pickupLocked ? (pickup?.address || "Pickup Locked") : (tempPickupDigipin || "Search Location or DigiPin")}
                  onSelect={(loc) => {
                    if (!pickupLocked) {
                      console.log('Selected pickup location from autocomplete:', loc);
                      
                      // Generate DigiPin if not provided in autocomplete response
                      const selectedDigipin = loc.digipin || digipin.getDIGIPINFromLatLon(loc.latitude, loc.longitude);
                      
                      // Fly to selected location on map
                      if (loc.latitude && loc.longitude) {
                        safeFlyTo(loc.latitude, loc.longitude, 17, {
                          duration: 1.5,
                          easeLinearity: 0.25
                        });
                        
                        // Update map center to trigger DigiPin generation and display
                        setMapCenter({ lat: loc.latitude, lng: loc.longitude });
                        
                        // Set pickup location with DigiPin
                        setPickup({
                          ...loc,
                          digipin: selectedDigipin,
                        });
                        
                        // Update temp DigiPin display immediately
                        setTempPickupDigipin(selectedDigipin);
                        
                        console.log('Flying to pickup location. DigiPin:', selectedDigipin);
                      } else {
                        // Fallback: set pickup even if map instance not ready
                        setPickup({
                          ...loc,
                          digipin: selectedDigipin,
                        });
                        setTempPickupDigipin(selectedDigipin);
                      }
                    }
                  }}
                  value={pickupLocked ? pickup?.address : tempPickupDigipin}
                  disabled={pickupLocked}
                  onClear={() => {
                    if (!pickupLocked) {
                      setPickup(null);
                      setTempPickupDigipin('');
                    } else {
                      // If pickup is locked, unlock it and clear
                      handleUnlockPickup();
                    }
                  }}
                />
              </div>
              {pickupLocked ? (
                <button
                  onClick={handleUnlockPickup}
                  className="flex-shrink-0 bg-budget-brand hover:bg-budget-brand/90 active:scale-95 p-2.5 rounded-full shadow-lg transition-all"
                  title="Edit pickup location"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords;
                          
                          // Fly to user location
                          safeFlyTo(latitude, longitude, 17, {
                            duration: 2,
                            easeLinearity: 0.25
                          });

                          setMapCenter({ lat: latitude, lng: longitude });
                        },
                        (error) => {
                          console.error('Geolocation error:', error);
                          showNotification('error', 'Location Error', 'Could not get your location.', 'Please check your browser settings.');
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    } else {
                      showNotification('error', 'Not Supported', 'Geolocation is not supported by your browser.');
                    }
                  }}
                  className="flex-shrink-0 active:scale-95 p-2.5 rounded-full shadow-lg transition-all"
                  style={{ backgroundColor: '#FFC107' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
                  title="Use my current location"
                >
                  <Navigation className="w-4 h-4 text-white fill-current" />
                </button>
              )}
            </div>

            {/* Destination - Always visible, but disabled until pickup locked */}
            <div className="relative flex-shrink-0 flex items-center gap-2">
              <div className="flex-1">
                <LocationSearch
                  placeholder={pickupLocked && !isAdjustingDestination ? (drop ? drop.address : "Search Destination or Digipin") : "City/Places/Digipin"}
                  disabled={!pickupLocked || isAdjustingDestination}
                  highlight={highlightDropoff && pickupLocked && !drop}
                  onSelect={(loc) => {
                    if (pickupLocked && !isAdjustingDestination) {
                      // Stop highlighting when user selects a location
                      setHighlightDropoff(false);
                      
                      console.log('Selected destination from autocomplete:', loc);
                      
                      // FlyTo destination on map
                      if (loc.latitude && loc.longitude) {
                        safeFlyTo(loc.latitude, loc.longitude, 16, {
                          duration: 1.5,
                          easeLinearity: 0.25
                        });
                        
                        // Set as temporary destination for adjustment
                        setTempDestination(loc);
                        setIsAdjustingDestination(true);
                        
                        console.log('Flying to destination. User can now adjust pin.');
                      }
                    }
                  }}
                  value={drop?.address}
                  onClear={() => {
                    if (pickupLocked && !isAdjustingDestination) {
                      setDrop(null);
                      setDistance(null);
                      setRouteGeometry(null);
                      
                      // Close booking sheet if open
                      setIsBookingSheetOpen(false);
                      
                      // If map center exists, set temp destination so user can confirm the pin position
                      if (mapCenter) {
                        const destinationDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
                        setTempDestination({
                          latitude: mapCenter.lat,
                          longitude: mapCenter.lng,
                          address: destinationDigipin,
                          digipin: destinationDigipin,
                        });
                        setIsAdjustingDestination(true);
                      } else {
                        setTempDestination(null);
                        setIsAdjustingDestination(false);
                      }
                      
                      // Re-highlight when cleared
                      setHighlightDropoff(true);
                      setTimeout(() => {
                        setHighlightDropoff(false);
                      }, 5000);
                    }
                  }}
                />
              </div>
              {pickupLocked && drop && !isAdjustingDestination && (
                <button
                  onClick={handleEditDestination}
                  className="flex-shrink-0 bg-budget-accent hover:bg-budget-accent/90 active:scale-95 p-2.5 rounded-full shadow-lg transition-all"
                  title="Edit destination location"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
            
            {/* Quick-select buttons for saved addresses - Below destination search */}
            {pickupLocked && !isAdjustingDestination && !drop && (savedAddresses.home || savedAddresses.work) && (
              <div className="mt-1.5 sm:mt-2 space-y-1 flex-shrink-0">
                {savedAddresses.home && (
                  <button
                    onClick={() => {
                      const homeAddr = savedAddresses.home;
                      const fullAddress = `${homeAddr.house_road_name}${homeAddr.locality ? `, ${homeAddr.locality}` : ''}`;
                      const destination = {
                        latitude: homeAddr.latitude,
                        longitude: homeAddr.longitude,
                        address: fullAddress,
                        digipin: homeAddr.digipin || '',
                        locality: homeAddr.locality,
                        pincode: homeAddr.pincode,
                        district: homeAddr.district,
                        state: homeAddr.state,
                      };
                      
                      // Fly to home location
                      safeFlyTo(homeAddr.latitude, homeAddr.longitude, 16, {
                        duration: 1.5,
                        easeLinearity: 0.25
                      });
                      
                      setTempDestination(destination);
                      setIsAdjustingDestination(true);
                      setHighlightDropoff(false);
                      console.log('Selected Home address:', destination);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-lg hover:bg-white transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-budget-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800">Home</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{savedAddresses.home?.house_road_name}{savedAddresses.home?.locality ? `, ${savedAddresses.home.locality}` : ''}</p>
                    </div>
                  </button>
                )}
                {savedAddresses.work && (
                  <button
                    onClick={() => {
                      const workAddr = savedAddresses.work;
                      const fullAddress = `${workAddr.house_road_name}${workAddr.locality ? `, ${workAddr.locality}` : ''}`;
                      const destination = {
                        latitude: workAddr.latitude,
                        longitude: workAddr.longitude,
                        address: fullAddress,
                        digipin: workAddr.digipin || '',
                        locality: workAddr.locality,
                        pincode: workAddr.pincode,
                        district: workAddr.district,
                        state: workAddr.state,
                      };
                      
                      // Fly to work location
                      safeFlyTo(workAddr.latitude, workAddr.longitude, 16, {
                        duration: 1.5,
                        easeLinearity: 0.25
                      });
                      
                      setTempDestination(destination);
                      setIsAdjustingDestination(true);
                      setHighlightDropoff(false);
                      console.log('Selected Work address:', destination);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-lg hover:bg-white transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-budget-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800">Work</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{savedAddresses.work?.house_road_name}{savedAddresses.work?.locality ? `, ${savedAddresses.work.locality}` : ''}</p>
                    </div>
                  </button>
                )}
              </div>
            )}
            
            {/* Hint message when pickup is locked but drop-off not selected and no saved addresses */}
            {pickupLocked && !drop && !isAdjustingDestination && !savedAddresses.home && !savedAddresses.work && (
              <div className="mt-2 px-3 py-2 bg-budget-brand/10 border border-budget-brand/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-budget-brand font-semibold flex items-center gap-2">
                  <span>✨</span>
                  <span>Great! Now select your Destination</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Location Button */}
      {!isBookingSheetOpen && !pickupLocked && (
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-safe-bottom z-[1001] safe-area-insets-bottom" style={{ paddingBottom: 'max(64px, calc(64px + env(safe-area-inset-bottom, 0px)))' }}>
          <button
            onClick={handleConfirmPickupLocation}
            disabled={loadingAddress || !mapCenter}
            className="w-full bg-budget-brand text-white font-bold py-3 sm:py-4 md:py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-budget-brand/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-2 border-white/20 text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] md:min-h-[56px]"
          >
            {loadingAddress ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-sm sm:text-base">Confirming Location...</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-base">Confirm Pickup Location</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirm Destination Button - Shows when destination is selected and being adjusted */}
      {!isBookingSheetOpen && pickupLocked && isAdjustingDestination && (
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-safe-bottom z-[1001] safe-area-insets-bottom" style={{ paddingBottom: 'max(48px, calc(48px + env(safe-area-inset-bottom, 0px)))' }}>
          <button
            onClick={async () => {
              // Confirm the adjusted destination
              if (tempDestination && tempDestination.latitude && tempDestination.longitude) {
                // Ensure all required fields are present, especially digipin
                const destinationDigipin = tempDestination.digipin || digipin.getDIGIPINFromLatLon(tempDestination.latitude, tempDestination.longitude);
                const confirmedDestination = {
                  latitude: tempDestination.latitude,
                  longitude: tempDestination.longitude,
                  address: tempDestination.address || destinationDigipin,
                  digipin: destinationDigipin,
                  locality: tempDestination.locality,
                  pincode: tempDestination.pincode,
                  district: tempDestination.district,
                  state: tempDestination.state,
                };
                
                console.log('Confirming destination:', confirmedDestination);
                
                // First, exit adjustment mode and clear temp destination
                setIsAdjustingDestination(false);
                setTempDestination(null);
                
                // Then set the drop location - this will trigger route calculation via useEffect
                setDrop(confirmedDestination);
                
                // Use requestAnimationFrame to ensure state updates are processed
                // before opening the booking sheet
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setIsBookingSheetOpen(true);
                    console.log('Destination confirmed and locked, booking sheet opened');
                  });
                });
              } else {
                console.error('Cannot confirm destination: missing required fields', tempDestination);
              }
            }}
            disabled={!tempDestination || !tempDestination.latitude || !tempDestination.longitude}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 sm:py-4 md:py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:shadow-green-600/50 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-2 border-white/20 text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] md:min-h-[56px]"
          >
            <>
              <span className="text-sm sm:text-base">Confirm Destination</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            </>
          </button>
        </div>
      )}

      {/* Show booking sheet button - Shows when destination is confirmed but sheet not open */}
      {!isBookingSheetOpen && pickupLocked && drop && !isAdjustingDestination && (
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-safe-bottom z-[1001] safe-area-insets-bottom" style={{ paddingBottom: 'max(32px, calc(32px + env(safe-area-inset-bottom, 0px)))' }}>
          <button
            onClick={() => setIsBookingSheetOpen(true)}
            disabled={loadingRoute}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 sm:py-4 md:py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:shadow-blue-600/50 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-2 border-white/20 text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] md:min-h-[56px]"
          >
            {loadingRoute ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-sm sm:text-base">Calculating Route...</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-base">💳 View Fare & Book</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Booking Bottom Sheet */}
      <BottomSheet
        isOpen={isBookingSheetOpen}
        onClose={() => {
          setIsBookingSheetOpen(false);
          setSelectedDate('');
          setSelectedTime('');
          setSelectedAmPm('AM');
          setSelectedCabType('');
          setSelectedTripType('');
          setStartDate('');
          setEndDate('');
        }}
      >
        <div className="space-y-6">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Booking</h2>
              <p className="text-sm text-gray-500">Select a date and time slot</p>
            </div>
            <button
              onClick={() => {
                setIsBookingSheetOpen(false);
                setSelectedDate('');
                setSelectedTime('');
                setSelectedAmPm('AM');
                setSelectedCabType('');
                setSelectedTripType('');
                setStartDate('');
                setEndDate('');
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Date and Time Picker */}
          <div className="space-y-4">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-budget-brand" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDateString()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium"
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-budget-brand" />
                Select Time
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    console.log('Time changed to:', newTime);
                    setSelectedTime(newTime);
                    // Auto-adjust AM/PM based on selected time (24-hour format)
                    if (newTime) {
                      const [hours] = newTime.split(':').map(Number);
                      // Sync AM/PM with the 24-hour time value
                      if (hours >= 12) {
                        setSelectedAmPm('PM');
                      } else {
                        setSelectedAmPm('AM');
                      }
                    }
                  }}
                  min={getMinTime()}
                  className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-gray-800 font-medium ${
                    selectedDate && selectedTime && !isTimeAtLeast3HoursAway()
                      ? 'border-yellow-400 focus:border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 focus:border-budget-accent'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTime) {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        // Convert current 24-hour time to AM equivalent (0-11 range)
                        // Examples: 0->0, 1->1, 11->11, 12->0, 13->1, 23->11
                        let hour24 = hours;
                        if (hours >= 12) {
                          hour24 = hours === 12 ? 0 : hours - 12;
                        }
                        const newTime = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        console.log('AM clicked, converting', hours, 'to', hour24, 'new time:', newTime);
                        setSelectedTime(newTime);
                        setSelectedAmPm('AM');
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedAmPm === 'AM'
                        ? 'bg-budget-brand text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTime) {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        // Convert current 24-hour time to PM equivalent (12-23 range)
                        // Examples: 0->12, 1->13, 11->23, 12->12, 13->13, 23->23
                        let hour24 = hours;
                        if (hours < 12) {
                          hour24 = hours === 0 ? 12 : hours + 12;
                        }
                        const newTime = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        console.log('PM clicked, converting', hours, 'to', hour24, 'new time:', newTime);
                        setSelectedTime(newTime);
                        setSelectedAmPm('PM');
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedAmPm === 'PM'
                        ? 'bg-budget-brand text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
              {/* Warning message if time is less than 3 hours away */}
              {selectedDate && selectedTime && !isTimeAtLeast3HoursAway() && (
                <div className="mt-2 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span>⚠️ Bookings must be made at least 3 hours in advance. Please select a later time.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Trip Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Route className="w-4 h-4 text-budget-brand" />
                Trip Type
              </label>
              <select
                value={selectedTripType}
                onChange={(e) => {
                  setSelectedTripType(e.target.value);
                  // Reset nights when trip type changes
                  if (e.target.value !== 'Outstation') {
                    setNumberOfNights(0);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium bg-white appearance-none cursor-pointer"
                required
              >
                <option value="">Select Trip Type</option>
                <option value="Airport Transfer">Airport Transfer</option>
                <option value="Local">Local</option>
                <option value="Outstation">Outstation</option>
                <option value="One Way">One Way</option>
              </select>
            </div>

            {/* Number of Nights - Only for Outstation trips */}
            {selectedTripType === 'Outstation' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-budget-brand" />
                  Number of Nights
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={numberOfNights || ''}
                  onChange={(e) => setNumberOfNights(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium"
                  placeholder="Enter number of nights"
                  required={selectedTripType === 'Outstation'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Night stay charges: ₹{nightStayRate} per night
                </p>
              </div>
            )}

            {/* Cab Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-budget-brand" />
                Cab Type
              </label>
              <select
                value={selectedCabType}
                onChange={(e) => setSelectedCabType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium bg-white appearance-none cursor-pointer"
                required
              >
                <option value="">Select Cab Type</option>
                {vehicleTypes.map((vehicle) => (
                  <option key={vehicle.name} value={vehicle.name}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date and End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-budget-brand" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDateString()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-budget-brand" />
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDateString()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-budget-accent focus:outline-none transition-colors text-gray-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Price Estimate */}
          <div className="grid grid-cols-2 gap-4 mb-0">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-2xl border border-green-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Estimated Fare</p>
              {SHOW_PRICING_TO_USERS ? (
                <>
                  <p className="text-2xl font-bold text-green-600">
                    {loadingRoute ? (
                      <span className="text-lg">Calculating...</span>
                    ) : calculatedFare !== null ? (
                      `₹${calculatedFare.toFixed(2)}`
                    ) : (
                      '₹--'
                    )}
                  </p>
                  {calculatedFare !== null && selectedCabType && selectedTripType && (() => {
                    const pricingKey = `${selectedCabType}|${selectedTripType}`;
                    const baseFare = pricingMap[pricingKey];
                    if (!baseFare) return null;
                    
                    const nights = selectedTripType === 'Outstation' ? numberOfNights : 0;
                    const nightStayCharges = nights > 0 ? nights * nightStayRate : 0;
                    
                    return (
                      <>
                        <p className="text-xs text-gray-500 mt-1">
                          Base Fare: ₹{baseFare}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedCabType.split(' ')[0]} - {selectedTripType}
                        </p>
                        {nights > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Night Stay ({nights} night{nights > 1 ? 's' : ''} @ ₹{nightStayRate}/night): ₹{nightStayCharges}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <p className="text-lg sm:text-xl font-semibold text-gray-600 mt-1">
                  Price on confirmation
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
              <p className="text-2xl font-bold text-blue-600">
                {loadingRoute ? (
                  <span className="text-lg">Calculating...</span>
                ) : distance ? (
                  `${distance.toFixed(2)} km`
                ) : (
                  '--'
                )}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="w-full bg-budget-brand text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleConfirmBooking}
            disabled={bookingInProgress || loadingRoute || !selectedDate || !selectedTime || !isValidDateTime() || !selectedCabType || !selectedTripType || !startDate || (selectedTripType === 'Outstation' && (!numberOfNights || numberOfNights <= 0))}
          >
            {bookingInProgress ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Booking...
              </>
            ) : loadingRoute ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Calculating...
              </>
            ) : !selectedDate || !selectedTime ? (
              <>
                <Clock className="w-5 h-5" />
                Select Date & Time
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Confirm Booking
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </BottomSheet>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />
    </main>
  );
}
