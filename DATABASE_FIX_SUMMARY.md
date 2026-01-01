# Database Schema Fixes & Booking Implementation

## Date: 2026-01-01
## Project: MaahiCabs User Application

---

## Database Schema Analysis & Fixes

### ✅ What Was Found:
1. All required tables exist: `profiles`, `user_addresses`, `bookings`, `drivers`, `pricing_rules`
2. Trigger function `handle_new_user()` exists and is active
3. Row Level Security (RLS) enabled on all tables
4. Pricing rules configured: ₹50 base + ₹15/km
5. 4 drivers with shift timings

### 🔧 Issues Fixed:

#### 1. **Profiles Table Schema** ✅
**Problem:** Columns were nullable, missing `updated_at`

**Fix Applied:**
```sql
-- Added updated_at column
ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Made columns NOT NULL
ALTER TABLE profiles 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN mobile SET NOT NULL;

-- Updated trigger to handle null values with COALESCE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, mobile)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. **Missing Timestamp Columns** ✅
Added `updated_at` columns to all tables for consistency:
- `user_addresses`
- `bookings`
- `drivers`
- `pricing_rules`

---

## Application Fixes

### 1. **Environment Variable Mismatch** ✅
**Problem:** Code used `MAPBOX_ACCESS_TOKEN` but docs specified `MAPBOX_API_KEY`

**Fix:**
```typescript
// src/app/api/directions/route.ts
const mapboxToken = process.env.MAPBOX_API_KEY; // Changed from MAPBOX_ACCESS_TOKEN
```

### 2. **Pricing Rules Integration** ✅
**Problem:** Pricing was hardcoded, not fetched from database

**Fix:**
```typescript
// Added state
const [baseFare, setBaseFare] = useState<number>(50);
const [perKmRate, setPerKmRate] = useState<number>(15);

// Added fetch function
const fetchPricingRules = async () => {
  const { data } = await supabase
    .from('pricing_rules')
    .select('base_fare, per_km_rate')
    .single();
  
  if (data) {
    setBaseFare(data.base_fare);
    setPerKmRate(data.per_km_rate);
  }
};

// Called on component mount
useEffect(() => {
  fetchPricingRules();
}, []);
```

### 3. **Distance Calculation Integration** ✅
**Problem:** Distance was hardcoded (12.4 km), not calculated from API

**Fix:**
```typescript
// Added state
const [distance, setDistance] = useState<number | null>(null);
const [loadingRoute, setLoadingRoute] = useState(false);

// Added calculation function
const calculateRoute = async () => {
  const response = await fetch('/api/directions', {
    method: 'POST',
    body: JSON.stringify({ pickup, drop }),
  });
  
  const data = await response.json();
  setDistance(data.distance); // Includes 0.4km buffer
  setRouteGeometry(data.route);
};

// Trigger calculation when locations are set
useEffect(() => {
  if (pickup && drop) {
    calculateRoute();
  }
}, [pickup, drop]);
```

### 4. **Booking Creation Logic** ✅
**Problem:** Booking button showed alert "TODO: Implement booking confirmation logic"

**Fix:**
```typescript
const handleConfirmBooking = async () => {
  // Validation
  if (!user || !profile) {
    alert('Please login to book a ride');
    return;
  }

  // Generate booking reference
  const bookingRef = generateBookingRef(); // MA-XXXXXXXXXX

  // Calculate price from distance
  const totalPrice = calculateFare(distance, baseFare, perKmRate);

  // Schedule time (for now: current time + 1 hour)
  const scheduledTime = new Date();
  scheduledTime.setHours(scheduledTime.getHours() + 1);

  // Insert into database
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      booking_ref: bookingRef,
      user_id: user.id,
      user_first_name: profile.first_name,
      user_mobile: profile.mobile,
      pickup_lat: pickup.latitude,
      pickup_lng: pickup.longitude,
      pickup_digipin: pickup.digipin || '',
      pickup_address: pickup.address || '',
      drop_lat: drop.latitude,
      drop_lng: drop.longitude,
      drop_digipin: drop.digipin || '',
      drop_address: drop.address || '',
      distance_km: distance,
      price_total: totalPrice,
      status: 'pending',
      scheduled_time: scheduledTime.toISOString(),
    })
    .select()
    .single();

  if (data) {
    alert(`🎉 Booking Confirmed!\n\nRef: ${bookingRef}\nFare: ₹${totalPrice}`);
    // Reset state
  }
};
```

### 5. **UI Updates** ✅
Updated the Bottom Sheet to show:
- Real-time distance calculation
- Dynamic fare based on distance and pricing rules
- Loading states while calculating
- Disabled button states
- Success/error feedback

```typescript
// Dynamic price display
{loadingRoute ? (
  <span>Calculating...</span>
) : distance ? (
  `₹${calculateFare(distance, baseFare, perKmRate).toFixed(2)}`
) : (
  '₹--'
)}

// Distance display
{distance ? `${distance.toFixed(2)} km` : '--'}

// Button with loading states
<button
  onClick={handleConfirmBooking}
  disabled={bookingInProgress || loadingRoute || !distance}
>
  {bookingInProgress ? 'Creating Booking...' : 'Confirm Booking'}
