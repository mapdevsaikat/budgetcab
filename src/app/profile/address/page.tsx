'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import * as digipin from 'digipin';
import { MapPin, Home, ArrowLeft, Navigation, Save, Plus, Edit, Trash2, Briefcase, MapPinned, X } from 'lucide-react';
import LocationSearch from '@/components/LocationSearch';
import NotificationModal from '@/components/NotificationModal';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function AddressManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Address list state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    address_type: 'home' as 'home' | 'work' | 'other',
    house_road_name: '',
    latitude: null as number | null,
    longitude: null as number | null,
    digipin: '',
    locality: '',
    pincode: '',
    district: '',
    state: '',
  });
  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [tempDigipin, setTempDigipin] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [localityAlternatives, setLocalityAlternatives] = useState<Array<{ name: string; pincode: string }>>([]);
  const [searchAddress, setSearchAddress] = useState('');
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Check if we should show "add address" form
    const mode = searchParams?.get('mode');
    if (mode === 'add') {
      setIsAddingAddress(true);
    }
  }, [searchParams]);

  // Real-time DigiPin update as map moves
  useEffect(() => {
    if (mapCenter && !isLocationConfirmed) {
      const realtimeDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      setTempDigipin(realtimeDigipin);
    }
  }, [mapCenter, isLocationConfirmed]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/onboarding');
      return;
    }

    setUser(session.user);
    await fetchAllAddresses(session.user.id);
    setLoading(false);
  };

  const fetchAllAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching addresses:', error);
      return;
    }

    if (data) {
      setAddresses(data);
      
      // If user has no addresses and not already adding, show add address form automatically
      if (data.length === 0 && !isAddingAddress) {
        setIsAddingAddress(true);
      }
    }
  };

  const handleConfirmLocation = async () => {
    if (!mapCenter) return;

    setIsLoadingAddress(true);
    try {
      const generatedDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      
      // Call QuantaRoute lookup API
      const response = await fetch('/api/geocoding/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          latitude: mapCenter.lat, 
          longitude: mapCenter.lng 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Lookup API response:', result);

        // Correct structure: result.data.administrative_info
        if (result.success && result.data) {
          const adminInfo = result.data.administrative_info;
          const alternatives = result.data.alternatives || [];
          
          // Extract locality alternatives with pincode
          const localityOptions = alternatives
            .filter((alt: any) => alt.name && alt.pincode)
            .map((alt: any) => ({ name: alt.name, pincode: alt.pincode }));
          
          setLocalityAlternatives(localityOptions);
          
          setAddressForm(prev => ({
            ...prev,
            latitude: mapCenter.lat,
            longitude: mapCenter.lng,
            digipin: result.data.digipin || generatedDigipin,
            locality: adminInfo?.locality || '',
            pincode: adminInfo?.pincode || '',
            district: adminInfo?.district || '',
            state: adminInfo?.state || '',
          }));
        } else {
          // Fallback: Use offline DigiPin if API response is not as expected
          setAddressForm(prev => ({
            ...prev,
            latitude: mapCenter.lat,
            longitude: mapCenter.lng,
            digipin: generatedDigipin,
          }));
        }
      } else {
        // Fallback: Use offline DigiPin if API fails
        setAddressForm(prev => ({
          ...prev,
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          digipin: generatedDigipin,
        }));
      }
      
      setIsLocationConfirmed(true);
      setShowConfirmButton(false);
    } catch (error) {
      console.error('Error fetching address details:', error);
      // Fallback: Use offline DigiPin
      const generatedDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
      setAddressForm(prev => ({
        ...prev,
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        digipin: generatedDigipin,
      }));
      setIsLocationConfirmed(true);
      setShowConfirmButton(false);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleChangeLocation = () => {
    setIsLocationConfirmed(false);
    setShowConfirmButton(true);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([latitude, longitude], 17, {
              duration: 2,
              easeLinearity: 0.25
            });
          }
          
          setMapCenter({ lat: latitude, lng: longitude });
          setShowConfirmButton(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Location Error',
            message: 'Could not get your location. Please check your browser settings.',
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Not Supported',
        message: 'Geolocation is not supported by your browser.',
      });
    }
  };

  const handleSearchLocationSelect = (location: any) => {
    if (!location.latitude || !location.longitude) {
      console.error('Invalid location data:', location);
      return;
    }

    // Update search address display
    setSearchAddress(location.address || location.digipin || '');

    // Fly map to selected location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], 17, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }

    // Update map center (this will trigger the map's onMoveEnd)
    setMapCenter({ lat: location.latitude, lng: location.longitude });
    
    // Show confirm button so user can confirm the location
    setShowConfirmButton(true);
    
    // If location has digipin, we can pre-populate some fields
    if (location.digipin) {
      setTempDigipin(location.digipin);
    }
  };

  const handleSaveAddress = async () => {
    if (!user || !addressForm.latitude || !addressForm.longitude) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Location Required',
        message: 'Please confirm your location on the map before saving.',
      });
      return;
    }

    if (!addressForm.house_road_name.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Details Required',
        message: 'Please enter your house/flat details.',
      });
      return;
    }

    setSaving(true);

    try {
      if (editingAddressId) {
        // Update existing address
        const { error } = await supabase
          .from('user_addresses')
          .update({
            address_type: addressForm.address_type,
            house_road_name: addressForm.house_road_name,
            latitude: addressForm.latitude,
            longitude: addressForm.longitude,
            digipin: addressForm.digipin,
            locality: addressForm.locality,
            pincode: addressForm.pincode,
            district: addressForm.district,
            state: addressForm.state,
          })
          .eq('id', editingAddressId);

        if (error) throw error;
        
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Address updated successfully!',
        });
      } else {
        // Insert new address
        const { error } = await supabase
          .from('user_addresses')
          .insert({
            user_id: user.id,
            address_type: addressForm.address_type,
            house_road_name: addressForm.house_road_name,
            latitude: addressForm.latitude,
            longitude: addressForm.longitude,
            digipin: addressForm.digipin,
            locality: addressForm.locality,
            pincode: addressForm.pincode,
            district: addressForm.district,
            state: addressForm.state,
          });

        if (error) throw error;
        
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Address added successfully!',
        });
      }

      // Refresh address list and reset form
      await fetchAllAddresses(user.id);
      resetAddressForm();
      setIsAddingAddress(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error('Error saving address:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save address. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId);

          if (error) throw error;

          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Deleted!',
            message: 'Address deleted successfully!',
          });
          await fetchAllAddresses(user!.id);
        } catch (error) {
          console.error('Error deleting address:', error);
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to delete address. Please try again.',
          });
        }
      },
    });
  };

  const handleEditAddress = (address: any) => {
    setAddressForm({
      address_type: address.address_type,
      house_road_name: address.house_road_name,
      latitude: address.latitude,
      longitude: address.longitude,
      digipin: address.digipin,
      locality: address.locality,
      pincode: address.pincode,
      district: address.district,
      state: address.state,
    });
    setMapCenter({ lat: address.latitude, lng: address.longitude });
    setIsLocationConfirmed(true);
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleAddNewAddress = () => {
    if (addresses.length >= 5) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Limit Reached',
        message: 'Maximum 5 addresses allowed. Please delete an existing address to add a new one.',
      });
      return;
    }
    resetAddressForm();
    setIsAddingAddress(true);
  };

  const handleCancelAddAddress = () => {
    if (addresses.length === 0) {
      // If no addresses, go back to profile
      router.push('/profile');
      return;
    }
    resetAddressForm();
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const resetAddressForm = () => {
    setAddressForm({
      address_type: 'home',
      house_road_name: '',
      latitude: null,
      longitude: null,
      digipin: '',
      locality: '',
      pincode: '',
      district: '',
      state: '',
    });
    setMapCenter(null);
    setIsLocationConfirmed(false);
    setShowConfirmButton(false);
    setLocalityAlternatives([]);
    setTempDigipin('');
    setSearchAddress('');
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-5 h-5 text-maahi-brand" />;
      case 'work':
        return <Briefcase className="w-5 h-5 text-maahi-accent" />;
      default:
        return <MapPinned className="w-5 h-5 text-gray-600" />;
    }
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
        <button
          onClick={() => router.push('/profile')}
          className="mb-3 sm:mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold">Back to Profile</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Manage Addresses</h1>
            <p className="text-white/80 text-xs sm:text-sm truncate">Add, edit or delete your saved addresses</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollable-container px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Show Address List or Add Address Form */}
        {!isAddingAddress ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">Saved Addresses</h2>
              </div>
              {addresses.length < 5 && (
                <button
                  onClick={handleAddNewAddress}
                  className="flex items-center gap-1.5 sm:gap-2 bg-maahi-brand text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-maahi-brand/90 transition-all text-xs sm:text-sm flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              )}
            </div>

            {/* Address List */}
            {addresses.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No saved addresses yet</p>
                <button
                  onClick={handleAddNewAddress}
                  className="bg-maahi-brand text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-maahi-brand/90 transition-all text-sm sm:text-base"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border-2 border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-maahi-accent/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">{getAddressIcon(address.address_type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800 capitalize truncate">
                              {address.address_type}
                            </h3>
                            {address.address_type === 'home' && (
                              <span className="text-[10px] sm:text-xs bg-maahi-brand/10 text-maahi-brand px-1.5 sm:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                            {address.house_road_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2">
                            {address.locality && `${address.locality}, `}
                            {[address.district, address.state, address.pincode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-mono truncate">
                            DigiPin: {address.digipin}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="p-1.5 sm:p-2 text-maahi-accent hover:bg-maahi-accent/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4">
                  {addresses.length} of 5 addresses saved
                </p>
              </div>
            )}
          </div>
        ) : (
          // Add/Edit Address Form
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-accent flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h2>
            </div>

            {/* Location Search - Above Map */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Search Address <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <LocationSearch
                placeholder="Search for an address or enter DigiPin..."
                onSelect={handleSearchLocationSelect}
                value={searchAddress}
                onClear={() => {
                  setSearchAddress('');
                }}
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
                Search for an address or drag the map pin to select your location
              </p>
            </div>

            {/* Map */}
            <div className="relative mb-3 sm:mb-4">
              <div className="h-48 sm:h-56 md:h-64 rounded-lg sm:rounded-xl overflow-hidden border-2 border-gray-200 relative z-0">
                <Map
                  center={mapCenter ? [mapCenter.lat, mapCenter.lng] : undefined}
                  onMoveEnd={(center) => {
                    setMapCenter(center);
                    if (!isLocationConfirmed) {
                      setShowConfirmButton(true);
                    }
                    // Clear search address when user manually moves map
                    if (searchAddress) {
                      setSearchAddress('');
                    }
                  }}
                  onLoad={() => console.log('Map loaded')}
                  onMapReady={(mapInstance) => {
                    mapInstanceRef.current = mapInstance;
                  }}
                />
              </div>

              {/* Center Pin */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 -mt-6">
                <div className="flex flex-col items-center">
                  <span className="relative flex h-5 w-5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLocationConfirmed ? 'bg-green-500' : 'bg-maahi-accent'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-5 w-5 ${isLocationConfirmed ? 'bg-green-500' : 'bg-maahi-accent'} border-2 border-white shadow-xl`}></span>
                  </span>
                  <div className={`w-0.5 h-6 ${isLocationConfirmed ? 'bg-green-600' : 'bg-maahi-brand'} rounded-full shadow-lg`}></div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/15 rounded-full blur-sm"></div>
                </div>
              </div>
            </div>

            {/* DigiPin Display */}
            {tempDigipin && !isLocationConfirmed && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-[10px] sm:text-xs text-blue-600 font-semibold">Live DigiPin Preview</p>
                <p className="text-xs sm:text-sm font-mono text-blue-800 break-all">{tempDigipin}</p>
              </div>
            )}

            {/* Use Current Location Button */}
            {!isLocationConfirmed && (
              <button
                onClick={handleUseCurrentLocation}
                className="w-full mb-3 sm:mb-4 flex items-center justify-center gap-2 bg-maahi-accent text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-maahi-accent/90 transition-all text-sm sm:text-base"
              >
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                Use My Current Location
              </button>
            )}

            {/* Confirm Location Button */}
            {showConfirmButton && !isLocationConfirmed && (
              <button
                onClick={handleConfirmLocation}
                disabled={isLoadingAddress}
                className="w-full mb-3 sm:mb-4 bg-gradient-to-r from-maahi-brand to-maahi-accent text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoadingAddress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Fetching Address...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    Confirm Location
                  </>
                )}
              </button>
            )}

            {/* Change Location Button */}
            {isLocationConfirmed && (
              <button
                onClick={handleChangeLocation}
                className="w-full mb-3 sm:mb-4 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base"
              >
                Change Location
              </button>
            )}

            {/* Address Form */}
            {isLocationConfirmed && (
              <div className="space-y-3 sm:space-y-4">
                {/* Address Type Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Address Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {(['home', 'work', 'other'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressForm(prev => ({ ...prev, address_type: type }))}
                        className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                          addressForm.address_type === type
                            ? 'bg-maahi-brand text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locality Selector - Simple Dropdown */}
                {localityAlternatives.length > 0 && (
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Select Locality <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addressForm.locality}
                      onChange={(e) => {
                        const selected = localityAlternatives.find(alt => alt.name === e.target.value);
                        if (selected) {
                          setAddressForm(prev => ({ 
                            ...prev, 
                            locality: selected.name,
                            pincode: selected.pincode 
                          }));
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-maahi-accent focus:outline-none transition-colors text-xs sm:text-sm text-gray-800 font-medium bg-white appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose a locality --</option>
                      {localityAlternatives.map((alt, index) => (
                        <option key={index} value={alt.name}>
                          {alt.name} (Pincode: {alt.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    House & Road Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.house_road_name}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, house_road_name: e.target.value }))}
                    placeholder="e.g., Flat 4B, Green Villa, MG Road"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-maahi-accent focus:outline-none transition-colors placeholder:text-gray-400 text-xs sm:text-sm text-gray-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs text-gray-500 mb-1">DigiPin</label>
                    <p className="text-xs sm:text-sm font-mono font-semibold text-gray-800 bg-gray-50 p-1.5 sm:p-2 rounded-lg break-all">
                      {addressForm.digipin || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs text-gray-500 mb-1">Pincode</label>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 bg-gray-50 p-1.5 sm:p-2 rounded-lg">
                      {addressForm.pincode || 'Not available'}
                    </p>
                  </div>
                </div>

                {/* Address Preview */}
                {(addressForm.house_road_name || addressForm.locality || addressForm.district || addressForm.state) && (
                  <div className="bg-gradient-to-br from-maahi-brand/5 to-maahi-accent/5 border-2 border-maahi-brand/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-maahi-brand flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-bold text-maahi-brand">Address Preview</p>
                    </div>
                    <div className="space-y-1">
                      {addressForm.house_road_name && (
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 break-words">{addressForm.house_road_name}</p>
                      )}
                      {addressForm.locality && (
                        <p className="text-xs sm:text-sm text-gray-700 break-words">{addressForm.locality}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {[addressForm.district, addressForm.state, addressForm.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Display Other Address Info */}
                {(addressForm.district || addressForm.state) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-blue-600 font-semibold mb-1">Auto-populated Address Info</p>
                    <div className="space-y-1">
                      {addressForm.district && (
                        <p className="text-xs sm:text-sm text-gray-700 break-words">
                          <span className="font-semibold">District:</span> {addressForm.district}
                        </p>
                      )}
                      {addressForm.state && (
                        <p className="text-xs sm:text-sm text-gray-700 break-words">
                          <span className="font-semibold">State:</span> {addressForm.state}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveAddress}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* End Scrollable Content */}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-red-50 border-red-200 border-b-2 rounded-t-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{confirmDialog.title}</h3>
                </div>
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                  className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{confirmDialog.message}</p>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 pt-0 flex gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 sm:py-3 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddressManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-maahi-brand to-maahi-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    }>
      <AddressManagementContent />
    </Suspense>
  );
}

