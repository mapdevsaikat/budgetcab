import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_QUANTAROUTE_KEY;

    try {
        const response = await fetch(`https://api.quantaroute.com/v1/digipin/autocomplete?q=${q}&key=${apiKey}`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch autocomplete' }, { status: 500 });
    }
}
