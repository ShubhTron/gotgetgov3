# Club Search — Paddlescores Integration + Google Maps Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show 34 real Westchester platform tennis clubs on the onboarding "Find your club" step, replacing "Search unavailable" with proximity results from Supabase, with Google Maps as a secondary search source when the user types.

**Architecture:** Club names from paddlescores.com are geocoded via Google Geocoding API by a one-time seed script and stored in Supabase with `source='paddlescores'`. The `useClubSearch` hook is extracted to its own file and updated to query Supabase first (proximity on load, name search on typing), then merge Google Maps results when the SDK is available. Google Maps SDK is loaded via `index.html` using the Vite env var replacement syntax.

**Tech Stack:** Vite (env var injection), Supabase JS client, Google Maps JS API (Places), Google Geocoding REST API, Vitest + @testing-library/react, Node.js ESM seed script.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/paddlescores-clubs.json` | Create | Source list of 34 club names |
| `scripts/seed-paddlescores-clubs.mjs` | Create | Geocode names → generate SQL migration |
| `supabase/migrations/20260405000000_054_add_clubs_source.sql` | Create | Add `source` column to clubs table |
| `supabase/migrations/20260405000001_055_seed_paddlescores_clubs.sql` | Generated | INSERT statements for 34 clubs |
| `.env` | Modify | Add `VITE_GOOGLE_MAPS_API_KEY` |
| `index.html` | Modify | Load Maps JS SDK with env var |
| `src/hooks/useClubSearch.ts` | Create | Extracted + updated hook (Supabase + Maps) |
| `src/hooks/useClubSearch.test.ts` | Create | Vitest tests for the hook |
| `src/pages/onboarding/OnboardingPage.tsx` | Modify | Remove inline hook + `SelectedClub`, import from hook file |

---

## Task 1: Add `source` column to clubs table

**Files:**
- Create: `supabase/migrations/20260405000000_054_add_clubs_source.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260405000000_054_add_clubs_source.sql`:

```sql
-- Add source column to clubs to distinguish paddlescores-seeded vs user-created clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';

-- Index for fast filtering by source + location
CREATE INDEX IF NOT EXISTS idx_clubs_source ON clubs(source);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs(location_lat, location_lng);
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected output: migration applied successfully. If prompted for remote DB credentials, use `npx supabase db push --password <your-db-password>`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260405000000_054_add_clubs_source.sql
git commit -m "feat: add source column to clubs table for paddlescores integration"
```

---

## Task 2: Create club names JSON

**Files:**
- Create: `scripts/paddlescores-clubs.json`

- [ ] **Step 1: Create the scripts directory and JSON file**

Create `scripts/paddlescores-clubs.json`:

```json
[
  "American Yacht Club",
  "Milbrook Club",
  "Mount Kisco Country Club",
  "New Rochelle Flint Paddle Club",
  "Orienta Beach Club",
  "Bronxville Field Club",
  "Scarsdale Golf Club",
  "Amackassin Club",
  "Ardsley Country Club",
  "Bailiwick Club",
  "Beach Point Club",
  "Bonnie Briar Country Club",
  "Brae Burn Country Club",
  "Century Country Club",
  "Coveleigh Club",
  "Fairview Country Club",
  "Fox Meadow Tennis Club",
  "Greenwich Field Club",
  "Larchmont Yacht Club",
  "Manursing Island Club",
  "Metropolis Country Club",
  "New Rochelle Tennis Club",
  "New York Athletic Club",
  "Pelham Country Club",
  "Pound Ridge Tennis Club",
  "Shenorock Shore Club",
  "Siwanoy Country Club",
  "Sleepy Hollow Country Club",
  "Sunningdale Country Club",
  "The Apawamis Club",
  "Waccabuc Country Club",
  "Westchester Country Club",
  "Whippoorwill Club",
  "Wykagyl Country Club"
]
```

- [ ] **Step 2: Commit**

```bash
git add scripts/paddlescores-clubs.json
git commit -m "chore: add paddlescores club names source list"
```

---

## Task 3: Write geocoding seed script

**Files:**
- Create: `scripts/seed-paddlescores-clubs.mjs`

- [ ] **Step 1: Write the seed script**

Create `scripts/seed-paddlescores-clubs.mjs`:

```javascript
// Usage: GOOGLE_GEOCODING_API_KEY=<key> node scripts/seed-paddlescores-clubs.mjs
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_GEOCODING_API_KEY env var is required');
  console.error('Run: GOOGLE_GEOCODING_API_KEY=<key> node scripts/seed-paddlescores-clubs.mjs');
  process.exit(1);
}

