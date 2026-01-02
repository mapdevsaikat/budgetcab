'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import * as digipin from 'digipin';

interface LocationSearchProps {
    placeholder: string;
    onSelect: (location: any) => void;
    value?: string;
    disabled?: boolean;
    onClear?: () => void;
    highlight?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ placeholder, onSelect, value, disabled, onClear, highlight = false }) => {
    // Initialize query with value prop to prevent hydration mismatch
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const lastProcessedDigipinRef = useRef<string>('');

    // Update query when value prop changes (for locked pickup display)
    useEffect(() => {
        if (value && !isUserTyping) {
            setQuery(value);
            // Reset processed DigiPin if value changes externally
            if (lastProcessedDigipinRef.current && !value.toUpperCase().includes(lastProcessedDigipinRef.current)) {
                lastProcessedDigipinRef.current = '';
            }
        } else if (!value && !isUserTyping) {
            // Reset to empty if value prop is cleared
            setQuery('');
            lastProcessedDigipinRef.current = '';
        }
    }, [value, isUserTyping]);

    // Handle DigiPin search (Bengaluru DigiPin starts with "4P")
    const handleDigiPinSearch = useCallback((digipinQuery: string): boolean => {
        const trimmedQuery = digipinQuery.trim().toUpperCase();
        
        // Prevent re-processing the same DigiPin
        if (lastProcessedDigipinRef.current === trimmedQuery) {
            return true; // Already processed, skip
        }
        
        // Check if it's a Bengaluru DigiPin (starts with 4P) and matches DigiPin format
        const isBengaluruDigiPin = trimmedQuery.startsWith('4P') && /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i.test(trimmedQuery);
        
        if (isBengaluruDigiPin) {
            try {
                // Use offline DigiPin library to get coordinates
                const coordinates = digipin.getLatLonFromDIGIPIN(trimmedQuery);
                
                // Check if coordinates are valid (not "Invalid DIGIPIN" string)
                if (coordinates && typeof coordinates === 'object' && 'latitude' in coordinates && 'longitude' in coordinates) {
                    // Mark as processed before calling onSelect to prevent loops
                    lastProcessedDigipinRef.current = trimmedQuery;
                    
                    // Create location object from DigiPin
                    const location = {
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        address: trimmedQuery,
                        digipin: trimmedQuery,
                        locality: undefined,
                        pincode: undefined,
                        district: undefined,
                        state: undefined,
                    };
                    
                    // Update UI state first (before calling onSelect to prevent loops)
                    setResults([]);
                    setShowSuggestions(false);
                    setIsUserTyping(false);
                    // Don't update query - it's already set to what user typed
                    // Updating it would trigger useEffect again
                    
                    // Call onSelect with the location (this might trigger parent re-render)
                    // But we've already marked it as processed, so it won't loop
                    onSelect(location);
                    
                    console.log('DigiPin search successful:', trimmedQuery, coordinates);
                    return true;
                } else {
                    console.warn('Invalid DigiPin:', trimmedQuery);
                }
            } catch (error) {
                console.error('Error converting DigiPin to coordinates:', error);
                // Fall through to regular search if DigiPin conversion fails
            }
        }
        
        return false;
    }, [onSelect]);

    // Fetch autocomplete suggestions - matching SearchPanel.tsx reference pattern
    const fetchAutocompleteSuggestions = useCallback(async (searchQuery: string) => {
        // Skip autocomplete for DigiPin format (e.g., "2P7-C93-PMP9" or "4P3-JF2-JP44")
        const isDigiPin = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i.test(searchQuery.trim());
        if (isDigiPin) {
            setResults([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);

        try {
            // Use /v1/digipin/autocomplete endpoint - matching SearchPanel.tsx reference
            // Using Next.js API route proxy to keep API key secure
            const response = await fetch(
                `/api/geocoding/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=10`,
                {
                    method: 'GET',
                }
            );

            if (response.ok) {
                const data = await response.json();
                
                // QuantaRoute response structure: {success: true, data: Array}
                if (data.success && data.data) {
                    setResults(data.data);
                    setShowSuggestions(true);
                } else {
                    setResults([]);
                    setShowSuggestions(false);
                }
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            // Silently fail for autocomplete - don't show errors to user (matching reference)
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced autocomplete - matching SearchPanel.tsx reference pattern exactly
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setShowSuggestions(false);
            return;
        }

        const trimmedQuery = query.trim().toUpperCase();
        
        // Check if user is typing a Bengaluru DigiPin (starts with 4P)
        if (trimmedQuery.startsWith('4P')) {
            // If it's a complete DigiPin format, try to convert it
            if (/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i.test(trimmedQuery)) {
                const handled = handleDigiPinSearch(trimmedQuery);
                if (handled) {
                    return; // DigiPin was successfully handled, don't call API
                }
            }
            // If it starts with 4P but not complete format yet, don't call API
            // User might still be typing - wait for complete DigiPin format
            setResults([]);
            setShowSuggestions(false);
            setLoading(false);
            return;
        }

        // For regular searches, require at least 3 characters
        if (query.trim().length < 3) {
            setResults([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            await fetchAutocompleteSuggestions(query);
        }, 900);

        return () => clearTimeout(timer);
    }, [query, handleDigiPinSearch, fetchAutocompleteSuggestions]);

    // Close suggestions when clicking outside - matching SearchPanel.tsx reference
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setIsUserTyping(true);
        // Reset processed DigiPin ref when user types something new
        if (lastProcessedDigipinRef.current && !val.toUpperCase().includes(lastProcessedDigipinRef.current)) {
            lastProcessedDigipinRef.current = '';
        }
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setShowSuggestions(false);
        setIsUserTyping(false);
        lastProcessedDigipinRef.current = ''; // Reset processed DigiPin
        if (onClear) {
            onClear();
        }
    };

    const handleSelect = (result: any) => {
        // NO GEOCODE API CALL NEEDED! Autocomplete already has everything!
        // Reference: SearchPanel.tsx - they directly use the autocomplete data
        
        const displayName = result.displayName || result.description || result.formatted_address || result.address || '';
        
        setQuery(displayName);
        setResults([]);
        setShowSuggestions(false);
        setIsUserTyping(false);

        // Use data directly from autocomplete response
        onSelect({
            latitude: result.coordinates?.latitude || result.latitude || result.lat,
            longitude: result.coordinates?.longitude || result.longitude || result.lng || result.lon,
            address: displayName,
            digipin: result.digipin,
            locality: result.addressComponents?.city || result.addressComponents?.suburb,
            pincode: result.addressComponents?.postcode,
            district: result.addressComponents?.state,
            state: result.addressComponents?.state,
        });
    };

    return (
        <div className="relative w-full">
            <div className={`flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border px-3 py-2.5 transition-all hover:shadow-xl ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
            } ${
                highlight 
                    ? 'border-maahi-brand border-2 shadow-[0_0_20px_rgba(0,169,157,0.4)] ring-2 ring-maahi-brand/30 animate-[pulse_2s_ease-in-out_infinite]' 
                    : 'border-gray-100'
            }`}>
                {value && value.includes('-') ? (
                    // DigiPin format detected
                    <span className="text-maahi-accent mr-2 text-sm flex-shrink-0">📍</span>
                ) : (
                    <MapPin className="text-maahi-brand mr-2 w-4 h-4 flex-shrink-0" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    onFocus={() => {
                        setIsUserTyping(true);
                        if (results.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onBlur={() => {
                        setTimeout(() => setIsUserTyping(false), 200);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    suppressHydrationWarning
                    className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 font-medium bg-transparent disabled:cursor-not-allowed"
                />
                {query && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors mr-1"
                        title="Clear search"
                    >
                        <X className="text-gray-400 hover:text-gray-600 w-4 h-4" />
                    </button>
                )}
                {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maahi-brand flex-shrink-0"></div>
                ) : (
                    <Search className="text-gray-400 w-4 h-4 flex-shrink-0" />
                )}
            </div>

            {/* Search Results Dropdown - matching SearchPanel.tsx pattern */}
            {showSuggestions && results.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-60 overflow-y-auto"
                >
                    {loading && (
                        <div className="px-3 py-2.5 text-center text-gray-500 text-xs">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maahi-brand mx-auto mb-1"></div>
                            <p>Searching...</p>
                        </div>
                    )}
                    
                    {!loading && (
                        <>
                            {results.map((result, i) => (
                                <div
                                    key={i}
                                    className="px-3 py-2.5 hover:bg-maahi-brand/5 cursor-pointer flex items-center border-b border-gray-50 transition-colors"
                                    onClick={() => handleSelect(result)}
                                >
                                    <MapPin className="text-maahi-accent mr-2 w-4 h-4 flex-shrink-0" />
                                    <div className="overflow-hidden flex-1">
                                        <p className="font-semibold text-sm text-gray-800 truncate">
                                            {result.displayName || result.description || result.formatted_address || result.address || 'Unknown Location'}
                                        </p>
                                        {result.secondary_text && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{result.secondary_text}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* QuantaRoute Branding */}
                            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-center text-xs text-gray-400">
                                    Powered by{' '}
                                    <a
                                        href="https://quantaroute.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        QuantaRoute
                                    </a>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
