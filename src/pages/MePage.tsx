import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SectionTitle } from '../design-system';
import {
  IconPlus,
  IconArrowRight,
  IconCalendar,
  IconZap,
  IconSettings,
  IconSun,
  IconMoon,
} from '../design-system/icons';
import { ProfileHero } from '../components/me/ProfileHero';
import { SportRow } from '../components/me/SportRow';
import { SettingsRow } from '../components/me/SettingsRow';
import type { SportType } from '../types/database';

// ─── Local types ──────────────────────────────────────────────────────────────

type SportProfileRow = {
  sport: SportType;
  self_assessed_level: string;
  official_rating: string | null;
  official_rating_system: string | null;
};

// ─── Skeleton row (for sport list loading) ────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        height: 64,
        background: 'var(--color-surf)',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

// ─── Section divider (indented, within a card) ────────────────────────────────

function RowDivider({ indent = 64 }: { indent?: number }) {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--color-bdr)',
        marginLeft: indent,
      }}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MePage() {
  const { user, profile, updateProfile, signOut } = useAuth();

  // Fetched data
  const [sportProfiles, setSportProfiles] = useState<SportProfileRow[]>([]);
  const [homeClubName, setHomeClubName] = useState<string | null>(null);
  const [statsMatches, setStatsMatches] = useState(0);
  const [statsWins, setStatsWins] = useState(0);
  const [statsConnections, setStatsConnections] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Derived dark mode state (source of truth is profile.dark_mode)
  const isDark = profile?.dark_mode ?? false;

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sportsRes, clubRes, connectionsRes, statsRes] = await Promise.all([
        // 1. Sport profiles
        (supabase as any)
          .from('user_sport_profiles')
          .select('sport, self_assessed_level, official_rating, official_rating_system')
          .eq('user_id', user.id),

        // 2. Home club
        (supabase as any)
          .from('user_clubs')
          .select('is_home_club, clubs(id, name)')
          .eq('user_id', user.id)
          .eq('is_home_club', true)
          .maybeSingle(),

        // 3. Connection count
        (supabase as any)
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'accepted'),

        // 4. Match stats (RPC — graceful fallback)
        (supabase.rpc as any)('get_player_match_stats', {
          p_player_id: user.id,
        }).maybeSingle(),
      ]);

      // Apply sports
      if (sportsRes.data) {
        setSportProfiles(sportsRes.data as SportProfileRow[]);
      }

      // Apply home club name
      if (clubRes.data?.clubs) {
        setHomeClubName((clubRes.data.clubs as { name: string }).name ?? null);
      }

      // Apply connections count
      if (typeof connectionsRes.count === 'number') {
        setStatsConnections(connectionsRes.count);
      }

      // Apply match stats (graceful: default to 0 if RPC missing)
      if (statsRes.data) {
        setStatsMatches(statsRes.data.matches_played ?? 0);
        setStatsWins(statsRes.data.wins ?? 0);
      }
    } catch (err) {
      console.error('[MePage] Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDarkModeToggle = async (next: boolean) => {
    // updateProfile updates Supabase AND profile state in AuthContext,
    // which triggers Shell → useTheme → data-theme attribute swap automatically.
    await updateProfile({ dark_mode: next });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (!user || !profile) {
    // Signed-out state — shell should handle routing, but safety net here
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-md)',
            color: 'var(--color-t2)',
          }}
        >
          Not signed in
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── Hero: avatar, name, location, bio, stats, player ID ─────────── */}
      <ProfileHero
        name={profile.full_name ?? 'Athlete'}
        avatarUrl={profile.avatar_url ?? null}
        bio={profile.bio ?? null}
        locationCity={profile.location_city ?? null}
        locationCountry={profile.location_country ?? null}
        statsMatches={statsMatches}
        statsWins={statsWins}
        statsConnections={statsConnections}
        userId={user.id}
        loading={loading}
        onEditPress={() => console.log('[MePage] Edit profile pressed')}
      />

      {/* ── My Sports ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 var(--space-5)',
          marginTop: 'var(--space-6)',
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
          }}
        >
          <SectionTitle>My Sports</SectionTitle>
          <button
            onClick={() => console.log('[MePage] Add sport pressed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-acc)',
              WebkitTapHighlightColor: 'transparent',
              padding: 0,
            }}
          >
            <IconPlus size={13} style={{ color: 'var(--color-acc)' }} />
            Add Sport
          </button>
        </div>

        {/* Sports card */}
        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <>
              <SkeletonRow />
              <RowDivider />
              <SkeletonRow />
              <RowDivider />
              <SkeletonRow />
            </>
          ) : sportProfiles.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-5)',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-t3)',
              }}
            >
              No sports added yet
            </div>
          ) : (
            sportProfiles.map((sp, i) => (
              <div key={sp.sport}>
                <SportRow
                  sport={sp.sport}
                  selfAssessedLevel={sp.self_assessed_level}
                  officialRating={sp.official_rating}
                  officialRatingSystem={sp.official_rating_system}
                  onPress={() =>
                    console.log('[MePage] Sport row pressed:', sp.sport)
                  }
                />
                {i < sportProfiles.length - 1 && (
                  <RowDivider indent={72} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── My Clubs ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 var(--space-5)',
          marginTop: 'var(--space-6)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <SectionTitle>My Clubs</SectionTitle>
        </div>
        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
          }}
        >
          {homeClubName ? (
            <button
              onClick={() => console.log('[MePage] Club pressed')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Club icon */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-acc-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                🏟
              </div>
              {/* Club name + badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-t1)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {homeClubName}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-acc)',
                    letterSpacing: 'var(--tracking-wider)',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  Home Club
                </div>
              </div>
              <IconArrowRight
                size={14}
                style={{ color: 'var(--color-t3)', flexShrink: 0 }}
              />
            </button>
          ) : (
            <div
              style={{
                padding: 'var(--space-5)',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-t3)',
              }}
            >
              No home club set
            </div>
          )}
        </div>
      </div>

      {/* ── Settings rows ────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 var(--space-5)',
          marginTop: 'var(--space-6)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <SectionTitle>More</SectionTitle>
        </div>
        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SettingsRow
            icon={
              <IconCalendar
                size={18}
                style={{ color: 'var(--color-t2)' }}
              />
            }
            label="Availability"
            secondaryText="Set when you're free to play"
            onPress={() => console.log('[MePage] Availability pressed')}
          />
          <RowDivider indent={68} />

          <SettingsRow
            icon={
              <IconZap size={18} style={{ color: 'var(--color-t2)' }} />
            }
            label="Achievements"
            secondaryText="View your badges and milestones"
            badge="3 new"
            onPress={() => console.log('[MePage] Achievements pressed')}
          />
          <RowDivider indent={68} />

          <SettingsRow
            icon={
              <IconSettings
                size={18}
                style={{ color: 'var(--color-t2)' }}
              />
            }
            label="Settings"
            secondaryText="Account, notifications, privacy"
            onPress={() => console.log('[MePage] Settings pressed')}
          />
          <RowDivider indent={68} />

          <SettingsRow
            icon={
              isDark ? (
                <IconMoon size={18} style={{ color: 'var(--color-t2)' }} />
              ) : (
                <IconSun size={18} style={{ color: 'var(--color-t2)' }} />
              )
            }
            label="Dark Mode"
            variant="toggle"
            toggleValue={isDark}
            onToggle={handleDarkModeToggle}
          />
        </div>
      </div>

      {/* ── Sign Out ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 var(--space-5)',
          marginTop: 'var(--space-6)',
        }}
      >
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-red-bg)',
            border: 'none',
            cursor: signingOut ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-red)',
            letterSpacing: 'var(--tracking-wide)',
            opacity: signingOut ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>

      {/* Bottom breathing room */}
      <div style={{ height: 'var(--space-8)' }} />
    </div>
  );
}