const clubs = JSON.parse(
  readFileSync(join(__dirname, 'paddlescores-clubs.json'), 'utf8')
);

async function geocode(name) {
  const query = encodeURIComponent(`${name} Westchester NY`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results.length) {
    console.warn(`  ⚠ Could not geocode: ${name} (status: ${data.status})`);
    return null;
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  let city = null;
  let state = null;

  for (const comp of result.address_components) {
    if (comp.types.includes('locality')) city = comp.long_name;
    if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
  }

  return { lat, lng, city, state, address: result.formatted_address };
}

function escape(s) {
  return (s ?? '').replace(/'/g, "''");
}

const inserts = [];

for (const name of clubs) {
  const geo = await geocode(name);
  if (!geo) continue;

  inserts.push(
    `INSERT INTO clubs (name, address, city, state, location_lat, location_lng, source, sports)\n` +
    `SELECT '${escape(name)}', '${escape(geo.address)}', '${escape(geo.city)}', '${escape(geo.state)}',\n` +
    `       ${geo.lat}, ${geo.lng}, 'paddlescores', '{platform_tennis}'\n` +
    `WHERE NOT EXISTS (\n` +
    `  SELECT 1 FROM clubs WHERE name = '${escape(name)}' AND city = '${escape(geo.city)}'\n` +
    `);\n`
  );

  console.log(`  ✓ ${name} → ${geo.city}, ${geo.state} (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`);

  // Respect Google's rate limit (50 req/s free tier)
  await new Promise(r => setTimeout(r, 200));
}

const timestamp = new Date().toISOString();
const sql = [
  `-- Paddlescores club seed — generated by scripts/seed-paddlescores-clubs.mjs`,
  `-- Generated: ${timestamp}`,
  `-- ${inserts.length} clubs from westchester.paddlescores.com`,
  ``,
  ...inserts,
].join('\n');

const outPath = join(
  __dirname,
  '../supabase/migrations/20260405000001_055_seed_paddlescores_clubs.sql'
);
writeFileSync(outPath, sql);
console.log(`\nWrote ${inserts.length} club inserts to:\n  ${outPath}`);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-paddlescores-clubs.mjs
git commit -m "chore: add paddlescores geocoding seed script"
```

---

## Task 4: Run seed script and apply migration

**Files:**
- Generated: `supabase/migrations/20260405000001_055_seed_paddlescores_clubs.sql`

> **Prereq:** Google Cloud project must have Geocoding API enabled. Get the API key from Google Cloud Console → APIs & Services → Credentials.

- [ ] **Step 1: Run the seed script**

```bash
GOOGLE_GEOCODING_API_KEY=<your-key> node scripts/seed-paddlescores-clubs.mjs
```

Expected output:
```
  ✓ American Yacht Club → Rye, NY (40.9804, -73.6877)
  ✓ Milbrook Club → Greenwich, CT (41.0534, -73.6284)
  ...
  ✓ Wykagyl Country Club → New Rochelle, NY (40.9368, -73.7662)

Wrote 34 club inserts to:
  .../supabase/migrations/20260405000001_055_seed_paddlescores_clubs.sql
```

If fewer than 30 clubs geocode successfully, the Geocoding API key may not be enabled — check Google Cloud Console.

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

- [ ] **Step 3: Verify clubs exist in Supabase**

Go to Supabase Dashboard → Table Editor → clubs. Filter by `source = paddlescores`. Should show ~34 rows with lat/lng populated.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260405000001_055_seed_paddlescores_clubs.sql
git commit -m "feat: seed 34 Westchester platform tennis clubs from paddlescores"
```

---

## Task 5: Add Google Maps API key and load SDK

**Files:**
- Modify: `.env`
- Modify: `index.html`

> **Prereq:** Google Cloud project must have Maps JavaScript API + Places API enabled (same project as Task 4).

- [ ] **Step 1: Add env var to `.env`**

Open `.env` and add:

```
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

- [ ] **Step 2: Load Maps SDK in `index.html`**

In `index.html`, add the following script tag inside `<head>`, after the fonts preconnect lines and before `</head>`:

```html
    <script
      async
      src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=places"
    ></script>
```

The `%VITE_GOOGLE_MAPS_API_KEY%` syntax is replaced by Vite at build time. The final `index.html` after `<link>` block should look like:

```html
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script
      async
      src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=places"
    ></script>
  </head>
```

- [ ] **Step 3: Verify Maps loads**

```bash
npm run dev
```

Open browser → DevTools Console → type `window.google.maps`. Should return the Maps API object, not `undefined`.

- [ ] **Step 4: Commit**

```bash
git add index.html
# Do NOT commit .env — it contains secrets
git commit -m "feat: load Google Maps JS SDK via Vite env var injection"
```

---

## Task 6: Extract and update `useClubSearch` hook

**Files:**
- Create: `src/hooks/useClubSearch.ts`
- Create: `src/hooks/useClubSearch.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useClubSearch.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useClubSearch } from './useClubSearch';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function makeMockQuery(resolvedData: unknown[]) {
  const q: Record<string, unknown> = {};
  ['select', 'eq', 'gte', 'lte', 'ilike'].forEach(m => {
    q[m] = vi.fn().mockReturnValue(q);
  });
  q['limit'] = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  return q;
}

describe('useClubSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No Google Maps by default
    (window as unknown as Record<string, unknown>).google = undefined;
  });

  it('returns empty results and not loading when lat/lng are null', () => {
    const { result } = renderHook(() => useClubSearch('', null, null, []));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('queries Supabase by proximity when lat/lng set and no query typed', async () => {
    const mockClubs = [
      {
        id: 'abc',
        name: 'Westchester Country Club',
        city: 'Rye',
        state: 'NY',
        logo_url: null,
        cover_image_url: null,
        location_lat: 40.98,
        location_lng: -73.68,
      },
    ];
    const mockQuery = makeMockQuery(mockClubs);
    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const { result } = renderHook(() => useClubSearch('', 40.98, -73.68, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('clubs');
    expect(mockQuery.eq).toHaveBeenCalledWith('source', 'paddlescores');
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe('Westchester Country Club');
  });

  it('queries Supabase by name when query is typed', async () => {
    const mockClubs = [
      {
        id: 'def',
        name: 'Bronxville Field Club',
        city: 'Bronxville',
        state: 'NY',
        logo_url: null,
        cover_image_url: null,
        location_lat: 40.94,
        location_lng: -73.83,
      },
    ];
    const mockQuery = makeMockQuery(mockClubs);
    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const { result } = renderHook(() => useClubSearch('bronx', 40.98, -73.68, []));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 1000 });

    expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%bronx%');
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe('Bronxville Field Club');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/useClubSearch.test.ts
```

Expected: `FAIL — Cannot find module './useClubSearch'`

- [ ] **Step 3: Create the hook**

Create `src/hooks/useClubSearch.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SportType } from '@/types';

export interface SelectedClub {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

const CLUB_SEARCH_RADIUS_DEG = 0.5; // ~55 km bounding box
const CLUB_SEARCH_RADIUS_M = 25000;

function toSelectedClub(row: {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
}): SelectedClub {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    logo_url: row.logo_url,
    cover_image_url: row.cover_image_url,
    location_lat: row.location_lat,
    location_lng: row.location_lng,
  };
}

export function useClubSearch(
  query: string,
  lat: number | null,
  lng: number | null,
  sports: SportType[]
): { results: SelectedClub[]; loading: boolean } {
  const [results, setResults] = useState<SelectedClub[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lng === null) {
      setResults([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();

    // ── No query: show nearby paddlescores clubs ──────────────────────────────
    if (!trimmed) {
      setLoading(true);
      supabase
        .from('clubs')
        .select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng')
        .eq('source', 'paddlescores')
        .gte('location_lat', lat - CLUB_SEARCH_RADIUS_DEG)
        .lte('location_lat', lat + CLUB_SEARCH_RADIUS_DEG)
        .gte('location_lng', lng - CLUB_SEARCH_RADIUS_DEG)
        .lte('location_lng', lng + CLUB_SEARCH_RADIUS_DEG)
        .limit(20)
        .then(({ data }) => {
          const sorted = (data ?? []).slice().sort((a, b) => {
            const dA = Math.abs((a.location_lat ?? 0) - lat) + Math.abs((a.location_lng ?? 0) - lng);
            const dB = Math.abs((b.location_lat ?? 0) - lat) + Math.abs((b.location_lng ?? 0) - lng);
            return dA - dB;
          });
          setResults(sorted.map(toSelectedClub));
          setLoading(false);
        });
      return;
    }

    // ── Query typed: Supabase name search + Google Maps ───────────────────────
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data: dbClubs } = await supabase
          .from('clubs')
          .select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng')
          .ilike('name', `%${trimmed}%`)
          .limit(10);

        const supabaseResults = (dbClubs ?? []).map(toSelectedClub);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        if (!g?.maps?.places) {
          setResults(supabaseResults);
          setLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapsApi = g.maps as any;
        const service = new mapsApi.places.PlacesService(document.createElement('div'));
        const keyword = sports.length ? sports.join(' ') : 'tennis paddle';

        service.nearbySearch(
          {
            location: new mapsApi.LatLng(lat, lng),
            radius: CLUB_SEARCH_RADIUS_M,
            keyword: `${trimmed} ${keyword}`,
            type: 'establishment',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (places: any[] | null, status: string) => {
            const mapsResults: SelectedClub[] = [];
            if (status === mapsApi.places.PlacesServiceStatus.OK && places) {
              const existingNames = new Set(
                supabaseResults.map(c => c.name.toLowerCase())
              );
              for (const place of places) {
                const name = (place.name ?? '') as string;
                if (!existingNames.has(name.toLowerCase())) {
                  mapsResults.push({
                    id: place.place_id ?? '',
                    name,
                    city: null,
                    state: null,
                    logo_url: null,
                    cover_image_url: null,
                    location_lat: place.geometry?.location?.lat() ?? null,
                    location_lng: place.geometry?.location?.lng() ?? null,
                  });
                }
              }
            }
            setResults([...supabaseResults, ...mapsResults]);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Club search error:', err);
        setResults([]);
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, lat, lng, sports]);

  return { results, loading };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/useClubSearch.test.ts
```

Expected:
```
✓ returns empty results and not loading when lat/lng are null
✓ queries Supabase by proximity when lat/lng set and no query typed
✓ queries Supabase by name when query is typed
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useClubSearch.ts src/hooks/useClubSearch.test.ts
git commit -m "feat: extract useClubSearch hook with Supabase proximity + Maps fallback"
```

---

## Task 7: Update OnboardingPage to use the extracted hook

**Files:**
- Modify: `src/pages/onboarding/OnboardingPage.tsx`

- [ ] **Step 1: Add import, remove inline definitions**

At the top of `src/pages/onboarding/OnboardingPage.tsx`, add this import after the existing imports:

```typescript
import { useClubSearch, type SelectedClub } from '@/hooks/useClubSearch';
```

- [ ] **Step 2: Remove the inline `SelectedClub` interface**

Find and delete these lines (around line 21–31):

```typescript
interface SelectedClub {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  membershipRole?: ClubRole;
}
```

Then re-add `membershipRole` only where it's needed. The `SelectedClub` from the hook doesn't have `membershipRole` since it's an onboarding-only concern. Create a local extension at the top of `OnboardingPage.tsx` (after the import):

```typescript
type SelectedClubWithRole = SelectedClub & { membershipRole?: ClubRole };
```

Then replace all uses of `SelectedClub` in `OnboardingPage.tsx` that include `membershipRole` with `SelectedClubWithRole`. Specifically:
- `selectedClubs: SelectedClub[]` in `OnboardingData` → `SelectedClubWithRole[]`
- `coachClubs: SelectedClub[]` in `OnboardingData` → `SelectedClubWithRole[]`
- `selectedClub` state in `LocationClubStep` → `SelectedClubWithRole | null`

- [ ] **Step 3: Remove the inline `useClubSearch` function**

Find and delete the entire `function useClubSearch(...)` block (lines ~355–431 in the original file). Also remove the `CLUB_SEARCH_RADIUS_M` constant at line 33 — it now lives in the hook file.

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build completes with no errors. If you see type errors about `membershipRole`, ensure `SelectedClubWithRole` is used in the right places (see Step 2).

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

1. Open the app → go through onboarding to the "Find your club" step
2. **Without typing anything:** a list of Westchester clubs should appear (proximity-sorted)
3. **Type a club name** (e.g. "bronx"): Supabase results appear first, Google Maps results below
4. **Select a club** → confirm it shows in the selected chips below the search box

- [ ] **Step 6: Commit**

```bash
git add src/pages/onboarding/OnboardingPage.tsx
git commit -m "feat: update onboarding to use extracted useClubSearch with Supabase + Maps"
```

---

## Self-Review

**Spec coverage:**
- ✅ Google Maps fix — Task 5 (env var + SDK script tag)
- ✅ Source column migration — Task 1
- ✅ Club names JSON — Task 2
- ✅ Geocoding seed script — Task 3
- ✅ Run seed + apply migration — Task 4
- ✅ Proximity query on load — Task 6 (hook), confirmed in Task 7 smoke test
- ✅ Supabase name search + Maps merge on typing — Task 6
- ✅ No cron/scheduler — intentionally omitted per spec

**Placeholder scan:** None found — all steps contain full code.

**Type consistency:**
- `SelectedClub` defined in `src/hooks/useClubSearch.ts`, exported, imported in `OnboardingPage.tsx`
- `SelectedClubWithRole` extends `SelectedClub` with `membershipRole`, used only in `OnboardingPage.tsx`
- `toSelectedClub()` helper used consistently in both query paths in the hook
