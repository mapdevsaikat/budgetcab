import type { MetadataRoute } from "next";
import { getSiteUrl, shouldBlockIndexing } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  if (shouldBlockIndexing()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${base}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/profile", "/diagnostics"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
