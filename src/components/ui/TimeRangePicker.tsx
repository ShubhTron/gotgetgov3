import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Clock, ChevronDown } from 'lucide-react';

export interface TimeRange {
  start: string;
  end: string;
}

interface TimeRangePickerProps {
  dayLabel: string;
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
  className?: string;
}

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

function TimeDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const reposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      }
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selected) selected.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  };

  return (
    <div style={{ flex: 1 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 10,
          border: `1px solid ${open ? 'var(--color-acc)' : 'var(--color-bdr)'}`,
          background: 'var(--color-surf)',
          color: 'var(--color-t1)',
          fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        }}
      >
        <span>{formatTime(value)}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && createPortal(
        <div
          ref={listRef}
          style={{
            position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999,
            background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
            borderRadius: 12, overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          {options.map(t => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                data-selected={isSelected}
                onClick={() => { onChange(t); setOpen(false); }}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: isSelected ? 'var(--color-acc-bg)' : 'transparent',
                  border: 'none', color: isSelected ? 'var(--color-acc)' : 'var(--color-t2)',
                  fontFamily: 'var(--font-body)', fontSize: '0.88rem',
                  fontWeight: isSelected ? 700 : 500, cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {formatTime(t)}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export function TimeRangePicker({ dayLabel, ranges, onChange }: TimeRangePickerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newStart, setNewStart] = useState('18:00');
  const [newEnd, setNewEnd] = useState('20:00');

  const addRange = () => {
    if (newStart && newEnd && newStart < newEnd) {
      onChange([...ranges, { start: newStart, end: newEnd }]);
      setIsAdding(false);
      setNewStart('18:00');
      setNewEnd('20:00');
    }
  };

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  const getEndTimeOptions = (start: string) => {
    const startIndex = TIME_OPTIONS.indexOf(start);
    return TIME_OPTIONS.slice(startIndex + 1);
  };

  const handleStartChange = (v: string) => {
    setNewStart(v);
    if (v >= newEnd) {
      const opts = getEndTimeOptions(v);
      if (opts.length > 0) setNewEnd(opts[0]);
    }
  };

  return (
    <div style={{
      padding: '18px 20px',
      background: 'var(--color-surf)',
      border: '1px solid var(--color-bdr)',
      borderRadius: 16,
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ranges.length > 0 || isAdding ? 12 : 0 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-t1)' }}>
          {dayLabel}
        </span>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-acc)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 0' }}
          >
            <Plus size={15} />
            Add time
          </button>
        )}
      </div>

      {/* Time chips */}
      {ranges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: isAdding ? 12 : 0 }}>
          {ranges.map((range, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 9px', background: 'var(--color-acc-bg)', border: '1px solid var(--color-acc)', borderRadius: 6, color: 'var(--color-acc)', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Clock size={13} style={{ opacity: 0.7 }} />
              <span>{formatTime(range.start)} - {formatTime(range.end)}</span>
              <button type="button" onClick={() => removeRange(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--color-acc)', opacity: 0.6, marginLeft: 2 }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-t3)', marginBottom: 6 }}>From</label>
              <TimeDropdown value={newStart} options={TIME_OPTIONS.slice(0, -1)} onChange={handleStartChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-t3)', marginBottom: 6 }}>To</label>
              <TimeDropdown value={newEnd} options={getEndTimeOptions(newStart)} onChange={setNewEnd} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)', color: 'var(--color-t2)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={addRange} style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: 'var(--color-acc)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
