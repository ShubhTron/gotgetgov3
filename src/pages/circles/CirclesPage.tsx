import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CirclesListView } from './CirclesListView';
import { ChatDetailView } from './ChatDetailView';
import { useConversations } from '../../hooks/useConversations';
import type { CirclesScreen, ConversationItem } from '../../types/circles';

// ─── Framer Motion transition variants ───────────────────────────────────────
// Ease curves: [0.32, 0, 0.67, 0] = ease-in-cubic (fast exit)
//              [0.33, 1, 0.68, 1] = ease-out-cubic (smooth landing)

const DURATION = 0.28;

const listVariants = {
  initial: { x: 0, opacity: 1 },
  exit: {
    x: '-30%',
    opacity: 0,
    transition: { duration: DURATION, ease: [0.32, 0, 0.67, 0] as const },
  },
};

const chatVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: DURATION, ease: [0.33, 1, 0.68, 1] as const },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: DURATION - 0.04, ease: [0.32, 0, 0.67, 0] as const },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Root state machine for the Circles (Connect) tab.
 *
 * Manages navigation between:
 *  - 'list'  → CirclesListView (conversation list)
 *  - 'chat'  → ChatDetailView  (individual chat thread)
 *
 * Both views are absolutely positioned within this container so Framer Motion
 * can animate them simultaneously during the slide transition.
 */
export function CirclesPage() {
  const [screen, setScreen] = useState<CirclesScreen>({ view: 'list' });
  // Single hook instance — one WebSocket subscription shared by both views
  const { conversations, loading, error, markAsRead } = useConversations();
  const location = useLocation();

  const openChat = useCallback((item: ConversationItem) => {
    setScreen({ view: 'chat', item });
  }, []);

  const goBack = useCallback(() => {
    setScreen({ view: 'list' });
  }, []);

  // Auto-open a conversation when navigated from invite acceptance
  useEffect(() => {
    const targetId = (location.state as { openConversationId?: string } | null)?.openConversationId;
    if (!targetId || loading || screen.view === 'chat') return;
    const item = conversations.find(c => c.conversation.id === targetId);
    if (item) {
      openChat(item);
      window.history.replaceState({}, '', '/circles');
    }
  }, [conversations, loading, location.state]);

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {screen.view === 'list' && (
          <motion.div
            key="circles-list"
            variants={listVariants}
            initial="initial"
            animate="initial"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
            }}
          >
            <CirclesListView
              conversations={conversations}
              loading={loading}
              error={error}
              onOpenChat={openChat}
            />
          </motion.div>
        )}

        {screen.view === 'chat' && (
          <motion.div
            key={`chat-${screen.item.conversation.id}`}
            variants={chatVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
            }}
          >
            <ChatDetailView
              conversationItem={screen.item}
              onBack={goBack}
              markAsRead={markAsRead}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
