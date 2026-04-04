# Club Search — Paddlescores Integration + Google Maps Fix

**Date:** 2026-04-05  
**Branch:** feature/liked-players-and-calendar-sync

---

## Problem

The "Find your club" onboarding step shows "Search unavailable" because:
1. Google Maps JS SDK is never loaded (no API key, no script tag)
2. No club data exists in Supabase to show by default

---

## Solution

1. Fix Google Maps (load SDK with API key)
2. Seed 34 Westchester platform tennis clubs into Supabase via a geocoding script
3. Update `useClubSearch` to show Supabase clubs by proximity before user types anything

---

## Section 1: Google Maps Fix

- Add `VITE_GOOGLE_MAPS_API_KEY` to `.env`
- Inject Maps JS script at app startup (`index.html` or `main.tsx`)
- Required Google Cloud APIs: Maps JavaScript API, Places API, Geocoding API

---

## Section 2: Club Data Seed

**Approach:** One-time seed. 34 club names manually extracted from `westchester.paddlescores.com`. A Node.js script geocodes each via Google Geocoding API and generates a SQL migration.

**Seed script:** `scripts/seed-paddlescores-clubs.mjs`
- Reads 34 club names from `scripts/paddlescores-clubs.json`
- Calls Google Geocoding API: `"{name} Westchester NY"` per club
- Extracts address, city, state, lat, lng
- Outputs `supabase/migrations/20260405000000_054_seed_paddlescores_clubs.sql`

**Clubs list (34 unique):**
American Yacht Club, Milbrook Club, Mount Kisco Country Club, New Rochelle Flint Paddle Club,
Orienta Beach Club, Bronxville Field Club, Scarsdale Golf Club, Amackassin Club,
Ardsley Country Club, Bailiwick Club, Beach Point Club, Bonnie Briar Country Club,
Brae Burn Country Club, Century Country Club, Coveleigh Club, Fairview Country Club,
Fox Meadow Tennis Club, Greenwich Field Club, Larchmont Yacht Club, Manursing Island Club,
Metropolis Country Club, New Rochelle Tennis Club, New York Athletic Club, Pelham Country Club,
Pound Ridge Tennis Club, Shenorock Shore Club, Siwanoy Country Club, Sleepy Hollow Country Club,
Sunningdale Country Club, The Apawamis Club, Waccabuc Country Club, Westchester Country Club,
Whippoorwill Club, Wykagyl Country Club

**DB change:**
```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_clubs_source ON clubs(source);
```

**Deduplication:** `ON CONFLICT (name, city) DO UPDATE` — safe to re-run.

---

## Section 3: `useClubSearch` Hook Update

**On step load (no query):**
- Query Supabase: `clubs WHERE source='paddlescores'` ordered by proximity (bounding box on lat/lng)
- Replaces "Search unavailable" with real nearby clubs

**On user typing:**
- Supabase `clubs.name ILIKE '%query%'` + Google Maps `nearbySearch` in parallel
- Merge: Supabase first, Maps results appended (deduplicated by name)

**Unchanged:** `SelectedClub` interface, `LocationClubStep` UI, `user_clubs` upsert on submit.

---

## Out of Scope

- Scheduled refresh / cron (paddlescores data changes rarely, manual re-seed when needed)
- Clubs outside Westchester region
- Admin UI for club management
