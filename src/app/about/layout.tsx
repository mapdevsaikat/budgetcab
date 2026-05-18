import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Budget Cabs Service is a trusted online cab booking aggregator providing premium intercity and local car rental services in Nashik, Mumbai, Pune, and surrounding areas. Book reliable taxi service with 24/7 assistance.',
  keywords: [
    'Budget Cabs Service about',
    'Nashik taxi service company',
    'Mumbai Nashik cab service',
    'intercity taxi service Nashik',
    'car rental service Nashik',
    'premium taxi service',
    'reliable cab service',
    '24/7 taxi service Nashik',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    description:
      'Trusted online cab booking aggregator providing premium intercity and local car rental services in Nashik, Mumbai, Pune, and surrounding areas.',
    type: 'website',
    url: '/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
