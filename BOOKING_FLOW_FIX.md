# Complete Booking Flow Fix - Following context.md

## Date: 2026-01-01
## Changes: Complete rewrite of booking flow to match context.md specifications

---

## ❌ Previous Issues

1. **Wrong API usage**: App was calling `/v1/location/lookup` on every map move (wasteful)
2. **No location locking**: Pickup location changed continuously as map moved
3. **Wrong flow**: Both pickup and destination were shown simultaneously
4. **Missing geocoding**: Destination selection didn't call `/v1/digipin/geocode`
5. **Incomplete data**: Administrative info not stored for database inserts
6. **Wrong env variable**: Used `NEXT_PUBLIC_QUANTAROUTE_KEY` instead of `QUANTAROUTE_API_KEY`

---

## ✅ Fixed Flow (As Per context.md)

### **Phase 1: Pickup Selection**

1. **Map loads** at user location
2. **Both pickup and destination fields visible** (destination disabled with "Confirm pickup first")
3. **Real-time DigiPin display** - Shows DigiPin as user moves map (NO API calls)
4. **User clicks "Confirm Pickup Location"**
   - ✅ Calls `POST https://api.quantaroute.com/v1/location/lookup` API **ONLY NOW**
   - ✅ Request body: `{ latitude, longitude }` (as per context.md line 138-142)
   - ✅ Response: `{ digipin, administrative_info }` (as per context.md line 143-154)
   - ✅ Gets full administrative_info
   - ✅ LOCKS the pickup location
   - ✅ ENABLES destination search

### **Phase 2: Destination Selection**

4. **User searches destination**
   - ✅ Uses `/v1/digipin/autocomplete` API for suggestions
5. **User selects a result**
   - ✅ Calls `/v1/digipin/geocode` API to get full details
   - ✅ Gets latitude, longitude, DigiPin, administrative_info
   - ✅ Opens booking sheet

### **Phase 3: Booking**

6. **Calculate route** (Mapbox Directions API)
7. **Calculate fare** (from pricing_rules table)
8. **Confirm booking** - Saves to database with full data

---

## 📁 Files Changed

### 1. **Store** - `/src/store/useBookingStore.ts`
**Added:**
- ✅ `pickupLocked` boolean state
- ✅ `lockPickup()` function
- ✅ Administrative info fields: `locality`, `pincode`, `district`, `state`

```typescript
interface Location {
    latitude: number;
    longitude: number;
    address: string;
    digipin?: string;
    locality?: string;      // NEW
    pincode?: string;       // NEW
    district?: string;      // NEW
    state?: string;         // NEW
}

interface BookingState {
    // ...
    pickupLocked: boolean;  // NEW
    lockPickup: () => void; // NEW
}
```

### 2. **API Routes** - Fixed all endpoints

#### `/src/app/api/geocoding/lookup/route.ts`
- ✅ Changed to `QUANTAROUTE_API_KEY` (from `NEXT_PUBLIC_QUANTAROUTE_KEY`)
- ✅ Better error handling
- ✅ Used for **PICKUP CONFIRMATION ONLY**

#### `/src/app/api/geocoding/autocomplete/route.ts`
- ✅ Changed to `QUANTAROUTE_API_KEY`
- ✅ Proper URL encoding
- ✅ Used for **DESTINATION SEARCH**

#### `/src/app/api/geocoding/geocode/route.ts` ⭐ **NEW**
- ✅ Created new endpoint for `/v1/digipin/geocode`
- ✅ Used after user selects destination from autocomplete
- ✅ Returns full location details with administrative_info

```typescript
POST /api/geocoding/geocode
Body: { address: "selected address from autocomplete" }
Response: { latitude, longitude, digipin, administrative_info }
```

### 3. **Main Page** - `/src/app/page.tsx`

#### Key Changes:

**State Management:**
```typescript
const [tempPickupDigipin, setTempPickupDigipin] = useState(''); // Real-time display
const { pickupLocked, lockPickup } = useBookingStore(); // Track confirmation
```

**Real-time DigiPin (Display Only):**
```typescript
useEffect(() => {
  if (mapCenter && !pickupLocked) {
    const realtimeDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
    setTempPickupDigipin(realtimeDigipin); // NO API call, just display
  }
}, [mapCenter, pickupLocked]);
```

**Pickup Confirmation (API call):**
```typescript
const handleConfirmPickupLocation = async () => {
  // 1. Generate DigiPin offline
  const offlineDigipin = digipin.getDIGIPINFromLatLon(mapCenter.lat, mapCenter.lng);
  
  // 2. Call /v1/location/lookup API
  const response = await fetch('/api/geocoding/lookup', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
  
  const data = await response.json();
  
  // 3. Store with administrative_info
  setPickup({
    latitude, longitude,
    address: buildAddress(data.administrative_info),
    digipin: data.digipin,
    locality: data.administrative_info.locality,
    pincode: data.administrative_info.pincode,
    district: data.administrative_info.district,
    state: data.administrative_info.state,
  });
  
  // 4. LOCK pickup
  lockPickup();
};
```

**UI Updates:**
```typescript
// Pickup search - disabled when locked
<LocationSearch
  placeholder={pickupLocked ? pickup?.address : tempPickupDigipin}
  disabled={pickupLocked}
  value={pickupLocked ? pickup?.address : tempPickupDigipin}
/>

// Destination search - only shown after pickup locked
{pickupLocked && (
  <LocationSearch
    placeholder="Search Destination"
    onSelect={(loc) => {
      setDrop(loc);
      setIsBookingSheetOpen(true);
    }}
  />
)}

// Button - only shown when pickup not locked
{!pickupLocked && (
  <button onClick={handleConfirmPickupLocation}>
    📍 Confirm Pickup Location
  </button>
)}
```

