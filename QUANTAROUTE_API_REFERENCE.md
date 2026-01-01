# QuantaRoute API Endpoints - Correct Usage

## Reference
- **API Documentation**: https://api.quantaroute.com/v1/digipin/docs
- **Base URL**: `https://api.quantaroute.com/v1/digipin`

## Authentication
All QuantaRoute API calls use the `x-api-key` header for authentication:
```typescript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_API_KEY'
}
```

---

## Endpoint 1: Lookup (Reverse Geocoding)

### Purpose
Convert latitude/longitude coordinates to DigiPin and administrative information.

### Endpoint
```
POST https://api.quantaroute.com/v1/digipin/lookup
```

### Request
```json
{
  "latitude": 22.17007254999999,
  "longitude": 87.91274260999997
}
```

### Response
```json
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
```

### Implementation
```typescript
// src/app/api/geocoding/lookup/route.ts
const response = await fetch('https://api.quantaroute.com/v1/digipin/lookup', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  },
  body: JSON.stringify({ latitude, longitude }),
});
```

---

## Endpoint 2: Autocomplete

### Purpose
Get address suggestions as user types (for destination search).

### Endpoint
```
POST https://api.quantaroute.com/v1/digipin/autocomplete
```

### Request
```json
{
  "query": "Mechada Station"
}
```

### Response
```json
{
  "predictions": [
    {
      "description": "Mechada Railway Station, West Bengal, India",
      "place_id": "...",
      ...
    }
  ]
}
```

### Implementation
```typescript
// src/app/api/geocoding/autocomplete/route.ts
const response = await fetch('https://api.quantaroute.com/v1/digipin/autocomplete', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  },
  body: JSON.stringify({ query: searchText }),
});
```

---

## Endpoint 3: Geocode (Forward Geocoding)

### Purpose
Convert address string to coordinates (for destination selection).

### Endpoint
```
POST https://api.quantaroute.com/v1/digipin/geocode
```

### Request
```json
{
  "address": "Mechada Railway Station, West Bengal, India"
}
```

### Response
```json
{
  "latitude": 22.170853,
  "longitude": 87.898407,
  "digipin": "2P7-CC7-T678",
  "administrative_info": {
    "locality": "Mechada",
    "district": "Purba Medinipur",
    "state": "West Bengal",
    "pincode": "721632"
  }
}
```

### Implementation
```typescript
// src/app/api/geocoding/geocode/route.ts
const response = await fetch('https://api.quantaroute.com/v1/digipin/geocode', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  },
  body: JSON.stringify({ address }),
});
```

---

## Flow in MaahiCabs App

### Phase 1: Pickup (Reverse Geocoding)
1. User positions map at desired pickup location
2. DigiPin generated offline for real-time display (using `digipin` npm package)
3. User clicks "Confirm Pickup Location"
4. **Call**: `POST /v1/digipin/lookup` with latitude/longitude
5. **Get**: DigiPin + administrative_info
6. Store and lock pickup location

### Phase 2: Destination (Autocomplete + Forward Geocoding)
1. User types in destination search box
2. **Call**: `POST /v1/digipin/autocomplete` with query text
3. **Get**: List of address suggestions
4. User selects an address
5. **Call**: `POST /v1/digipin/geocode` with selected address
6. **Get**: Coordinates + DigiPin + administrative_info
7. Store destination, open booking sheet

---

## Error Handling

All endpoints should handle:
- Missing API key
- Invalid coordinates/address
- Network errors
- API rate limits

Example:
```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('QuantaRoute API error:', error);
  throw error;
}
```

---

## Common Mistakes to Avoid

❌ **WRONG**: Using `/v1/location/lookup`
✅ **CORRECT**: Using `/v1/digipin/lookup`

❌ **WRONG**: Query parameter authentication `?key=xxx`
✅ **CORRECT**: Header authentication `x-api-key: xxx`

❌ **WRONG**: GET request for autocomplete
✅ **CORRECT**: POST request with JSON body

❌ **WRONG**: Calling lookup on every map move
✅ **CORRECT**: Call lookup only when user confirms location

---

## Environment Variable

```bash
# .env.local
QUANTAROUTE_API_KEY=your_api_key_here
```

**Note**: Use server-side only (no `NEXT_PUBLIC_` prefix) for security.

