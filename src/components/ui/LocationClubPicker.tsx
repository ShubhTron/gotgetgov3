import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader2, Navigation, Building2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Club {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  distance?: number;
}

interface LocationClubPickerProps {
  onLocationSelect: (city: string, lat: number | null, lng: number | null) => void;
  onClubSelect: (club: Club) => void;
  selectedClubs: Club[];
  onRemoveClub: (clubId: string) => void;
  onAutoAdvance?: () => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  className?: string;
}

const CLUB_PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=100',
];

function getPlaceholderImage(clubId: string): string {
  const hash = clubId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CLUB_PLACEHOLDER_IMAGES[hash % CLUB_PLACEHOLDER_IMAGES.length];
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function LocationClubPicker({ onLocationSelect, onClubSelect, selectedClubs, onRemoveClub, onAutoAdvance, onSearchFocus, onSearchBlur, className }: LocationClubPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [nearbyClubs, setNearbyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [ipLocation, setIpLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchIpLocation(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (ipLocation && !userLocation) fetchNearbyClubs(ipLocation.lat, ipLocation.lng);
  }, [ipLocation, userLocation]);

  const fetchIpLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        setIpLocation({ lat: data.latitude, lng: data.longitude, city: data.city ? `${data.city}, ${data.region_code || data.region}` : '' });
      }
    } catch {
      setIpLocation({ lat: 40.7128, lng: -74.006, city: 'New York, NY' });
    }
  };

  const fetchNearbyClubs = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clubs').select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng').limit(20);
      if (error) throw error;
      const clubsWithDistance = (data || []).map(club => ({
        ...club,
        distance: club.location_lat && club.location_lng ? calculateDistance(lat, lng, club.location_lat, club.location_lng) : undefined,
      })).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      setNearbyClubs(clubsWithDistance.slice(0, 8));
    } catch { setNearbyClubs([]); } finally { setLoading(false); }
  };

  const searchClubs = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clubs').select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng').or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`).limit(10);
      if (error) throw error;
      const location = userLocation || ipLocation;
      setSearchResults((data || []).map(club => ({
        ...club,
        distance: location && club.location_lat && club.location_lng ? calculateDistance(location.lat, location.lng, club.location_lat, club.location_lng) : undefined,
      })));
    } catch { setSearchResults([]); } finally { setLoading(false); }
  }, [userLocation, ipLocation]);

  useEffect(() => {
    const id = setTimeout(() => searchClubs(query), 300);
    return () => clearTimeout(id);
  }, [query, searchClubs]);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let cityName = 'Location detected';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const d = await res.json();
          if (d.address) {
            const city = d.address.city || d.address.town || d.address.village || '';
            cityName = city ? `${city}, ${d.address.state || ''}` : 'Location detected';
          }
        } catch {}
        setUserLocation({ lat: latitude, lng: longitude, city: cityName });
        setLocationDetected(true);
        setDetectingLocation(false);
        onLocationSelect(cityName, latitude, longitude);
        fetchNearbyClubs(latitude, longitude);
        setTimeout(() => onAutoAdvance?.(), 600);
      },
      () => setDetectingLocation(false)
    );
  };

  const handleClubSelect = (club: Club) => {
    if (!selectedClubs.find(c => c.id === club.id)) {
      onClubSelect(club);
      if (club.city) {
        onLocationSelect(`${club.city}${club.state ? `, ${club.state}` : ''}`, club.location_lat, club.location_lng);
        setLocationDetected(true);
      }
    }
    setQuery('');
    setIsOpen(false);
  };

  const displayClubs = query.trim() ? searchResults : nearbyClubs;
  const filteredClubs = displayClubs.filter(c => !selectedClubs.find(sc => sc.id === c.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className={className}>
      {/* Use My Location button */}
      {!locationDetected && (
        <button
          onClick={detectLocation}
          disabled={detectingLocation}
          style={{
            width: '100%', height: 52, borderRadius: 12, cursor: detectingLocation ? 'not-allowed' : 'pointer',
            background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
            color: 'var(--color-acc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '1rem', letterSpacing: '0.04em',
            transition: 'background 0.2s, border-color 0.2s', opacity: detectingLocation ? 0.7 : 1,
          }}
        >
          {detectingLocation
            ? <Loader2 size={18} className="animate-spin" />
            : <Navigation size={18} />
          }
          Use My Location
        </button>
      )}

      {/* Location confirmed */}
      {locationDetected && userLocation && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-acc-bg)', border: '1px solid var(--color-acc)', borderRadius: 12 }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={15} color="var(--color-bg)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-acc)', marginBottom: 2 }}>Location detected</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--color-t2)' }}>{userLocation.city}</p>
          </div>
        </motion.div>
      )}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '2px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
        <span style={{ padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-t3)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
          {locationDetected ? 'or search for clubs' : 'or enter location / club'}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
      </div>

      {/* Search input */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => { setIsOpen(true); onSearchFocus?.(); }}
            onBlur={() => onSearchBlur?.()}
            placeholder="Search for a city or club..."
            style={{
              width: '100%', padding: '13px 40px 13px 42px',
              background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
              borderRadius: 12, color: 'var(--color-t1)', fontFamily: 'var(--font-body)',
              fontSize: '0.95rem', fontWeight: 500, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {loading && (
            <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)' }} />
          )}
        </div>

        <AnimatePresence>
          {isOpen && filteredClubs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)', borderRadius: 14, zIndex: 50, maxHeight: 280, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
            >
              {filteredClubs.map((club, i) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => handleClubSelect(club)}
                  style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: 'none', border: 'none', borderBottom: i < filteredClubs.length - 1 ? '1px solid var(--color-bdr)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--color-surf)' }}>
                    <img src={club.logo_url || club.cover_image_url || getPlaceholderImage(club.id)} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.city}{club.state ? `, ${club.state}` : ''}</p>
                  </div>
                  {club.distance !== undefined && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-t3)', flexShrink: 0 }}>{club.distance} mi</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected clubs */}
      {selectedClubs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-t3)' }}>Selected Clubs</p>
          {selectedClubs.map(club => (
            <motion.div key={club.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-acc-bg)', border: '1px solid var(--color-acc)', borderRadius: 12 }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <img src={club.logo_url || club.cover_image_url || getPlaceholderImage(club.id)} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.city}{club.state ? `, ${club.state}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveClub(club.id)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surf)')}
              >
                <X size={13} style={{ color: 'var(--color-t2)' }} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Nearby clubs list */}
      {!query.trim() && nearbyClubs.length > 0 && filteredClubs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={12} />
            {ipLocation || userLocation ? 'Clubs Near You' : 'Popular Clubs'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredClubs.slice(0, 5).map(club => (
              <button
                key={club.id}
                type="button"
                onClick={() => handleClubSelect(club)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-acc)'; e.currentTarget.style.background = 'var(--color-acc-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-bdr)'; e.currentTarget.style.background = 'var(--color-surf)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--color-surf-2)' }}>
                  <img src={club.logo_url || club.cover_image_url || getPlaceholderImage(club.id)} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.city}{club.state ? `, ${club.state}` : ''}</p>
                </div>
                {club.distance !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <MapPin size={12} style={{ color: 'var(--color-t3)' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-t3)' }}>{club.distance} mi</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
