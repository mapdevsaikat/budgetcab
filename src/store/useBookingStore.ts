import { create } from 'zustand';

interface Location {
    latitude: number;
    longitude: number;
    address: string;
    digipin?: string;
    // Store full administrative info for database
    locality?: string;
    pincode?: string;
    district?: string;
    state?: string;
}

interface BookingState {
    pickup: Location | null;
    drop: Location | null;
    distance: number | null;
    price: number | null;
    selectedSlot: string | null;
    pickupLocked: boolean;  // Track if pickup is confirmed

    setPickup: (location: Location | null) => void;
    setDrop: (location: Location | null) => void;
    setDistance: (distance: number | null) => void;
    setPrice: (price: number | null) => void;
    setSelectedSlot: (slot: string | null) => void;
    lockPickup: () => void;
    unlockPickup: () => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    pickup: null,
    drop: null,
    distance: null,
    price: null,
    selectedSlot: null,
    pickupLocked: false,

    setPickup: (pickup) => set({ pickup }),
    setDrop: (drop) => set({ drop }),
    setDistance: (distance) => set({ distance }),
    setPrice: (price) => set({ price }),
    setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
    lockPickup: () => set({ pickupLocked: true }),
    unlockPickup: () => set({ pickupLocked: false }),
    reset: () => set({ 
        pickup: null, 
        drop: null, 
        distance: null, 
        price: null, 
        selectedSlot: null,
        pickupLocked: false 
    }),
}));
