import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.maptiler.com',
      },
      {
        protocol: 'https',
        hostname: '*.maptiler.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://api.maptiler.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.maptiler.com https://*.maptiler.com https://*.supabase.co https://api.mapbox.com https://quantaroute.com https://api.quantaroute.com",
              "frame-src 'self' https://www.google.com https://*.google.com https://*.googleapis.com",
              "worker-src 'self' blob:",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
