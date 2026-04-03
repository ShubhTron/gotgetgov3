import { MessageCircle, Users, Radio, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComposeMenuProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onNewBroadcast: () => void;
}

const OPTIONS = [
  {
    key: 'chat',
    label: 'New Chat',
    description: 'Message someone directly',
    icon: MessageCircle,
    iconColor: '#16a34a',
    iconBg: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.12) 100%)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  {
    key: 'group',
    label: 'New Group',
    description: 'Chat with multiple people',
    icon: Users,
    iconColor: '#0ea5e9',
    iconBg: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(99,102,241,0.12) 100%)',
    borderColor: 'rgba(14,165,233,0.15)',
  },
  {
    key: 'broadcast',
    label: 'New Broadcast',
    description: 'Send to your followers',
    icon: Radio,
    iconColor: '#a855f7',
    iconBg: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(236,72,153,0.12) 100%)',
    borderColor: 'rgba(168,85,247,0.15)',
  },
];

export function ComposeMenu({ open, onClose, onNewChat, onNewGroup, onNewBroadcast }: ComposeMenuProps) {
  const handlers: Record<string, () => void> = {
    chat:      onNewChat,
    group:     onNewGroup,
    broadcast: onNewBroadcast,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'var(--color-surf)',
              borderRadius: '24px 24px 0 0',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 16px',
            }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, fontWeight: 800,
                  color: 'var(--color-t1)',
                  margin: 0, letterSpacing: '-0.3px',
                }}>
                  New Message
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13, color: 'var(--color-t3)',
                  margin: '2px 0 0', fontWeight: 400,
                }}>
                  Start a conversation
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1.5px solid var(--color-bdr)',
                  background: 'var(--color-surf-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--color-t2)', flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-bdr)', margin: '0 20px' }} />

            {/* Options */}
            <div style={{ padding: '8px 0' }}>
              {OPTIONS.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <div key={opt.key}>
                    <button
                      onClick={() => { handlers[opt.key](); onClose(); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: 16, padding: '14px 20px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                        background: opt.iconBg,
                        border: `1.5px solid ${opt.borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={24} color={opt.iconColor} strokeWidth={1.8} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 16, fontWeight: 600,
                          color: 'var(--color-t1)', margin: 0,
                        }}>
                          {opt.label}
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 13, color: 'var(--color-t3)',
                          margin: '2px 0 0', fontWeight: 400,
                        }}>
                          {opt.description}
                        </p>
                      </div>

                      {/* Chevron */}
                      <ChevronRight size={18} color="var(--color-t3)" strokeWidth={2} />
                    </button>

                    {/* Divider between rows (not after last) */}
                    {i < OPTIONS.length - 1 && (
                      <div style={{ height: 1, background: 'var(--color-bdr)', margin: '0 20px 0 88px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
