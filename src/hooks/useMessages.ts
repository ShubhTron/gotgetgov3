import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Profile } from '../types/database';
import type { MessageWithSender } from '../types/circles';

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseMessagesReturn {
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  sending: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the last 50 messages for a conversation and listens for new ones
 * over a **WebSocket** channel (Supabase Realtime, protocol: wss://).
 *
 * Send behaviour is **optimistic**: the message appears in the UI immediately,
 * then is removed if the Supabase insert fails.
 */
export function useMessages(conversationId: string | null): UseMessagesReturn {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Cache sender profiles so we don't re-fetch the same profile repeatedly
  const profileCacheRef = useRef<Map<string, Profile>>(new Map());

  // ─── Helper: enrich a raw message with sender profile ──────────────────

  const enrichMessage = useCallback(
    async (msg: Message): Promise<MessageWithSender> => {
      let sender = profileCacheRef.current.get(msg.sender_id);
      if (!sender) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', msg.sender_id)
          .single();
        if (data) {
          sender = data as Profile;
          profileCacheRef.current.set(msg.sender_id, sender);
        }
      }
      return {
        message: msg,
        sender: sender!,
        isMine: msg.sender_id === user?.id,
      };
    },
    [user]
  );

  // ─── Fetch initial messages ───────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: rawMessages, error: msgErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, encrypted_content, expires_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (msgErr) throw msgErr;
      if (!rawMessages || rawMessages.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Pre-warm the profile cache for all unique senders
      const uniqueSenderIds = [...new Set(rawMessages.map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueSenderIds);

      (senderProfiles ?? []).forEach((p) => {
        profileCacheRef.current.set(p.id, p as Profile);
      });

      const enriched = await Promise.all(rawMessages.map(enrichMessage));
      setMessages(enriched);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, enrichMessage]);

  // ─── WebSocket realtime subscription ─────────────────────────────────────

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }

    // Fetch on mount / conversation change
    fetchMessages();

    // Subscribe to new messages for this specific conversation via WebSocket.
    // Supabase Realtime uses a persistent WebSocket (wss://) connection so
    // new messages arrive instantly without polling.
    const channel = supabase
      .channel(`circles:chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Skip if this is our own optimistic message (already in state)
          if (newMsg.sender_id === user.id) {
            // Replace the temp optimistic message with the real one from DB
            setMessages((prev) => {
              const tempIdx = prev.findIndex(
                (m) => m.message.id.startsWith('temp-') && m.isMine
              );
              if (tempIdx === -1) return prev;
              const next = [...prev];
              next[tempIdx] = {
                ...next[tempIdx],
                message: newMsg,
              };
              return next;
            });
            return;
          }

          // Received message from another user
          const enriched = await enrichMessage(newMsg);
          setMessages((prev) => [...prev, enriched]);
        }
      )
      .subscribe();

    return () => {
      // Close WebSocket channel when conversation changes or component unmounts
      supabase.removeChannel(channel);
      // Clear messages when leaving conversation
      setMessages([]);
    };
  }, [conversationId, user, fetchMessages, enrichMessage]);

  // ─── Send message (optimistic) ────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !profile || !content.trim()) return;
      setSending(true);

      const trimmed = content.trim();
      const tempId = `temp-${Date.now()}`;
      const optimistic: MessageWithSender = {
        message: {
          id: tempId,
          conversation_id: conversationId,
          sender_id: user.id,
          content: trimmed,
          encrypted_content: null,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        sender: profile as Profile,
        isMine: true,
      };

      // Immediately show the message in the UI
      setMessages((prev) => [...prev, optimistic]);

      const { error: insertErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmed,
      });

      if (insertErr) {
        // Roll back the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.message.id !== tempId));
        setError('Failed to send message. Please try again.');
      }

      setSending(false);
    },
    [conversationId, user, profile]
  );

  return { messages, loading, error, sendMessage, sending };
}
