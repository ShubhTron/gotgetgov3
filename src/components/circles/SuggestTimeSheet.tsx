import { useState } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchProposalPayload } from '../../types/circles';

const TIME_SLOTS: { id: MatchProposalPayload['timeOfDay']; label: string; sub: string }[] = [
  { id: 'morning',   label: 'Morning',   sub: '6 AM – 12 PM' },
  { id: 'afternoon', label: 'Afternoon', sub: '12 – 5 PM'    },
  { id: 'evening',   label: 'Evening',   sub: '5 – 10 PM'    },
];

function getNext14Days(): Array<{ iso: string; label: string }> {
  const days: Array<{ iso: string; label: string }> = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = i === 0
      ? `Today, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
      : i === 1
        ? `Tomorrow, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
        : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ iso, label });
  }
  return days;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPropose: (payload: Omit<MatchProposalPayload, 'status' | 'proposedBy'>) => void;
  myUserId: string;
}

export function SuggestTimeSheet({ open, onClose, onPropose, myUserId }: Props) {
  const days = getNext14Days();
  const [selectedDay, setSelectedDay] = useState(days[0].iso);
  const [selectedTime, setSelectedTime] = useState<MatchProposalPayload['timeOfDay']>('morning');
  const [location, setLocation] = useState('');

  function handlePropose() {
    onPropose({ date: selectedDay, timeOfDay: selectedTime, location: location.trim() || undefined });
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
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              maxHeight: '85dvh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>
                  Suggest a Time
                </h2>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--color-bdr)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '0 16px', flex: 1 }} className="hide-scrollbar">
              {/* Date picker */}
              <SectionLabel icon={<Calendar size={14} />} label="Date" />
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'scroll', WebkitOverflowScrolling: 'touch' as never, paddingBottom: 16, touchAction: 'pan-x' }}>
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setSelectedDay(d.iso)}
                    style={{
                      flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                      border: '1.5px solid',
                      borderColor: selectedDay === d.iso ? 'var(--color-acc)' : 'var(--color-bdr)',
                      background: selectedDay === d.iso ? 'color-mix(in srgb, var(--color-acc) 12%, transparent)' : 'none',
                      color: selectedDay === d.iso ? 'var(--color-acc)' : 'var(--color-t1)',
                      fontFamily: 'var(--font-body)', fontSize: 13,
                      fontWeight: selectedDay === d.iso ? 700 : 400,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Time slot */}
              <SectionLabel icon={<Clock size={14} />} label="Time" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTime(t.id)}
                    style={{
                      padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: selectedTime === t.id ? 'var(--color-acc)' : 'var(--color-bdr)',
                      background: selectedTime === t.id ? 'color-mix(in srgb, var(--color-acc) 10%, transparent)' : 'none',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: selectedTime === t.id ? 'var(--color-acc)' : 'var(--color-t1)', marginBottom: 2 }}>
                      {t.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)' }}>
                      {t.sub}
                    </div>
                  </button>
                ))}
              </div>

              {/* Location */}
              <SectionLabel icon={<MapPin size={14} />} label="Location (optional)" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Tennis Club"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px', borderRadius: 12,
                  border: '1.5px solid var(--color-bdr)',
                  background: 'var(--color-surf-2)',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--color-t1)', outline: 'none',
                  marginBottom: 24,
                }}
              />
            </div>

            {/* Propose button */}
            <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
              <button
                onClick={handlePropose}
                style={{
                  width: '100%', height: 50, borderRadius: 999,
                  background: 'var(--color-acc)', border: 'none', cursor: 'pointer',
                  color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--color-acc) 35%, transparent)',
                }}
              >
                Send Proposal
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span style={{ color: 'var(--color-acc)' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--color-t2)' }}>
        {label}
      </span>
    </div>
  );
}
