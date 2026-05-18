import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const publicPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/booking", changeFrequency: "daily", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact", changeFrequency: "weekly", priority: 0.9 },
    { path: "/onboarding", changeFrequency: "monthly", priority: 0.6 },
  ];

  return publicPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
