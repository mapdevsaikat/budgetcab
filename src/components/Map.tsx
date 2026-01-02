'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import 'leaflet/dist/leaflet.css';

interface MapProps {
    center?: [number, number];
    zoom?: number;
    onMoveEnd?: (center: { lat: number; lng: number }) => void;
    onLoad?: () => void;
    onMapReady?: (mapInstance: L.Map) => void;
}

const Map: React.FC<MapProps> = ({ center = [12.963157, 77.577345], zoom = 17, onMoveEnd, onLoad, onMapReady }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const userMarker = useRef<L.Marker | null>(null);
    const userLocationSetRef = useRef<boolean>(false);
    const isAutoCenteringRef = useRef<boolean>(false);
    const userHasInteractedRef = useRef<boolean>(false); // Track if user has moved map manually
    const isCheckingLocationRef = useRef<boolean>(false); // Track if we're checking for user location
    const mapLoadedRef = useRef<boolean>(false);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [mounted, setMounted] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Store callbacks in refs to avoid re-triggering useEffect
    const onMoveEndRef = useRef(onMoveEnd);
    const onLoadRef = useRef(onLoad);
    const onMapReadyRef = useRef(onMapReady);

    // Update refs when callbacks change
    useEffect(() => {
        onMoveEndRef.current = onMoveEnd;
        onLoadRef.current = onLoad;
        onMapReadyRef.current = onMapReady;
    }, [onMoveEnd, onLoad, onMapReady]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only initialize once
        if (!mounted || map.current || !mapContainer.current) return;

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

        console.log('[MaahiCabs Map] Initializing Leaflet map...');
        console.log('[MaahiCabs Map] API Key present:', !!apiKey);
        console.log('[MaahiCabs Map] API Key length:', apiKey?.length || 0);

        if (!apiKey) {
            console.error('[MaahiCabs Map] No API key found!');
            setError('MapTiler API key not found. Please add NEXT_PUBLIC_MAPTILER_KEY to your .env file.');
            return;
        }

        try {
            console.log('[MaahiCabs Map] Creating Leaflet map instance...');

            // Initialize the map WITHOUT zoom control (we'll add custom controls later if needed)
            map.current = L.map(mapContainer.current, {
                center: L.latLng(center[0], center[1]),
                zoom: zoom,
                zoomControl: false, // Disable default zoom control
                minZoom: 11, // Restrict zoom out to level 12 to avoid border issues
                maxZoom: 20, // Set reasonable max zoom
            });

            // Add MapTiler layer using the MaptilerLayer class
            const mtLayer = new MaptilerLayer({
                apiKey: apiKey,
            }).addTo(map.current);
            // Setup event listeners
            map.current.on('load', () => {
                console.log('[MaahiCabs Map] Map loaded successfully!');
                mapLoadedRef.current = true;
                setMapLoaded(true);
                setError(null);
                
                // Clear timeout if map loads successfully
                if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current);
                    loadTimeoutRef.current = null;
                }

                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }

                if (onLoadRef.current) {
                    onLoadRef.current();
                }
            });

            map.current.on('movestart', () => {
                // Mark that user has manually moved the map (unless it's auto-centering)
                if (!isAutoCenteringRef.current) {
                    userHasInteractedRef.current = true;
                    console.log('[MaahiCabs Map] User manually moved map');
                }
            });

            map.current.on('moveend', () => {
                // Don't trigger onMoveEnd during auto-centering or location checking to prevent conflicts
                if (isAutoCenteringRef.current || isCheckingLocationRef.current) {
                    return;
                }
                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }
            });

            // For Leaflet, the map is ready after a short delay
            setTimeout(() => {
                console.log('[MaahiCabs Map] Map ready!');
                mapLoadedRef.current = true;
                setMapLoaded(true);
                setError(null);
                
                // Clear timeout if map loads successfully
                if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current);
                    loadTimeoutRef.current = null;
                }

                // Don't call onMoveEnd here - wait for user location check to complete
                // This prevents setting mapCenter to default location before user location is checked
                if (onLoadRef.current) {
                    onLoadRef.current();
                }

                // Pass map instance to parent for external control
                if (onMapReadyRef.current && map.current) {
                    onMapReadyRef.current(map.current);
                }
            }, 500);

            // Add a timeout to detect if map doesn't load
            // Use ref to check current state, not closure
            loadTimeoutRef.current = setTimeout(() => {
                if (!mapLoadedRef.current) {
                    console.error('[MaahiCabs Map] Map loading timeout');
                    setError('Map loading timeout. Please check your API key and internet connection.');
                }
            }, 10000);

        } catch (err) {
            console.error('[MaahiCabs Map] Error initializing map:', err);
            setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        return () => {
            // Clear timeout on cleanup
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
            }
            
            if (map.current) {
                console.log('[MaahiCabs Map] Cleaning up map instance');
                if (userMarker.current) {
                    userMarker.current.remove();
                    userMarker.current = null;
                }
                map.current.remove();
                map.current = null;
            }
            
            // Reset refs
            mapLoadedRef.current = false;
            userLocationSetRef.current = false;
            isAutoCenteringRef.current = false;
            userHasInteractedRef.current = false;
            isCheckingLocationRef.current = false;
        };
    }, [mounted]); // Removed center and zoom from dependencies to prevent re-initialization

    // Separate effect: Request user location and flyTo after map is loaded
    useEffect(() => {
        // Only proceed if map is loaded and we haven't already requested location
        if (!mapLoaded || !map.current || userLocationSetRef.current) return;

        // Check if geolocation is available
        if (!('geolocation' in navigator)) {
            console.log('[MaahiCabs Map] Geolocation not available in this browser');
            // No location available, set map center to default
            if (onMoveEndRef.current && map.current) {
                const center = map.current.getCenter();
                onMoveEndRef.current({ lat: center.lat, lng: center.lng });
            }
            return;
        }

        console.log('[MaahiCabs Map] Requesting user location after map load...');
        isCheckingLocationRef.current = true; // Start location check, prevent moveend events
        
        // Request user location permission and flyTo when granted
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!map.current || userLocationSetRef.current) {
                    isCheckingLocationRef.current = false;
                    return;
                }
                
                const { latitude, longitude } = position.coords;
                userLocationSetRef.current = true;
                
                console.log('[MaahiCabs Map] Location permission granted, user location:', latitude, longitude);
                
                // Only fly to user location if they haven't manually interacted with the map yet
                if (userHasInteractedRef.current) {
                    console.log('[MaahiCabs Map] User has already interacted with map, skipping auto-center');
                    isCheckingLocationRef.current = false;
                    // Set mapCenter to current location
                    if (onMoveEndRef.current && map.current) {
                        const center = map.current.getCenter();
                        onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                    }
                    return;
                }
                
                isAutoCenteringRef.current = true;
                console.log('[MaahiCabs Map] Flying to user location...');
                
                // Use setView with animation for smooth transition to user location
                // Check if flyTo method exists (might be from a plugin), otherwise use setView
                if (typeof (map.current as any).flyTo === 'function') {
                    (map.current as any).flyTo([latitude, longitude], 16, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                } else {
                    map.current.setView([latitude, longitude], 16, {
                        animate: true,
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
                
                // Update parent's mapCenter state after animation completes
                setTimeout(() => {
                    isAutoCenteringRef.current = false;
                    isCheckingLocationRef.current = false; // Location check complete
                    if (onMoveEndRef.current && map.current) {
                        const center = map.current.getCenter();
                        onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                    }
                    console.log('[MaahiCabs Map] Successfully centered on user location');
                }, 1600); // Wait for animation to complete (1500ms + 100ms buffer)
            },
            (error) => {
                console.warn('[MaahiCabs Map] Geolocation error:', error.message);
                // Mark as attempted so we don't keep trying
                userLocationSetRef.current = true;
                isCheckingLocationRef.current = false; // Location check complete (failed)
                
                // Set mapCenter to default location since user location failed
                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // Increased timeout to give user time to grant permission
                maximumAge: 0,
            }
        );
    }, [mapLoaded]); // Only run when mapLoaded changes from false to true

    if (!mounted) {
        return (
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-gray-500">Preparing map...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Loading overlay */}
            {!mapLoaded && !error && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-[1000]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-700 font-medium">Loading map...</p>
                        <p className="text-gray-500 text-sm mt-2">Powered by Leaflet + MapTiler</p>
                    </div>
                </div>
            )}
            
            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-[1000]">
                    <div className="text-center p-6 max-w-md">
                        <div className="text-red-600 text-4xl mb-4">⚠️</div>
                        <h3 className="text-red-800 font-bold text-lg mb-2">Map Loading Failed</h3>
                        <p className="text-red-700 text-sm mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
