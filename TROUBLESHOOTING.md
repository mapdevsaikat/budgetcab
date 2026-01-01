# Quick Troubleshooting Guide

## 🔴 "Failed to fetch" Error During Registration

### Symptoms
- Error appears when clicking "Create Account" or "Log In"
- Console shows: `TypeError: Failed to fetch`
- Error points to `supabase.auth.signUp` or `supabase.auth.signInWithPassword`

### Root Cause
Supabase client cannot connect to the backend, usually because:
1. Environment variables are not configured
2. Supabase project URL or key is incorrect
3. Supabase project is paused or deleted

### Solution

#### Step 1: Check Environment Variables
```bash
npm run check-env
```

If you see errors, create or update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Step 2: Get Correct Values
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Step 3: Verify Configuration
```bash
npm run dev
```

Then visit: http://localhost:3000/diagnostics

All checks should show ✅ green.

#### Step 4: Restart Server
If you just added the variables:
1. Stop the dev server (Ctrl+C)
2. Start it again: `npm run dev`

---

## 🟡 Registration Succeeds But Profile Not Created

### Symptoms
- Registration completes successfully
- User appears in Supabase Auth
- But no profile entry in `profiles` table

### Root Cause
Database trigger not created or not working

### Solution

Run this SQL in Supabase SQL Editor:

```sql
-- Create the trigger function
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🟡 Email Confirmation Required

### Symptoms
- Registration appears successful
- Alert says "Check your email to confirm"
- Cannot log in immediately

### Root Cause
Email confirmation is enabled in Supabase

### Solutions

**Option 1: Disable Email Confirmation (Development)**
1. Go to Supabase Dashboard
2. **Authentication** → **Providers** → **Email**
3. Toggle OFF "Confirm email"
4. Try registering again

**Option 2: Use Email Confirmation (Production)**
1. Check your email inbox
2. Click the confirmation link
3. Then you can log in

---

## 🔴 Map Not Loading

### Symptoms
- Blank or grey area where map should be
- Console error: "MapTiler key not configured"

### Solution

Add MapTiler API key to `.env.local`:

```bash
NEXT_PUBLIC_MAPTILER_API_KEY=your-key-here
```

Get your key: https://cloud.maptiler.com/

---

## 🔴 Location Search Not Working

### Symptoms
- Search box doesn't show suggestions
- "No results found" always appears
- API errors in console

### Solution

Add QuantaRoute API key to `.env.local`:

```bash
QUANTAROUTE_API_KEY=your-key-here
```

Get your key: https://quantaroute.com/

---

## 🟡 CORS Errors

### Symptoms
- Console shows CORS policy errors
- Requests to Supabase fail with CORS error

### Solution

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add these URLs:
   - `http://localhost:3000`
   - Your production URL (when deploying)
4. Save changes
5. Restart your app

---

## 🔴 "Invalid JWT" or Authentication Errors

### Symptoms
- Cannot access protected routes
- "Invalid JWT" error in console
- Logged out unexpectedly

### Solutions

**Clear Browser Storage**
1. Open browser DevTools (F12)
2. Go to **Application** → **Storage**
3. Click "Clear site data"
4. Refresh page
5. Log in again

**Check Token Expiry**
- Supabase tokens expire after 1 hour by default
- The app should auto-refresh, but if not:
  1. Log out
  2. Log in again

---

## 🟢 General Debugging Steps

### 1. Check Browser Console
- Open DevTools (F12)
- Look for red errors
- Share error messages when asking for help

### 2. Check Network Tab
- Open DevTools → Network
- Try the action that's failing
- Look for failed requests (red)
- Check request/response details

### 3. Check Supabase Logs
1. Go to Supabase Dashboard
2. **Logs** → **API**
3. Look for errors around the time you tried the action

### 4. Verify Environment
```bash
# Quick check
npm run check-env

# Detailed check
npm run dev
# Visit: http://localhost:3000/diagnostics
```

---

## 📞 Still Having Issues?

### Before Asking for Help, Gather:
1. ✅ Error message from browser console
2. ✅ Output of `npm run check-env`
3. ✅ Screenshot of `/diagnostics` page
4. ✅ Steps to reproduce the issue
5. ✅ What you've already tried

### Useful Commands
```bash
# Check environment
npm run check-env

# Restart clean
rm -rf .next
npm run dev

# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

---

## 📚 Additional Resources

- [Full Setup Guide](./SETUP.md)
- [Registration Fix Details](./REGISTRATION_FIX.md)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

