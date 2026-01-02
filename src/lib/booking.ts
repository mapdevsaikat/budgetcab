export function generateBookingRef(): string {
    const digits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `MA-${digits}`;
}

/**
 * Time slot types for pricing
 */
export type TimeSlotType = 'office_hours' | 'night_hours' | 'regular_time';

/**
 * Determines the time slot type based on IST (India Standard Time)
 * Office Hours: 8:00 AM - 11:00 AM and 5:00 PM - 9:00 PM
 * Night Hours: 11:00 PM - 5:00 AM
 * Regular Time: All other times
 */
export function getTimeSlotType(dateTime: Date): TimeSlotType {
    // Convert to IST (UTC+5:30) by adding the offset manually
    // IST is UTC+5:30, so we add 5 hours and 30 minutes
    const utcTime = dateTime.getTime();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(utcTime + istOffset);
    
    // Get hours and minutes in IST
    const hours = istTime.getUTCHours(); // Use UTC methods since we've already adjusted the time
    const minutes = istTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Office Hours: 8:00 AM - 11:00 AM (480-660 minutes) and 5:00 PM - 9:00 PM (1020-1320 minutes)
    if ((totalMinutes >= 480 && totalMinutes < 660) || (totalMinutes >= 1020 && totalMinutes < 1320)) {
        return 'office_hours';
    }

    // Night Hours: 11:00 PM - 5:00 AM (1320-1440 minutes or 0-300 minutes)
    if (totalMinutes >= 1320 || totalMinutes < 300) {
        return 'night_hours';
    }

    // Regular Time: All other times
    return 'regular_time';
}

/**
 * Calculate fare based on distance and time slot
 */
export function calculateFare(
    distanceKm: number, 
    baseFare: number, 
    perKmRate: number, 
    timeSlot?: TimeSlotType
): number {
    return parseFloat(((distanceKm * perKmRate) + baseFare).toFixed(2));
}
