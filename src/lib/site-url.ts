/**
 * Canonical origin for metadataBase, sitemap, robots, and JSON-LD.
 * Prefer NEXT_PUBLIC_SITE_URL in production (e.g. https://budgetcabsservices.com).
 * On Vercel previews, VERCEL_URL is used when the public URL is unset.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "https://budgetcabsservices.com";
}

export function shouldBlockIndexing(): boolean {
  return process.env.NEXT_PUBLIC_NOINDEX === "true";
}
