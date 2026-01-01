import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log(' === LOOKUP API ROUTE CALLED ===');
    
    const body = await request.json();
    const { latitude, longitude } = body;

    console.log(' Coordinates:', { latitude, longitude });

    if (!latitude || !longitude) {
        console.error(' Missing coordinates');
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const apiKey = process.env.QUANTAROUTE_API_KEY;

    if (!apiKey) {
        console.error('❌ QUANTAROUTE_API_KEY not found in environment');
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('✅ API key found (first 15 chars):', apiKey.substring(0, 15) + '...');

    try {
        // Correct QuantaRoute endpoint - /v1/location/lookup (not /v1/digipin/lookup)
        const url = `https://api.quantaroute.com/v1/location/lookup`;
        
        console.log(' Calling QuantaRoute:', url);
        console.log(' Request body:', JSON.stringify({ latitude, longitude }));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, // Use Bearer token
            },
            body: JSON.stringify({ latitude, longitude }),
        });

        console.log(' Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ QuantaRoute API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API responded with status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(' QuantaRoute response:', JSON.stringify(data, null, 2));
        
        // Validate response has expected structure
        if (!data.digipin || !data.administrative_info) {
            console.warn(' Unexpected response structure. Expected digipin and administrative_info');
        }
        
        return NextResponse.json(data);
    } catch (error) {
        console.error(' === LOOKUP ERROR ===');
        console.error(error);
        return NextResponse.json({ 
            error: 'Failed to fetch lookup',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
