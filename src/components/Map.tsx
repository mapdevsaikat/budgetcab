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

const Map: React.FC<MapProps> = ({ center = [19.99932, 73.79004], zoom = 17, onMoveEnd, onLoad, onMapReady }) => {
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

        // Use requestAnimationFrame to ensure DOM is ready
        const initMap = () => {
            if (!mapContainer.current || map.current) return;
            
            // Double-check container exists and has dimensions
            if (mapContainer.current.offsetWidth === 0 && mapContainer.current.offsetHeight === 0) {
                // Container might not be visible yet, try again on next frame
                requestAnimationFrame(initMap);
                return;
            }

            // Support both variable names for backward compatibility
            const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || process.env.NEXT_PUBLIC_MAPTILER_KEY;

        console.log('[budgetcab Map] Initializing Leaflet map...');
        console.log('[budgetcab Map] API Key present:', !!apiKey);
        console.log('[budgetcab Map] API Key length:', apiKey?.length || 0);

        if (!apiKey) {
            console.error('[budgetcab Map] No API key found!');
            setError('MapTiler API key not found. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env.local file.');
            return;
        }

        // Validate API key format (MapTiler keys are typically alphanumeric)
        if (apiKey.length < 10) {
            console.error('[budgetcab Map] Invalid API key format!');
            setError('Invalid MapTiler API key format. Please check your NEXT_PUBLIC_MAPTILER_API_KEY in .env.local');
            return;
        }

        try {
            console.log('[budgetcab Map] Creating Leaflet map instance...');

            // Double-check container is still available
            if (!mapContainer.current) {
                console.error('[budgetcab Map] Container ref is null');
                return;
            }

            // Initialize the map WITHOUT zoom control (we'll add custom controls later if needed)
            map.current = L.map(mapContainer.current, {
                center: L.latLng(center[0], center[1]),
                zoom: zoom,
                zoomControl: false, // Disable default zoom control
                minZoom: 11, // Restrict zoom out to level 12 to avoid border issues
                maxZoom: 20, // Set reasonable max zoom
            });

            // Invalidate size to ensure Leaflet properly calculates container dimensions
            // This fixes the containerPointToLayerPoint error
            setTimeout(() => {
                if (map.current) {
                    map.current.invalidateSize();
                }
            }, 0);

            // Verify map was created successfully
            if (!map.current) {
                console.error('[budgetcab Map] Failed to create map instance');
                setError('Failed to initialize map. Please try refreshing the page.');
                return;
            }

            // Add error handler for tile loading errors
            map.current.on('tileerror', (error: any) => {
                console.error('[budgetcab Map] Tile loading error:', error);
                setError('Failed to load map tiles. Please check your MapTiler API key and internet connection.');
            });

            // Add MapTiler layer using the MaptilerLayer class with error handling
            try {
                if (!map.current) {
                    throw new Error('Map instance is null');
                }
                const mtLayer = new MaptilerLayer({
                    apiKey: apiKey,
                }).addTo(map.current);
                
                console.log('[budgetcab Map] MapTiler layer added successfully');
            } catch (layerError) {
                console.error('[budgetcab Map] Error creating MapTiler layer:', layerError);
                setError(`Failed to initialize MapTiler layer: ${layerError instanceof Error ? layerError.message : 'Unknown error'}. Please check your API key in .env.local (NEXT_PUBLIC_MAPTILER_API_KEY).`);
                // Clean up map if layer failed
                if (map.current) {
                    map.current.remove();
                    map.current = null;
                }
                return;
            }
            // Setup event listeners
            map.current.on('load', () => {
                if (!map.current) return;
                console.log('[budgetcab Map] Map loaded successfully!');
                mapLoadedRef.current = true;
                setMapLoaded(true);
                setError(null);
                
                // Clear timeout if map loads successfully
                if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current);
                    loadTimeoutRef.current = null;
                }

                if (onMoveEndRef.current && map.current) {
                    try {
                        const center = map.current.getCenter();
                        onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                    } catch (err) {
                        console.error('[budgetcab Map] Error getting center:', err);
                    }
                }

                if (onLoadRef.current) {
                    onLoadRef.current();
                }
            });

            map.current.on('movestart', () => {
                // Mark that user has manually moved the map (unless it's auto-centering)
                if (!isAutoCenteringRef.current) {
                    userHasInteractedRef.current = true;
                    console.log('[budgetcab Map] User manually moved map');
                }
            });

            map.current.on('moveend', () => {
                // Don't trigger onMoveEnd during auto-centering or location checking to prevent conflicts
                if (isAutoCenteringRef.current || isCheckingLocationRef.current) {
                    return;
                }
                if (onMoveEndRef.current && map.current) {
                    try {
                        const center = map.current.getCenter();
                        onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                    } catch (err) {
                        console.error('[budgetcab Map] Error getting center in moveend:', err);
                    }
                }
            });

            // For Leaflet, the map is ready after a short delay
            setTimeout(() => {
                console.log('[budgetcab Map] Map ready!');
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
                    console.error('[budgetcab Map] Map loading timeout');
                    setError('Map loading timeout. Please check your API key and internet connection.');
                }
            }, 10000);

        } catch (err) {
            console.error('[budgetcab Map] Error initializing map:', err);
            setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        };

        // Start initialization
        requestAnimationFrame(initMap);

        return () => {
            // Clear timeout on cleanup
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
            }
            
            if (map.current) {
                console.log('[budgetcab Map] Cleaning up map instance');
                try {
                    if (userMarker.current) {
                        userMarker.current.remove();
                        userMarker.current = null;
                    }
                    // Remove all event listeners before removing map
                    map.current.off();
                    map.current.remove();
                } catch (err) {
                    console.error('[budgetcab Map] Error during cleanup:', err);
                } finally {
                    map.current = null;
                }
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
            console.log('[budgetcab Map] Geolocation not available in this browser');
            // No location available, set map center to default
            if (onMoveEndRef.current && map.current) {
                try {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                } catch (err) {
                    console.error('[budgetcab Map] Error getting center:', err);
                }
            }
            return;
        }

        console.log('[budgetcab Map] Requesting user location after map load...');
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
                
                console.log('[budgetcab Map] Location permission granted, user location:', latitude, longitude);
                
                // Only fly to user location if they haven't manually interacted with the map yet
                if (userHasInteractedRef.current) {
                    console.log('[budgetcab Map] User has already interacted with map, skipping auto-center');
                    isCheckingLocationRef.current = false;
                    // Set mapCenter to current location
                    if (onMoveEndRef.current && map.current) {
                        try {
                            const center = map.current.getCenter();
                            onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                        } catch (err) {
                            console.error('[budgetcab Map] Error getting center:', err);
                        }
                    }
                    return;
                }
                
                isAutoCenteringRef.current = true;
                console.log('[budgetcab Map] Flying to user location...');
                
                // Ensure map is still available before calling methods
                if (!map.current) {
                    console.error('[budgetcab Map] Map instance is null, cannot fly to location');
                    isAutoCenteringRef.current = false;
                    isCheckingLocationRef.current = false;
                    return;
                }
                
                // Use setView with animation for smooth transition to user location
                // Check if flyTo method exists (might be from a plugin), otherwise use setView
                try {
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
                } catch (err) {
                    console.error('[budgetcab Map] Error setting view:', err);
                    isAutoCenteringRef.current = false;
                    isCheckingLocationRef.current = false;
                    return;
                }
                
                // Update parent's mapCenter state after animation completes
                setTimeout(() => {
                    isAutoCenteringRef.current = false;
                    isCheckingLocationRef.current = false; // Location check complete
                    if (onMoveEndRef.current && map.current) {
                        try {
                            const center = map.current.getCenter();
                            onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                        } catch (err) {
                            console.error('[budgetcab Map] Error getting center after fly:', err);
                        }
                    }
                    console.log('[budgetcab Map] Successfully centered on user location');
                }, 1600); // Wait for animation to complete (1500ms + 100ms buffer)
            },
            (error) => {
                console.warn('[budgetcab Map] Geolocation error:', error.message);
                // Mark as attempted so we don't keep trying
                userLocationSetRef.current = true;
                isCheckingLocationRef.current = false; // Location check complete (failed)
                
                // Set mapCenter to default location since user location failed
                if (onMoveEndRef.current && map.current) {
                    try {
                        const center = map.current.getCenter();
                        onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                    } catch (err) {
                        console.error('[budgetcab Map] Error getting center in geolocation error:', err);
                    }
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
