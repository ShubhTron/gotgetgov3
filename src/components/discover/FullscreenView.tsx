/**
 * FullscreenView Component
 * Fullscreen discovery mode with swipe-off animations for accept/reject/rewind.
 */

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { type ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { Player } from '../../types/discover';

export interface FullscreenViewProps {
  player: Player;
  isActive: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onRewind: () => void;
  onExit: () => void;
  canRewind: boolean;
  zIndex?: number;
  header?: ReactNode;
  children?: ReactNode;
  // Sort mode
  sortMode?: 'forYou' | 'nearby';
  onSortModeChange?: (mode: 'forYou' | 'nearby') => void;
  // Filter sheet — open distance sheet by default from fullscreen
  onOpenFilters?: () => void;
}

const EXPANSION_SPRING = { stiffness: 300, damping: 30, duration: 0.4 };
const SWIPE_THRESHOLD = 100;
const SCREEN_W = typeof window !== 'undefined' ? window.innerWidth : 400;

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#4ade80',
  intermediate: '#facc15',
  advanced: '#fb923c',
  expert: '#f87171',
  professional: '#c084fc',
};

export function FullscreenView({
  player,
  isActive,
  onSwipeRight,
  onSwipeLeft,
  onRewind,
  onExit,
  canRewind,
  zIndex = 101,
  children,
  sortMode = 'forYou',
  onSortModeChange,
  onOpenFilters,
}: FullscreenViewProps) {
  const isInteractive = zIndex >= 101;

  const scrollY = useMotionValue(0);
  const [showDetails, setShowDetails] = useState(false);
  const DETAILS_THRESHOLD = 80;

  const cardInfoOpacity = useTransform(scrollY, [0, DETAILS_THRESHOLD], [1, 0]);
  const overlayOpacity = useTransform(scrollY, [0, DETAILS_THRESHOLD], [0, 1]);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setShowDetails(v >= DETAILS_THRESHOLD));
    return unsub;
  }, [scrollY]);

  // Pull-up-to-exit: y motion value for the whole card sliding down
  const y = useMotionValue(0);
  const PULL_UP_THRESHOLD = -80;
  const pullUpStartY = useRef<number | null>(null);
  const scrollElRef = useRef<HTMLDivElement | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-SCREEN_W, 0, SCREEN_W], [-18, 0, 18]);
  const scale = useTransform(x, [-SCREEN_W, 0, SCREEN_W], [1.05, 1, 1.05]);
  const [isAnimating, setIsAnimating] = useState(false);

  const acceptOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const flyOff = useCallback(
    (direction: 'left' | 'right', callback: () => void) => {
      if (isAnimating) return;
      setIsAnimating(true);
      const target = direction === 'right' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
      animate(x, target, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => {
          callback();
          x.set(0);
          setIsAnimating(false);
        },
      });
    },
    [isAnimating, x]
  );

  const flyIn = useCallback(
    (callback: () => void) => {
      if (isAnimating) return;
      setIsAnimating(true);
      x.set(-SCREEN_W * 1.5);
      animate(x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => {
          callback();
          setIsAnimating(false);
        },
      });
    },
    [isAnimating, x]
  );

  const handleAccept = useCallback(() => flyOff('right', onSwipeRight), [flyOff, onSwipeRight]);
  const handleReject = useCallback(() => flyOff('left', onSwipeLeft), [flyOff, onSwipeLeft]);
  const handleRewind = useCallback(() => flyIn(onRewind), [flyIn, onRewind]);

  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive || isAnimating) return;
    const t = e.touches[0];
    setSwipeStartX(t.clientX);
    setSwipeStartY(t.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractive || swipeStartX === null || swipeStartY === null || isAnimating) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStartX;
    const dy = t.clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dx) > 10) {
      x.set(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!isInteractive || swipeStartX === null) return;
    const current = x.get();
    setSwipeStartX(null);
    setSwipeStartY(null);
    if (current > SWIPE_THRESHOLD) {
      flyOff('right', onSwipeRight);
    } else if (current < -SWIPE_THRESHOLD) {
      flyOff('left', onSwipeLeft);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  const handleOverlayTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive) return;
    const el = scrollElRef.current;
    if (!el || el.scrollTop > 0) return;
    pullUpStartY.current = e.touches[0].clientY;
  };

  const handleOverlayTouchMove = (e: React.TouchEvent) => {
    if (!isInteractive || pullUpStartY.current === null) return;
    const el = scrollElRef.current;
    if (!el || el.scrollTop > 0) {
      pullUpStartY.current = null;
      return;
    }
    const startY = pullUpStartY.current;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dy = currentY - startY;
    const dx = Math.abs(currentX - (swipeStartX ?? currentX));
    if (dy < -10 && Math.abs(dy) > dx * 1.5) {
      y.set(Math.max(dy * 0.4, -120));
    }
  };

  const handleOverlayTouchEnd = () => {
    if (!isInteractive) return;
    const currentY = y.get();
    pullUpStartY.current = null;
    if (currentY <= PULL_UP_THRESHOLD) {
      animate(y, typeof window !== 'undefined' ? window.innerHeight : 800, {
        type: 'spring',
        stiffness: 280,
        damping: 28,
        onComplete: () => {
          y.set(0);
          onExit();
        },
      });
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  if (!isActive) return null;

  const firstName = player.fullName.split(' ')[0];
  const displayName = firstName.length > 12 ? firstName.substring(0, 11) + '\u2026' : firstName;
  const levelColor = LEVEL_COLORS[player.level?.toLowerCase()] || 'var(--color-acc)';
  const levelLabel = player.level
    ? player.level.charAt(0).toUpperCase() + player.level.slice(1).toLowerCase()
    : '';

  return (
    <motion.div
      className="fixed inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={EXPANSION_SPRING}
      style={{ height: '100vh', width: '100vw', zIndex, overflow: 'hidden', pointerEvents: isInteractive ? 'auto' : 'none', y }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="absolute inset-0"
        style={isInteractive ? { x, rotate, scale, transformOrigin: 'center bottom', background: '#050a14' } : { background: '#050a14' }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: player.avatarUrl
              ? `url(${player.avatarUrl})`
              : 'linear-gradient(135deg, rgba(22,212,106,0.3) 0%, rgba(0,40,120,0.6) 100%)',
          }}
        />

        {/* Bottom gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(5,10,20,0.5) 50%, rgba(5,10,20,0.95) 100%)' }}
        />

        {/* Accept indicator */}
        {isInteractive && (
          <motion.div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: acceptOpacity, zIndex: 70 }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: 'var(--color-acc)', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 0 32px rgba(22,212,106,0.6)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Reject indicator */}
        {isInteractive && (
          <motion.div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: rejectOpacity, zIndex: 70 }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '3px solid rgba(255,255,255,0.3)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Stage 2: card info */}
        <motion.div
          className="absolute left-0 right-0 px-6 pb-6"
          style={{ bottom: '140px', zIndex: 63, opacity: cardInfoOpacity, pointerEvents: showDetails ? 'none' : 'auto' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {isInteractive && (
            <motion.div
              className="flex flex-col items-center gap-1 mb-4"
              animate={{ opacity: [1, 0.4, 1], y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" style={{ color: 'rgba(200,218,255,0.5)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,218,255,0.45)' }}>
                Scroll for more
              </span>
            </motion.div>
          )}

          {/* Level badge */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(5,10,20,0.5)', backdropFilter: 'blur(12px)', border: `1px solid ${levelColor}55`, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: levelColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: levelColor, boxShadow: `0 0 6px ${levelColor}` }} />
              {levelLabel}
            </span>
          </div>

          {/* Name */}
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2.8rem, 13vw, 4rem)', lineHeight: 1, letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'white', marginBottom: '6px' }}>
            {displayName}
          </h3>

          {/* Rating */}
          {(player.rating || player.eloRating) && (
            <div className="mb-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.85rem', color: 'rgba(200,218,255,0.5)', letterSpacing: '0.04em' }}>
              {player.rating ? `${player.ratingSystem || 'Rating'} ${player.rating}` : `ELO ${player.eloRating}`}
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(200,218,255,0.5)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.9rem', color: 'rgba(200,218,255,0.7)' }}>
              {player.locationCity && player.locationCountry
                ? `${player.locationCity}, ${player.locationCountry}`
                : player.locationCity || player.locationCountry || 'Location not set'}
            </span>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: `${player.distance} mi`, icon: <MapPin className="w-3.5 h-3.5" /> },
              { label: levelLabel },
              { label: 'Active', icon: <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block' }} /> },
            ].map((pill, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'white' }}>
                {pill.icon}
                {pill.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Stage 3: scrollable details overlay */}
        <div
          ref={scrollElRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          style={{ zIndex: 65, pointerEvents: isInteractive ? 'auto' : 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          onTouchStart={handleOverlayTouchStart}
          onTouchMove={handleOverlayTouchMove}
          onTouchEnd={handleOverlayTouchEnd}
          onScroll={(e) => {
            if (!isInteractive) return;
            const el = e.currentTarget;
            scrollY.set(el.scrollTop);
          }}
        >
          {/* Spacer that pushes content below the fold */}
          <div style={{ height: '100vh', flexShrink: 0 }} />

          {/* Pull-up hint */}
          <motion.div
            className="flex flex-col items-center py-2 pointer-events-none sticky top-0"
            style={{ opacity: useTransform(y, [0, -40], [0, 1]), zIndex: 66 }}
          >
            <ChevronUp className="w-5 h-5" style={{ color: 'rgba(200,218,255,0.6)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,218,255,0.5)' }}>
              Release to exit
            </span>
          </motion.div>

          {/* Actual details content */}
          <motion.div style={{ opacity: overlayOpacity, backgroundColor: 'rgba(5,10,20,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
            <div style={{ paddingTop: '16px', paddingBottom: '160px', minHeight: '100vh' }}>
              {children}
            </div>
          </motion.div>
        </div>

        {/* Visual blur overlay — purely decorative, no pointer events */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(5,10,20,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', opacity: overlayOpacity, zIndex: 64 }}
        />
      </motion.div>

      {/* Header & action buttons */}
      {isInteractive && (
        <>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe" style={{ height: '56px', zIndex: 102 }}>
            <button onClick={onExit} className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
              aria-label="Back">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSortModeChange?.('forYou')}
                className="px-5 py-2 rounded-full text-white transition-all active:scale-95"
                style={{
                  background: sortMode === 'forYou' ? 'var(--color-acc)' : 'rgba(255,255,255,0.12)',
                  backdropFilter: sortMode === 'forYou' ? undefined : 'blur(12px)',
                  border: sortMode === 'forYou' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                FOR YOU
              </button>
              <button
                onClick={() => onSortModeChange?.('nearby')}
                className="px-5 py-2 rounded-full text-white transition-all active:scale-95"
                style={{
                  background: sortMode === 'nearby' ? 'var(--color-acc)' : 'rgba(255,255,255,0.12)',
                  backdropFilter: sortMode === 'nearby' ? undefined : 'blur(12px)',
                  border: sortMode === 'nearby' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                NEARBY
              </button>
            </div>

            <button
              onClick={onOpenFilters}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Bottom action bar */}
          <div className="absolute left-0 right-0 pb-safe" style={{ bottom: '70px', zIndex: 103 }}>
            <div className="mx-auto max-w-md px-4">
              <div className="flex items-center justify-center gap-4 px-3 py-3"
                style={{ background: 'rgba(5,10,20,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9999px' }}>
                {/* Reject */}
                <button onClick={handleReject} disabled={isAnimating}
                  className="flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                  style={{ width: '130px', height: '54px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
                  aria-label="Pass">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Rewind */}
                <button onClick={handleRewind} disabled={!canRewind || isAnimating}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  aria-label="Rewind">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  </svg>
                </button>

                {/* Accept */}
                <button onClick={handleAccept} disabled={isAnimating}
                  className="flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                  style={{ width: '130px', height: '54px', borderRadius: '9999px', background: 'var(--color-acc)', boxShadow: '0 0 24px rgba(22,212,106,0.4)' }}
                  aria-label="Connect">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
