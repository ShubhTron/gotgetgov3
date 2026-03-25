/**
 * PlayerProfilePreview Component
 *
 * Expandable profile preview with Strava-inspired design showing detailed player information.
 * Slides up from bottom with spring physics and supports dismissal by swipe down or tap outside.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  MapPin,
  Users,
  MessageCircle,
  Swords,
  User,
  X,
  Target,
} from 'lucide-react';
import type { Player } from '@/types/discover';

export interface PlayerProfilePreviewProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (playerId: string) => void;
  onChallenge: (playerId: string) => void;
  onViewFullProfile: (playerId: string) => void;
}

export function PlayerProfilePreview({
  player,
  isOpen,
  onClose,
  onMessage,
  onChallenge,
  onViewFullProfile,
}: PlayerProfilePreviewProps) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  if (!player) return null;

  const stats = {
    matchesPlayed: player.matchCompletionRate ? Math.floor(player.matchCompletionRate * 10) : 24,
    winRate: player.matchCompletionRate || 65,
    favoriteCourts: player.clubIds?.length || 3,
  };

  const playStyleTags = player.playStyle
    ? player.playStyle.split(',').map((s) => s.trim())
    : ['Competitive', 'Strategic', 'Consistent'];

  const recentActivity = [
    { type: 'match', opponent: 'John D.', result: 'Won 6-4, 6-3', date: '2 days ago' },
    { type: 'match', opponent: 'Sarah M.', result: 'Lost 4-6, 6-7', date: '5 days ago' },
    { type: 'match', opponent: 'Mike R.', result: 'Won 7-5, 6-4', date: '1 week ago' },
  ];

  const mutualConnections = player.mutualConnections || 0;
  const mutualAvatars = Array.from({ length: Math.min(mutualConnections, 5) }, (_, i) => ({
    id: `mutual-${i}`,
    name: `Connection ${i + 1}`,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
          />

          {/* Profile Preview Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto"
            style={{
              backgroundColor: 'var(--color-surf-2)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '85vh',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full" style={{ backgroundColor: 'var(--color-t3)' }} />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full transition-colors"
              style={{
                backgroundColor: 'var(--color-surf)',
                color: 'var(--color-t2)',
              }}
              aria-label="Close profile preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div
              className="overflow-y-auto px-6 pb-32"
              style={{ maxHeight: 'calc(85vh - 120px)' }}
            >
              {/* Player Header */}
              <div className="text-center mb-6">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--color-t1)', fontFamily: 'var(--font-display)' }}
                >
                  {player.fullName}
                </h2>
                <div
                  className="flex items-center justify-center gap-2 text-sm"
                  style={{ color: 'var(--color-t2)' }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{player.distance} miles away</span>
                  {player.verified && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--color-acc)' }}>Verified</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Section */}
              <section className="mb-6">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-t3)' }}
                >
                  Stats
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'var(--color-surf)', borderRadius: 8 }}
                  >
                    <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--color-acc)' }} />
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-t1)' }}>
                      {stats.matchesPlayed}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-t2)' }}>Matches</div>
                  </div>

                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'var(--color-surf)', borderRadius: 8 }}
                  >
                    <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--color-acc)' }} />
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-t1)' }}>
                      {stats.winRate}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-t2)' }}>Win Rate</div>
                  </div>

                  <div
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'var(--color-surf)', borderRadius: 8 }}
                  >
                    <MapPin className="w-5 h-5 mx-auto mb-2" style={{ color: '#FFB300' }} />
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-t1)' }}>
                      {stats.favoriteCourts}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-t2)' }}>Courts</div>
                  </div>
                </div>
              </section>

              {/* Play Style Tags */}
              <section className="mb-6">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-t3)' }}
                >
                  Play Style
                </h3>
                <div className="flex flex-wrap gap-2">
                  {playStyleTags.map((tag, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--color-surf)',
                        color: 'var(--color-t1)',
                        borderRadius: 6,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Activity */}
              <section className="mb-6">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-t3)' }}
                >
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--color-surf)', borderRadius: 8 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" style={{ color: 'var(--color-acc)' }} />
                          <span className="font-medium" style={{ color: 'var(--color-t1)' }}>
                            vs {activity.opponent}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-t3)' }}>
                          {activity.date}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-t2)' }}>
                        {activity.result}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Mutual Connections */}
              {mutualConnections > 0 && (
                <section className="mb-6">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--color-t3)' }}
                  >
                    Mutual Connections
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {mutualAvatars.map((connection) => (
                        <div
                          key={connection.id}
                          className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                          style={{
                            backgroundColor: 'var(--color-surf)',
                            borderColor: 'var(--color-surf-2)',
                            color: 'var(--color-t2)',
                          }}
                        >
                          <User className="w-5 h-5" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-t1)' }}>
                      {mutualConnections} mutual{' '}
                      {mutualConnections === 1 ? 'connection' : 'connections'}
                      {mutualConnections > 5 && ` (+${mutualConnections - 5} more)`}
                    </span>
                  </div>
                </section>
              )}
            </div>

            {/* Action Buttons (sticky bottom) */}
            <div
              className="absolute bottom-0 left-0 right-0 p-6 border-t"
              style={{
                backgroundColor: 'var(--color-surf-2)',
                borderColor: 'var(--color-bdr)',
              }}
            >
              <div className="flex gap-3">
                {/* Message Button */}
                <button
                  onClick={() => onMessage(player.id)}
                  className="flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-surf)',
                    color: 'var(--color-t1)',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>

                {/* Challenge Button */}
                <button
                  onClick={() => onChallenge(player.id)}
                  className="flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-acc)',
                    color: '#fff',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Swords className="w-4 h-4" />
                  Challenge
                </button>
              </div>

              {/* View Full Profile Button */}
              <button
                onClick={() => onViewFullProfile(player.id)}
                className="w-full mt-3 py-3 px-4 font-semibold text-sm transition-transform active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-acc)',
                  border: `1px solid var(--color-acc)`,
                  borderRadius: 9999,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                View Full Profile
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
