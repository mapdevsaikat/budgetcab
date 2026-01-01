import { create } from 'zustand';

interface Location {
    latitude: number;
    longitude: number;
    address: string;
    digipin?: string;
}

interface BookingState {
    pickup: Location | null;
    drop: Location | null;
    distance: number | null;
    price: number | null;
    selectedSlot: string | null;

    setPickup: (location: Location | null) => void;
    setDrop: (location: Location | null) => void;
    setDistance: (distance: number | null) => void;
    setPrice: (price: number | null) => void;
    setSelectedSlot: (slot: string | null) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    pickup: null,
    drop: null,
    distance: null,
    price: null,
    selectedSlot: null,

    setPickup: (pickup) => set({ pickup }),
    setDrop: (drop) => set({ drop }),
    setDistance: (distance) => set({ distance }),
    setPrice: (price) => set({ price }),
    setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
    reset: () => set({ pickup: null, drop: null, distance: null, price: null, selectedSlot: null }),
}));
