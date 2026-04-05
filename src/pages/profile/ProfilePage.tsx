import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { MapPin, Trophy, ChevronRight, ClipboardList, Copy, Check, Heart } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AvailabilityModal } from '@/components/availability';
import { SportRow } from '@/components/me/SportRow';
import { SettingsRow } from '@/components/me/SettingsRow';
import { LikedPlayersSection } from '@/components/me/LikedPlayersSection';
import { SectionTitle } from '@/design-system';
import {
  IconCalendar,
  IconZap,
  IconSettings,
  IconSun,
  IconMoon,
  IconUser,
  IconClock,
} from '@/design-system/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { SportType, LikedPlayer } from '@/types/database';
import { fetchPendingScoreMatches } from '@/lib/scoring';
import { useThemeContext } from '@/contexts/ThemeContext';
import { PageContainer } from '@/components/layout/PageContainer';

// ── Local helpers ──────────────────────────────────────────────────────────────

function RowDivider({ indent = 64 }: { indent?: number }) {
  return (
    <div style={{ height: 1, background: 'var(--color-bdr)', marginLeft: indent }} />
  );
}

function MiniStatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}
    >
      <div style={{ color: 'var(--color-t3)' }}>{icon}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-t1)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 1,
          marginTop: 'var(--space-1)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-2xs)',
          fontWeight: 'var(--weight-medium)',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase' as const,
          color: 'var(--color-t2)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user, signOut, updateProfile } = useAuth();
  const { theme, toggle } = useThemeContext();
  const isDark = theme === 'dark';
  const isDesktop = useIsDesktop();

  const [uploading, setUploading] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [likedModalOpen, setLikedModalOpen] = useState(false);
  const [pendingScoreCount, setPendingScoreCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [likedPlayers, setLikedPlayers] = useState<LikedPlayer[]>([]);
  const [likedLoading, setLikedLoading] = useState<boolean>(true);

  const shortId = user?.id ? `#${user.id.split('-')[0].toUpperCase()}` : '#--------';

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(shortId);
    } catch {
      const el = document.createElement('textarea');
      el.value = shortId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchPendingScoreMatches(user.id).then(({ data }) => {
      setPendingScoreCount(data?.length ?? 0);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('liked_players')
      .select('liked_user_id, sport, profiles!liked_user_id(full_name, avatar_url)')
      .eq('liker_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLikedPlayers(
          (data ?? [])
            .filter((r: any) => r.profiles != null)
            .map((r: any) => ({
              id: r.liked_user_id,
              fullName: r.profiles?.full_name ?? 'Unknown',
              avatarUrl: r.profiles?.avatar_url ?? null,
              sport: r.sport,
            }))
        );
        setLikedLoading(false);
      });
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleAvatarChange = async (url: string | null, file?: File) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: dbError } = await updateProfile({ avatar_url: publicUrl });
      if (dbError) console.error('Profile update error:', dbError);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // TODO: replace with Supabase fetch (see MePage.tsx for pattern)
  const userSports: {
    sport: SportType;
    level: string;
    rating?: string;
    ratingSystem?: string;
  }[] = [
    { sport: 'platform_tennis', level: 'Advanced', rating: '4.5', ratingSystem: 'PTI' },
    { sport: 'tennis', level: 'Intermediate', rating: '5.8', ratingSystem: 'UTR' },
    { sport: 'pickleball', level: 'Advanced', rating: '4.2', ratingSystem: 'DUPR' },
  ];

  // TODO: replace with Supabase fetch (see MePage.tsx for pattern)
  const stats = { matchesPlayed: 47, wins: 32, winRate: 68 };

  const location = [profile?.location_city, profile?.location_country]
    .filter(Boolean)
    .join(', ');

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
      <PageContainer style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── A. Profile Hero ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        alignItems: 'center',
        textAlign: isDesktop ? 'left' : 'center',
        padding: '24px 20px 16px',
        gap: isDesktop ? 24 : 12,
      }}>
        {/* Avatar with green ring */}
        <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
          <ImageUpload
            value={profile?.avatar_url}
            name={profile?.full_name || 'User'}
            onChange={handleAvatarChange}
            size="xl"
          />
          {/* Decorative ring */}
          <div
            style={{
              position: 'absolute',
              inset: -5,
              borderRadius: '50%',
              border: '3px solid var(--color-acc)',
              pointerEvents: 'none',
            }}
          />
          {uploading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isDesktop ? 'flex-start' : 'center', gap: 6 }}>
          {/* Name */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isDesktop ? 28 : 'var(--text-3xl)',
              fontWeight: 'var(--weight-bold)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--color-t1)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {profile?.full_name || 'Your Name'}
          </div>

          {/* Unique ID pill */}
          <button
            onClick={handleCopyId}
            title="Copy your unique ID"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf)',
              border: '1px solid var(--color-bdr)',
              cursor: 'pointer',
              color: copied ? 'var(--color-acc)' : 'var(--color-t3)',
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
          >
            {copied
              ? <Check size={12} strokeWidth={3} />
              : <Copy size={12} />
            }
            {copied ? 'Copied!' : shortId}
          </button>

          {/* Location */}
          {location && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                color: 'var(--color-t2)',
              }}
            >
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {location}
              </span>
            </div>
          )}

          {/* Edit Profile pill */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              marginTop: 'var(--space-1)',
              padding: 'var(--space-2) var(--space-6)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-t1)',
              color: 'var(--color-bg)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              letterSpacing: 'var(--tracking-wide)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* ── B. Performance Sync ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
          }}
        >
          <SectionTitle>Performance Sync</SectionTitle>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-acc)',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Live View
          </button>
        </div>

        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {[
            { value: String(stats.matchesPlayed), label: 'Matches' },
            { value: String(stats.wins), label: 'Wins' },
            { value: `${stats.winRate}%`, label: 'Win Rate' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                borderRight: i < 2 ? '1px solid var(--color-bdr)' : 'none',
                padding: 'var(--space-4) 0',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-acc)',
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--weight-medium)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-t2)',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── C. Pending score alert ───────────────────────────────────────────── */}
      {pendingScoreCount > 0 && (
        <div
          style={{
            margin: '0 var(--space-5)',
            marginTop: 'var(--space-4)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid rgba(255,179,0,0.3)',
            background: 'rgba(255,179,0,0.06)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,179,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ClipboardList size={20} color="#FFB300" />
          </div>
          <span
            style={{
              flex: 1,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-t1)',
            }}
          >
            {pendingScoreCount} match{pendingScoreCount !== 1 ? 'es' : ''} need
            {pendingScoreCount === 1 ? 's' : ''} a score
          </span>
          <button
            onClick={() => navigate('/results')}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-acc)',
              color: 'var(--color-bg)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            Add Scores
          </button>
        </div>
      )}

      {/* ── D. My Sports ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
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
            onClick={() => navigate('/sports')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-acc)',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Add Sport
          </button>
        </div>

        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
          }}
        >
          {userSports.map((s, i) => (
            <div key={s.sport}>
              <SportRow
                sport={s.sport}
                selfAssessedLevel={s.level}
                officialRating={s.rating ?? null}
                officialRatingSystem={s.ratingSystem ?? null}
                onPress={() => navigate('/sports')}
              />
              {i < userSports.length - 1 && <RowDivider indent={68} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── E. Liked Players (button → opens modal) ──────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
        <div style={{ background: 'var(--color-surf)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
          <button
            onClick={() => setLikedModalOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-4) var(--space-5)',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Heart size={18} color="#ef4444" fill="#ef4444" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-t1)' }}>
                Liked Players
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-t3)', marginTop: 2 }}>
                {likedLoading ? 'Loading…' : likedPlayers.length === 0 ? 'No liked players yet' : `${likedPlayers.length} player${likedPlayers.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
          </button>
        </div>
      </div>

      {/* ── F. Activity Feed ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <SectionTitle>Activity Feed</SectionTitle>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Achievement card — full width */}
          <div
            style={{
              background: 'var(--color-acc)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-5)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 96,
            }}
          >
            {/* Decorative trophy in background */}
            <div
              style={{
                position: 'absolute',
                right: -8,
                top: -8,
                opacity: 0.18,
                transform: 'rotate(15deg)',
                pointerEvents: 'none',
              }}
            >
              <Trophy size={80} color="#fff" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.75)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Latest Achievement
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: '#fff',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              10 Match Win Streak
            </div>
          </div>

          {/* Mini stat cards — side by side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
            }}
          >
            <MiniStatCard
              icon={<IconClock size={20} />}
              value="124h"
              label="Training Time"
            />
            <MiniStatCard
              icon={<IconUser size={20} />}
              value="89"
              label="Court Partners"
            />
          </div>
        </div>
      </div>

      {/* ── G. My Clubs ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
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
          <button
            onClick={() => console.log('[ProfilePage] Club pressed')}
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
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                Fox Meadow Tennis Club
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
            <ChevronRight
              size={14}
              style={{ color: 'var(--color-t3)', flexShrink: 0 }}
            />
          </button>
        </div>
      </div>

      {/* ── H. Settings rows ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
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
            icon={<IconCalendar size={18} style={{ color: 'var(--color-t2)' }} />}
            label="Availability"
            secondaryText="Set when you're free to play"
            onPress={() => setAvailabilityModalOpen(true)}
          />
          <RowDivider indent={68} />
          <SettingsRow
            icon={<IconZap size={18} style={{ color: 'var(--color-t2)' }} />}
            label="Achievements"
            secondaryText="View your badges and milestones"
            badge="3 new"
            onPress={() => {}}
          />
          <RowDivider indent={68} />
          <SettingsRow
            icon={<IconSettings size={18} style={{ color: 'var(--color-t2)' }} />}
            label="Settings"
            secondaryText="Account, notifications, privacy"
            onPress={() => navigate('/settings')}
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
            secondaryText={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            variant="toggle"
            toggleValue={isDark}
            onToggle={() => toggle()}
          />
        </div>
      </div>

      {/* ── I. Sign Out ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-red-bg)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-red)',
            letterSpacing: 'var(--tracking-wide)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Bottom breathing room */}
      <div style={{ height: 'var(--space-8)' }} />

      <AvailabilityModal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
      />

      <LikedPlayersSection
        likedPlayers={likedPlayers}
        loading={likedLoading}
        open={likedModalOpen}
        onClose={() => setLikedModalOpen(false)}
      />
      </PageContainer>
    </div>
  );
}
