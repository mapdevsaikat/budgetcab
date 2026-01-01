export function generateBookingRef(): string {
    const digits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `MA-${digits}`;
}

export function calculateFare(distanceKm: number, baseFare: number, perKmRate: number): number {
    return parseFloat(((distanceKm * perKmRate) + baseFare).toFixed(2));
}
