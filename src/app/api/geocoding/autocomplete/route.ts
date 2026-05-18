import { NextResponse } from "next/server";
import { apiForbiddenUnlessBrowserOrigin } from "@/lib/api-request-guard";

export async function GET(request: Request) {
  const forbidden = apiForbiddenUnlessBrowserOrigin(request);
  if (forbidden) {
    return forbidden;
  }

  const isDev = process.env.NODE_ENV === "development";

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") || "10";

  if (!q || q.trim() === "") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.QUANTAROUTE_API_KEY;

  if (!apiKey) {
    if (isDev) {
      console.error("QUANTAROUTE_API_KEY not configured");
    }
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const response = await fetch(
      `https://api.quantaroute.com/v1/digipin/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (isDev) {
        console.error("QuantaRoute autocomplete error:", response.status, errorText);
      }
      return NextResponse.json(
        { error: "Upstream geocoding error" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (isDev) {
      console.error("Autocomplete error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch autocomplete" },
      { status: 500 },
    );
  }
}
