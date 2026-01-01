import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { address } = body;

    if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const apiKey = process.env.QUANTAROUTE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        // Correct QuantaRoute geocode endpoint - uses Bearer token like autocomplete
        const url = `https://api.quantaroute.com/v1/digipin/geocode`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, // Bearer token, NOT x-api-key
            },
            body: JSON.stringify({ address }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Geocode API error:', response.status, errorText);
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Geocode response:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Geocode error:', error);
        return NextResponse.json({ 
            error: 'Failed to geocode address',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

