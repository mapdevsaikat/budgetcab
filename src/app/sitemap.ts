import type { MetadataRoute } from "next";
import { getSiteUrl, SITE_ORIGIN_FALLBACK } from "@/lib/site-url";

const publicPaths: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/booking", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "weekly", priority: 0.9 },
  { path: "/onboarding", changeFrequency: "monthly", priority: 0.6 },
];

function buildSitemap(baseUrl: string): MetadataRoute.Sitemap {
  const normalized = baseUrl.replace(/\/$/, "");
  const now = new Date();
  return publicPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${normalized}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = buildSitemap(getSiteUrl());
    const first = entries[0];
    if (!first?.url) {
      return buildSitemap(SITE_ORIGIN_FALLBACK);
    }
    new URL(first.url);
    return entries;
  } catch {
    return buildSitemap(SITE_ORIGIN_FALLBACK);
  }
}
