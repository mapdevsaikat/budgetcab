import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Use production domain as primary, Vercel as alternate
  const baseUrl = 'https://budgetcabsservices.com';
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
      alternates: {
        languages: {
          'x-default': 'https://budgetcab.vercel.app',
        },
      },
    },
    // Booking page - High priority, core functionality
    {
      url: `${baseUrl}/booking`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          'x-default': 'https://budgetcab.vercel.app/booking',
        },
      },
    },
    // About page - Important for E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness)
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          'x-default': 'https://budgetcab.vercel.app/about',
        },
      },
    },
    // Contact page - Important for trust and local SEO with multi-location info
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'weekly', // Changed to weekly since we have dynamic location info
      priority: 0.9, // Increased priority for local SEO with multiple locations
      alternates: {
        languages: {
          'x-default': 'https://budgetcab.vercel.app/contact',
        },
      },
    },
    // Onboarding (Login/Signup) - Useful for users searching for login
    {
      url: `${baseUrl}/onboarding`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          'x-default': 'https://budgetcab.vercel.app/onboarding',
        },
      },
    },
  ];

  return routes;
}
