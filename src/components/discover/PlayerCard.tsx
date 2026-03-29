import { Avatar, Chip, SectionTitle, Divider, MatchRow } from '../../design-system';
import { IconPin, IconCalendar, IconZap, IconClock, IconArrowRight } from '../../design-system';
import type { DiscoverPlayer } from '../../types/discover';

export type Player = DiscoverPlayer;

interface PlayerCardProps {
  player: DiscoverPlayer;
  scrollable?: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert', professional: 'Professional',
};

function getSkillMatchLabel(level: string): string {
  switch (level) {
    case 'beginner':     return 'Friendly pace';
    case 'intermediate': return 'Great match';
    case 'advanced':     return 'Strong challenge';
    case 'expert':       return 'Elite level';
    default:             return 'Skill unknown';
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function AboutCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
        fontWeight: 600, letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase', color: 'var(--color-t3)',
        marginBottom: 'var(--space-1)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: accent ? 'var(--color-acc-dk)' : 'var(--color-t1)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {value}
        {accent && <IconArrowRight size={13} style={{ color: 'var(--color-acc-dk)', flexShrink: 0 }} />}
      </div>
    </div>
  );
}

export function PlayerCard({ player, scrollable = false }: PlayerCardProps) {
  const levelLabel = LEVEL_LABELS[player.level] ?? player.level;
  const skillLabel = getSkillMatchLabel(player.level);

  return (
    <div style={{
      background: 'var(--color-surf)',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--color-bdr)',
      boxShadow: 'var(--shadow-card)',
      position: 'relative',
      width: '100%', height: '100%',
      overflowY: scrollable ? 'auto' : 'hidden',
      scrollbarWidth: 'none',
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-4)', position: 'relative' }}>

        {/* Compatibility badge */}
        <div style={{
          position: 'absolute', top: 24, right: 22,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-extrabold)' as any,
            color: 'var(--color-acc-dk)',
            letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-none)',
          }}>
            {player.compatibilityScore}%
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
            fontWeight: 'var(--weight-semibold)' as any,
            color: 'var(--color-t3)',
            letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
            marginTop: 4,
          }}>
            Compatible
          </span>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', paddingRight: 88 }}>
          <Avatar name={player.fullName} imageUrl={player.avatarUrl} size="xl" />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)' as any,
              color: 'var(--color-t1)', letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {player.fullName}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              marginTop: 'var(--space-1)',
            }}>
              <IconPin size={10} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)' as any,
                color: 'var(--color-t3)',
              }}>
                {player.distanceKm < 2 ? 'Nearby' : `${Math.round(player.distanceKm)} km away`}
              </span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--color-acc)', color: '#052910',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--weight-extrabold)' as any,
              letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
              padding: '4px 11px', borderRadius: 'var(--radius-full)',
              marginTop: 'var(--space-1)', whiteSpace: 'nowrap',
            }}>
              {player.sportName} · {levelLabel}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-bdr)', margin: '18px 0 16px' }} />

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
          <div style={{
            width: 9, height: 9, borderRadius: 'var(--radius-full)', flexShrink: 0,
            background: '#16D46A',
            boxShadow: '0 0 0 3px rgba(22,212,106,0.22)',
          }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)' as any,
            color: 'var(--color-t1)', letterSpacing: 'var(--tracking-tight)',
          }}>
            Looking for match today
          </span>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Chip
            variant="neutral"
            icon={<IconCalendar size={12} style={{ color: 'var(--color-t2)' }} />}
            label={titleCase(player.availability)}
          />
          <Chip
            variant="accent"
            icon={<IconZap size={12} style={{ color: 'var(--color-acc-dk)' }} />}
            label={skillLabel}
          />
          {player.isActiveRecently && (
            <Chip
              variant="accent"
              icon={<IconClock size={12} style={{ color: 'var(--color-acc-dk)' }} />}
              label="Active recently"
            />
          )}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
        <SectionTitle>About</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-3)' }}>
          <AboutCell label="Availability"    value={titleCase(player.availability)} />
          <AboutCell label="Preferred Time"  value={titleCase(player.preferredTime)} />
          <AboutCell label="Home Club"       value={player.homeClub} />
          <AboutCell label="Schedule Match"  value={player.scheduleOverlapLabel} accent />
        </div>
        {player.playStyle && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Chip
              variant="accent"
              icon={<IconZap size={12} style={{ color: 'var(--color-acc-dk)' }} />}
              label={player.playStyle}
            />
          </div>
        )}
        <Divider spacing="md" />
      </div>

      {/* ── LAST 5 MATCHES ── */}
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-6)' }}>
        <SectionTitle>Last 5 Matches</SectionTitle>
        {player.recentMatches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            fontStyle: 'italic', color: 'var(--color-t3)',
            padding: 'var(--space-4) 0',
          }}>
            Recently joined
          </div>
        ) : (
          player.recentMatches.map(m => (
            <MatchRow key={m.id} result={m.result} opponentName={m.opponentName} score={m.score} date={m.date} />
          ))
        )}
      </div>
    </div>
  );
}
