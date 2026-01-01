import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_QUANTAROUTE_KEY;

    try {
        const response = await fetch(`https://api.quantaroute.com/v1/location/lookup?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch lookup' }, { status: 500 });
    }
}
