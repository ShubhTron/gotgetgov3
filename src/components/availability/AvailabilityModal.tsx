import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TimeRangePicker, type TimeRange } from '@/components/ui/TimeRangePicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilityEntry {
  day: number;
  ranges: TimeRange[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AvailabilityModal({ isOpen, onClose }: AvailabilityModalProps) {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAvailability();
    }
  }, [isOpen, user]);

  const loadAvailability = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const entriesMap = new Map<number, TimeRange[]>();

      data.forEach((row) => {
        const existing = entriesMap.get(row.day_of_week) || [];
        entriesMap.set(row.day_of_week, [...existing, { start: row.start_time, end: row.end_time }]);
      });

      const entries: AvailabilityEntry[] = [];
      entriesMap.forEach((ranges, day) => {
        entries.push({ day, ranges });
      });

      setAvailability(entries.sort((a, b) => a.day - b.day));
    }
    setLoading(false);
  };

  const toggleDay = (dayIndex: number) => {
    setAvailability((prev) => {
      const existing = prev.find((a) => a.day === dayIndex);
      if (existing) {
        return prev.filter((a) => a.day !== dayIndex);
      }
      return [...prev, { day: dayIndex, ranges: [] }].sort((a, b) => a.day - b.day);
    });
  };

  const updateDayRanges = (dayIndex: number, ranges: TimeRange[]) => {
    setAvailability((prev) =>
      prev.map((a) => (a.day === dayIndex ? { ...a, ranges } : a))
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from('availability').delete().eq('user_id', user.id);

    const inserts: { user_id: string; day_of_week: number; start_time: string; end_time: string }[] = [];

    availability.forEach((entry) => {
      for (const range of entry.ranges) {
        inserts.push({
          user_id: user.id,
          day_of_week: entry.day,
          start_time: range.start,
          end_time: range.end,
        });
      }
    });

    if (inserts.length > 0) {
      await supabase.from('availability').insert(inserts);
    }

    setSaving(false);
    onClose();
  };

  const selectedDays = availability.sort((a, b) => a.day - b.day);

  if (!isOpen) return null;

  return (
    /* ── Overlay ─────────────────────────────────────────────────────── */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      {/* ── Sheet ───────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--color-surf)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: '1px solid var(--color-bdr)',
        }}>
          <h2 className="font-display font-bold text-lg text-t1 m-0">
            Set Availability
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-surf-2)',
              border: '1px solid var(--color-bdr)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-t2)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 20px 0', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{
                width: 32, height: 32,
                border: '2px solid var(--color-acc)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <>
              <p className="font-body text-sm text-t2 mb-5 mt-0">
                Select days you're typically available to play.
              </p>

              {/* Day selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                {DAY_ABBREV.map((day, index) => {
                  const isSelected = availability.some((a) => a.day === index);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleDay(index)}
                      className="font-body font-semibold"
                      style={{
                        width: 40, height: 40,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                        border: 'none', cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: isSelected ? 'var(--color-acc)' : 'var(--color-surf-2)',
                        color: isSelected ? '#fff' : 'var(--color-t2)',
                        boxShadow: isSelected ? '0 2px 8px rgba(22,212,106,0.3)' : 'none',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time ranges per day */}
              {selectedDays.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {selectedDays.map((entry) => (
                    <TimeRangePicker
                      key={entry.day}
                      dayLabel={DAYS[entry.day]}
                      ranges={entry.ranges}
                      onChange={(ranges) => updateDayRanges(entry.day, ranges)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', gap: 10,
          borderTop: '1px solid var(--color-bdr)',
          background: 'var(--color-surf)',
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-body font-bold text-sm"
            style={{
              width: '100%', height: 50,
              borderRadius: 'var(--radius-full)',
              background: saving ? 'var(--color-t3)' : 'var(--color-acc)',
              border: 'none', cursor: saving ? 'default' : 'pointer',
              color: '#fff',
              letterSpacing: '0.04em',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(22,212,106,0.3)',
              transition: 'opacity 0.15s',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={onClose}
            className="font-body font-semibold text-sm"
            style={{
              width: '100%', height: 46,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              border: '1px solid var(--color-bdr)',
              cursor: 'pointer',
              color: 'var(--color-t2)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
