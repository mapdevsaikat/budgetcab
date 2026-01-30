# Budget Cabs Service - User Application

A mobile-first intercity taxi booking application for Mumbai to Nashik routes, built with Next.js, Supabase, and modern mapping technologies.

## 🚀 Quick Start

> **⚡ New to the project?** See [QUICKSTART.md](./QUICKSTART.md) for a visual step-by-step guide.

### Prerequisites
- Node.js 18+ installed
- A Supabase account
- API keys for QuantaRoute, MapTiler, and Mapbox

### Setup Instructions

1. **Clone and Install**
```bash
npm install
```

2. **Configure Environment Variables**

Create a `.env.local` file in the root directory:

```bash
# Supabase (Required for Authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# QuantaRoute Geocoding API
QUANTAROUTE_API_KEY=your-quantaroute-api-key-here

# MapTiler API (for map tiles)
NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-api-key-here

# Mapbox API (for routing/distance)
MAPBOX_API_KEY=your-mapbox-api-key-here
```

**📋 For detailed setup instructions, database schema, and troubleshooting, see [SETUP.md](./SETUP.md)**

3. **Run the Development Server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

**🔍 Verify Setup:** Visit [http://localhost:3000/diagnostics](http://localhost:3000/diagnostics) to check if all services are configured correctly.

## 🎯 Features

- **User Authentication** - Secure signup/login with Supabase
- **Location Search** - Smart address autocomplete with QuantaRoute
- **Interactive Maps** - MapLibre GL with MapTiler tiles
- **Route Planning** - Calculate distances and fares
- **Booking System** - Complete ride booking workflow
- **Mobile-First Design** - Optimized for touch interfaces

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Maps:** MapLibre GL + MapTiler
- **Geocoding:** QuantaRoute API
- **Routing:** Mapbox Directions API

## 📱 User Flow

1. Select pickup location (auto-detected or searched)
2. Search and select destination
3. View route preview and fare estimate
4. Choose available time slot
5. Confirm booking

## 🔧 Troubleshooting

### "Failed to fetch" Error on Registration

This typically means Supabase is not configured:

1. Verify `.env.local` exists with correct credentials
2. Check Supabase project is active
3. Run the database setup SQL (see SETUP.md)
4. Restart the development server

### Map Not Loading

1. Check `NEXT_PUBLIC_MAPTILER_API_KEY` is set
2. Verify API key is valid at [MapTiler Dashboard](https://cloud.maptiler.com/)

### Location Search Not Working

1. Check `QUANTAROUTE_API_KEY` is configured
2. Verify API key is valid

**📖 For complete troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

## 📚 Documentation

- **[Quick Start](./QUICKSTART.md)** - Visual step-by-step setup guide ⭐ **START HERE**
- [Setup Guide](./SETUP.md) - Complete setup and configuration
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Registration Fix](./REGISTRATION_FIX.md) - Details about the registration fix
- [Context](./context.md) - Project architecture and requirements

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
