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
  ['select', 'eq', 'ilike'].forEach(m => {
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

  it('returns empty results and not loading when lat/lng are null', async () => {
    const mockQuery = makeMockQuery([]);
    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const { result } = renderHook(() => useClubSearch('', null, null, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([]);
  });

  it('fetches all paddlescores clubs when no query typed', async () => {
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

    const { result } = renderHook(() => useClubSearch('', null, null, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('clubs');
    expect(mockQuery.eq).toHaveBeenCalledWith('source', 'paddlescores');
    expect(mockQuery.limit).toHaveBeenCalledWith(50);
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
