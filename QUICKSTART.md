# 🚀 Quick Start - Visual Guide

## Step 1: Check Current Status

Run the environment checker:

```bash
npm run check-env
```

**Expected Output:**

```
╔═══════════════════════════════════════════╗
║   MaahiCabs Environment Setup Checker    ║
╚═══════════════════════════════════════════╝

✗ .env.local file not found!

To create it:
1. Copy the template: cp .env.local.example .env.local
2. Or create a new file: .env.local
3. Add your API keys (see SETUP.md for details)
```

---

## Step 2: Create Environment File

Create a file named `.env.local` in the project root with:

```bash
# Supabase (REQUIRED for auth to work)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other services
QUANTAROUTE_API_KEY=your-key-here
NEXT_PUBLIC_MAPTILER_API_KEY=your-key-here
MAPBOX_API_KEY=your-key-here
```

### 🔑 Where to Get Keys?

| Service | Dashboard URL | What to Copy |
|---------|---------------|--------------|
| **Supabase** | https://supabase.com/dashboard | Settings → API → Project URL & anon key |
| **QuantaRoute** | https://quantaroute.com | Get API key from dashboard |
| **MapTiler** | https://cloud.maptiler.com/ | Cloud → API keys |
| **Mapbox** | https://account.mapbox.com/ | Access tokens |

---

## Step 3: Verify Configuration

### Option A: Command Line
```bash
npm run check-env
```

**Success Output:**
```
✓ NEXT_PUBLIC_SUPABASE_URL
  https://abcdefgh.supabase.co

✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
  eyJhbGciOiJIUzI1NiIsInR5c...

✓ All environment variables are configured!
You can now run: npm run dev
```

### Option B: Web Interface
```bash
npm run dev
```

Then open: http://localhost:3000/diagnostics

**What You Should See:**

```
✅ All Systems Operational
Your application is properly configured

✓ Supabase URL
  https://your-project.supabase.co

✓ Supabase Anon Key
  eyJhbGciOiJIUzI1NiIsI...

✓ Supabase Connection
  Connected successfully

✓ MapTiler API Key
  xxxxxxxxxxxxxxx...
```

---

## Step 4: Setup Database

1. Go to your Supabase Dashboard
2. Open **SQL Editor**
3. Copy the SQL from `SETUP.md` (Section: "Database Setup")
4. Run the SQL
5. Verify tables are created: **Table Editor** should show:
   - ✅ profiles
   - ✅ user_addresses
   - ✅ bookings
   - ✅ drivers
   - ✅ pricing_rules

---

## Step 5: Test Registration

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Open in browser**
   ```
   http://localhost:3000/onboarding
   ```

3. **Fill the form:**
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Mobile: +91 98765 43210
   - Password: Test123!

4. **Click "Create Account"**

### ✅ Success Indicators:
- Alert: "✅ Registration successful!"
- Redirected to home page
- Check Supabase Dashboard → Authentication → Users
- New user should appear
- Check Table Editor → profiles
- Profile entry should be created

### ❌ Common Errors:

| Error | Fix |
|-------|-----|
| "Failed to fetch" | Environment not configured. Run `npm run check-env` |
| "Missing Supabase credentials" | Add credentials to `.env.local`, restart server |
| "User already exists" | Email already registered. Use different email or try login |
| "Invalid email" | Use valid email format |
| Profile not created | Run database trigger SQL (see SETUP.md) |

---

## Step 6: Test the App

### Test Homepage
```
http://localhost:3000
```

**You Should See:**
- 🗺️ Map loads (grey tiles)
- 📍 "Use My Location" button
- 🔍 Location search box
- ⚠️ Yellow warning banner (if env not configured)
- 👤 User icon (if logged in)

### Test Diagnostics
```
http://localhost:3000/diagnostics
```

**You Should See:**
- All green checkmarks ✅
- "All Systems Operational"
- Valid API keys displayed (truncated)

---

## Visual Checklist

Copy this to track your progress:

```
Setup Checklist:
□ Installed dependencies (npm install)
□ Created .env.local file
□ Added Supabase URL
□ Added Supabase Anon Key
□ Added QuantaRoute key (optional for now)
□ Added MapTiler key (optional for now)
□ Added Mapbox key (optional for now)
□ Ran npm run check-env (all ✓)
□ Ran database SQL in Supabase
□ Started dev server (npm run dev)
□ Visited /diagnostics (all green)
□ Tested registration (/onboarding)
□ Verified user in Supabase Auth
□ Verified profile in profiles table
□ Tested login
□ Homepage loads without errors
```

---

## Quick Commands Reference

```bash
# Check environment setup
npm run check-env

# Start development server
npm run dev

# Build for production
npm run build

# Clean restart
rm -rf .next
npm run dev
```

---

## URLs Reference

| Page | URL | Purpose |
|------|-----|---------|
| **Home** | http://localhost:3000 | Main booking interface |
| **Diagnostics** | http://localhost:3000/diagnostics | Check configuration |
| **Onboarding** | http://localhost:3000/onboarding | Registration/Login |
| **Map Test** | http://localhost:3000/map-test | Test map features |

---

## Need Help?

1. **Check warnings**: Look for yellow banner at top of pages
2. **Run diagnostics**: Visit `/diagnostics` page
3. **Check console**: Open browser DevTools (F12)
4. **Read docs**:
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
   - [SETUP.md](./SETUP.md) - Detailed setup
   - [REGISTRATION_FIX.md](./REGISTRATION_FIX.md) - Fix details

---

## Success! 🎉

If you can:
- ✅ Register a new account
- ✅ Login successfully
- ✅ See the map on homepage
- ✅ All diagnostics are green

**You're all set! Start building your features!**

