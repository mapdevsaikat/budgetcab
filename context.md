# Project Context: MaahiCabs User Application

## 1. Project Overview
We are building the "User App" for **MaahiCabs**, a cab booking service.
**Target Audience:** Mobile users (Mobile-First Design).
**Core Functionality:** Users view available slots from 30 driver partners, select pickup/drop locations, calculate fares, and book a ride.

## 2. Tech Stack & Dependencies
* **Framework:** Next.js 14+ (App Router), React, TypeScript.
* **Styling:** Tailwind CSS (Mobile-first utility classes).
* **Icons:** Lucide-React.
* **State Management:** React Context or Zustand (keep it simple).
* **Database & Auth:** Supabase.
* **Maps (Visual):** MapLibre GL JS with **MapTiler** tiles.
* **Geocoding (Search):** **QuantaRoute Geocoding API**.
* **API:** Use **QuantaRoute Geocoding API** for autocomplete/search.
    - /v1/digipin/geocode for address search. - for destination search
    - /v1/digipin/autocomplete for autocomplete. - 
    - /v1/location/lookup - we will use it for pickup location.
* **API:** Use **Mapbox** for routing/distance calculation. 
* **Routing/Distance Calculation:** **Mapbox** (Profile: `mapbox/driving`).

## 3. Database Schema (Supabase)
*Architecture must be lean and scalable.*
### Table: `profiles` (User Onboarding)
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Link to auth.users). |
| `first_name` | Text | User's first name. |
| `last_name` | Text | User's last name. |
| `email` | Text | User's email address. |
| `mobile` | Text | Verified mobile number. |
| `onboarding_completed` | Boolean | Default: false. |

### Table: `user_addresses` (Saved Locations)
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `user_id` | UUID | Foreign Key to profiles.id. |
| `address_type` | Text | 'home', 'work', 'other'. |
| `house_road_name` | Text | Manual input (e.g., "Flat 4B, Green Villa"). |
| `latitude` | Float | From QuantaRoute Lookup. |
| `longitude` | Float | From QuantaRoute Lookup. |
| `digipin` | Text | From QuantaRoute Lookup (e.g., "2P7-C93-PPKL"). |
| `locality` | Text | From QuantaRoute administrative_info. |
| `pincode` | Text | From QuantaRoute administrative_info. |
| `district` | Text | From QuantaRoute administrative_info. |
| `state` | Text | From QuantaRoute administrative_info. |

### Table: `bookings`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Internal). |
| `booking_ref` | Text | Public ID. Format: `MA-` + 10 random digits (e.g., `MA-4829104821`). |
| `user_id` | UUID | Foreign Key to Auth Users. |
| `user_first_name` | Text | User's first name. |
| `user_mobile` | Text | User Phone Number. |
| `pickup_lat` | Float | Pickup Latitude. |
| `pickup_lng` | Float | Pickup Longitude. |
| `pickup_digipin` | Text | Pickup DigiPin. |
| `pickup_address`| Text | Human readable address. |
| `drop_lat` | Float | Destination Latitude. |
| `drop_lng` | Float | Destination Longitude. |
| `drop_address` | Text | Human readable address. |
| `drop_digipin` | Text | Destination DigiPin. |
| `distance_km` | Float | Calculated distance including buffer. |
| `price_total` | Float | Final calculated price. |
| `status` | Text | 'pending', 'confirmed', 'completed', 'cancelled'. |
| `scheduled_time`| Timestamptz| The slot chosen by the user. |
| `created_at` | Timestamptz| Default: now(). |

### Table: `pricing_rules`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | Int | Primary Key. |
| `base_fare` | Float | Starting price. |
| `per_km_rate` | Float | Price per kilometer. |

### Table: `drivers` (Simplified for Slot Logic)
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `name` | Text | Driver Name. |
| `is_active` | Boolean | Is the driver currently working? |
| `shift_start` | Time | Start of working hours. |
| `shift_end` | Time | End of working hours. |

## 4. Functional Requirements & Logic

### A. Booking Flow
1.  **Slot Selection:**
    * User opens app.
    * App fetches `drivers` to see who is active.
    * Display available time slots based on driver shifts.
2.  **Location Selection:**
    * **Input:** User searches Address (Pickup/Drop).
    * **API:** Use **QuantaRoute Geocoding API** for autocomplete/search.
    * **Visual:** Display markers on **MapLibre** (MapTiler Source).
3.  **Distance & Price Calculation:**
    * **API:** Call **Mapbox Direction API** (profile: `driving`) between Pickup and Drop coordinates.
    * **Buffer Logic:** Take the API distance result and **ADD 400 meters** (0.4 km).
    * **Math:** `Final Distance = Mapbox Distance + 0.4km`.
    * **Price:** `(Final Distance * Rate) + Base Fare` (Fetch rates from `pricing_rules` table).
4.  **Booking Confirmation:**
    * User clicks "Book".
    * **ID Generation:** Generate a custom ID in code: `"MA-" + Math.floor(Math.random() * 10000000000)`. Ensure it is 10 digits.
    * **Save:** Insert row into Supabase `bookings` table.

## 5. UI/UX Design Guidelines
* **Mobile First:** All inputs, buttons, and maps must be touch-friendly (min-height 44px for buttons).
* **Bottom Sheet:** Use a draggable bottom sheet for showing price estimates and booking details over the map (like Uber/Ola).
* **Clean:** White/Green color palette (inspired by MaahiCabs vibe).
* **Map Interaction:** The map should take up the full background. UI floats on top.

