import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EnvWarningBanner from "@/components/EnvWarningBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.budgetcabsservice.com'),
  title: "Budget Cabs Service Nashik | Airport Transfer | Nashik-Mumbai-Pune Taxi",
  description: "Book affordable taxi service from Nashik to Mumbai, Pune, and airport transfers. Budget Cabs Service offers reliable intercity cabs, Nashik-Mumbai taxi, Nashik-Pune cab, Malegaon taxi, and Mumbai Airport transfers. Call 8600829292 for bookings.",
  keywords: [
    "Nashik taxi service",
    "Nashik to Mumbai taxi",
    "Nashik to Pune cab",
    "Mumbai to Nashik taxi",
    "Pune to Nashik cab",
    "Nashik airport transfer",
    "Mumbai airport transfer",
    "Nashik-Mumbai taxi",
    "Nashik-Pune taxi",
    "Malegaon taxi",
    "Nashik cab service",
    "intercity taxi Nashik",
    "budget cab Nashik",
    "affordable taxi Nashik",
    "Nashik taxi booking",
    "cab service Nashik",
    "Nashik to Mumbai airport",
    "Nashik to Pune airport",
    "Panchavati taxi",
    "Gangapur Road taxi",
    "Satpur taxi",
    "Ambad taxi",
    "Sinnar taxi",
    "Igatpuri taxi",
    "Trimbakeshwar taxi",
    "Shirdi taxi",
    "sharing cab Nashik",
    "Nashik local taxi",
    "outstation taxi Nashik"
  ],
  authors: [{ name: "Budget Cabs Service" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Budget Cabs Service",
    url: "https://www.budgetcabsservice.com/",
    title: "Budget Cabs Service Nashik | Airport Transfer | Nashik-Mumbai-Pune Taxi",
    description: "Affordable intercity taxi service from Nashik to Mumbai, Pune, and airport transfers. Reliable Nashik-Mumbai-Pune cabs, Malegaon taxi, and Mumbai Airport transfers. 24/7 availability.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Budget Cabs Service Nashik - Airport Transfer & Intercity Taxi Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget Cabs Service Nashik | Nashik-Mumbai-Pune Taxi & Airport Transfer",
    description: "Affordable, professional taxi service from Nashik to Mumbai, Pune, and airport transfers. Nashik-Mumbai-Pune cabs, Malegaon taxi. 24/7 availability.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budget Cabs Service',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": "Budget Cabs Service",
    "description": "Affordable intercity taxi service from Nashik to Mumbai, Pune, and airport transfers. Nashik-Mumbai-Pune cabs, Malegaon taxi, and reliable rides.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Budget Cabs Service",
      "image": "https://www.budgetcabsservice.com/android-chrome-512x512.png",
      "telePhone": "+91-8600829292",
      "email": "info@budgetcabsservices.com",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nashik",
        "addressRegion": "Maharashtra",
        "addressCountry": "IN"
      }
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Nashik"
      },
      {
        "@type": "City",
        "name": "Mumbai"
      },
      {
        "@type": "City",
        "name": "Pune"
      },
      {
        "@type": "City",
        "name": "Malegaon"
      },
      {
        "@type": "City",
        "name": "Sinnar"
      },
      {
        "@type": "City",
        "name": "Igatpuri"
      },
      {
        "@type": "City",
        "name": "Trimbakeshwar"
      },
      {
        "@type": "City",
        "name": "Shirdi"
      }
    ],
    "serviceType": [
      "Intercity Taxi Service",
      "Airport Transfer",
      "Nashik to Mumbai Taxi",
      "Nashik to Pune Taxi",
      "Mumbai Airport Transfer",
      "Pune Airport Transfer",
      "Outstation Taxi"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+91-8600829292",
        "contactType": "booking and customer service",
        "availableLanguage": ["English", "Hindi", "Marathi"],
        "areaServed": ["IN"],
        "availableChannel": ["Phone", "WhatsApp"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+91-7977619481",
        "contactType": "booking and customer service",
        "availableLanguage": ["English", "Hindi", "Marathi"],
        "areaServed": ["IN"],
        "availableChannel": ["Phone", "WhatsApp"]
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <EnvWarningBanner />
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
