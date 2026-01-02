import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EnvWarningBanner from "@/components/EnvWarningBanner";

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
  metadataBase: new URL('https://www.maahicabs.com'),
  title: "MaahiCabs | Safe & Reliable Female-Only Cab Service in Bengaluru",
  description: "Book MaahiCabs for a safe, female-only taxi experience in Bengaluru. Founded by Maahi Narender, providing trusted rides with verified woman partners. Call or WhatsApp 9535238661.",
  keywords: ["female only cabs Bengaluru", "safe taxi for women Bangalore", "MaahiCabs", "women driven cabs", "ladies taxi service Bengaluru", "Maahi Narender"],
  authors: [{ name: "Maahi Narender" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "MaahiCabs",
    url: "https://www.maahicabs.com/",
    title: "MaahiCabs - Empowering Women's Travel in Bengaluru",
    description: "By women, for women. Experience the safest cab service in Bengaluru. Book your ride today.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MaahiCabs - Safe & Reliable Female-Only Cab Service in Bengaluru",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaahiCabs | Female-Only Cabs Bengaluru",
    description: "Safe, professional, and reliable female-only cab service in Bengaluru. 24/7 availability.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": "MaahiCabs",
    "description": "A premium female-only cab service operating in the Bengaluru area, ensuring safety and empowerment for women travelers.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "MaahiCabs",
      "image": "https://www.maahicabs.com/android-chrome-512x512.png",
      "telePhone": "+91-9535238661",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Bengaluru",
        "addressRegion": "Karnataka",
        "addressCountry": "IN"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Bengaluru"
    },
    "founder": {
      "@type": "Person",
      "name": "Maahi Narender"
    },
    "sameAs": [
      "https://www.instagram.com/_maahi_cabs/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9535238661",
      "contactType": "booking and customer service",
      "availableLanguage": ["English", "Hindi", "Kannada"]
    }
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
        {children}
      </body>
    </html>
  );
}
