/**
 * InteractionButtons Component
 *
 * Circular action buttons for card interactions with mode-aware positioning.
 * Supports both default and fullscreen modes with animated repositioning.
 */

import { motion } from 'framer-motion';
import { X, Heart, RotateCcw } from 'lucide-react';
// Capacitor haptics stub for web — falls back to navigator.vibrate if available
const ImpactStyle = { Medium: 'MEDIUM', Light: 'LIGHT', Heavy: 'HEAVY' } as const;
const Haptics = {
  impact: async (_opts?: { style?: string }) => {
    try { navigator.vibrate?.(10); } catch (_) { /* not available */ }
  },
};

export interface InteractionButtonsProps {
  mode: 'default' | 'fullscreen';
  onPass: () => void;
  onLike: () => void;
  onRewind: () => void;
  onUndo?: () => void;
  canRewind: boolean;
  canUndo?: boolean;
  disabled?: boolean;
}

export function InteractionButtons({
  mode,
  onPass,
  onLike,
  onRewind,
  onUndo,
  canRewind,
  canUndo = false,
  disabled = false,
}: InteractionButtonsProps) {
  const handleButtonTap = (callback: () => void) => {
    if (disabled) return;
    callback();
    Haptics.impact({ style: ImpactStyle.Light }).catch((error) => {
      console.debug('Haptics not available:', error);
    });
  };

  const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  };

  const containerStyle =
    mode === 'fullscreen'
      ? {
          position: 'fixed' as const,
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 50,
        }
      : {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '24px',
          paddingBottom: '8px',
        };

  return (
    <motion.div
      style={containerStyle}
      initial={false}
      animate={{ opacity: 1 }}
      transition={springTransition}
    >
      {/* Pass Button */}
      <motion.button
        onClick={() => handleButtonTap(onPass)}
        disabled={disabled}
        className="rounded-full flex items-center justify-center transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-red)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        whileTap={{ scale: disabled ? 1.0 : 1.1 }}
        whileHover={{ scale: disabled ? 1.0 : 1.05 }}
        transition={springTransition}
        initial={{ x: mode === 'default' ? 0 : -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        custom={0}
        exit={{ x: mode === 'default' ? 0 : -20, opacity: 0 }}
        aria-label="Pass"
      >
        <X className="w-8 h-8 stroke-[2.5] text-white" />
      </motion.button>

      {/* Center Button — Rewind (fullscreen) or Undo (default) */}
      {mode === 'fullscreen' ? (
        <motion.button
          onClick={() => handleButtonTap(onRewind)}
          disabled={!canRewind || disabled}
          className="rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'var(--color-surf)',
          }}
          whileHover={{ scale: disabled || !canRewind ? 1.0 : 1.05 }}
          transition={springTransition}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: !canRewind || disabled ? 0.5 : 1 }}
          custom={1}
          exit={{ y: 20, opacity: 0 }}
          aria-label="Rewind"
        >
          <RotateCcw
            className="w-6 h-6 stroke-[2.5]"
            style={{ color: 'var(--color-acc)' }}
          />
        </motion.button>
      ) : (
        canUndo &&
        onUndo && (
          <motion.button
            onClick={() => handleButtonTap(onUndo)}
            disabled={!canUndo || disabled}
            className="rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-surf)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
            whileTap={{ scale: disabled || !canUndo ? 1.0 : 1.1 }}
            whileHover={{ scale: disabled || !canUndo ? 1.0 : 1.05 }}
            transition={springTransition}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: !canUndo || disabled ? 0.5 : 1 }}
            custom={1}
            exit={{ y: 20, opacity: 0 }}
            aria-label="Undo last swipe"
          >
            <RotateCcw
              className="w-5 h-5 stroke-[2.5]"
              style={{ color: 'var(--color-acc)' }}
            />
          </motion.button>
        )
      )}

      {/* Like Button */}
      <motion.button
        onClick={() => handleButtonTap(onLike)}
        disabled={disabled}
        className="rounded-full flex items-center justify-center transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-acc)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        whileTap={{ scale: disabled ? 1.0 : 1.1 }}
        whileHover={{ scale: disabled ? 1.0 : 1.05 }}
        transition={springTransition}
        initial={{ x: mode === 'default' ? 0 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        custom={2}
        exit={{ x: mode === 'default' ? 0 : 20, opacity: 0 }}
        aria-label="Connect"
      >
        <Heart className="w-8 h-8 text-white" style={{ fill: 'white' }} />
      </motion.button>
    </motion.div>
  );
}
