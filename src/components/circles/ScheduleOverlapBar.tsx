import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvailRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Slot {
  label: string;        // "Mon Eve"
  dayOfWeek: number;
  startHour: number;
  endHour: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOTS: Slot[] = [
  { label: 'Mon AM',  dayOfWeek: 1, startHour: 6,  endHour: 12 },
  { label: 'Mon PM',  dayOfWeek: 1, startHour: 12, endHour: 17 },
  { label: 'Mon Eve', dayOfWeek: 1, startHour: 17, endHour: 22 },
  { label: 'Tue AM',  dayOfWeek: 2, startHour: 6,  endHour: 12 },
  { label: 'Tue PM',  dayOfWeek: 2, startHour: 12, endHour: 17 },
  { label: 'Tue Eve', dayOfWeek: 2, startHour: 17, endHour: 22 },
  { label: 'Wed AM',  dayOfWeek: 3, startHour: 6,  endHour: 12 },
  { label: 'Wed PM',  dayOfWeek: 3, startHour: 12, endHour: 17 },
  { label: 'Wed Eve', dayOfWeek: 3, startHour: 17, endHour: 22 },
  { label: 'Thu AM',  dayOfWeek: 4, startHour: 6,  endHour: 12 },
  { label: 'Thu PM',  dayOfWeek: 4, startHour: 12, endHour: 17 },
  { label: 'Thu Eve', dayOfWeek: 4, startHour: 17, endHour: 22 },
  { label: 'Fri AM',  dayOfWeek: 5, startHour: 6,  endHour: 12 },
  { label: 'Fri PM',  dayOfWeek: 5, startHour: 12, endHour: 17 },
  { label: 'Fri Eve', dayOfWeek: 5, startHour: 17, endHour: 22 },
  { label: 'Sat AM',  dayOfWeek: 6, startHour: 6,  endHour: 12 },
  { label: 'Sat PM',  dayOfWeek: 6, startHour: 12, endHour: 22 },
  { label: 'Sun AM',  dayOfWeek: 0, startHour: 6,  endHour: 12 },
  { label: 'Sun PM',  dayOfWeek: 0, startHour: 12, endHour: 22 },
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function slotActive(avail: AvailRow[], slot: Slot): boolean {
  return avail.some(
    (r) =>
      r.day_of_week === slot.dayOfWeek &&
      timeToMinutes(r.start_time) < slot.endHour * 60 &&
      timeToMinutes(r.end_time) > slot.startHour * 60,
  );
}

interface Props {
  myUserId: string;
  otherUserId: string;
  otherName: string;
}

export function ScheduleOverlapBar({ myUserId, otherUserId, otherName }: Props) {
  const [myAvail, setMyAvail] = useState<AvailRow[]>([]);
  const [theirAvail, setTheirAvail] = useState<AvailRow[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from('availability').select('day_of_week,start_time,end_time').eq('user_id', myUserId),
      supabase.from('availability').select('day_of_week,start_time,end_time').eq('user_id', otherUserId),
    ]).then(([me, them]) => {
      if (cancelled) return;
      setMyAvail((me.data ?? []) as AvailRow[]);
      setTheirAvail((them.data ?? []) as AvailRow[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [myUserId, otherUserId]);

  // Only show slots where at least one person is free
  const visibleSlots = SLOTS.filter(
    (s) => slotActive(myAvail, s) || slotActive(theirAvail, s),
  );

  if (!loading && visibleSlots.length === 0) return null;

  return (
    <div style={{
      background: 'var(--color-surf)',
      borderBottom: '1px solid var(--color-bdr)',
      flexShrink: 0,
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <Clock size={13} style={{ color: 'var(--color-acc)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-t2)',
          flex: 1, textAlign: 'left',
        }}>
          Schedule Overlap
        </span>
        {expanded
          ? <ChevronUp size={14} style={{ color: 'var(--color-t3)' }} />
          : <ChevronDown size={14} style={{ color: 'var(--color-t3)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 12px' }}>
          {loading ? (
            <div style={{ height: 24, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--color-acc)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* Pill rows */}
              <div className="hide-scrollbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {visibleSlots.map((slot) => {
                  const mine = slotActive(myAvail, slot);
                  const theirs = slotActive(theirAvail, slot);
                  const both = mine && theirs;

                  let bg: string, border: string, color: string;
                  if (both) {
                    bg = 'color-mix(in srgb, var(--color-acc) 18%, transparent)';
                    border = 'var(--color-acc)';
                    color = 'var(--color-acc)';
                  } else if (mine) {
                    bg = 'rgba(100,149,237,0.12)';
                    border = 'rgba(100,149,237,0.5)';
                    color = 'rgb(100,149,237)';
                  } else {
                    bg = 'rgba(200,150,80,0.10)';
                    border = 'rgba(200,150,80,0.4)';
                    color = 'rgb(200,150,80)';
                  }

                  return (
                    <span
                      key={slot.label}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 999,
                        border: `1px solid ${border}`,
                        background: bg, color,
                        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {slot.label}
                      {both && <span style={{ fontSize: 11 }}>✓</span>}
                    </span>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Legend dot="var(--color-acc)" label="Both free" />
                <Legend dot="rgb(100,149,237)" label="You" />
                <Legend dot="rgb(200,150,80)" label={otherName.split(' ')[0]} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)' }}>
        {label}
      </span>
    </div>
  );
}

export { DAY_LABELS };
