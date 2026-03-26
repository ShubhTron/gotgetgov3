import { Calendar, Clock, MapPin, RefreshCw, Check, X } from 'lucide-react';
import type { MatchProposalPayload } from '../../types/circles';

const TIME_LABELS: Record<MatchProposalPayload['timeOfDay'], string> = {
  morning:   'Morning',
  afternoon: 'Afternoon',
  evening:   'Evening',
};

function formatProposalDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00'); // avoid TZ shift
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

interface Props {
  payload: MatchProposalPayload;
  isMine: boolean;
  onAccept?: () => void;
  onAlt?: () => void;
  onDecline?: () => void;
}

export function MatchProposalCard({ payload, isMine, onAccept, onAlt, onDecline }: Props) {
  const isCounter = payload.status === 'counter';
  const isAccepted = payload.status === 'accepted';
  const isDeclined = payload.status === 'declined';
  const isPending = payload.status === 'pending';

  const borderColor = isCounter
    ? 'rgba(200,150,80,0.6)'
    : isAccepted
      ? 'color-mix(in srgb, var(--color-acc) 40%, transparent)'
      : isDeclined
        ? 'var(--color-bdr)'
        : 'var(--color-bdr)';

  const bgColor = isCounter
    ? 'rgba(200,150,80,0.06)'
    : isAccepted
      ? 'color-mix(in srgb, var(--color-acc) 6%, var(--color-surf))'
      : 'var(--color-surf)';

  return (
    <div style={{
      border: `1.5px solid ${borderColor}`,
      borderRadius: 16,
      background: bgColor,
      overflow: 'hidden',
      maxWidth: 260,
      opacity: isDeclined ? 0.55 : 1,
    }}>
      {/* Card body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={15} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--color-t1)' }}>
            {formatProposalDate(payload.date)}
          </span>
        </div>

        {/* Time of day */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={15} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)' }}>
            {TIME_LABELS[payload.timeOfDay]}
          </span>
        </div>

        {/* Location */}
        {payload.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={15} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)' }}>
              {payload.location}
            </span>
          </div>
        )}

        {/* Status badge */}
        {isCounter && (
          <StatusBadge icon={<RefreshCw size={12} />} label="Counter-proposed" color="rgb(200,150,80)" bg="rgba(200,150,80,0.12)" />
        )}
        {isAccepted && (
          <StatusBadge icon={<Check size={12} />} label="Accepted" color="var(--color-acc)" bg="color-mix(in srgb, var(--color-acc) 12%, transparent)" />
        )}
        {isDeclined && (
          <StatusBadge icon={<X size={12} />} label="Declined" color="var(--color-t3)" bg="var(--color-surf-2)" />
        )}
      </div>

      {/* Accept / Alt / No actions — only for received pending proposals */}
      {!isMine && isPending && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '1px solid var(--color-bdr)',
        }}>
          <ActionButton
            icon={<Check size={14} />}
            label="Accept"
            color="var(--color-acc)"
            onClick={onAccept}
          />
          <ActionButton
            icon={<RefreshCw size={14} />}
            label="Alt"
            color="rgb(200,150,80)"
            onClick={onAlt}
            borderLeft
            borderRight
          />
          <ActionButton
            icon={<X size={14} />}
            label="No"
            color="var(--color-red, #ff3b30)"
            onClick={onDecline}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ icon, label, color, bg }: { icon: React.ReactNode; label: string; color: string; bg: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: bg, color,
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
      alignSelf: 'flex-start',
    }}>
      {icon}
      {label}
    </div>
  );
}

function ActionButton({
  icon, label, color, onClick, borderLeft, borderRight,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
  borderLeft?: boolean;
  borderRight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
        borderLeft: borderLeft ? '1px solid var(--color-bdr)' : 'none',
        borderRight: borderRight ? '1px solid var(--color-bdr)' : 'none',
        color, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
