# MaahiCabs Setup Guide

## Environment Variables Setup

To run this application, you need to configure the following environment variables.

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root directory of the project with the following content:

```bash
# Supabase Configuration
# Get these from your Supabase project: https://supabase.com/dashboard/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# QuantaRoute Geocoding API
# Get your API key from: https://quantaroute.com

QUANTAROUTE_API_KEY=your-quantaroute-api-key-here

# MapTiler API (for map tiles)
# Get your API key from: https://www.maptiler.com/

NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-api-key-here

# Mapbox API (for routing/distance calculation)
# Get your API key from: https://www.mapbox.com/

MAPBOX_API_KEY=your-mapbox-api-key-here
```

### Step 2: Get Your API Keys

#### Supabase Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select your existing project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Database Setup (Supabase)
After setting up your Supabase project, you need to create the required tables. Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    address_type TEXT CHECK (address_type IN ('home', 'work', 'other')),
    house_road_name TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    digipin TEXT,
    locality TEXT,
    pincode TEXT,
    district TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id SERIAL PRIMARY KEY,
    base_fare FLOAT NOT NULL DEFAULT 50.0,
    per_km_rate FLOAT NOT NULL DEFAULT 15.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing rule
INSERT INTO pricing_rules (base_fare, per_km_rate) 
VALUES (50.0, 15.0)
ON CONFLICT DO NOTHING;

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_ref TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_first_name TEXT NOT NULL,
    user_mobile TEXT NOT NULL,
    pickup_lat FLOAT NOT NULL,
    pickup_lng FLOAT NOT NULL,
    pickup_digipin TEXT,
    pickup_address TEXT NOT NULL,
    drop_lat FLOAT NOT NULL,
    drop_lng FLOAT NOT NULL,
    drop_address TEXT NOT NULL,
    drop_digipin TEXT,
    distance_km FLOAT NOT NULL,
    price_total FLOAT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    scheduled_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, mobile)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'mobile', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own addresses" ON user_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON user_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON user_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON user_addresses
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow all users to read pricing rules and drivers
CREATE POLICY "Anyone can view pricing rules" ON pricing_rules
    FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view active drivers" ON drivers
    FOR SELECT USING (TRUE);
```

#### QuantaRoute API
1. Go to [QuantaRoute](https://quantaroute.com)
2. Sign up and get your API key
3. Copy the API key → `QUANTAROUTE_API_KEY`

#### MapTiler API
1. Go to [MapTiler](https://www.maptiler.com/)
2. Create an account and get your API key
3. Copy the API key → `NEXT_PUBLIC_MAPTILER_API_KEY`

#### Mapbox API
1. Go to [Mapbox](https://www.mapbox.com/)
2. Create an account and get your API key
3. Copy the API key → `MAPBOX_API_KEY`

### Step 3: Verify Configuration

After creating the `.env.local` file, verify your setup:

**Option 1: Command Line Check**
```bash
npm run check-env
```

**Option 2: Web-based Diagnostics**
```bash
npm run dev
# Then visit: http://localhost:3000/diagnostics
```

### Step 4: Restart Development Server

After creating the `.env.local` file:

```bash
# Stop the current server (Ctrl + C)
# Start the development server again
npm run dev
```

## Troubleshooting

### "Failed to fetch" Error
This error occurs when:
- Supabase environment variables are not configured
- Supabase project is not accessible
- Internet connection issues

**Solution:**
1. Make sure `.env.local` file exists with correct values
2. Check if your Supabase project is active
3. Verify your internet connection
4. Check browser console for detailed error messages

### Registration Not Working
1. Verify Supabase credentials are correct
2. Check if the database trigger is created (see SQL above)
3. Check Supabase logs in the dashboard
4. Verify email confirmation settings in Supabase Auth settings

### CORS Errors
If you see CORS errors:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your development URL: `http://localhost:3000`
3. Add your production URL when deploying

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [QuantaRoute API Docs](https://quantaroute.com/docs)
- [MapTiler Docs](https://docs.maptiler.com/)
- [Mapbox Docs](https://docs.mapbox.com/)

