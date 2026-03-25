import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

interface CitySuggestion {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

const popularCities: CitySuggestion[] = [
  { name: 'New York, NY', displayName: 'New York, NY, USA', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles, CA', displayName: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', displayName: 'Chicago, IL, USA', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', displayName: 'Houston, TX, USA', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', displayName: 'Phoenix, AZ, USA', lat: 33.4484, lng: -112.074 },
  { name: 'Scarsdale, NY', displayName: 'Scarsdale, NY, USA', lat: 40.9885, lng: -73.7854 },
  { name: 'Rye, NY', displayName: 'Rye, NY, USA', lat: 40.9826, lng: -73.6854 },
  { name: 'Greenwich, CT', displayName: 'Greenwich, CT, USA', lat: 41.0262, lng: -73.6282 },
  { name: 'San Francisco, CA', displayName: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194 },
  { name: 'Boston, MA', displayName: 'Boston, MA, USA', lat: 42.3601, lng: -71.0589 },
  { name: 'Miami, FL', displayName: 'Miami, FL, USA', lat: 25.7617, lng: -80.1918 },
  { name: 'Seattle, WA', displayName: 'Seattle, WA, USA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver, CO', displayName: 'Denver, CO, USA', lat: 39.7392, lng: -104.9903 },
  { name: 'London', displayName: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', displayName: 'Paris, France', lat: 48.8566, lng: 2.3522 },
];

export function CityAutocomplete({ value, onChange, placeholder = 'Enter your city', label, className }: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

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
    if (!query.trim()) {
      setSuggestions(popularCities.slice(0, 5));
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      const filtered = popularCities.filter(
        city => city.name.toLowerCase().includes(query.toLowerCase()) ||
                city.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (suggestion: CitySuggestion) => {
    setQuery(suggestion.displayName);
    onChange(suggestion.displayName, suggestion.lat, suggestion.lng);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--color-t2)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-t3)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%', paddingLeft: 40, paddingRight: 40, paddingTop: 12, paddingBottom: 12,
            borderRadius: 12, border: '1px solid var(--color-bdr)',
            background: 'var(--color-surf)', color: 'var(--color-t1)',
            fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none',
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
          borderRadius: 12, zIndex: 50, maxHeight: 256, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center',
                gap: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--color-bdr)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-t3)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }} className="truncate">
                {suggestion.displayName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