</button>
```

---

## Database Schema Summary (Current State)

### `profiles` ✅
- id (UUID, PK, FK to auth.users) NOT NULL
- first_name (TEXT) NOT NULL
- last_name (TEXT) NOT NULL
- email (TEXT) NOT NULL
- mobile (TEXT) NOT NULL
- onboarding_completed (BOOLEAN) DEFAULT false
- created_at (TIMESTAMPTZ) DEFAULT now()
- updated_at (TIMESTAMPTZ) DEFAULT now()

### `bookings` ✅
- id (UUID, PK)
- booking_ref (TEXT, UNIQUE) - Format: MA-XXXXXXXXXX
- user_id (UUID, FK to profiles)
- user_first_name (TEXT)
- user_mobile (TEXT)
- pickup_lat, pickup_lng (FLOAT)
- pickup_digipin, pickup_address (TEXT)
- drop_lat, drop_lng (FLOAT)
- drop_digipin, drop_address (TEXT)
- distance_km (FLOAT) - Includes 0.4km buffer
- price_total (FLOAT) - Calculated from distance × rate + base
- status (TEXT) - 'pending', 'confirmed', 'completed', 'cancelled'
- scheduled_time (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### `pricing_rules` ✅
- id (INT, PK)
- base_fare (FLOAT) - Currently ₹50
- per_km_rate (FLOAT) - Currently ₹15/km
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### `drivers` ✅
- id (UUID, PK)
- name (TEXT)
- is_active (BOOLEAN)
- shift_start, shift_end (TIME)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Current Data:**
- Rahul Sharma: 06:00 - 18:00
- Amit Patel: 08:00 - 20:00
- Priya Singh: 14:00 - 02:00
- Suresh Kumar: 22:00 - 10:00

### `user_addresses` ✅
- id (UUID, PK)
- user_id (UUID, FK to profiles)
- address_type (TEXT) - 'home', 'work', 'other'
- house_road_name (TEXT)
- latitude, longitude (FLOAT)
- digipin (TEXT)
- locality, pincode, district, state (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

---

## Booking Flow (As Implemented)

1. **User opens app**
   - Map loads at user location
   - Pricing rules fetched from database

2. **Select pickup location**
   - User clicks "Use My Location" OR searches
   - DigiPin generated offline immediately
   - If logged in: Full address fetched via QuantaRoute API

3. **Select destination**
   - User searches for destination
   - Automatically triggers route calculation
   - Bottom sheet opens

4. **Route calculation**
   - Calls Mapbox Directions API
   - Adds 0.4km buffer (as per context.md)
   - Calculates fare: (distance × ₹15/km) + ₹50 base

5. **Confirm booking**
   - Validates user is logged in
   - Generates booking reference: MA-XXXXXXXXXX
   - Inserts into `bookings` table
   - Shows confirmation with booking ref and fare

---

## Testing Checklist

- [x] Database schema matches context.md
- [x] Trigger creates profile on signup
- [x] Pricing rules fetched from database
- [x] Distance calculation works (with 0.4km buffer)
- [x] Booking creation saves to database
- [x] Booking reference format: MA-XXXXXXXXXX
- [x] Fare calculation: (distance × rate) + base
- [x] DigiPin generation works
- [x] User authentication integrated
- [x] Loading states and error handling
- [ ] Slot selection (TODO: needs driver availability logic)

---

## Known TODOs / Future Enhancements

### 1. **Slot Selection Logic**
Currently using current time + 1 hour. Should:
- Query `drivers` table for active drivers
- Check shift_start and shift_end times
- Display available time slots
- Allow user to select preferred time

### 2. **Driver Assignment**
Currently not implemented. Should:
- Assign driver based on shift and availability
- Update booking with driver_id (needs schema update)

### 3. **Real-time Booking Status**
- Implement realtime subscription to booking updates
- Show driver location on map
- Push notifications for status changes

### 4. **Booking History**
- Page to view past bookings
- Filter by status
- Re-book functionality

### 5. **Saved Addresses**
- Use `user_addresses` table
- Quick select home/work locations
- Manage saved addresses

---

## Files Modified

### Core Application
- ✅ `src/app/page.tsx` - Complete booking flow implementation
- ✅ `src/app/api/directions/route.ts` - Fixed env variable name
- ✅ `src/lib/supabase.ts` - Enhanced error handling (from earlier fix)
- ✅ `src/app/onboarding/page.tsx` - Better registration flow (from earlier fix)

### Database Migrations Applied
- ✅ `fix_profiles_schema_constraints` - Made columns NOT NULL, updated trigger
- ✅ `fix_user_addresses_add_updated_at` - Added timestamp column
- ✅ `fix_bookings_add_updated_at` - Added timestamp column
- ✅ `fix_pricing_rules_add_timestamps` - Added timestamp columns
- ✅ `fix_drivers_add_updated_at` - Added timestamp column

---

## Environment Variables

Ensure these are set in `.env.local`:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xvarzrifyuscgxantnuw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# QuantaRoute (for location search)
QUANTAROUTE_API_KEY=your-key

# MapTiler (for map tiles)
NEXT_PUBLIC_MAPTILER_API_KEY=your-key

# Mapbox (for routing - FIXED NAME)
MAPBOX_API_KEY=your-key
```

---

## Summary

✅ **Database Schema:** Fully compliant with context.md requirements
✅ **User Registration:** Working with auto-profile creation
✅ **Pricing:** Dynamic from database
✅ **Distance Calculation:** Integrated with 0.4km buffer
✅ **Booking Creation:** Complete with proper data structure
✅ **UI/UX:** Real-time updates, loading states, error handling

**Status:** Production-ready for basic booking flow. Slot selection and driver assignment are the main features pending implementation.