### 4. **LocationSearch Component** - `/src/components/LocationSearch.tsx`

#### Major Rewrite:

**Autocomplete (for search):**
```typescript
const handleSearch = async (val) => {
  const response = await fetch(`/api/geocoding/autocomplete?q=${val}`);
  const data = await response.json();
  setResults(data.predictions || data.results || data.data);
};
```

**Geocoding (on selection):**
```typescript
const handleSelect = async (result) => {
  // Call /v1/digipin/geocode to get full details
  const response = await fetch('/api/geocoding/geocode', {
    method: 'POST',
    body: JSON.stringify({ address: result.description }),
  });
  
  const data = await response.json();
  
  // Return full location with administrative_info
  onSelect({
    latitude: data.latitude,
    longitude: data.longitude,
    address: result.description,
    digipin: data.digipin,
    locality: data.administrative_info?.locality,
    pincode: data.administrative_info?.pincode,
    district: data.administrative_info?.district,
    state: data.administrative_info?.state,
  });
};
```

**Props:**
```typescript
interface LocationSearchProps {
    disabled?: boolean;  // NEW - for locked pickup
}
```

---

## 🎯 User Experience Flow

### Before (Wrong):
1. ❌ User opens app → Sees both pickup and destination fields
2. ❌ Map moves → API call on every move (wasteful)
3. ❌ User searches destination → No geocoding
4. ❌ Incomplete data stored in database

### After (Correct - As Per context.md):
1. ✅ User opens app → Sees ONLY pickup field + map
2. ✅ User moves map → DigiPin updates in real-time (NO API calls)
3. ✅ User clicks "Confirm Pickup Location"
   - Calls `/v1/location/lookup` **once**
   - Locks pickup location
   - Shows destination field
4. ✅ User searches destination → Autocomplete suggestions
5. ✅ User selects result → Geocodes to get full details
6. ✅ Booking sheet opens with route & fare
7. ✅ Full administrative_info saved to database

---

## 📊 Database Insert (Correct Data)

### Pickup Location (from `/v1/location/lookup`):
```javascript
{
  pickup_lat: pickup.latitude,
  pickup_lng: pickup.longitude,
  pickup_digipin: pickup.digipin,        // From API
  pickup_address: pickup.address,        // Human readable
  // For user_addresses table (if saving):
  locality: pickup.locality,             // From administrative_info
  pincode: pickup.pincode,               // From administrative_info
  district: pickup.district,             // From administrative_info
  state: pickup.state,                   // From administrative_info
}
```

### Drop Location (from `/v1/digipin/geocode`):
```javascript
{
  drop_lat: drop.latitude,
  drop_lng: drop.longitude,
  drop_digipin: drop.digipin,
  drop_address: drop.address,
  // Administrative info available if needed
}
```

---

## 🔧 Environment Variables

### Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xvarzrifyuscgxantnuw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# QuantaRoute (SERVER-SIDE - NO NEXT_PUBLIC prefix)
QUANTAROUTE_API_KEY=your-key

# MapTiler
NEXT_PUBLIC_MAPTILER_API_KEY=your-key

# Mapbox
MAPBOX_API_KEY=your-key
```

**⚠️ Important:** `QUANTAROUTE_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix) for security.

---

## 🧪 Testing Checklist

### Pickup Flow:
- [ ] Map shows at user location
- [ ] DigiPin updates as map moves (no API calls)
- [ ] Click "Confirm Pickup Location"
- [ ] Sees loading state
- [ ] Pickup field becomes disabled and shows address
- [ ] Destination field appears
- [ ] Navigation button disappears

### Destination Flow:
- [ ] Type in destination search
- [ ] See autocomplete suggestions (from `/v1/digipin/autocomplete`)
- [ ] Click a suggestion
- [ ] Sees loading state
- [ ] Destination gets geocoded (from `/v1/digipin/geocode`)
- [ ] Booking sheet opens

### Booking:
- [ ] Route calculated with 0.4km buffer
- [ ] Fare calculated from database pricing_rules
- [ ] Booking created with full administrative_info
- [ ] Database insert includes all required fields

---

## 📝 API Usage Summary

| Endpoint | When Called | Purpose |
|----------|-------------|---------|
| `/v1/location/lookup` | On "Confirm Pickup Location" button | Get pickup administrative_info |
| `/v1/digipin/autocomplete` | As user types destination | Show address suggestions |
| `/v1/digipin/geocode` | When destination selected | Get full location details |
| Mapbox Directions API | When both locations confirmed | Calculate route & distance |

---

## ✅ Compliance with context.md

✅ Uses `/v1/location/lookup` for pickup (as specified)
✅ Uses `/v1/digipin/autocomplete` for destination search (as specified)
✅ Calls API only on confirmation ("Uber-like mechanism" as specified)
✅ Stores administrative_info for database (as specified)
✅ DigiPin generated offline for real-time display
✅ 0.4km buffer added to distance
✅ Pricing from database

---

## 🚀 Next Steps

1. **Restart dev server** (config changes require restart)
2. **Test the new flow**
3. **Implement slot selection** (using drivers table)
4. **Add saved addresses** (home/work from user_addresses table)

---

**Status:** ✅ Complete - Booking flow now matches context.md specifications exactly!

