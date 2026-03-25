import { useState } from 'react';
import {
  IconPin,
  IconPencil,
  IconSettings,
  IconCopy,
  IconCheckCheck,
} from '../../design-system/icons';

// ─── Skeleton helper ──────────────────────────────────────────────────────────

function Skeleton({
  width,
  height,
  radius = 'var(--radius-sm)',
}: {
  width: string | number;
  height: number;
  radius?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--color-surf)',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileHeroProps {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  statsMatches: number;
  statsWins: number;
  statsConnections: number;
  /** Full UUID — shortId derived internally */
  userId: string;
  loading: boolean;
  onEditPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHero({
  name,
  avatarUrl,
  bio,
  locationCity,
  locationCountry,
  statsMatches,
  statsWins,
  statsConnections,
  userId,
  loading,
  onEditPress,
}: ProfileHeroProps) {
  const [copied, setCopied] = useState(false);

  // Derive short ID from first segment of UUID
  const shortId = userId ? userId.split('-')[0].toUpperCase() : '--------';

  // Derive win rate — guard against division by zero
  const winRate =
    statsMatches > 0 ? Math.round((statsWins / statsMatches) * 100) : 0;

  // Derive location string
  const location = [locationCity, locationCountry].filter(Boolean).join(', ');

  // Derive initials for avatar fallback
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Copy user ID to clipboard
  const handleCopyId = async () => {
    const text = `#${shortId}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-HTTPS / older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { value: statsMatches, label: 'Matches' },
    { value: statsWins, label: 'Wins' },
    { value: `${winRate}%`, label: 'Win Rate' },
    { value: statsConnections, label: 'Friends' },
  ];

  return (
    <div style={{ padding: 'var(--space-5)', paddingTop: 'var(--space-6)' }}>

      {/* ── Title row ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-regular)',
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--color-t1)',
            lineHeight: 1,
          }}
        >
          Profile
        </span>

        <button
          onClick={onEditPress}
          aria-label="Edit profile"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surf)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-btn)',
            color: 'var(--color-t2)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <IconSettings size={16} />
        </button>
      </div>

      {/* ── Avatar + identity ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          textAlign: 'center',
        }}
      >
        {loading ? (
          <>
            <Skeleton width={88} height={88} radius="var(--radius-xl)" />
            <Skeleton width={160} height={28} />
            <Skeleton width={100} height={16} />
          </>
        ) : (
          <>
            {/* Avatar */}
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={onEditPress}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  background:
                    'linear-gradient(135deg, var(--color-acc-bg), rgba(13,158,80,0.25))',
                  boxShadow: 'var(--shadow-hero)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-acc)',
                      letterSpacing: 'var(--tracking-tight)',
                    }}
                  >
                    {initials}
                  </span>
                )}
              </div>

              {/* Edit badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-acc)',
                  border: '2px solid var(--color-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPencil
                  size={11}
                  style={{ color: '#fff' }}
                />
              </div>
            </div>

            {/* Name */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-3xl)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--color-t1)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {name}
            </div>

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
                <IconPin
                  size={13}
                  style={{ color: 'var(--color-t2)', flexShrink: 0 }}
                />
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

            {/* Bio */}
            {bio && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-t2)',
                  lineHeight: 'var(--leading-normal)',
                  margin: 0,
                  maxWidth: 280,
                  textAlign: 'center',
                }}
              >
                {bio}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton width="100%" height={80} radius="var(--radius-2xl)" />
      ) : (
        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                borderRight:
                  i < stats.length - 1
                    ? '1px solid var(--color-bdr)'
                    : 'none',
                paddingLeft: i > 0 ? 4 : 0,
                paddingRight: i < stats.length - 1 ? 4 : 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  letterSpacing: 'var(--tracking-tight)',
                  color: 'var(--color-t1)',
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
                  color: 'var(--color-t2)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Player ID card ────────────────────────────────────────────────── */}
      {!loading && (
        <div
          style={{
            background: 'var(--color-surf)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-t3)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                marginBottom: 3,
              }}
            >
              Player ID
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-t1)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              #{shortId}
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopyId}
            aria-label="Copy player ID"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: copied ? 'var(--color-acc)' : 'var(--color-t2)',
              transition: 'color 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {copied ? (
              <IconCheckCheck size={14} />
            ) : (
              <IconCopy size={14} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
