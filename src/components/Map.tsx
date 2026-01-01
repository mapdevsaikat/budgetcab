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
            });

            // Add MapTiler layer using the MaptilerLayer class
            const mtLayer = new MaptilerLayer({
                apiKey: apiKey,
            }).addTo(map.current);

            // Create custom user location marker icon (matching app theme)
            const createUserLocationIcon = () => {
                const iconHtml = `
                    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <!-- Outer pulse ring -->
                        <div style="
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            background: #2E3192;
                            opacity: 0.3;
                            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                        "></div>
                        <!-- Inner solid circle -->
                        <div style="
                            position: relative;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #2E3192;
                            border: 3px solid white;
                            box-shadow: 0 2px 8px rgba(46, 49, 146, 0.4);
                        "></div>
                    </div>
                    <style>
                        @keyframes pulse {
                            0%, 100% {
                                transform: scale(1);
                                opacity: 0.3;
                            }
                            50% {
                                transform: scale(1.2);
                                opacity: 0.1;
                            }
                        }
                    </style>
                `;

                return L.divIcon({
                    html: iconHtml,
                    className: 'custom-user-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                });
            };

            // Setup event listeners
            map.current.on('load', () => {
                console.log('[MaahiCabs Map] Map loaded successfully!');
                setMapLoaded(true);
                setError(null);

                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }

                if (onLoadRef.current) {
                    onLoadRef.current();
                }
            });

            map.current.on('moveend', () => {
                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }
            });

            // For Leaflet, the map is ready after a short delay
            setTimeout(() => {
                console.log('[MaahiCabs Map] Map ready!');
                setMapLoaded(true);
                setError(null);

                if (onMoveEndRef.current && map.current) {
                    const center = map.current.getCenter();
                    onMoveEndRef.current({ lat: center.lat, lng: center.lng });
                }

                if (onLoadRef.current) {
                    onLoadRef.current();
                }

                // Pass map instance to parent for external control
                if (onMapReadyRef.current && map.current) {
                    onMapReadyRef.current(map.current);
                }

                // Auto-center on user location (no marker, just center the map)
                if (map.current && 'geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            if (map.current) {
                                const { latitude, longitude } = position.coords;
                                map.current.flyTo([latitude, longitude], 16, {
                                    duration: 2,
                                    easeLinearity: 0.25
                                });
                                console.log('[MaahiCabs Map] Centered on user location');
                            }
                        },
                        (error) => {
                            console.warn('[MaahiCabs Map] Geolocation error:', error.message);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0,
                        }
                    );
                }
            }, 500);

            // Add a timeout to detect if map doesn't load
            const loadTimeout = setTimeout(() => {
                if (!mapLoaded) {
                    console.error('[MaahiCabs Map] Map loading timeout');
                    setError('Map loading timeout. Please check your API key and internet connection.');
                }
            }, 10000);

            return () => {
                clearTimeout(loadTimeout);
            };

        } catch (err) {
            console.error('[MaahiCabs Map] Error initializing map:', err);
            setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        return () => {
            if (map.current) {
                console.log('[MaahiCabs Map] Cleaning up map instance');
                if (userMarker.current) {
                    userMarker.current.remove();
                    userMarker.current = null;
                }
                map.current.remove();
                map.current = null;
            }
        };
    }, [mounted, center, zoom]);

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
