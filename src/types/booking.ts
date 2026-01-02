/**
 * Booking Status ENUM - Matches the database enum type
 * 
 * This enum represents all possible states in the booking lifecycle.
 * It's synced with the database ENUM type 'booking_status'.
 */
export enum BookingStatus {
  // Initial States
  PENDING = 'pending',                      // Booking created, awaiting confirmation
  CONFIRMED = 'confirmed',                  // Booking confirmed, awaiting driver assignment
  
  // Driver Assignment & Transit
  DRIVER_ASSIGNED = 'driver_assigned',      // Driver assigned to the booking
  DRIVER_ENROUTE = 'driver_enroute',        // Driver on the way to pickup location
  ARRIVED = 'arrived',                      // Driver arrived at pickup location
  
  // Active Trip
  IN_PROGRESS = 'in_progress',              // Trip started (passenger picked up)
  
  // Terminal States
  COMPLETED = 'completed',                  // Trip completed successfully
  CANCELLED_BY_USER = 'cancelled_by_user',  // User cancelled
  CANCELLED_BY_DRIVER = 'cancelled_by_driver', // Driver cancelled
  CANCELLED_BY_ADMIN = 'cancelled_by_admin', // Admin cancelled
  NO_SHOW = 'no_show',                      // User didn't show up
  EXPIRED = 'expired',                      // Booking expired
}

/**
 * Booking Status Type - For type safety
 */
export type BookingStatusType = 
  | 'pending'
  | 'confirmed'
  | 'driver_assigned'
  | 'driver_enroute'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_driver'
  | 'cancelled_by_admin'
  | 'no_show'
  | 'expired';

/**
 * Booking Interface - Matches the database schema
 */
export interface Booking {
  id: string;
  booking_ref: string;
  user_id: string;
  user_first_name: string;
  user_mobile: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_digipin: string;
  pickup_address: string;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  drop_digipin: string;
  distance_km: number;
  price_total: number;
  status: BookingStatusType;
  scheduled_time: string;
  driver_id?: string | null;
  cancellation_reason?: string | null;
  actual_pickup_time?: string | null;
  actual_drop_time?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Status Categories - Helper for grouping statuses
 */
export const BookingStatusCategories = {
  ACTIVE: [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.DRIVER_ASSIGNED,
    BookingStatus.DRIVER_ENROUTE,
    BookingStatus.ARRIVED,
    BookingStatus.IN_PROGRESS,
  ],
  TERMINAL: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED_BY_USER,
    BookingStatus.CANCELLED_BY_DRIVER,
    BookingStatus.CANCELLED_BY_ADMIN,
    BookingStatus.NO_SHOW,
    BookingStatus.EXPIRED,
  ],
  CANCELLED: [
    BookingStatus.CANCELLED_BY_USER,
    BookingStatus.CANCELLED_BY_DRIVER,
    BookingStatus.CANCELLED_BY_ADMIN,
  ],
  SUCCESSFUL: [BookingStatus.COMPLETED],
} as const;

/**
 * Status Display Names - For UI display
 */
export const BookingStatusLabels: Record<BookingStatusType, string> = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  driver_assigned: 'Driver Assigned',
  driver_enroute: 'Driver on the Way',
  arrived: 'Driver Arrived',
  in_progress: 'Trip in Progress',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled by You',
  cancelled_by_driver: 'Cancelled by Driver',
  cancelled_by_admin: 'Cancelled by Admin',
  no_show: 'No Show',
  expired: 'Expired',
};

/**
 * Status Colors - For UI styling (Tailwind classes)
 */
export const BookingStatusColors: Record<BookingStatusType, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  driver_assigned: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  driver_enroute: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  arrived: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  in_progress: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  cancelled_by_user: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  cancelled_by_driver: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  cancelled_by_admin: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  no_show: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
};

/**
 * Check if a status is active (not terminal)
 */
export const isActiveBooking = (status: BookingStatusType): boolean => {
  return BookingStatusCategories.ACTIVE.some(s => s === status);
};

/**
 * Check if a status is cancelled
 */
export const isCancelledBooking = (status: BookingStatusType): boolean => {
  return BookingStatusCategories.CANCELLED.some(s => s === status);
};

/**
 * Check if a status is completed successfully
 */
export const isCompletedBooking = (status: BookingStatusType): boolean => {
  return status === BookingStatus.COMPLETED;
};

/**
 * Get the next allowed status transitions for a given status
 */
export const getAllowedStatusTransitions = (currentStatus: BookingStatusType): BookingStatusType[] => {
  const transitions: Record<BookingStatusType, BookingStatusType[]> = {
    pending: ['confirmed', 'cancelled_by_user', 'cancelled_by_admin', 'expired'],
    confirmed: ['driver_assigned', 'cancelled_by_user', 'cancelled_by_admin', 'expired'],
    driver_assigned: ['driver_enroute', 'cancelled_by_user', 'cancelled_by_driver', 'cancelled_by_admin'],
    driver_enroute: ['arrived', 'cancelled_by_user', 'cancelled_by_driver', 'cancelled_by_admin'],
    arrived: ['in_progress', 'no_show', 'cancelled_by_user', 'cancelled_by_driver', 'cancelled_by_admin'],
    in_progress: ['completed', 'cancelled_by_driver', 'cancelled_by_admin'],
    completed: [],
    cancelled_by_user: [],
    cancelled_by_driver: [],
    cancelled_by_admin: [],
    no_show: [],
    expired: [],
  };

  return transitions[currentStatus] || [];
};

