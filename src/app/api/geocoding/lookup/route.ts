import { NextResponse } from "next/server";
import { apiForbiddenUnlessBrowserOrigin } from "@/lib/api-request-guard";

export async function POST(request: Request) {
  const forbidden = apiForbiddenUnlessBrowserOrigin(request);
  if (forbidden) return forbidden;

  const isDev = process.env.NODE_ENV === "development";

  const body = await request.json();
  const { latitude, longitude } = body;

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const apiKey = process.env.QUANTAROUTE_API_KEY;

  if (!apiKey) {
    if (isDev) console.error("QUANTAROUTE_API_KEY not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const url = `https://api.quantaroute.com/v1/location/lookup`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (isDev) {
        console.error("QuantaRoute lookup error:", response.status, errorText);
      }
      return NextResponse.json({ error: "Upstream lookup error" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (isDev) console.error("Lookup error:", error);
    return NextResponse.json({ error: "Failed to fetch lookup" }, { status: 500 });
  }
}
