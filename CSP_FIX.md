# CSP (Content Security Policy) Fix

## Issue
Sign up was failing with CSP errors blocking connections to:
- Supabase (`https://*.supabase.co`)
- MapTiler (`https://api.maptiler.com`, `https://*.maptiler.com`)
- Mapbox API (`https://api.mapbox.com`)
- QuantaRoute API (`https://quantaroute.com`, `https://api.quantaroute.com`)

## Error Messages
```
Connecting to 'https://xvarzrifyuscgxantnuw.supabase.co/auth/v1/signup' violates the 
following Content Security Policy directive: "connect-src 'self'"
```

## Fix Applied
Updated `next.config.ts` to include all required external domains in the CSP `connect-src` directive:

```typescript
connect-src 'self' 
  https://api.maptiler.com 
  https://*.maptiler.com 
  https://*.supabase.co 
  https://api.mapbox.com 
  https://quantaroute.com 
  https://api.quantaroute.com
```

## How to Apply

**⚠️ IMPORTANT: You must restart the development server for this to take effect!**

1. Stop the current server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

## CSP Policy Breakdown

| Directive | Allowed Sources | Purpose |
|-----------|----------------|---------|
| `default-src` | `'self'` | Default policy for all resources |
| `script-src` | `'self' 'unsafe-eval' 'unsafe-inline'` | Allow scripts (needed for Next.js) |
| `style-src` | `'self' 'unsafe-inline' https://api.maptiler.com` | Allow styles and MapTiler styles |
| `img-src` | `'self' data: https: blob:` | Allow images from any HTTPS source |
| `font-src` | `'self' data:` | Allow fonts |
| `connect-src` | See below | Allow API connections |
| `worker-src` | `'self' blob:` | Allow web workers |

### connect-src (API Connections)
- `'self'` - Your own API routes
- `https://api.maptiler.com` - Map tiles
- `https://*.maptiler.com` - MapTiler services
- `https://*.supabase.co` - Supabase Auth & Database
- `https://api.mapbox.com` - Mapbox Directions API
- `https://quantaroute.com` - QuantaRoute Geocoding
- `https://api.quantaroute.com` - QuantaRoute API endpoint

## Testing After Restart

1. Go to http://localhost:3000/onboarding
2. Try to register a new account
3. Check browser console - CSP errors should be gone
4. Registration should work successfully

## Security Note

This CSP configuration allows connections to the specific external services your app needs while still maintaining reasonable security. All API keys should remain in environment variables on the server side, never exposed to the client.

