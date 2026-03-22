import React from 'react';
import { motion } from 'framer-motion';
import { IconUndo, IconX, IconZap, IconHeart } from '../../design-system';

interface InteractionBarProps {
  onPass: () => void;
  onConnect: () => void;
  onUndo?: () => void;
  onFavorite?: () => void;
  canUndo?: boolean;
  isFavorited?: boolean;
  disabled?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const circleBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 9999,
  background: 'var(--color-surf)',
  border: '1px solid var(--color-bdr)',
  boxShadow: 'var(--shadow-btn)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, cursor: 'pointer',
};

export function InteractionBar({
  onPass, onConnect, onUndo, onFavorite,
  canUndo = false, isFavorited = false, disabled = false,
}: InteractionBarProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(83px + 10px)',
      left: 'var(--space-5)', right: 'var(--space-5)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Undo */}
      <motion.button
        style={{ ...circleBtn, opacity: canUndo && !disabled ? 1 : 0.38, cursor: canUndo && !disabled ? 'pointer' : 'not-allowed' }}
        whileTap={{ scale: canUndo && !disabled ? 0.92 : 1 }}
        transition={spring}
        onClick={() => { if (canUndo && !disabled) onUndo?.(); }}
        aria-label="Undo"
      >
        <IconUndo size={16} style={{ color: 'var(--color-t3)' }} />
      </motion.button>

      {/* Split pill */}
      <div style={{
        flex: 1, height: 56, borderRadius: 15, overflow: 'hidden',
        display: 'flex',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}>
        {/* Pass */}
        <motion.button
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, background: 'rgba(20,18,14,0.46)',
            border: 'none', borderRight: '1px solid rgba(255,255,255,0.10)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          whileTap={{ scale: disabled ? 1 : 0.96 }}
          transition={spring}
          onClick={() => { if (!disabled) onPass(); }}
          aria-label="Pass"
        >
          <IconX size={18} style={{ color: 'rgba(255,255,255,0.72)' }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)' as any,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            Pass
          </span>
        </motion.button>

        {/* Connect */}
        <motion.button
          style={{
            flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, background: 'rgba(8,7,5,0.88)',
            border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          whileTap={{ scale: disabled ? 1 : 0.96 }}
          transition={spring}
          onClick={() => { if (!disabled) onConnect(); }}
          aria-label="Connect"
        >
          <IconZap size={18} style={{ color: '#fff' }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-extrabold)' as any,
            color: '#fff',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
          }}>
            Connect
          </span>
        </motion.button>
      </div>

      {/* Heart */}
      <motion.button
        style={{ ...circleBtn, cursor: disabled ? 'not-allowed' : 'pointer' }}
        whileTap={{ scale: disabled ? 1 : 0.92 }}
        transition={spring}
        onClick={() => { if (!disabled) onFavorite?.(); }}
        aria-label="Favorite"
      >
        <IconHeart
          size={16} filled={isFavorited}
          style={{ color: 'var(--color-acc-dk)' }}
        />
      </motion.button>
    </div>
  );
}
