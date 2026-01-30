import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.budgetcabsservice.com';
  const now = new Date();

  // Main pages with their priorities and change frequencies
  const routes: MetadataRoute.Sitemap = [
    // Homepage - Highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Booking page - High priority for SEO
    {
      url: `${baseUrl}/booking`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // User pages
    {
      url: `${baseUrl}/onboarding`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/profile/address`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profile/booking-status`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  return routes;
}

