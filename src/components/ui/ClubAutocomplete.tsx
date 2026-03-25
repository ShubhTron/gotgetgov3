import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Users, Loader2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClubAutocompleteProps {
  selectedClubs: string[];
  onAddClub: (clubId: string) => void;
  onRemoveClub: (clubId: string) => void;
  userCity?: string;
  className?: string;
}

interface Club {
  id: string;
  name: string;
  city: string;
  state: string;
  type: 'private' | 'semi-private' | 'public' | 'country';
  distance?: number;
  sports?: string[];
}

const allClubs: Club[] = [
  { id: '1', name: 'Fox Meadow Tennis Club', city: 'Scarsdale', state: 'NY', type: 'private', distance: 0.5, sports: ['tennis', 'platform_tennis'] },
  { id: '2', name: 'Westchester Country Club', city: 'Rye', state: 'NY', type: 'country', distance: 2.1, sports: ['tennis', 'golf', 'platform_tennis', 'padel'] },
  { id: '3', name: 'Sleepy Hollow Country Club', city: 'Scarborough', state: 'NY', type: 'country', distance: 3.4, sports: ['tennis', 'golf', 'platform_tennis'] },
  { id: '4', name: 'Apawamis Club', city: 'Rye', state: 'NY', type: 'private', distance: 2.3, sports: ['tennis', 'platform_tennis', 'squash'] },
  { id: '5', name: 'Orienta Beach Club', city: 'Mamaroneck', state: 'NY', type: 'semi-private', distance: 1.8, sports: ['tennis', 'platform_tennis'] },
  { id: '6', name: 'Beach Point Club', city: 'Mamaroneck', state: 'NY', type: 'private', distance: 1.9, sports: ['tennis', 'platform_tennis', 'paddle'] },
  { id: '7', name: 'Saxon Woods Park', city: 'White Plains', state: 'NY', type: 'public', distance: 4.2, sports: ['tennis', 'pickleball'] },
  { id: '8', name: 'Quaker Ridge Golf Club', city: 'Scarsdale', state: 'NY', type: 'private', distance: 1.1, sports: ['golf', 'platform_tennis'] },
  { id: '9', name: 'Bonnie Briar Country Club', city: 'Larchmont', state: 'NY', type: 'country', distance: 2.8, sports: ['tennis', 'golf', 'platform_tennis'] },
  { id: '10', name: 'Winged Foot Golf Club', city: 'Mamaroneck', state: 'NY', type: 'private', distance: 2.5, sports: ['golf', 'tennis'] },
  { id: '11', name: 'Wykagyl Country Club', city: 'New Rochelle', state: 'NY', type: 'country', distance: 5.1, sports: ['golf', 'tennis', 'platform_tennis'] },
  { id: '12', name: 'Pelham Country Club', city: 'Pelham Manor', state: 'NY', type: 'country', distance: 6.2, sports: ['golf', 'tennis', 'platform_tennis'] },
  { id: '13', name: 'Larchmont Yacht Club', city: 'Larchmont', state: 'NY', type: 'private', distance: 3.1, sports: ['tennis', 'platform_tennis'] },
  { id: '14', name: 'Edgewood Country Club', city: 'River Vale', state: 'NJ', type: 'private', distance: 12.5, sports: ['golf', 'tennis', 'platform_tennis'] },
  { id: '15', name: 'Ridgewood Country Club', city: 'Paramus', state: 'NJ', type: 'private', distance: 15.2, sports: ['golf', 'tennis'] },
  { id: '16', name: 'Round Hill Club', city: 'Greenwich', state: 'CT', type: 'private', distance: 8.4, sports: ['tennis', 'platform_tennis', 'squash'] },
  { id: '17', name: 'Greenwich Country Club', city: 'Greenwich', state: 'CT', type: 'country', distance: 9.1, sports: ['golf', 'tennis', 'platform_tennis'] },
  { id: '18', name: 'Stanwich Club', city: 'Greenwich', state: 'CT', type: 'private', distance: 10.3, sports: ['golf', 'tennis', 'platform_tennis', 'padel'] },
  { id: '19', name: 'Burning Tree Country Club', city: 'Greenwich', state: 'CT', type: 'country', distance: 11.2, sports: ['golf', 'tennis'] },
  { id: '20', name: 'Fairfield County Hunt Club', city: 'Westport', state: 'CT', type: 'private', distance: 18.5, sports: ['tennis', 'platform_tennis'] },
  { id: '21', name: 'Central Park Tennis Center', city: 'New York', state: 'NY', type: 'public', distance: 22.1, sports: ['tennis'] },
  { id: '22', name: 'USTA Billie Jean King National Tennis Center', city: 'Flushing', state: 'NY', type: 'public', distance: 18.3, sports: ['tennis'] },
  { id: '23', name: 'Midtown Tennis Club', city: 'New York', state: 'NY', type: 'semi-private', distance: 21.5, sports: ['tennis', 'pickleball'] },
  { id: '24', name: 'New York Athletic Club', city: 'New York', state: 'NY', type: 'private', distance: 20.8, sports: ['tennis', 'squash', 'racquetball'] },
];

