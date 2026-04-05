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

  // Serialize sports array so it can be used as a stable effect dependency
  const sportsKey = sports.join(',');

  useEffect(() => {
    const trimmed = query.trim();

    // ── No query: fetch all paddlescores clubs ────────────────────────────────
    if (!trimmed) {
      let cancelled = false;
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('clubs')
        .select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng')
        .eq('source', 'paddlescores')
        .limit(50)
        .then(({ data, error }: { data: Parameters<typeof toSelectedClub>[0][] | null; error: unknown }) => {
          if (cancelled) return;
          if (error) console.error('Club fetch error:', error);
          setResults((data ?? []).map(toSelectedClub));
          setLoading(false);
        });
      return () => { cancelled = true; };
    }

    // ── Query typed: Supabase name search ──────────────────────────────────────
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data: dbClubs } = await supabase
          .from('clubs')
          .select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng')
          .ilike('name', `%${trimmed}%`)
          .order('source', { ascending: false }) // paddlescores before user-created
          .limit(20);

        // Deduplicate by name (case-insensitive) — keep first occurrence (paddlescores wins)
        const seen = new Set<string>();
        const deduped = (dbClubs ?? []).filter(c => {
          const key = c.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setResults(deduped.map(toSelectedClub));
      } catch (err) {
        console.error('Club search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sportsKey]);

  return { results, loading };
}
