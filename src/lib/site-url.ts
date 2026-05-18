/**
 * Canonical origin for metadataBase, sitemap, robots, and JSON-LD.
 *
 * Order:
 * 1. NEXT_PUBLIC_SITE_URL — set in Vercel to your public origin (e.g. https://www.budgetcabsservices.com).
 * 2. Production: VERCEL_PROJECT_PRODUCTION_URL — shortest production custom domain (avoids *.vercel.app in sitemap when the site is served on a custom domain).
 * 3. Preview/dev on Vercel: VERCEL_URL — this deployment’s hostname.
 * 4. Static fallback.
 *
 * Without (1) or (2) on a production deploy, metadata and robots used to point at *.vercel.app while users hit the custom domain.
 */

/** Used when env-derived origins are missing or invalid (never throw from consumers). */
export const SITE_ORIGIN_FALLBACK = "https://budgetcabsservices.com";

function hostnameOnly(raw: string): string {
  return raw.replace(/^https?:\/\//i, "").split("/")[0]?.replace(/\/$/, "") ?? "";
}

/** Returns `http(s)://host[:port]` or null if the value cannot be a usable origin. */
function originFromCandidate(candidate: string): string | null {
  try {
    const trimmed = candidate.trim();
    if (!trimmed) return null;
    const href = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, "")}`;
    const u = new URL(href);
    if (!u.hostname || (u.protocol !== "http:" && u.protocol !== "https:")) {
      return null;
    }
    return u.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  try {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicit) {
      const origin = originFromCandidate(explicit);
      if (origin) return origin;
    }

    const vercelEnv = process.env.VERCEL_ENV;
    const productionHostRaw = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelEnv === "production" && productionHostRaw) {
      const host = hostnameOnly(productionHostRaw);
      if (host) {
        const origin = originFromCandidate(`https://${host}`);
        if (origin) return origin;
      }
    }

    const vercelRaw = process.env.VERCEL_URL?.trim();
    if (vercelRaw) {
      const host = hostnameOnly(vercelRaw);
      if (host) {
        const origin = originFromCandidate(`https://${host}`);
        if (origin) return origin;
      }
    }

    return SITE_ORIGIN_FALLBACK;
  } catch {
    return SITE_ORIGIN_FALLBACK;
  }
}

export function shouldBlockIndexing(): boolean {
  return process.env.NEXT_PUBLIC_NOINDEX === "true";
}
