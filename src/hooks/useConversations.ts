import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Profile } from '../types/database';
import type { ConversationItem, ParticipantWithProfile } from '../types/circles';

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Returns true if a last_seen ISO string is within the last 5 minutes */
function isOnlineNow(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseConversationsReturn {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all conversations the current user participates in, enriched with
 * participant profiles, last message, and unread count.
 *
 * Realtime updates arrive over a **WebSocket** channel (Supabase Realtime).
 * A single `messages` INSERT listener updates the relevant conversation in
 * place so the list stays fresh without a full refetch.
 */
export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which conversation is currently "open" so we don't increment
  // unread for messages arriving in the active chat.
  const activeConvIdRef = useRef<string | null>(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get all conversation_participant rows for this user (+ conversation data)
      const { data: myRows, error: myErr } = await supabase
        .from('conversation_participants')
        .select(
          `id, conversation_id, user_id, last_read_at, joined_at, is_admin, is_creator,
           conversations!inner(id, type, circle_id, team_id, name, avatar_url, created_by, created_at, updated_at)`
        )
        .eq('user_id', user.id);

      if (myErr) throw myErr;
      if (!myRows || myRows.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = myRows.map((r) => r.conversation_id);

      // 2. Get all participants for those conversations (+ their profiles)
      const { data: allParticipants, error: partErr } = await supabase
        .from('conversation_participants')
        .select(
          `id, conversation_id, user_id, last_read_at, joined_at, is_admin, is_creator,
           profiles!inner(id, full_name, avatar_url, last_seen)`
        )
        .in('conversation_id', convIds);

      if (partErr) throw partErr;

      // 3 & 4. For each conversation: fetch last message + unread count in parallel
      const enriched = await Promise.all(
        myRows.map(async (myRow) => {
          const convId = myRow.conversation_id;
          const conv = (myRow as any).conversations as ConversationItem['conversation'];

          // Last message
          const { data: lastMsgs } = await supabase
            .from('messages')
            .select('id, conversation_id, sender_id, content, encrypted_content, expires_at, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage: Message | null = lastMsgs?.[0] ?? null;

          // Unread count
          let unreadCount = 0;
          if (myRow.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', convId)
              .gt('created_at', myRow.last_read_at)
              .neq('sender_id', user.id);
            unreadCount = count ?? 0;
          } else {
            // Never read — count everything not sent by self
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', convId)
              .neq('sender_id', user.id);
            unreadCount = count ?? 0;
          }

          // Build participant list for this conversation
          const convParticipants = (allParticipants ?? []).filter(
            (p) => p.conversation_id === convId
          );
          const others: ParticipantWithProfile[] = convParticipants
            .filter((p) => p.user_id !== user.id)
            .map((p) => ({
              participant: {
                id: p.id,
                conversation_id: p.conversation_id,
                user_id: p.user_id,
                last_read_at: p.last_read_at,
                joined_at: p.joined_at,
                is_admin: p.is_admin,
                is_creator: p.is_creator,
              },
              profile: (p as any).profiles as Profile,
            }));

          // Derived display values
          const isDirect = conv.type === 'direct';
          const firstOther = others[0]?.profile;
          const displayName = isDirect
            ? (firstOther?.full_name ?? 'Unknown')
            : (conv.name ?? 'Group');
          const displayAvatarUrl = isDirect
            ? (firstOther?.avatar_url ?? null)
            : (conv.avatar_url ?? null);
          const isOnline = isDirect ? isOnlineNow(firstOther?.last_seen ?? null) : false;
          const lastActivity = lastMessage?.created_at ?? conv.updated_at;

          const item: ConversationItem = {
            conversation: conv,
            otherParticipants: others,
            myParticipant: {
              id: myRow.id,
              conversation_id: myRow.conversation_id,
              user_id: myRow.user_id,
              last_read_at: myRow.last_read_at,
              joined_at: myRow.joined_at,
              is_admin: myRow.is_admin,
              is_creator: myRow.is_creator,
            },
            lastMessage,
            unreadCount,
            displayName,
            displayAvatarUrl,
            isOnline,
            lastActivity,
          };
          return item;
        })
      );

      // Sort by most recent activity
      enriched.sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      setConversations(enriched);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Mark as read ─────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      activeConvIdRef.current = conversationId;
      const now = new Date().toISOString();

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: now })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      // Clear unread badge optimistically in local state
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation.id === conversationId
            ? { ...c, unreadCount: 0, myParticipant: { ...c.myParticipant, last_read_at: now } }
            : c
        )
      );
    },
    [user]
  );

  // ─── WebSocket realtime subscription ─────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchConversations();

    // Subscribe to new messages across ALL conversations via WebSocket.
    // Supabase Realtime uses a persistent WebSocket (wss://) connection
    // to push postgres_changes events to the client in real-time.
    const channel = supabase
      .channel('circles:conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setConversations((prev) => {
            // Only update conversations we are a participant of
            const idx = prev.findIndex(
              (c) => c.conversation.id === newMsg.conversation_id
            );
            if (idx === -1) return prev;

            const target = prev[idx];
            const isMine = newMsg.sender_id === user.id;
            const isActive = activeConvIdRef.current === newMsg.conversation_id;

            const updated: ConversationItem = {
              ...target,
              lastMessage: newMsg,
              lastActivity: newMsg.created_at,
              // Only increment unread if: not our own message AND conversation not currently open
              unreadCount:
                !isMine && !isActive
                  ? target.unreadCount + 1
                  : target.unreadCount,
            };

            // Re-sort: bubble conversation to top
            const next = [...prev];
            next.splice(idx, 1);
            return [updated, ...next];
          });
        }
      )
      .subscribe();

    return () => {
      // Cleanly close the WebSocket channel on unmount
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations, markAsRead };
}
