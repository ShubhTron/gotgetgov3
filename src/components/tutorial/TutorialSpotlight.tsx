import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuestTutorial, type TutorialStep } from '../../contexts/GuestTutorialContext';

// ─── Step metadata ────────────────────────────────────────────────────────────

interface StepInfo {
  step: number;
  title: string;
  body: string;
}

const STEP_META: Partial<Record<TutorialStep, StepInfo>> = {
  swipe_card:          { step: 1, title: 'Meet Emma!',           body: 'Swipe right on her card to connect.' },
  go_to_notifications: { step: 2, title: 'Check notifications',  body: 'Emma accepted! Tap the bell icon.' },
  accept_connection:   { step: 3, title: 'Accept connection',    body: 'Emma wants to connect — tap Accept!' },
  go_to_messages:      { step: 4, title: 'Send a message',       body: "Tap \"Send Message\" to start chatting." },
  emma_greeting:       { step: 5, title: 'Emma replied!',        body: 'Opening your chat with Emma…' },
  send_message:        { step: 6, title: 'Say something!',       body: 'Type and send any message to Emma.' },
  emma_accepts:        { step: 7, title: 'She accepted!',        body: 'See you at the match! 🎾' },
};

const TOTAL_STEPS = 7;
const PAD = 10; // px breathing room around target

// ─── Component ────────────────────────────────────────────────────────────────

export function TutorialSpotlight() {
  const { tutorialStep, isTutorialActive, skipTutorial, targetElements } = useGuestTutorial();
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Recompute rect on step change and on resize
  useEffect(() => {
    function compute() {
      const el = targetElements[tutorialStep as TutorialStep];
      setRect(el ? el.getBoundingClientRect() : null);
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [tutorialStep, targetElements]);

  if (!isTutorialActive) return null;
  const info = STEP_META[tutorialStep as TutorialStep];
  if (!info) return null;

  const hasTarget = !!rect;

  // Spotlight hole position
  const holeTop    = hasTarget ? rect!.top    - PAD : 0;
  const holeLeft   = hasTarget ? rect!.left   - PAD : 0;
  const holeWidth  = hasTarget ? rect!.width  + PAD * 2 : 0;
  const holeHeight = hasTarget ? rect!.height + PAD * 2 : 0;

  // Tooltip positioning logic
  // TOOLTIP_HEIGHT estimated at 120px so tooltip clears the bouncing arrow (holeTop - 36)
  const TOOLTIP_HEIGHT = 120;
  const aboveTarget = hasTarget && rect!.top - PAD > 160;
  // Large targets (e.g. swipe deck) push the tooltip off-screen below — anchor to top-right instead
  const tallTarget  = hasTarget && !aboveTarget && (holeTop + holeHeight + 12 > window.innerHeight * 0.75);

  const tooltipTop  = hasTarget
    ? tallTarget
      ? 8                                                  // top-right corner, above the card
      : aboveTarget
        ? Math.max(8, holeTop - 36 - TOOLTIP_HEIGHT - 4)  // above arrow
        : holeTop + holeHeight + 12                        // below target
    : window.innerHeight * 0.38;
  const tooltipLeft = hasTarget
    ? tallTarget
      ? window.innerWidth - 296 - 12                      // right-aligned, near screen edge
      : Math.max(16, Math.min(rect!.left + rect!.width / 2 - 140, window.innerWidth - 296))
    : 16;

  const progress = info.step / TOTAL_STEPS;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={tutorialStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* ── Dark backdrop with cutout ── */}
        {hasTarget ? (
          <div
            style={{
              position: 'fixed',
              top: holeTop,
              left: holeLeft,
              width: holeWidth,
              height: holeHeight,
              zIndex: 9998,
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.72)', pointerEvents: 'none',
            }}
          />
        )}

        {/* ── Pulsing green border ── */}
        {hasTarget && (
          <div
            style={{
              position: 'fixed',
              top: holeTop,
              left: holeLeft,
              width: holeWidth,
              height: holeHeight,
              zIndex: 9999,
              borderRadius: 14,
              border: '2px solid var(--color-acc)',
              animation: 'tutorialPulse 1.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ── Bouncing arrow (hidden for tall/full-screen targets) ── */}
        {hasTarget && !tallTarget && (
          <BouncingArrow
            cx={holeLeft + holeWidth / 2}
            aboveTarget={aboveTarget}
            holeTop={holeTop}
            holeBottom={holeTop + holeHeight}
          />
        )}

        {/* ── Tooltip card ── */}
        <motion.div
          style={{
            position: 'fixed',
            top: tooltipTop,
            left: tooltipLeft,
            width: 280,
            zIndex: 10001,
            pointerEvents: 'auto',
          }}
          initial={{ y: tallTarget ? -8 : aboveTarget ? -8 : 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 380, damping: 28 }}
        >
          <div style={{
            background: 'var(--color-surf)',
            border: '1px solid var(--color-bdr)',
            borderRadius: 18,
            padding: '14px 16px 16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.36)',
          }}>
            {/* Header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                color: 'var(--color-acc)', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {info.step} / {TOTAL_STEPS}
              </span>
              <button
                onClick={skipTutorial}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--color-t3)', textDecoration: 'underline',
                  padding: 0, lineHeight: 1,
                }}
              >
                Skip
              </button>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 3, borderRadius: 99,
              background: 'var(--color-bdr)',
              marginBottom: 10, overflow: 'hidden',
            }}>
              <motion.div
                style={{ height: '100%', background: 'var(--color-acc)', borderRadius: 99 }}
                initial={{ width: `${((info.step - 1) / TOTAL_STEPS) * 100}%` }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Title */}
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              color: 'var(--color-t1)', margin: '0 0 4px', lineHeight: 1.2,
            }}>
              {info.title}
            </p>

            {/* Body */}
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-t2)', margin: 0, lineHeight: 1.5,
            }}>
              {info.body}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ─── Bouncing arrow ───────────────────────────────────────────────────────────

function BouncingArrow({
  cx, aboveTarget, holeTop, holeBottom,
}: {
  cx: number;
  aboveTarget: boolean;
  holeTop: number;
  holeBottom: number;
}) {
  // If tooltip is above target, arrow points downward (below tooltip, above hole)
  // If tooltip is below target, arrow points upward (above tooltip, below hole)
  const top = aboveTarget ? holeTop - 36 : holeBottom + 8;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: cx - 12,
        top,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
      animate={{ y: [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {aboveTarget ? (
          // Pointing down (↓)
          <path d="M12 20 L4 8 L20 8 Z" fill="var(--color-acc)" opacity="0.9" />
        ) : (
          // Pointing up (↑)
          <path d="M12 4 L4 16 L20 16 Z" fill="var(--color-acc)" opacity="0.9" />
        )}
      </svg>
    </motion.div>
  );
}
