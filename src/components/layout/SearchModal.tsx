import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Search, Users, Building2, Trophy, Calendar, CircleUser as UserCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getInitials } from '@/lib/avatar-utils';
import type { Profile } from '../../types/database';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange?: (filters: SearchFilters) => void;
  userSports?: string[];
}

export interface SearchFilters {
  searchFilter: string;
  sportFilter: string;
  contentFilter?: string;
  scheduleFilter?: string;
  resultsFilter?: string;
  resultsSubFilter?: string;
  circlesFilter?: string;
  newsFilter?: string;
}

type SearchFilter = 'all' | 'players' | 'clubs' | 'competitions' | 'events' | 'coaches';
type DiscoverContentFilter = 'all' | 'players' | 'clubs' | 'competitions' | 'events' | 'coaches';
type NewsFilter = 'all' | 'circles' | 'club' | 'competitions';
type ScheduleFilter = 'my' | 'all' | 'club';
type ResultsFilter = 'my' | 'club' | 'all';
type ResultsSubFilter = 'matches' | 'ladders' | 'leagues' | 'tournaments';
type CirclesFilter = 'people' | 'matches' | 'messages';

const _globalFilterOptions: { id: SearchFilter; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'clubs', label: 'Clubs', icon: Building2 },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'coaches', label: 'Coaches', icon: UserCircle },
];

const discoverContentFilters: { id: DiscoverContentFilter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'players', label: 'Players' }, { id: 'clubs', label: 'Clubs' },
  { id: 'competitions', label: 'Competitions' }, { id: 'events', label: 'Events' }, { id: 'coaches', label: 'Coaches' },
];
const newsFilters: { id: NewsFilter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'circles', label: 'My Circles' }, { id: 'club', label: 'My Club' }, { id: 'competitions', label: 'My Competitions' },
];
const scheduleFilters: { id: ScheduleFilter; label: string }[] = [
  { id: 'my', label: 'My Schedule' }, { id: 'all', label: 'All Schedules' }, { id: 'club', label: 'Club Schedule' },
];
const resultsFilters: { id: ResultsFilter; label: string }[] = [
  { id: 'my', label: 'My Results' }, { id: 'club', label: 'Club Results' }, { id: 'all', label: 'All Results' },
];
const resultsSubFilters: { id: ResultsSubFilter; label: string }[] = [
  { id: 'matches', label: 'Matches' }, { id: 'ladders', label: 'Ladders' }, { id: 'leagues', label: 'Leagues' }, { id: 'tournaments', label: 'Tournaments' },
];
const circlesFilters: { id: CirclesFilter; label: string }[] = [
  { id: 'people', label: 'My People' }, { id: 'matches', label: 'Matches' }, { id: 'messages', label: 'Messages' },
];

type PageContext = 'discover' | 'news' | 'schedule' | 'results' | 'circles' | 'other';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getPageContext(pathname: string): PageContext {
  if (pathname.startsWith('/discover')) return 'discover';
  if (pathname.startsWith('/news')) return 'news';
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/results')) return 'results';
  if (pathname.startsWith('/circles')) return 'circles';
  return 'other';
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: 32, padding: '0 12px', borderRadius: 999,
        border: active ? 'none' : '1px solid var(--color-bdr)',
        background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
        color: active ? 'var(--color-bg)' : 'var(--color-t2)',
        fontFamily: 'var(--font-body)', fontSize: 13,
        fontWeight: active ? 600 : 400, cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s', flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="hide-scrollbar"
      style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'scroll', WebkitOverflowScrolling: 'touch' as never, touchAction: 'pan-x', paddingBottom: 4 }}
    >
      {children}
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      color: 'var(--color-t3)', margin: '0 0 8px 0',
    }}>
      {children}
    </p>
  );
}

