import { NextResponse } from "next/server";
import { apiForbiddenUnlessBrowserOrigin } from "@/lib/api-request-guard";

export async function POST(request: Request) {
  const forbidden = apiForbiddenUnlessBrowserOrigin(request);
  if (forbidden) return forbidden;

  const isDev = process.env.NODE_ENV === "development";

  const body = await request.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const apiKey = process.env.QUANTAROUTE_API_KEY;

  if (!apiKey) {
    if (isDev) console.error("QUANTAROUTE_API_KEY not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const url = `https://api.quantaroute.com/v1/digipin/geocode`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (isDev) {
        console.error("Geocode API error:", response.status, errorText);
      }
      return NextResponse.json({ error: "Upstream geocoding error" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (isDev) console.error("Geocode error:", error);
    return NextResponse.json({ error: "Failed to geocode address" }, { status: 500 });
  }
}
