import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CirclesListView } from './CirclesListView';
import { ChatDetailView } from './ChatDetailView';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../contexts/AuthContext';
import { useNavVisibility } from '../../contexts/NavVisibilityContext';
import { getOrCreateDirectConversation } from '../../lib/messaging';
import type { CirclesScreen, ConversationItem } from '../../types/circles';
import type { Profile } from '../../types/database';

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
  const { conversations, loading, error, markAsRead, refetch } = useConversations();
  const { user } = useAuth();
  const location = useLocation();
  const { setHideNav } = useNavVisibility();

  const openChat = useCallback((item: ConversationItem) => {
    setScreen({ view: 'chat', item });
    setHideNav(true);
  }, [setHideNav]);

  const goBack = useCallback(() => {
    setScreen({ view: 'list' });
    setHideNav(false);
  }, [setHideNav]);

  const handleNewChat = useCallback(async (contactId: string, contactProfile: Profile) => {
    if (!user) return;

    // If a direct conversation already exists in the list, open it immediately
    const existing = conversations.find(
      (c) =>
        c.conversation.type === 'direct' &&
        c.otherParticipants[0]?.profile?.id === contactId
    );
    if (existing) {
      openChat(existing);
      return;
    }

    // Otherwise, get or create a new direct conversation
    const { conversationId, error: createErr } = await getOrCreateDirectConversation(
      user.id,
      contactId
    );
    if (!conversationId || createErr) return;

    // Refetch conversations so the new one appears, then open it
    await refetch();
    // After refetch the state will update; use a short delay to let state settle
    setTimeout(() => {
      setScreen((prev) => {
        if (prev.view === 'chat') return prev; // already navigated elsewhere
        // Will be resolved by the useEffect below once conversations updates
        return prev;
      });
      // Trigger open by storing the target id
      setPendingOpenId(conversationId);
    }, 100);
  }, [user, conversations, openChat, refetch]);

  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  // Open pending conversation once conversations list updates
  useEffect(() => {
    if (!pendingOpenId) return;
    const item = conversations.find((c) => c.conversation.id === pendingOpenId);
    if (item) {
      setPendingOpenId(null);
      openChat(item);
    }
  }, [pendingOpenId, conversations, openChat]);

  // Restore nav when unmounting
  useEffect(() => () => { setHideNav(false); }, [setHideNav]);

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
              onNewChat={handleNewChat}
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
