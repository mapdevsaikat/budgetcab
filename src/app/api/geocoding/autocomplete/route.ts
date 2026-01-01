import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    console.log(' === AUTOCOMPLETE API ROUTE CALLED ===');
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10'; // Default to 10, matching SearchPanel.tsx reference

    console.log(' Search query:', q);
    console.log(' Limit:', limit);

    if (!q || q.trim() === '') {
        console.error(' Missing or empty query');
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const apiKey = process.env.QUANTAROUTE_API_KEY;

    if (!apiKey) {
        console.error(' API key not configured');
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(' API key found');

    try {
      const response = await fetch(
        `https://api.quantaroute.com/v1/digipin/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
          },
        }
      );
        
        console.log(' Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(' QuantaRoute API error:', response.status, errorText);
            throw new Error(`API responded with status: ${response.status}`);
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
