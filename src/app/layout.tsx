import type { Metadata, Viewport } from "next";
import { getSiteUrl, shouldBlockIndexing } from "@/lib/site-url";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const defaultTitle =
  "Budget Cabs Service Nashik | Airport Transfer | Nashik-Mumbai-Pune Taxi";
const defaultDescription =
  "Book affordable taxi service from Nashik to Mumbai, Pune, Shirdi, and airport transfers. Budget Cabs Service offers reliable intercity cabs, one-way taxi, round trip, and sharing cabs. Call 9860689292.";
const defaultOgDescription =
  "Affordable intercity taxi service from Nashik to Mumbai, Pune, and airport transfers. Reliable Nashik-Mumbai-Pune cabs, Malegaon taxi, and Mumbai Airport transfers. 24/7 availability.";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getSiteUrl();
  const blocked = shouldBlockIndexing();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: defaultTitle,
      template: "%s | Budget Cabs Service Nashik",
    },
    description: defaultDescription,
    keywords: [
    // Core Services
    "Nashik taxi service",
    "Nashik cab service",
    "intercity taxi Nashik",
    "outstation taxi Nashik",
    "Nashik taxi booking",
    "online cab booking Nashik",
    "24x7 taxi service Nashik",
    
    // Major Routes (Mumbai)
    "Nashik to Mumbai taxi",
    "Mumbai to Nashik taxi",
    "Nashik to Mumbai cab fare",
    "Mumbai to Nashik cab price",
    "Nashik to Mumbai airport taxi",
    "Mumbai airport to Nashik taxi",
    "Nashik to Mumbai one way cab",
    "Nashik to Dadar taxi",
    "Nashik to Borivali taxi",
    "Nashik to Thane taxi",
    
    // Major Routes (Pune)
    "Nashik to Pune cab",
    "Pune to Nashik cab",
    "Nashik to Pune taxi fare",
    "Pune to Nashik taxi service",
    "Nashik to Pune airport taxi",
    "Pune airport to Nashik cab",
    
    // Pilgrimage & Tourism
    "Nashik to Shirdi taxi",
    "Shirdi to Nashik taxi",
    "Mumbai to Shirdi taxi",
    "Nashik to Trimbakeshwar taxi",
    "Nashik darshan taxi",
    "Sula Vineyards taxi",
    
    // Local & Nearby
    "Malegaon taxi",
    "Sinnar taxi",
    "Igatpuri taxi",
    "Panchavati taxi",
    "Gangapur Road taxi",
    "Nashik local rental",
    
    // Service Types & Qualities
    "budget cab Nashik",
    "cheap taxi Nashik",
    "affordable taxi Nashik",
    "luxury cab Nashik",
    "sharing cab Nashik",
    "cool cab Nashik",
    "AC taxi Nashik",
    "Innova rental Nashik",
    "Ertiga cab Nashik",
    "Sedan taxi Nashik",
    "corporate car rental Nashik"
  ],
    authors: [{ name: "Budget Cabs Service" }],
    robots: blocked
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: "Budget Cabs Service",
      url: `${baseUrl}/`,
      title: defaultTitle,
      description: defaultOgDescription,
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
      title:
        "Budget Cabs Service Nashik | Nashik-Mumbai-Pune Taxi & Airport Transfer",
      description:
        "Affordable, professional taxi service from Nashik to Mumbai, Pune, and airport transfers. Nashik-Mumbai-Pune cabs, Malegaon taxi. 24/7 availability.",
      images: ["/opengraph-image"],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png" }],
      other: [
        { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
        { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
      ],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Budget Cabs Service",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Budget Cabs Service",
        "inLanguage": "en-IN",
        "publisher": { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Budget Cabs Service",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/android-chrome-512x512.png`,
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+91-9860689292",
            "contactType": "customer service",
            "availableLanguage": ["English", "Hindi", "Marathi"],
            "areaServed": "Nashik"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+91-8975900092",
            "contactType": "customer service",
            "availableLanguage": ["English", "Hindi", "Marathi"],
            "areaServed": "Mumbai"
          }
        ],
        "email": "info@budgetcabsservices.com"
      },
      {
        "@type": ["LocalBusiness", "TaxiService"],
        "@id": `${baseUrl}/#nashik-location`,
        "name": "Budget Cabs Service - Nashik",
        "image": `${baseUrl}/android-chrome-512x512.png`,
        "telephone": "+91-9860689292",
        "email": "info@budgetcabsservices.com",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Hotel Sai Pritam, near Dwarka circle, General Arun Kumar Vaidya Nagar, Wadala Naka",
          "addressLocality": "Nashik",
          "addressRegion": "Maharashtra",
          "postalCode": "422011",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "19.9918583",
          "longitude": "73.7937136"
        },
        "url": baseUrl,
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        },
        "parentOrganization": { "@id": `${baseUrl}/#organization` },
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
          }
        ],
        "serviceType": [
          "Intercity Taxi Service",
          "Airport Transfer",
          "Nashik to Mumbai Taxi",
          "Nashik to Pune Taxi",
          "Outstation Taxi"
        ]
      },
      {
        "@type": ["LocalBusiness", "TaxiService"],
        "@id": `${baseUrl}/#mumbai-location`,
        "name": "Budget Cabs Service - Mumbai",
        "image": `${baseUrl}/android-chrome-512x512.png`,
        "telephone": "+91-8975900092",
        "email": "info@budgetcabsservices.com",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "16 PLOT 175, R-2, B-WING, MAJAS VLG, NR.POONAM NAGAR",
          "addressLocality": "Andheri East, Mumbai",
          "addressRegion": "Maharashtra",
          "postalCode": "400060",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "19.1136",
          "longitude": "72.8697"
        },
        "url": baseUrl,
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        },
        "parentOrganization": { "@id": `${baseUrl}/#organization` },
        "areaServed": [
          {
            "@type": "City",
            "name": "Mumbai"
          },
          {
            "@type": "City",
            "name": "Nashik"
          },
          {
            "@type": "City",
            "name": "Pune"
          },
          {
            "@type": "City",
            "name": "Thane"
          }
        ],
        "serviceType": [
          "Intercity Taxi Service",
          "Airport Transfer",
          "Mumbai to Nashik Taxi",
          "Mumbai to Pune Taxi",
          "Mumbai Airport Transfer",
          "Outstation Taxi"
        ]
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-55KELJEL4P"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-55KELJEL4P');
          `}
        </Script>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <EnvWarningBanner />
        <PWAInstallPrompt />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}