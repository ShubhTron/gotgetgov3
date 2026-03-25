import { X, Swords, CalendarPlus, Trophy, Users, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CreateMenuItemId) => void;
}

export type CreateMenuItemId = 'match' | 'event' | 'competition' | 'circle' | 'announcement';

const menuItems: { id: CreateMenuItemId; label: string; description: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'match',        label: 'Match',             description: 'Request a match with a player',        icon: Swords },
  { id: 'event',        label: 'Event',             description: 'Create an open play or meetup',         icon: CalendarPlus },
  { id: 'competition',  label: 'Competition',       description: 'Start a league, tournament, or ladder', icon: Trophy },
  { id: 'circle',       label: 'Circle / Team',     description: 'Create a group or doubles pair',        icon: Users },
  { id: 'announcement', label: 'Announcement',      description: 'Post to your club or circle',           icon: Megaphone },
];

// Named type alias to fix shadowing lint issue
type CreateMenuItem = typeof menuItems[0];

export function CreateMenu({ isOpen, onClose, onSelect }: CreateMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Mobile sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
            style={{
              background: 'var(--color-surf)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid var(--color-bdr)',
              maxHeight: '90dvh', overflow: 'hidden',
              paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr-s)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--color-t1)', letterSpacing: '-0.02em' }}>
                Create
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t2)', padding: 4 }} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '0 12px' }}>
              {menuItems.map((item) => (
                <CreateMenuItemButton
                  key={item.id}
                  item={item}
                  onClick={() => { onSelect(item.id); onClose(); }}
                />
              ))}
            </div>
          </motion.div>

          {/* Desktop popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="hidden lg:block fixed z-50"
            style={{
              top: 68, right: 20,
              background: 'var(--color-surf)',
              border: '1px solid var(--color-bdr)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              width: 320, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-bdr)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--color-t1)', letterSpacing: '-0.02em' }}>
                Create
              </span>
            </div>
            <div style={{ padding: 8 }}>
              {menuItems.map((item) => (
                <CreateMenuItemButton
                  key={item.id}
                  item={item}
                  onClick={() => { onSelect(item.id); onClose(); }}
                />
              ))}
            </div>
          </motion.div>

          {/* Desktop backdrop */}
          <div className="hidden lg:block fixed inset-0 z-40" onClick={onClose} />
        </>
      )}
    </AnimatePresence>
  );
}

function CreateMenuItemButton({ item, onClick }: { item: CreateMenuItem; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn('w-full text-left transition-colors duration-100')}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 8px', borderRadius: 12,
        background: 'none', border: 'none', cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--color-acc-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} strokeWidth={2} style={{ color: 'var(--color-acc)' } as React.CSSProperties} />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)', marginBottom: 2 }}>
          {item.label}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)' }}>
          {item.description}
        </p>
      </div>
    </button>
  );
}
