'use client';

import React, { useEffect, useState } from 'react';
import { useBookingStore } from '@/store/useBookingStore';
import { MapPin, Navigation } from 'lucide-react';

const UserLocation = () => {
    const { pickup } = useBookingStore();

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-budget-brand/10 p-2 rounded-full">
                    <Navigation className="w-5 h-5 text-budget-brand fill-current" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Current Location</p>
                    <p className="text-gray-900 font-medium text-sm truncate max-w-[200px]">
                        {pickup?.address || 'Not set'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserLocation;
