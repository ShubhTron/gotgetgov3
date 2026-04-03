import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { calendarService, type CalendarEventPayload } from '@/lib/calendar-service';
import { useCalendarSync } from '@/hooks/useCalendarSync';

type ItemType = 'challenge' | 'event' | 'competition';

interface CalendarPromptModalProps {
  open: boolean;
  onClose: () => void;
  itemType: ItemType;
  itemId: string;
  eventPayload: CalendarEventPayload;
  eventSummary?: string; // e.g. "Singles Match vs Rahul on Apr 12 at 6:00 PM"
}

export function CalendarPromptModal({
  open,
  onClose,
  itemType,
  itemId,
  eventPayload,
  eventSummary,
}: CalendarPromptModalProps) {
  const { syncCreate } = useCalendarSync();
  const [connecting, setConnecting] = useState(false);

  if (!open) return null;

  const platform = calendarService.getPlatform();
  const calendarLabel = platform === 'ios' ? 'Apple Calendar' : platform === 'android' ? 'Google Calendar' : 'Calendar';

  const handleConnectAndAdd = async () => {
    setConnecting(true);
    const granted = await calendarService.requestPermission();
    if (granted) {
      localStorage.setItem('calendar_connected', 'true');
      await syncCreate(itemType, itemId, eventPayload);
    }
    setConnecting(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-surf)',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr-s)' }} />
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--space-4) var(--space-2)' }}>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-surf-2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-t2)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-acc) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-acc)',
          }}>
            <CalendarDays size={28} />
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', padding: '0 var(--space-6) var(--space-5)' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'var(--text-xl)', color: 'var(--color-t1)',
            margin: '0 0 var(--space-2)', letterSpacing: '-0.01em',
          }}>
            Add to your calendar?
          </h3>
          {eventSummary && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
              color: 'var(--color-t2)', margin: 0, lineHeight: 1.5,
            }}>
              {eventSummary}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div style={{ padding: '0 var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button
            onClick={handleConnectAndAdd}
            disabled={connecting}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 'var(--radius-full)',
              border: 'none', background: 'var(--color-acc)',
              color: '#fff', fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: 'var(--text-sm)',
              cursor: connecting ? 'not-allowed' : 'pointer',
              opacity: connecting ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(22,212,106,0.25)',
            }}
          >
            {connecting ? 'Connecting…' : `Connect ${calendarLabel} & Add`}
          </button>
          <button
            onClick={onClose}
            disabled={connecting}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--color-bdr)',
              background: 'transparent',
              color: 'var(--color-t2)', fontFamily: 'var(--font-body)',
              fontWeight: 600, fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
