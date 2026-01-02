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
import { Calendar, Clock, ArrowRight, LogOut, User as UserIcon, Navigation, ChevronDown, X, Edit2, Home as HomeIcon, Briefcase } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import L from 'leaflet';
import { generateBookingRef, calculateFare, getTimeSlotType, TimeSlotType } from '@/lib/booking';

export default function Home() {
  const router = useRouter();
  const { pickup, drop, setPickup, setDrop, pickupLocked, lockPickup, unlockPickup, reset } = useBookingStore();
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [tempPickupDigipin, setTempPickupDigipin] = useState<string>(''); // Real-time DigiPin display
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  const [pricingRules, setPricingRules] = useState<{
    office_hours: { base_fare: number; per_km_rate: number } | null;
    night_hours: { base_fare: number; per_km_rate: number } | null;
    regular_time: { base_fare: number; per_km_rate: number } | null;
  }>({
    office_hours: null,
    night_hours: null,
    regular_time: null,
  });
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlotType>('regular_time');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

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

    // Fetch pricing rules
    fetchPricingRules();

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

  // Helper function to find matching pricing rule from database based on time
  const findPricingRuleForTime = (hours: number, minutes: number) => {
    const pricingData = (window as any).pricingRulesData;
    if (!pricingData || !Array.isArray(pricingData)) {
      return null;
    }

    const currentTimeInMinutes = hours * 60 + minutes;

    // Sort by priority (highest first) and check each rule
    const sortedRules = [...pricingData].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      if (!rule.start_time || !rule.end_time) continue;

      const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
      const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;

      // Check if time falls within range
      let isInRange = false;
      
      if (startTimeInMinutes <= endTimeInMinutes) {
        // Normal range (e.g., 8:00 to 11:00)
        isInRange = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
      } else {
        // Overnight range (e.g., 23:00 to 05:00)
        isInRange = currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
      }

      if (isInRange) {
        return rule;
      }
    }

    return null;
  };

  // Recalculate fare when time, date, distance, or pricing rules change
  useEffect(() => {
    console.log('🔄 Fare recalculation triggered:', {
      selectedDate,
      selectedTime,
      selectedAmPm,
      distance,
      hasPricingRules: !!pricingRules.regular_time
    });

    if (!distance || !pricingRules.regular_time) {
      console.log('⚠️ Missing distance or pricing rules');
      setCalculatedFare(null);
      return;
    }

    try {
      // Determine time slot from database
      let matchedRule = null;
      let timeSlot: TimeSlotType = 'regular_time';
      
      if (selectedDate && selectedTime) {
        // selectedTime is already kept in 24-hour format by our handlers
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const hour24 = hours % 24; // Ensure it's within 0-23 range
        
        // Find matching rule from database
        matchedRule = findPricingRuleForTime(hour24, minutes);
        
        if (matchedRule) {
          timeSlot = matchedRule.time_slot_type as TimeSlotType;
          console.log('⏰ Time slot determined from DB:', timeSlot, 'for time:', `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
          console.log('📋 Matched rule:', matchedRule);
        } else {
          console.log('⚠️ No matching rule found, using regular_time');
        }
      }

      setCurrentTimeSlot(timeSlot);
      
      // Get pricing from matched rule or fallback
      let currentPricing;
      if (matchedRule) {
        currentPricing = {
          base_fare: matchedRule.base_fare,
          per_km_rate: matchedRule.per_km_rate
        };
      } else {
        currentPricing = pricingRules[timeSlot] || pricingRules.regular_time || { base_fare: 50, per_km_rate: 15 };
      }
      
      console.log('💰 Pricing for', timeSlot, ':', currentPricing);
      
      // Calculate fare
      const fare = calculateFare(distance, currentPricing.base_fare, currentPricing.per_km_rate, timeSlot);
      console.log('✅ Calculated fare:', fare);
      setCalculatedFare(fare);
    } catch (error) {
      console.error('❌ Error recalculating fare:', error);
      // Fallback to regular time pricing
      const fallbackPricing = pricingRules.regular_time || { base_fare: 50, per_km_rate: 15 };
      const fare = calculateFare(distance, fallbackPricing.base_fare, fallbackPricing.per_km_rate, 'regular_time');
      setCalculatedFare(fare);
      setCurrentTimeSlot('regular_time');
    }
  }, [selectedDate, selectedTime, selectedAmPm, distance, pricingRules]);

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

  const fetchPricingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('id, base_fare, per_km_rate, time_slot_type, start_time, end_time, priority')
        .order('priority', { ascending: false });
      
      if (error) {
        console.error('Error fetching pricing rules:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Use defaults if fetch fails
        console.warn('Using default pricing: ₹50 base + ₹15/km');
        setPricingRules({
          office_hours: { base_fare: 60, per_km_rate: 18 },
          night_hours: { base_fare: 70, per_km_rate: 20 },
          regular_time: { base_fare: 50, per_km_rate: 15 },
        });
        return;
      }

      if (data && data.length > 0) {
        // Store all rules for time-based lookup
        (window as any).pricingRulesData = data;
        
        // Also keep simplified rules for fallback
        const rules: {
          office_hours: { base_fare: number; per_km_rate: number } | null;
          night_hours: { base_fare: number; per_km_rate: number } | null;
          regular_time: { base_fare: number; per_km_rate: number } | null;
        } = {
          office_hours: null,
          night_hours: null,
          regular_time: null,
        };

        data.forEach((rule: any) => {
          const slotType = rule.time_slot_type || 'regular_time';
          if (slotType in rules && !rules[slotType as TimeSlotType]) {
            rules[slotType as TimeSlotType] = {
              base_fare: rule.base_fare,
              per_km_rate: rule.per_km_rate,
            };
          }
        });

        // Fill in defaults for missing time slots
        if (!rules.office_hours) {
          rules.office_hours = { base_fare: 60, per_km_rate: 18 };
        }
        if (!rules.night_hours) {
          rules.night_hours = { base_fare: 70, per_km_rate: 20 };
        }
        if (!rules.regular_time) {
          rules.regular_time = { base_fare: 50, per_km_rate: 15 };
        }

        setPricingRules(rules);
        console.log('Pricing rules loaded from database:', data);
      } else {
        console.warn('No pricing rules found in database. Using defaults.');
        setPricingRules({
          office_hours: { base_fare: 60, per_km_rate: 18 },
          night_hours: { base_fare: 70, per_km_rate: 20 },
          regular_time: { base_fare: 50, per_km_rate: 15 },
        });
      }
    } catch (error) {
      console.error('Failed to fetch pricing rules:', error);
      // Use defaults
      console.warn('Using default pricing.');
      setPricingRules({
        office_hours: { base_fare: 60, per_km_rate: 18 },
        night_hours: { base_fare: 70, per_km_rate: 20 },
        regular_time: { base_fare: 50, per_km_rate: 15 },
      });
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
        timeSlot: getTimeSlotLabel(),
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

  // Initialize date to today when booking sheet opens
  useEffect(() => {
    if (isBookingSheetOpen && !selectedDate) {
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
      // Set default time to current hour + 1, or 9 AM if current hour is late
      const currentHour = today.getHours();
      const defaultHour = currentHour >= 20 ? 9 : currentHour + 1;
      setSelectedTime(String(defaultHour).padStart(2, '0') + ':00');
      setSelectedAmPm(defaultHour >= 12 ? 'PM' : 'AM');
    }
  }, [isBookingSheetOpen, selectedDate]);

  // Get minimum time for today (current time + 15 minutes buffer)
  const getMinTime = () => {
    const today = new Date();
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    
    if (selectedDateObj && selectedDateObj.toDateString() === today.toDateString()) {
      // If today is selected, minimum time is current time + 15 minutes
      const minTime = new Date(today.getTime() + 15 * 60 * 1000); // Add 15 minutes
      const hours = String(minTime.getHours()).padStart(2, '0');
      const minutes = String(minTime.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '00:00'; // For future dates, any time is allowed
  };

  // Validate if selected datetime is in the future
  const isValidDateTime = () => {
    if (!selectedDate || !selectedTime) return false;
    
    // Time input is already in 24-hour format matching the AM/PM selection
    // (because AM/PM buttons adjust the time value)
    const dateTimeString = `${selectedDate}T${selectedTime}:00`;
    const selectedDateTime = new Date(dateTimeString);
    const now = new Date();
    
    return selectedDateTime > now;
  };

  // Check and update date to tomorrow if selected datetime is in the past
  // This ensures that when time crosses midnight, the date automatically moves to the next day
  // Also applies 15-minute buffer logic (same as getMinTime but for tomorrow)
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;
    
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    const minTimeWithBuffer = new Date(now.getTime() + 15 * 60 * 1000); // Current time + 15 minutes
    
    // If selected datetime is in the past or less than 15 minutes from now, adjust it
    if (selectedDateTime <= minTimeWithBuffer) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      // Apply 15-minute buffer logic: current time + 15 minutes
      const minBufferTime = new Date(now.getTime() + 15 * 60 * 1000);
      const hours = String(minBufferTime.getHours()).padStart(2, '0');
      const minutes = String(minBufferTime.getMinutes()).padStart(2, '0');
      const adjustedTime = `${hours}:${minutes}`;
      
      setSelectedDate(tomorrowString);
      setSelectedTime(adjustedTime);
      const adjustedHours = minBufferTime.getHours();
      setSelectedAmPm(adjustedHours >= 12 ? 'PM' : 'AM');
    }
  }, [selectedDate, selectedTime]); // Check when either date or time changes

  // Helper function to get current time slot using database time ranges
  const getCurrentTimeSlot = (): TimeSlotType => {
    if (!selectedDate || !selectedTime) {
      return 'regular_time';
    }

    try {
      // Convert selected date/time to hours and minutes
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const hour24 = hours % 24;
      
      // Find matching rule from database
      const matchedRule = findPricingRuleForTime(hour24, minutes);
      
      if (matchedRule && matchedRule.time_slot_type) {
        return matchedRule.time_slot_type as TimeSlotType;
      }
      
      return 'regular_time';
    } catch (error) {
      console.error('Error getting current time slot:', error);
      return 'regular_time';
    }
  };

  // Helper function to get pricing based on selected date/time using database
  const getCurrentPricing = () => {
    if (!selectedDate || !selectedTime) {
      return pricingRules.regular_time || { base_fare: 50, per_km_rate: 15 };
    }

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const hour24 = hours % 24;
      
      const matchedRule = findPricingRuleForTime(hour24, minutes);
      
      if (matchedRule) {
        return {
          base_fare: matchedRule.base_fare,
          per_km_rate: matchedRule.per_km_rate
        };
      }
    } catch (error) {
      console.error('Error getting current pricing:', error);
    }

    const timeSlotType = getCurrentTimeSlot();
    return pricingRules[timeSlotType] || pricingRules.regular_time || { base_fare: 50, per_km_rate: 15 };
  };

  // Helper function to get time slot label
  const getTimeSlotLabel = (): string => {
    const labels: Record<TimeSlotType, string> = {
      office_hours: 'Office Hours',
      night_hours: 'Night Hours',
      regular_time: 'Regular Time',
    };
    return labels[currentTimeSlot];
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

    setBookingInProgress(true);

    try {
      // Generate booking reference
      const bookingRef = generateBookingRef();
      
      // Use selected date and time or default to 1 hour from now
      // Time input is already in 24-hour format matching the AM/PM selection
      let scheduledTime: Date;
      if (selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        const hour24 = selectedAmPm === 'PM' && parseInt(hours) !== 12 
          ? parseInt(hours) + 12 
          : selectedAmPm === 'AM' && parseInt(hours) === 12 
            ? 0 
            : parseInt(hours);
        scheduledTime = new Date(`${selectedDate}T${String(hour24).padStart(2, '0')}:${minutes}:00`);
        
        // Validate that scheduled time is in the future
        const now = new Date();
        if (scheduledTime <= now) {
          showNotification('error', 'Invalid Time', 'Please select a future date and time. The selected time has already passed.');
          setBookingInProgress(false);
          return;
        }
      } else {
        scheduledTime = new Date();
        scheduledTime.setHours(scheduledTime.getHours() + 1);
      }

      // Use the already calculated fare (which is based on selected time)
      const totalPrice = calculatedFare || (() => {
        // Fallback calculation if calculatedFare is null
        const timeSlotType = getTimeSlotType(scheduledTime);
        const currentPricing = pricingRules[timeSlotType] || pricingRules.regular_time || { base_fare: 50, per_km_rate: 15 };
        return calculateFare(distance, currentPricing.base_fare, currentPricing.per_km_rate, timeSlotType);
      })();

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
        // Reset booking state
        setIsBookingSheetOpen(false);
        setPickup(null);
        setDrop(null);
        setDistance(null);
        setRouteGeometry(null);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedAmPm('AM');
        
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
    
    // Fly back to pickup location if it exists, otherwise keep current view
    if (pickup && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pickup.latitude, pickup.longitude], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
    
    console.log('Pickup location unlocked - user can now edit');
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
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAdjustingDestination ? 'bg-green-500' : 'bg-maahi-accent'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-5 w-5 ${isAdjustingDestination ? 'bg-green-500' : 'bg-maahi-accent'} border-2 border-white shadow-xl`}></span>
              </span>
              {/* Pin stem */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0.5 w-1 h-6 ${isAdjustingDestination ? 'bg-green-600' : 'bg-maahi-brand/80'} rounded-full shadow-lg`}></div>
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
                <span className="text-maahi-brand">Maah</span><span className="text-maahi-warn">iC</span><span className="text-maahi-accent">abs</span>
              </h1>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-md border border-white/50 hover:bg-white transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-maahi-brand flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800 whitespace-nowrap hidden xs:inline">
                      {profile?.first_name || 'User'}
                    </span>
                    <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600 transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100">
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
                <a href="/onboarding" className="text-xs font-bold text-maahi-brand bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-white/50 hover:bg-white transition-colors">
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
                  placeholder={pickupLocked ? (pickup?.address || "Pickup Locked") : (tempPickupDigipin || "Search Pickup Location")}
                  onSelect={(loc) => {
                    if (!pickupLocked) {
                      console.log('Selected pickup location from autocomplete:', loc);
                      
                      // Generate DigiPin if not provided in autocomplete response
                      const selectedDigipin = loc.digipin || digipin.getDIGIPINFromLatLon(loc.latitude, loc.longitude);
                      
                      // Fly to selected location on map
                      if (mapInstanceRef.current && loc.latitude && loc.longitude) {
                        mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 17, {
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
                  className="flex-shrink-0 bg-maahi-brand hover:bg-maahi-brand/90 active:scale-95 p-2.5 rounded-full shadow-lg transition-all"
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
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([latitude, longitude], 17, {
                              duration: 2,
                              easeLinearity: 0.25
                            });
                          }

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
            <div className="relative flex-shrink-0">
              <LocationSearch
                placeholder={pickupLocked && !isAdjustingDestination ? "Search Drop-off Location" : "Drop-off Location"}
                disabled={!pickupLocked || isAdjustingDestination}
                highlight={highlightDropoff && pickupLocked && !drop}
                onSelect={(loc) => {
                if (pickupLocked && !isAdjustingDestination) {
                  // Stop highlighting when user selects a location
                  setHighlightDropoff(false);
                  
                  console.log('Selected destination from autocomplete:', loc);
                  
                  // FlyTo destination on map
                  if (mapInstanceRef.current && loc.latitude && loc.longitude) {
                    mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 16, {
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
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([homeAddr.latitude, homeAddr.longitude], 16, {
                          duration: 1.5,
                          easeLinearity: 0.25
                        });
                      }
                      
                      setTempDestination(destination);
                      setIsAdjustingDestination(true);
                      setHighlightDropoff(false);
                      console.log('Selected Home address:', destination);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-lg hover:bg-white transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-brand" />
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
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([workAddr.latitude, workAddr.longitude], 16, {
                          duration: 1.5,
                          easeLinearity: 0.25
                        });
                      }
                      
                      setTempDestination(destination);
                      setIsAdjustingDestination(true);
                      setHighlightDropoff(false);
                      console.log('Selected Work address:', destination);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-lg hover:bg-white transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent" />
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
              <div className="mt-2 px-3 py-2 bg-maahi-brand/10 border border-maahi-brand/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-maahi-brand font-semibold flex items-center gap-2">
                  <span>✨</span>
                  <span>Great! Now select your Destination</span>
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Location Button */}
      {!isBookingSheetOpen && !pickupLocked && (
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-safe-bottom z-[1001] safe-area-insets-bottom" style={{ paddingBottom: 'max(32px, calc(32px + env(safe-area-inset-bottom, 0px)))' }}>
          <button
            onClick={handleConfirmPickupLocation}
            disabled={loadingAddress || !mapCenter}
            className="w-full bg-maahi-brand text-white font-bold py-3 sm:py-4 md:py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-maahi-brand/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-2 border-white/20 text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] md:min-h-[56px]"
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
            onClick={() => {
              // Confirm the adjusted destination
              if (tempDestination) {
                setDrop(tempDestination);
                setIsAdjustingDestination(false);
                setIsBookingSheetOpen(true);
                console.log('Destination confirmed:', tempDestination);
              }
            }}
            disabled={!tempDestination}
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
                <Calendar className="w-4 h-4 text-maahi-brand" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-maahi-accent focus:outline-none transition-colors text-gray-800 font-medium"
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-maahi-brand" />
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
                    // Auto-adjust AM/PM based on selected time
                    const [hours] = newTime.split(':').map(Number);
                    if (hours >= 12) {
                      setSelectedAmPm('PM');
                    } else {
                      setSelectedAmPm('AM');
                    }
                  }}
                  min={getMinTime()}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-maahi-accent focus:outline-none transition-colors text-gray-800 font-medium"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTime) {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        // Convert to AM: if hours >= 12, subtract 12 (but 12 becomes 0)
                        const hour24 = hours >= 12 ? (hours === 12 ? 0 : hours - 12) : hours;
                        const newTime = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        console.log('AM clicked, new time:', newTime);
                        setSelectedTime(newTime);
                      }
                      setSelectedAmPm('AM');
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedAmPm === 'AM'
                        ? 'bg-maahi-brand text-white shadow-md'
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
                        // Convert to PM: if hours < 12, add 12 (but 12 stays as 12)
                        const hour24 = hours < 12 ? hours + 12 : hours;
                        const newTime = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        console.log('PM clicked, new time:', newTime);
                        setSelectedTime(newTime);
                      }
                      setSelectedAmPm('PM');
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedAmPm === 'PM'
                        ? 'bg-maahi-brand text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Price Estimate */}
          <div className="grid grid-cols-2 gap-4 mb-0">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-2xl border border-green-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Estimated Fare</p>
              <p className="text-2xl font-bold text-green-600">
                {loadingRoute ? (
                  <span className="text-lg">Calculating...</span>
                ) : calculatedFare !== null ? (
                  `₹${calculatedFare.toFixed(2)}`
                ) : (
                  '₹--'
                )}
              </p>
              {distance && calculatedFare !== null && (() => {
                const currentPricing = getCurrentPricing();
                const timeSlotLabel = getTimeSlotLabel();
                return (
                  <>
                    <p className="text-xs text-gray-500 mt-1">
                      Base: ₹{currentPricing.base_fare} + ₹{currentPricing.per_km_rate}/km
                    </p>
                    <p className="text-xs text-maahi-brand font-semibold mt-1">
                      {timeSlotLabel}
                    </p>
                  </>
                );
              })()}
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
            className="w-full bg-maahi-brand text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleConfirmBooking}
            disabled={bookingInProgress || loadingRoute || !distance || !selectedDate || !selectedTime || !isValidDateTime()}
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
