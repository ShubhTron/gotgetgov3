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

  // Serialize sports array so it can be used as a stable effect dependency
  const sportsKey = sports.join(',');

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, lat, lng, sportsKey]);

  return { results, loading };
}
