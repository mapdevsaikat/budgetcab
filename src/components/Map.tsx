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

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || map.current) return;

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const styleUrl = apiKey
            ? `https://api.maptiler.com/maps/streets-v4/style.json?key=${apiKey}`
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

                // clean controls
                map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

                const geolocate = new maplibregl.GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                    showUserLocation: true
                });

                map.current.addControl(geolocate, 'top-right');

                map.current.on('load', () => {
                    // 1. Fire onMoveEnd immediately to set initial center in parent
                    if (onMoveEnd) {
                        const { lng, lat } = map.current!.getCenter();
                        onMoveEnd({ lat, lng });
                    }

                    // 2. Try to auto-locate
                    geolocate.trigger();

                    if (onLoad) onLoad();
                });

                if (onMoveEnd) {
                    map.current.on('moveend', () => {
                        const { lng, lat } = map.current!.getCenter();
                        onMoveEnd({ lat, lng });
                    });
                }

            } catch (err) {
                console.error('Error initializing map:', err);
            }
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [mounted, center, zoom]); // careful with deps here to avoid re-init

    if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse" />;

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="absolute inset-0" />
            {/* Attribution fallback if needed */}
            <div className="absolute bottom-1 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded pointer-events-none">
                © MapLibre © MapTiler © OpenStreetMap
            </div>
        </div>
    );
};

export default Map;