## 6. API Handling
* **Security:** Do NOT expose API keys (Mapbox/QuantaRoute) on the client side if possible. Use Next.js API Routes (`/app/api/route.ts`) to proxy requests to QuantaRoute and Mapbox to keep keys hidden.

## 7. Color Palette

// tailwind.config.js
theme: {
  extend: {
    colors: {
      'maahi-brand': '#2E3192',  // Deep Indigo
      'maahi-accent': '#00A99D', // Teal
      'maahi-warn': '#FFC107',   // Amber
    }
  }
}

Color,Hex Code,Brand Meaning
Royal Indigo,#2E3192,"Authority & Safety. This deep blue-purple replaces the traditional ""police blue."" It signals security, trust, and a premium professional standard."
Vibrant Teal,#00A99D,"Independence & Clarity. Teal is a refreshing, high-energy color that stands out beautifully against asphalt. It represents a ""green light"" for movement and growth."
Electric Amber,#FFC107,"Caution & Visibility. A nod to classic taxi heritage but modernized. It provides the high contrast needed for ""Book Now"" buttons and ensures the brand is visible even in low light."

## 8. API Example
* **QuantaRoute:** 
POST /v1/location/lookup
{
  "latitude": 22.17007254999999,
  "longitude": 87.91274260999997
}
{
  "digipin": "2P7-C93-PPKL",
  "administrative_info": {
    "country": "India",
    "state": "West Bengal",
    "division": "Tamluk",
    "locality": "Nandakumar SO",
    "pincode": "721632",
    "delivery": "Delivery",
    "district": "Medinipur East"
  }
}

Address search example:
Kalyanchak Gour Mohan Institution, Contai-Nandakumar Road, Uttar Pada, Sitalpur, Nandakumar, Purba Medinipur, West Bengal, 721632, India
22.170853, 87.898407
DigiPin:
2P7-CC7-T678
If we do not find the exact location, we will use the suitable address components to set the actual location of the Destination.
We will follow the uber like mechanism, once user hit the comfim location then only we will hit the api end point to necessary address as per out table to make the insert.

## 9. SEO
To make **MaahiCabs** visible to search engines (Google) and AI discovery tools (like ChatGPT, Gemini, and Perplexity), you need a mix of standard meta tags and **JSON-LD Structured Data**.

Since your service is a **Local Business** in **Bengaluru**, these tags are optimized for local SEO.

### 1. Standard SEO Meta Tags

Place these inside the `<head>` tag of your `layout.tsx` or `index.html`.

```html
<title>MaahiCabs | Safe & Reliable Female-Only Cab Service in Bengaluru</title>
<meta name="title" content="MaahiCabs | Safe & Reliable Female-Only Cab Service in Bengaluru">
<meta name="description" content="Book MaahiCabs for a safe, female-only taxi experience in Bengaluru. Founded by Maahi Narender, providing trusted rides with verified woman partners. Call or WhatsApp 9535238661.">
<meta name="keywords" content="female only cabs Bengaluru, safe taxi for women Bangalore, MaahiCabs, women driven cabs, ladies taxi service Bengaluru, Maahi Narender">
<meta name="author" content="Maahi Narender">
<meta name="robots" content="index, follow">

<meta property="og:type" content="website">
<meta property="og:url" content="https://www.maahicabs.com/"> <meta property="og:title" content="MaahiCabs - Empowering Women's Travel in Bengaluru">
<meta property="og:description" content="By women, for women. Experience the safest cab service in Bengaluru. Book your ride today.">
<meta property="og:image" content="/logo-for-social.png"> <meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="MaahiCabs | Female-Only Cabs Bengaluru">
<meta property="twitter:description" content="Safe, professional, and reliable female-only cab service in Bengaluru. 24/7 availability.">

```

---

### 2. AI-Friendly Structured Data (JSON-LD)

This is the most important part for **AI visibility**. It tells AI bots exactly what your business is, who the owner is, and where you operate.

Add this script inside your `<head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TaxiService",
  "name": "MaahiCabs",
  "description": "A premium female-only cab service operating in the Bengaluru area, ensuring safety and empowerment for women travelers.",
  "provider": {
    "@type": "LocalBusiness",
    "name": "MaahiCabs",
    "image": "https://www.maahicabs.com/logo.png",
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
}
</script>

```

---

### 3. Verification & AI Discovery Files

To ensure AI bots crawl your site correctly, create these two files in your `public/` folder:

**A. `robots.txt**`

```text
User-agent: *
Allow: /

Sitemap: https://www.maahicabs.com/sitemap.xml

```

**B. WhatsApp Click-to-Action (For the UI)**
Since you provided a mobile number, your "Book Now" button should be AI-recognizable as a contact method.

```html
<a href="https://wa.me/919535238661?text=Hi%20MaahiCabs,%20I%20want%20to%20book%20a%20ride" 
   class="bg-[#00A99D] text-white p-4 rounded-lg">
   Book via WhatsApp
</a>

```

### Why this works:

1. **Local Keywords:** It repeats "Bengaluru" and "Safe" which are high-volume search terms for taxi services in that area.
2. **Schema.org:** Using `@type: TaxiService` tells Google exactly what service to list you under in Google Maps and Search.
3. **Owner Profile:** Including **Maahi Narender** as the founder helps in "Knowledge Graph" results, linking your personal brand to the business.
4. **Instagram Link:** The `sameAs` tag tells AI that the website and the Instagram profile belong to the same entity, increasing your "Trust Score."