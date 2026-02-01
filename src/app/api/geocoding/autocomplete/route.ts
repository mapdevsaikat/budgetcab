import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    console.log(' === AUTOCOMPLETE API ROUTE CALLED ===');
    console.log(' Environment check:', {
        nodeEnv: process.env.NODE_ENV,
        hasQuantaRouteKey: !!process.env.QUANTAROUTE_API_KEY,
        keyLength: process.env.QUANTAROUTE_API_KEY?.length || 0,
    });
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10'; // Default to 10, matching SearchPanel.tsx reference

    console.log(' Search query:', q);
    console.log(' Limit:', limit);

    if (!q || q.trim() === '') {
        console.error(' Missing or empty query');
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Try both QUANTAROUTE_API_KEY and check if it's loaded
    const apiKey = process.env.QUANTAROUTE_API_KEY;

    if (!apiKey) {
        console.error(' ❌ QUANTAROUTE_API_KEY not found in environment');
        console.error(' Available env vars:', Object.keys(process.env).filter(k => k.includes('QUANTA') || k.includes('API') || k.includes('NODE')));
        console.error(' All env vars starting with Q:', Object.keys(process.env).filter(k => k.startsWith('Q')));
        return NextResponse.json({ 
            error: 'API key not configured',
            details: 'QUANTAROUTE_API_KEY environment variable is missing. Please check your .env.local file and restart the dev server.'
        }, { status: 500 });
    }

    console.log(' ✅ API key found (first 15 chars):', apiKey.substring(0, 15) + '...');
    console.log(' API key format:', apiKey.startsWith('qr_') ? 'QuantaRoute format' : apiKey.startsWith('dp_') ? 'DigiPin format' : 'Unknown format');
    console.log(' API key length:', apiKey.length);

    try {
      const response = await fetch(
        `https://api.quantaroute.com/v1/digipin/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`, // Use Bearer token, NOT x-api-key
          },
        }
      );
        
        console.log(' Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(' ❌ QuantaRoute API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                url: `https://api.quantaroute.com/v1/digipin/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`,
                headers: { 'Authorization': `Bearer ${apiKey.substring(0, 15)}...` }
            });
            
            // Provide more helpful error messages
            if (response.status === 401) {
                throw new Error(`Authentication failed (401). Please verify your QUANTAROUTE_API_KEY is correct and active. Current key format: ${apiKey.startsWith('qr_') ? 'QuantaRoute' : apiKey.startsWith('dp_') ? 'DigiPin' : 'Unknown'}`);
            }
            
            throw new Error(`API responded with status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(' Autocomplete response:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error(' Autocomplete error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch autocomplete',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
