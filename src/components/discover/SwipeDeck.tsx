import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { IconRefreshCw } from '../../design-system';
import type { DiscoverPlayer } from '../../types/discover';
import { PlayerCard } from './PlayerCard';

interface SwipeDeckProps {
  players: DiscoverPlayer[];
  onSwipeRight: (id: string) => void;
  onSwipeLeft: (id: string) => void;
  undoId?: string | null;   // when set, re-adds this player to top
}

export interface SwipeDeckHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const SWIPE_THRESHOLD = 0.4;
const VELOCITY_THRESHOLD = 300;

function DraggableCard({
  player, onSwipeRight, onSwipeLeft, isBack,
}: {
  player: DiscoverPlayer;
  onSwipeRight: (id: string) => void;
  onSwipeLeft:  (id: string) => void;
  isBack: boolean;
}) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]);

  const threshold = window.innerWidth * 0.4;
  const connectOpacity = useTransform(x, [0, threshold], [0, 1]);
  const passOpacity    = useTransform(x, [-threshold, 0], [1, 0]);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const screenW = window.innerWidth;
    const threshold = screenW * SWIPE_THRESHOLD;
    if (info.offset.x > threshold || info.velocity.x > VELOCITY_THRESHOLD) {
      animate(x, screenW * 1.5, { duration: 0.3 }).then(() => onSwipeRight(player.id));
    } else if (info.offset.x < -threshold || info.velocity.x < -VELOCITY_THRESHOLD) {
      animate(x, -screenW * 1.5, { duration: 0.3 }).then(() => onSwipeLeft(player.id));
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [x, player.id, onSwipeRight, onSwipeLeft]);

  if (isBack) {
    return (
      <div style={{
        position: 'absolute', top: 10, right: 14, bottom: 10, left: 14,
        transform: 'scale(0.94) translateY(18px)',
        zIndex: 1, pointerEvents: 'none',
        filter: isDark ? 'brightness(0.80)' : undefined,
      }}>
        <PlayerCard player={player} scrollable={false} />
      </div>
    );
  }

  return (
    <motion.div
      style={{
        position: 'absolute', top: 10, right: 14, bottom: 10, left: 14,
        zIndex: 2, x, rotate,
        cursor: 'grab',
        touchAction: 'pan-y',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
    >
      {/* CONNECT stamp */}
      <motion.div style={{
        position: 'absolute', top: 24, left: 24, zIndex: 10,
        pointerEvents: 'none', opacity: connectOpacity,
        border: '2.5px solid var(--color-acc)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 10px',
        transform: 'rotate(-15deg)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-lg)', fontWeight: 800,
        letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
        color: 'var(--color-acc)',
      }}>
        Connect
      </motion.div>

      {/* PASS stamp */}
      <motion.div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 10,
        pointerEvents: 'none', opacity: passOpacity,
        border: '2.5px solid var(--color-red)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 10px',
        transform: 'rotate(15deg)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-lg)', fontWeight: 800,
        letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
        color: 'var(--color-red)',
      }}>
        Pass
      </motion.div>

      <PlayerCard player={player} scrollable={true} />
    </motion.div>
  );
}

export function SwipeDeck({ players, onSwipeRight, onSwipeLeft, undoId }: SwipeDeckProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Undo: remove from dismissed when undoId changes
  useEffect(() => {
    if (undoId) {
      setDismissed(prev => {
        const next = new Set(prev);
        next.delete(undoId);
        return next;
      });
    }
  }, [undoId]);

  const handleSwipeRight = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onSwipeRight(id);
  }, [onSwipeRight]);

  const handleSwipeLeft = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onSwipeLeft(id);
  }, [onSwipeLeft]);

  const visible = players.filter(p => !dismissed.has(p.id));

  if (visible.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'var(--space-4)', padding: 'var(--space-8)',
      }}>
        <IconRefreshCw size={32} style={{ color: 'var(--color-t3)' }} />
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
          fontWeight: 600, color: 'var(--color-t1)', textAlign: 'center',
        }}>
          You've seen everyone nearby
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
          color: 'var(--color-t2)', textAlign: 'center',
        }}>
          Check back soon
        </div>
        <button
          onClick={() => setDismissed(new Set())}
          style={{
            marginTop: 'var(--space-2)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            fontWeight: 600, color: 'var(--color-acc-dk)',
            background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Reset
        </button>
      </div>
    );
  }

  // Render top 2 cards (back first so front sits on top)
  const [front, back] = [visible[0], visible[1]];

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {back && (
        <DraggableCard
          key={back.id + '-back'}
          player={back}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          isBack={true}
        />
      )}
      <DraggableCard
        key={front.id}
        player={front}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        isBack={false}
      />
    </div>
  );
}