const typeLabels: Record<string, string> = {
  private: 'Private',
  'semi-private': 'Semi-Private',
  public: 'Public',
  country: 'Country Club',
};

function getClubsForLocation(userCity: string): Club[] {
  if (!userCity) return allClubs;
  const cityLower = userCity.toLowerCase();
  const stateMatches = allClubs.filter(club => {
    const fullLocation = `${club.city}, ${club.state}`.toLowerCase();
    return cityLower.includes(club.state.toLowerCase()) ||
           fullLocation.includes(cityLower.split(',')[0]?.trim() || '');
  });
  if (stateMatches.length > 0) {
    return stateMatches.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
  }
  return allClubs.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
}

export function ClubAutocomplete({ selectedClubs, onAddClub, onRemoveClub, userCity = '', className }: ClubAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const relevantClubs = getClubsForLocation(userCity);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      if (!query.trim()) {
        setSuggestions(relevantClubs.filter(c => !selectedClubs.includes(c.id)).slice(0, 6));
      } else {
        const filtered = allClubs.filter(
          club =>
            !selectedClubs.includes(club.id) &&
            (club.name.toLowerCase().includes(query.toLowerCase()) ||
             club.city.toLowerCase().includes(query.toLowerCase()) ||
             club.state.toLowerCase().includes(query.toLowerCase()))
        );
        setSuggestions(filtered.slice(0, 8));
      }
      setLoading(false);
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [query, selectedClubs, relevantClubs]);

  const handleSelect = (club: Club) => {
    onAddClub(club.id);
    setQuery('');
    setIsOpen(false);
  };

  const nearbyClubs = relevantClubs.filter(c => !selectedClubs.includes(c.id)).slice(0, 8);
  const selectedClubData = allClubs.filter(c => selectedClubs.includes(c.id));

  return (
    <div className={cn('space-y-4', className)}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-t3)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a club by name or location..."
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 40, paddingTop: 12, paddingBottom: 12,
              borderRadius: 12, border: '1px solid var(--color-bdr)',
              background: 'var(--color-surf)', color: 'var(--color-t1)',
              fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" style={{ color: 'var(--color-t3)' }} />
          )}
        </div>

        {isOpen && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
            borderRadius: 12, zIndex: 50, maxHeight: 288, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {suggestions.map((club, i) => (
              <button
                key={club.id}
                type="button"
                onClick={() => handleSelect(club)}
                style={{
                  width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center',
                  gap: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-bdr)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-t3)' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)' }} className="truncate">
                    {club.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }} className="truncate">
                    {club.city}, {club.state} - {typeLabels[club.type]}
                  </p>
                </div>
                {club.distance && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', flexShrink: 0 }}>{club.distance} mi</span>
                )}
                <Plus className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClubData.length > 0 && (
        <div className="space-y-2">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Clubs</p>
          {selectedClubData.map((club) => (
            <div
              key={club.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--color-acc-bg)', border: '1px solid var(--color-acc)', borderRadius: 12, opacity: 0.9 }}
            >
              <div style={{ width: 40, height: 40, background: 'var(--color-acc-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users className="w-5 h-5" style={{ color: 'var(--color-acc)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)' }} className="truncate">
                  {club.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>{club.city}, {club.state}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveClub(club.id)}
                style={{ width: 24, height: 24, background: 'var(--color-acc)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                <Check className="w-4 h-4" style={{ color: 'var(--color-bg)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {nearbyClubs.length > 0 && (
        <div className="space-y-2">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {userCity ? 'Clubs in your area' : 'Popular Clubs'}
          </p>
          {nearbyClubs.map((club) => (
            <button
              key={club.id}
              type="button"
              onClick={() => onAddClub(club.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-acc)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-bdr)')}
            >
              <div style={{ width: 40, height: 40, background: 'var(--color-surf-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users className="w-5 h-5" style={{ color: 'var(--color-t3)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)' }} className="truncate">
                  {club.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>
                  <span>{club.city}, {club.state}</span>
                  <span>-</span>
                  <span>{typeLabels[club.type]}</span>
                </div>
              </div>
              {club.distance && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-t3)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>{club.distance} mi</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
