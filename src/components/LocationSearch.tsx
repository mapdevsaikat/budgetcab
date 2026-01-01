'use client';

import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface LocationSearchProps {
    placeholder: string;
    onSelect: (location: any) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ placeholder, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (val.length > 2) {
            setLoading(true);
            try {
                const response = await fetch(`/api/geocoding/autocomplete?q=${val}`);
                const data = await response.json();
                // Adjust based on actual QuantaRoute response structure
                setResults(data.predictions || data.results || []);
            } catch (error) {
                console.error('Autocomplete error:', error);
            } finally {
                setLoading(false);
            }
        } else {
            setResults([]);
        }
    };

    return (
        <div className="relative w-full">
            <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-100 p-3">
                <MapPin className="text-maahi-brand mr-2 w-5 h-5" />
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder={placeholder}
                    className="flex-1 outline-none text-gray-800 placeholder-gray-400"
                />
                <Search className="text-gray-400 w-5 h-5" />
            </div>

            {/* Search Results Dropdown */}
            {(results.length > 0 || loading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm italic">Searching...</div>
                    ) : (
                        results.map((result, i) => (
                            <div
                                key={i}
                                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0"
                                onClick={() => {
                                    setQuery(result.description || result.formatted_address || '');
                                    setResults([]);
                                    onSelect(result);
                                }}
                            >
                                <MapPin className="text-gray-400 mr-3 w-4 h-4 flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="font-medium text-gray-800 truncate">{result.description || result.name || 'Unknown Location'}</p>
                                    <p className="text-xs text-gray-500 truncate">{result.secondary_text || result.administrative_info?.locality || ''}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
