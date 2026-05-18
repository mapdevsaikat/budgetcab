import { NextResponse } from "next/server";
import { SITE_ORIGIN_FALLBACK, getSiteUrl } from "./site-url";

function hostnameOnly(raw: string): string | null {
  try {
    const h = raw.replace(/^https?:\/\//i, "").split("/")[0]?.split(":")[0];
    return h || null;
  } catch {
    return null;
  }
}

/** Hostnames allowed to call first-party API routes (browser Origin / Referer). */
function allowedBrowserHosts(): Set<string> {
  const set = new Set<string>();
  for (const urlStr of [
    getSiteUrl(),
    SITE_ORIGIN_FALLBACK,
    "https://www.budgetcabsservices.com",
    "https://budgetcabsservices.com",
    process.env.VERCEL_URL?.trim()
      ? `https://${hostnameOnly(process.env.VERCEL_URL) ?? ""}`
      : "",
  ]) {
    if (!urlStr) continue;
    const h = hostnameOnly(urlStr);
    if (h) set.add(h);
  }
  if (process.env.NODE_ENV === "development") {
    set.add("localhost");
    set.add("127.0.0.1");
  }
  return set;
}

/**
 * Blocks cross-origin and direct server/tool requests to API routes in production,
 * reducing anonymous quota burn on proxied third-party keys.
 * Development allows all callers for local tooling.
 */
export function apiForbiddenUnlessBrowserOrigin(
  request: Request,
): NextResponse | null {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const allowed = allowedBrowserHosts();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  let host: string | null = null;
  try {
    if (origin && origin !== "null") {
      host = new URL(origin).hostname;
    } else if (referer) {
      host = new URL(referer).hostname;
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!host || !allowed.has(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
