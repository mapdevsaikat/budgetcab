export function generateBookingRef(): string {
    const digits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `BC-${digits}`;
}

/**
 * Calculate number of nights between start and end date
 */
export function calculateNights(startDate: string, endDate: string | null): number {
  if (!endDate || !startDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Simplified fare calculation based on cab type + trip type pricing
 * @param baseFare - Base fare amount for the cab type + trip type combination
 * @param numberOfNights - Number of nights (only for Outstation trips)
 * @param nightStayRate - Night stay rate per night (default: 500)
 */
export function calculateFare(
    baseFare: number,
    numberOfNights: number = 0,
    nightStayRate: number = 500 // Default night stay rate per night
): number {
    // Base fare for cab type + trip type combination
    let fare = baseFare;
    
    // Add night stay charges for Outstation trips
    if (numberOfNights > 0) {
        fare += numberOfNights * nightStayRate;
    }
    
    return parseFloat(fare.toFixed(2));
}