export function SearchModal({ isOpen, onClose, onFilterChange, userSports = [] }: SearchModalProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageContext = getPageContext(location.pathname);
  const { user: _user } = useAuth();

  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<DiscoverContentFilter>('players');
  const [newsFilter, setNewsFilter] = useState<NewsFilter>('all');
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>('my');
  const [resultsFilter, setResultsFilter] = useState<ResultsFilter>('my');
  const [resultsSubFilter, setResultsSubFilter] = useState<ResultsSubFilter>('matches');
  const [circlesFilter, setCirclesFilter] = useState<CirclesFilter>('people');
  const [uuidResult, setUuidResult] = useState<Profile | null>(null);
  const [uuidLoading, setUuidLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ searchFilter, sportFilter, contentFilter, scheduleFilter, resultsFilter, resultsSubFilter, circlesFilter, newsFilter });
    }
  }, [searchFilter, sportFilter, contentFilter, scheduleFilter, resultsFilter, resultsSubFilter, circlesFilter, newsFilter, onFilterChange]);

  useEffect(() => {
    if (!UUID_REGEX.test(query)) { setUuidResult(null); return; }
    let cancelled = false;
    setUuidLoading(true);
    supabase.from('profiles').select('*').eq('id', query).maybeSingle().then(({ data }) => {
      if (!cancelled) { setUuidResult(data ?? null); setUuidLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query]);

  const renderContextFilters = () => {
    switch (pageContext) {
      case 'discover':
        return (
          <>
            <div style={{ marginBottom: 20 }}>
              <FilterLabel>Sport</FilterLabel>
              <PillRow>
                <Pill label="All" active={sportFilter === 'all'} onClick={() => setSportFilter('all')} />
                {userSports.map((sport) => (
                  <Pill key={sport} label={sport} active={sportFilter === sport} onClick={() => setSportFilter(sport)} />
                ))}
                <button onClick={() => { onClose(); navigate('/sports'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 999, border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)', color: 'var(--color-t3)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                  <Plus size={12} /> Add
                </button>
              </PillRow>
            </div>
            <div>
              <FilterLabel>Content</FilterLabel>
              <PillRow>{discoverContentFilters.map((o) => <Pill key={o.id} label={o.label} active={contentFilter === o.id} onClick={() => setContentFilter(o.id)} />)}</PillRow>
            </div>
          </>
        );
      case 'news':
        return <div><FilterLabel>Feed</FilterLabel><PillRow>{newsFilters.map((o) => <Pill key={o.id} label={o.label} active={newsFilter === o.id} onClick={() => setNewsFilter(o.id)} />)}</PillRow></div>;
      case 'schedule':
        return <div><FilterLabel>View</FilterLabel><PillRow>{scheduleFilters.map((o) => <Pill key={o.id} label={o.label} active={scheduleFilter === o.id} onClick={() => setScheduleFilter(o.id)} />)}</PillRow></div>;
      case 'results':
        return (
          <>
            <div style={{ marginBottom: 16 }}><FilterLabel>View</FilterLabel><PillRow>{resultsFilters.map((o) => <Pill key={o.id} label={o.label} active={resultsFilter === o.id} onClick={() => setResultsFilter(o.id)} />)}</PillRow></div>
            <div><FilterLabel>Type</FilterLabel><PillRow>{resultsSubFilters.map((o) => <Pill key={o.id} label={o.label} active={resultsSubFilter === o.id} onClick={() => setResultsSubFilter(o.id)} />)}</PillRow></div>
          </>
        );
      case 'circles':
        return <div><FilterLabel>View</FilterLabel><PillRow>{circlesFilters.map((o) => <Pill key={o.id} label={o.label} active={circlesFilter === o.id} onClick={() => setCirclesFilter(o.id)} />)}</PillRow></div>;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 999 }}
            onClick={onClose}
          />

          {/* Search panel — slides down from below header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
            className="fixed inset-0 z-[1000] overflow-y-auto md:inset-auto md:top-[80px] md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:rounded-[14px] md:max-h-[calc(100dvh-100px)] md:border md:border-[var(--color-bdr)]"
            style={{ background: 'var(--color-surf)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
          >
            <div style={{ padding: '0 16px 16px', paddingTop: 'max(20px, env(safe-area-inset-top, 20px))', borderBottom: '1px solid var(--color-bdr)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)', borderRadius: 12, padding: '0 14px', height: 44 }}>
                  <Search size={16} style={{ color: 'var(--color-acc)', flexShrink: 0 }} />
                  <input
                    autoFocus
                    placeholder="Search players, clubs, events..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t1)' }}
                  />
                  {query.length > 0 && (
                    <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-t3)' }} aria-label="Clear">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)', flexShrink: 0 }} aria-label="Close search">
                  <X size={20} />
                </button>
              </div>

              {pageContext !== 'other' && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-bdr)' }}>
                  {renderContextFilters()}
                </div>
              )}
            </div>

            <div style={{ padding: '20px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
              {query.length > 0 && (uuidLoading || uuidResult) && (
                <div style={{ marginBottom: 16 }}>
                  <FilterLabel>User</FilterLabel>
                  {uuidLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                      <div style={{ width: 16, height: 16, border: '2px solid var(--color-acc)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)' }}>Looking up user…</span>
                    </div>
                  )}
                  {!uuidLoading && uuidResult && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--color-bg)', overflow: 'hidden', flexShrink: 0 }}>
                        {uuidResult.avatar_url ? <img src={uuidResult.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(uuidResult.full_name ?? '')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {uuidResult.full_name}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedProfile(uuidResult)}
                        style={{ padding: '6px 14px', borderRadius: 999, background: 'var(--color-acc)', border: 'none', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        View
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!UUID_REGEX.test(query) && (
                query.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <Search size={40} style={{ color: 'var(--color-t3)', margin: '0 auto 12px' }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0 }}>
                      Search for players, clubs, competitions, and more
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0 }}>
                      No results found for "{query}"
                    </p>
                  </div>
                )
              )}

              {UUID_REGEX.test(query) && !uuidLoading && !uuidResult && (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0 }}>No user found for this ID</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* PlayerProfileModal is a placeholder that will be filled in Phase 5 */}
          {selectedProfile && (
            <div onClick={() => setSelectedProfile(null)} style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
              <div style={{ background: 'var(--color-surf)', borderRadius: 16, padding: 24, maxWidth: 360, width: '90%' }}>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)', fontWeight: 600, marginBottom: 4 }}>{selectedProfile.full_name}</p>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>Profile details coming in Phase 5</p>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
