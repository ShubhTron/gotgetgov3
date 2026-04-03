import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchProposalPayload } from '../../types/circles';

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEM_H = 54;
const HOURS   = Array.from({ length: 24 }, (_, i) => i);       // 0 – 23
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function hourToTimeOfDay(h: number): MatchProposalPayload['timeOfDay'] {
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getNext14Days() {
  const days: Array<{ iso: string; num: number; day: string; month: string }> = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      iso:   d.toISOString().slice(0, 10),
      num:   d.getDate(),
      day:   d.toLocaleDateString([], { weekday: 'short' }),
      month: d.toLocaleDateString([], { month: 'short', year: 'numeric' }),
    });
  }
  return days;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onPropose: (payload: Omit<MatchProposalPayload, 'status' | 'proposedBy'>) => void;
  myUserId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SuggestTimeSheet({ open, onClose, onPropose }: Props) {
  const days = getNext14Days();
  const [selectedDay, setSelectedDay] = useState(days[0].iso);
  const [hour,   setHour]   = useState(9);
  const [minute, setMinute] = useState(0);
  const [location, setLocation] = useState('');

  const selectedDayData = days.find(d => d.iso === selectedDay) ?? days[0];

  function handlePropose() {
    onPropose({
      date:       selectedDay,
      timeOfDay:  hourToTimeOfDay(hour),
      location:   location.trim() || undefined,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1101,
              background: 'var(--color-surf)',
              borderRadius: '24px 24px 0 0',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              maxHeight: '90dvh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-bdr)', margin: '0 auto 20px' }} />
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }} className="hide-scrollbar">

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 800,
                color: 'var(--color-t1)',
                margin: '0 0 28px',
                letterSpacing: '-0.4px',
              }}>
                Suggest a Time
              </h2>

              {/* ── PICK DATE ───────────────────────────────────── */}
              <p style={labelStyle}>Pick Date</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)', fontWeight: 500, margin: '0 0 12px' }}>
                {selectedDayData.month}
              </p>

              {/* Date strip */}
              <div
                className="hide-scrollbar"
                style={{ display: 'flex', gap: 2, overflowX: 'scroll', WebkitOverflowScrolling: 'touch' as never, paddingBottom: 20, touchAction: 'pan-x' }}
              >
                {days.map((d) => {
                  const sel = d.iso === selectedDay;
                  return (
                    <button
                      key={d.iso}
                      onClick={() => setSelectedDay(d.iso)}
                      style={{ flexShrink: 0, width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0 6px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: sel ? '2px solid var(--color-acc)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: sel ? 700 : 400, color: sel ? 'var(--color-acc)' : 'var(--color-t1)', transition: 'color 0.15s' }}>
                          {d.num}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: sel ? 'var(--color-acc)' : 'transparent', letterSpacing: '0.03em', transition: 'color 0.15s', userSelect: 'none' }}>
                        {d.day}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── PICK TIME ───────────────────────────────────── */}
              <p style={labelStyle}>Pick Time</p>
              <TimePickerDrum
                hour={hour}   onHourChange={setHour}
                minute={minute} onMinuteChange={setMinute}
              />

              {/* ── LOCATION ────────────────────────────────────── */}
              <p style={{ ...labelStyle, marginTop: 20 }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Location (optional)
              </p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Tennis Club"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px', borderRadius: 12,
                  border: '1.5px solid var(--color-bdr)',
                  background: 'var(--color-surf-2)',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--color-t1)', outline: 'none',
                  marginBottom: 28,
                }}
              />
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={onClose}
                style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
              >
                back
              </button>
              <button
                onClick={handlePropose}
                style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--color-acc)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px color-mix(in srgb, var(--color-acc) 40%, transparent)' }}
              >
                <ChevronRight size={24} color="#fff" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Two-column drum roll (Hr / Min) ──────────────────────────────────────────

function TimePickerDrum({
  hour, minute, onHourChange, onMinuteChange,
}: {
  hour: number; minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--color-surf-2)',
      borderRadius: 16,
      height: ITEM_H * 3,
      padding: '0 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Selection band */}
      <div style={{
        position: 'absolute',
        top: ITEM_H, left: 0, right: 0, height: ITEM_H,
        borderTop: '1px solid var(--color-bdr)',
        borderBottom: '1px solid var(--color-bdr)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Top fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, var(--color-surf-2) 10%, transparent)', pointerEvents: 'none', zIndex: 3 }} />
      {/* Bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, var(--color-surf-2) 10%, transparent)', pointerEvents: 'none', zIndex: 3 }} />

      {/* Hours drum */}
      <SingleDrum
        values={HOURS}
        selected={hour}
        onChange={onHourChange}
        format={(h) => String(h)}
      />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--color-t3)', marginLeft: 10, flexShrink: 0, position: 'relative', zIndex: 4 }}>
        Hr
      </span>

      <div style={{ flex: 1 }} />

      {/* Minutes drum */}
      <SingleDrum
        values={MINUTES}
        selected={minute}
        onChange={onMinuteChange}
        format={(m) => String(m).padStart(2, '0')}
      />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--color-t3)', marginLeft: 10, flexShrink: 0, position: 'relative', zIndex: 4 }}>
        Min
      </span>
    </div>
  );
}

// ── Single scroll drum column ─────────────────────────────────────────────────

function SingleDrum({
  values, selected, onChange, format,
}: {
  values: number[];
  selected: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Snap to selected on mount
  useEffect(() => {
    const idx = values.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll() {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const v = values[Math.max(0, Math.min(values.length - 1, idx))];
    if (v !== selected) onChange(v);
  }

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{
        width: 56,
        height: ITEM_H * 3,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        paddingTop: ITEM_H,
        paddingBottom: ITEM_H,
        scrollbarWidth: 'none',
        position: 'relative',
        zIndex: 2,
      } as React.CSSProperties}
    >
      {values.map((v, idx) => {
        const sel = v === selected;
        return (
          <div
            key={v}
            style={{
              height: ITEM_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scrollSnapAlign: 'center',
              cursor: 'pointer',
              // Left pipe on selected row — matches the image
              borderLeft: sel ? '2.5px solid var(--color-t2)' : '2.5px solid transparent',
              paddingLeft: 4,
            }}
            onClick={() => {
              onChange(v);
              ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
            }}
          >
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: sel ? 28 : 18,
              fontWeight: sel ? 700 : 400,
              color: sel ? 'var(--color-t1)' : 'var(--color-t3)',
              transition: 'font-size 0.15s, color 0.15s',
              lineHeight: 1,
            }}>
              {format(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared style ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11, fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-t3)',
  margin: '0 0 10px',
};
