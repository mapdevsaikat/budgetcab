import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { pickup, drop } = body;

    if (!pickup || !drop) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    try {
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${drop.longitude},${drop.latitude}?geometries=geojson&access_token=${mapboxToken}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            // Add 400 meters buffer logic as per context.md
            const finalDistanceKm = (distanceMeters + 400) / 1000;

            return NextResponse.json({
                distance: finalDistanceKm,
                route: data.routes[0].geometry,
                originalDistance: distanceMeters / 1000
            });
        }

        return NextResponse.json({ error: 'No route found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
    }
}
