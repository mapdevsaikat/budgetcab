'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
    center?: [number, number];
    zoom?: number;
    onMoveEnd?: (center: { lat: number; lng: number }) => void;
    onLoad?: () => void;
}

const Map: React.FC<MapProps> = ({ center = [87.9127426, 22.1700725], zoom = 14, onMoveEnd, onLoad }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [mounted, setMounted] = React.useState(false);

    // Store callbacks in refs to avoid re-triggering useEffect
    const onMoveEndRef = useRef(onMoveEnd);
    const onLoadRef = useRef(onLoad);

    // Update refs when callbacks change
    useEffect(() => {
        onMoveEndRef.current = onMoveEnd;
        onLoadRef.current = onLoad;
    }, [onMoveEnd, onLoad]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only initialize once
        if (!mounted || map.current) return;

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

        console.log('[MaahiCabs Map] Initializing map...');
        console.log('[MaahiCabs Map] API Key present:', !!apiKey);

        const styleUrl = apiKey
            ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
            : 'https://demotiles.maplibre.org/style.json';

        if (mapContainer.current) {
            try {
                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: styleUrl,
                    center: center,
                    zoom: zoom,
                    attributionControl: false,
                });

                map.current.on('error', (e) => {
                    console.error('[MaahiCabs Map] Map error:', e.error);
                });

                map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

                const geolocate = new maplibregl.GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                    showUserLocation: true
                });

                map.current.addControl(geolocate, 'top-right');

                map.current.on('load', () => {
                    console.log('[MaahiCabs Map] Map loaded successfully!');

                    if (onMoveEndRef.current) {
                        const { lng, lat } = map.current!.getCenter();
                        onMoveEndRef.current({ lat, lng });
                    }

                    geolocate.trigger();

                    if (onLoadRef.current) onLoadRef.current();
                });

                map.current.on('moveend', () => {
                    if (onMoveEndRef.current) {
                        const { lng, lat } = map.current!.getCenter();
                        onMoveEndRef.current({ lat, lng });
                    }
                });

            } catch (err) {
                console.error('[MaahiCabs Map] Error initializing map:', err);
            }
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [mounted]); // Only depend on mounted - center/zoom are initial values only

    if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse" />;

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="absolute inset-0" />
            <div className="absolute bottom-1 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded pointer-events-none">
                © MapLibre © MapTiler © OpenStreetMap
            </div>
        </div>
    );
};

export default Map;
