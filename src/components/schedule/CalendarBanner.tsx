import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { calendarService } from '@/lib/calendar-service';

interface CalendarBannerProps {
  onConnected: () => void;
}

export function CalendarBanner({ onConnected }: CalendarBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('calendar_banner_dismissed') === 'true'
  );
  const [connecting, setConnecting] = useState(false);

  if (localStorage.getItem('calendar_connected') === 'true') return null;
  if (dismissed) return null;

  const handleConnect = async () => {
    setConnecting(true);
    const granted = await calendarService.requestPermission();
    setConnecting(false);
    if (granted) {
      localStorage.setItem('calendar_connected', 'true');
      onConnected();
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('calendar_banner_dismissed', 'true');
    setDismissed(true);
  };

  const platform = calendarService.getPlatform();
  const label = platform === 'ios' ? 'Apple Calendar' : platform === 'android' ? 'Google Calendar' : 'Calendar';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '12px var(--space-4)',
        margin: '0 var(--space-4) var(--space-3)',
        borderRadius: 'var(--radius-xl)',
        background: 'color-mix(in srgb, var(--color-acc) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-acc) 25%, transparent)',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'color-mix(in srgb, var(--color-acc) 18%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-acc)',
        }}
      >
        <CalendarDays size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: 'var(--text-sm)', color: 'var(--color-t1)',
          margin: 0, lineHeight: 1.3,
        }}>
          Sync matches to {label}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
          color: 'var(--color-t2)', margin: 0, lineHeight: 1.4,
        }}>
          Auto-add confirmed matches to your calendar
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'var(--color-acc)',
          color: '#fff',
          fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: 'var(--text-xs)',
          cursor: connecting ? 'not-allowed' : 'pointer',
          opacity: connecting ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {connecting ? 'Connecting…' : 'Connect'}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0, width: 28, height: 28,
          borderRadius: '50%', border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-t3)',
          padding: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
