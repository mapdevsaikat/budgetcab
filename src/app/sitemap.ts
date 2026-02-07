import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://budgetcab.vercel.app';
  const now = new Date();

  // Public pages with their priorities and change frequencies
  // Prioritizing pages that are most important for SEO and AI discovery
  const routes: MetadataRoute.Sitemap = [
    // Homepage - Highest priority, likely to change frequently with offers/news
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Booking page - High priority, core functionality
    {
      url: `${baseUrl}/booking`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // About page - Important for E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness)
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Contact page - Important for trust and local SEO
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Onboarding (Login/Signup) - Useful for users searching for login
    {
      url: `${baseUrl}/onboarding`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return routes;
}
