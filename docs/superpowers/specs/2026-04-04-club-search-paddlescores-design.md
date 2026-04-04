# Club Search — Paddlescores Integration + Google Maps Fix

**Date:** 2026-04-04  
**Branch:** feature/liked-players-and-calendar-sync  
**Scope:** Onboarding `location_club` step

---

## Problem

The "Find your club" onboarding step currently shows "Search unavailable" for all users because:
1. The Google Maps JS SDK is never loaded (no API key, no script tag)
2. There is no pre-seeded club data — the step only works if Maps is running

---

## Goal

Show real paddle/platform tennis clubs near the user on the "Find your club" step by:
1. Fixing Google Maps so it actually loads
2. Seeding the Supabase `clubs` table nightly from `westchester.paddlescores.com`
3. Updating `useClubSearch` to query Supabase first, Google Maps second

---

## Architecture

```
westchester.paddlescores.com
      │ (nightly, server-side HTTP fetch)
      ▼
Edge Function: scrape-paddlescores
  → parse HTML for club names + addresses
  → geocode via Google Geocoding API
  → upsert into clubs (source='paddlescores')
      │
      ▼
clubs table (source column added)
      │
      ▼
useClubSearch hook
  ① on load    → Supabase proximity query (no typing needed)
  ② on typing  → Supabase name search + Google Maps, merged
      │
      ▼
LocationClubStep UI (unchanged)
```

---

## Section 1: Google Maps Fix

**Files touched:** `.env`, `index.html` or `src/main.tsx`

- Add env var `VITE_GOOGLE_MAPS_API_KEY`
- Inject Maps JS script dynamically using the key at app startup
- Required Google Cloud APIs: Maps JavaScript API, Places API, Geocoding API
- The existing `useClubSearch` hook already handles `window.google` — no hook changes needed for this part

---

## Section 2: Supabase Edge Function — `scrape-paddlescores`

**File:** `supabase/functions/scrape-paddlescores/index.ts`

**Responsibilities:**
1. Fetch `https://westchester.paddlescores.com/?mod=nndz-TjJiOWtOR2sxTnhI` with a browser `User-Agent` header to avoid bot blocking
2. Parse HTML — extract club names and addresses from the page DOM structure (selectors determined by manual inspection of the page)
3. For each club, call Google Geocoding API to resolve address → lat/lng
4. Upsert into `clubs` table:
   - `source = 'paddlescores'`
   - Deduplicate by `(name, city)` — use `ON CONFLICT DO UPDATE`
   - Set `sports = '{platform_tennis}'`
5. Respond with a count of clubs upserted

**Schedule:** Nightly via Supabase pg_cron (e.g. `0 2 * * *`)

**Database migration:**
```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';
UPDATE clubs SET source = 'paddlescores' WHERE website ILIKE '%paddlescores%';
CREATE INDEX IF NOT EXISTS idx_clubs_source ON clubs(source);
```

**Environment variables needed in Supabase:**
- `GOOGLE_GEOCODING_API_KEY` — same key as Maps, used server-side for geocoding
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — for upsert

**Fragility note:** HTML selectors are hardcoded. If paddlescores changes their page layout, the parser needs a targeted update. The function should log parse errors clearly so breakage is visible.

---

## Section 3: Frontend `useClubSearch` Hook

**File:** `src/pages/onboarding/OnboardingPage.tsx`

### On step load (no query)
- Fire a Supabase query immediately when lat/lng are available:
  ```
  SELECT * FROM clubs
  WHERE source = 'paddlescores'
    AND location_lat BETWEEN (lat - 0.5) AND (lat + 0.5)
    AND location_lng BETWEEN (lng - 0.5) AND (lng + 0.5)
  ORDER BY ABS(location_lat - lat) + ABS(location_lng - lng)
  LIMIT 20
  ```
- Show these as the default list — replaces "Search unavailable"

### On user typing
- Fire both in parallel (debounced 350ms):
  1. Supabase: `clubs.name ILIKE '%query%'` (all sources)
  2. Google Maps `nearbySearch` (existing logic, now works with loaded SDK)
- Merge: Supabase results first, then Maps results not already in the list (deduplicate by name)

### Unchanged
- `SelectedClub` interface
- `LocationClubStep` UI components
- `confirmClub` / `removeClub` handlers
- `user_clubs` upsert on onboarding submit

---

## What Is Not In Scope

- Geocoding clubs that already exist in `clubs` with null lat/lng
- Showing clubs from other paddlescores regions (only Westchester URL)
- Admin UI for managing scraped clubs
- Handling JS-rendered content on paddlescores (assuming server-rendered HTML)

---

## Open Questions

1. Does the Google Cloud project already exist, or does a new one need to be created?
2. Is pg_cron already enabled on the Supabase project, or does it need to be enabled?
3. What is the exact HTML structure of the paddlescores page? (Needs manual inspection to write the parser)
