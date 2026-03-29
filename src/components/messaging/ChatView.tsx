import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Send, Users, CheckCheck, Info, Radio } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchMessages,
  sendMessage,
  markAsRead,
  subscribeToConversation,
  subscribeToTypingIndicators,
  broadcastTyping,
  subscribeToPresence,
  broadcastPresence,
  subscribeToConnectionStatus,
  fetchReadReceipts,
  type ChatMessage,
  type ConversationWithMeta,
} from '@/lib/messaging';
import { cn } from '@/lib/utils';
import { GroupInfoModal } from './GroupInfoModal';
import { ChannelInfoModal } from './ChannelInfoModal';
import { getInitials } from '@/lib/avatar-utils';

interface ChatViewProps {
  conversation: ConversationWithMeta;
  onBack: () => void;
}

export function ChatView({ conversation, onBack }: ChatViewProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type === 'group' || conversation.type === 'circle' || conversation.type === 'team';
  const isGroupChat = conversation.type === 'group';
  const isBroadcast = conversation.type === 'broadcast';
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Real-time state
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const displayedMessageIds = useRef<Set<string>>(new Set());

  // Task 10: Read receipts — Map<userId, lastReadAt ISO string>
  const [readReceipts, setReadReceipts] = useState<Map<string, string>>(new Map());

  // Task 11: Track previous connection status for missed-message recovery
  const prevConnectionStatus = useRef<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [showReconnected, setShowReconnected] = useState(false);
  const lastMessageTimestamp = useRef<string | null>(null);

  // Optimistic update state - tracks pending messages by temp ID
  const [pendingMessages, setPendingMessages] = useState<Map<string, ChatMessage>>(new Map());

  // Typing indicator state
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef = useRef(false);
  const typingUserTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Presence tracking state
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastActivityRef = useRef<number>(Date.now());

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  // Fetch user's admin status for broadcast channels
  useEffect(() => {
    if (!isBroadcast || !user?.id) return;

    const fetchAdminStatus = async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('is_admin')
        .eq('conversation_id', conversation.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsUserAdmin(data?.is_admin ?? false);
    };

    fetchAdminStatus();
  }, [conversation.id, isBroadcast, user?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    console.log('[ChatView] useEffect triggered - conversation:', conversation?.id, 'user:', user?.id);

    if (!conversation?.id) {
      console.log('[ChatView] No conversation ID, skipping subscription');
      return;
    }

    console.log('[ChatView] Setting up subscriptions for conversation:', conversation.id);

    // Subscribe to new messages — uses private Broadcast channel (zero WAL reads)
    const messageChannel = subscribeToConversation(conversation.id, (newMsg) => {
      console.log('[ChatView] Received new message in callback:', newMsg.id, 'from:', newMsg.senderId);

      // Check if message already displayed (deduplication)
      if (displayedMessageIds.current.has(newMsg.id)) {
        console.log('[ChatView] Message already displayed, skipping:', newMsg.id);
        return;
      }

      // Don't add our own messages (already added optimistically)
      if (newMsg.senderId === user?.id) {
        console.log('[ChatView] Skipping own message (already added optimistically):', newMsg.id);
        return;
      }

      console.log('[ChatView] Adding message to UI:', newMsg.id);
      setMessages((prev) => {
        // Double-check for duplicates in state
        if (prev.some((m) => m.id === newMsg.id)) {
          console.log('[ChatView] Message already in state, skipping:', newMsg.id);
          return prev;
        }
        console.log('[ChatView] Message added to state successfully');
        return [...prev, newMsg];
      });

      // Track displayed message
      displayedMessageIds.current.add(newMsg.id);

      // Mark as read when we receive a message while viewing
      if (user?.id) markAsRead(conversation.id, user.id);
    });
    console.log('[ChatView] Message channel created successfully');

    // Subscribe to typing indicators with 5-second auto-removal
    const typingChannel = subscribeToTypingIndicators(
      conversation.id,
      (userId, isTyping) => {
        // Clear existing timeout for this user
        const existingTimeout = typingUserTimeouts.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (isTyping) {
          // Add to typing users
          setTypingUsers(prev =>
            prev.includes(userId) ? prev : [...prev, userId]
          );

          // Set 5-second timeout to auto-remove
          const timeout = setTimeout(() => {
            setTypingUsers(prev => prev.filter(id => id !== userId));
            typingUserTimeouts.current.delete(userId);
          }, 5000);

          typingUserTimeouts.current.set(userId, timeout);
        } else {
          // Remove from typing users
          setTypingUsers(prev => prev.filter(id => id !== userId));
          typingUserTimeouts.current.delete(userId);
        }
      }
    );

    // Subscribe to presence
    const presenceChannel = subscribeToPresence(
      conversation.id,
      (userId, status) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          if (status === 'online') {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      }
    );

    // Subscribe to connection status (Task 11: fetch missed messages on reconnect)
    const statusChannel = subscribeToConnectionStatus((status) => {
      const prev = prevConnectionStatus.current;
      prevConnectionStatus.current = status;
      setConnectionStatus(status);

      // Task 11: Recover missed messages when coming back from disconnected
      if (status === 'connected' && prev === 'disconnected') {
        fetchMessages(conversation.id, 50).then((freshMessages) => {
          setMessages((current) => {
            const newOnes = freshMessages.filter(
              (m) => !displayedMessageIds.current.has(m.id)
            );
            if (newOnes.length === 0) return current;
            newOnes.forEach((m) => displayedMessageIds.current.add(m.id));
            // Merge and sort chronologically
            const merged = [...current, ...newOnes].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return merged;
          });
        });

        // Show brief "Reconnected" confirmation
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 2000);
      }
    });

    // Task 10: Fetch read receipts on conversation open (on-demand, not subscription).
    if (user?.id) {
      fetchReadReceipts(conversation.id, user.id).then(setReadReceipts);
    }

    // Cleanup on unmount
    return () => {
      console.log('[ChatView] Cleaning up subscriptions for conversation:', conversation.id);
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();
      presenceChannel.unsubscribe();
      statusChannel.unsubscribe();

      // Clear all typing user timeouts
      typingUserTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingUserTimeouts.current.clear();
    };
  }, [conversation?.id, user?.id]);

  // Mark as read on open
  useEffect(() => {
    if (user?.id) {
      markAsRead(conversation.id, user.id);
    }
  }, [conversation.id, user?.id]);

  // Broadcast presence on mount and handle inactivity
  useEffect(() => {
    if (!user?.id) return;

    // Broadcast online status on mount
    broadcastPresence(user.id, 'online');
    lastActivityRef.current = Date.now();

    // Set up inactivity detection (5 minutes)
    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(() => {
        broadcastPresence(user.id, 'away');
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Track user activity
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 1 minute has passed since last activity
      if (now - lastActivityRef.current > 60000) {
        broadcastPresence(user.id, 'online');
      }
      resetInactivityTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Start inactivity timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const msgs = await fetchMessages(conversation.id, 50);
    setMessages(msgs);
    setHasMore(msgs.length >= 50);

    // Track all loaded message IDs for deduplication
    msgs.forEach(msg => displayedMessageIds.current.add(msg.id));

    // Task 11: Track the timestamp of the most recent message
    if (msgs.length > 0) {
      lastMessageTimestamp.current = msgs[msgs.length - 1].createdAt;
    }

    setLoading(false);
  };

  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;
    const oldestDate = messages[0]?.createdAt;
    const olderMsgs = await fetchMessages(conversation.id, 50, oldestDate);
    if (olderMsgs.length < 50) setHasMore(false);

    // Track loaded message IDs for deduplication
    olderMsgs.forEach(msg => displayedMessageIds.current.add(msg.id));

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newOnes = olderMsgs.filter((m) => !existingIds.has(m.id));
      return [...newOnes, ...prev];
    });
  }, [conversation.id, hasMore, messages]);

  // Infinite scroll - load older messages when scrolling to top
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop < 50 && hasMore && !loading) {
      loadOlderMessages();
    }
  }, [hasMore, loading, loadOlderMessages]);

  const handleSend = async () => {
    if (!text.trim() || !user?.id || sending) return;
    const content = text.trim();
    setSending(true);
    setText('');

    // Broadcast stopped-typing immediately when message is sent
    if (isTypingRef.current) {
      broadcastTyping(conversation.id, user.id, false);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Create optimistic message with temp ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderId: user.id,
      senderName: profile?.full_name || 'You',
      senderAvatar: profile?.avatar_url || undefined,
      content,
      createdAt: new Date().toISOString(),
      pending: true, // Mark as pending
    };

    // Add to pending messages Map
    setPendingMessages(prev => new Map(prev).set(tempId, optimisticMsg));

    // Display pending message immediately in UI
    setMessages((prev) => [...prev, optimisticMsg]);

    // Track optimistic message ID temporarily
    displayedMessageIds.current.add(tempId);

    try {
      // Send to server
      const sent = await sendMessage(conversation.id, user.id, content);

      if (sent) {
        // Handle server confirmation - replace temp message with real message
        displayedMessageIds.current.delete(tempId);
        displayedMessageIds.current.add(sent.id);

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...sent, senderName: optimisticMsg.senderName, senderAvatar: optimisticMsg.senderAvatar } : m))
        );

        // Remove from pending messages
        setPendingMessages(prev => {
          const next = new Map(prev);
          next.delete(tempId);
          return next;
        });

        // Refresh read receipts after sending
        fetchReadReceipts(conversation.id, user.id).then(setReadReceipts);
      } else {
        // Handle send failure - mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true, error: 'Failed to send message' } : m
          )
        );

        setPendingMessages(prev => {
          const next = new Map(prev);
          const msg = next.get(tempId);
          if (msg) {
            next.set(tempId, { ...msg, pending: false, failed: true, error: 'Failed to send message' });
          }
          return next;
        });
      }
    } catch (error) {
      // Handle send failures with error indicator
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true, error: errorMessage } : m
        )
      );

      setPendingMessages(prev => {
        const next = new Map(prev);
        const msg = next.get(tempId);
        if (msg) {
          next.set(tempId, { ...msg, pending: false, failed: true, error: errorMessage });
        }
        return next;
      });
    }

    setSending(false);
  };

  // Retry failed message
  const handleRetry = async (failedMessage: ChatMessage) => {
    if (!user?.id) return;

    // Mark as pending again
    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedMessage.id ? { ...m, pending: true, failed: false, error: undefined } : m
      )
    );

    setPendingMessages(prev => {
      const next = new Map(prev);
      next.set(failedMessage.id, { ...failedMessage, pending: true, failed: false, error: undefined });
      return next;
    });

    try {
      // Retry sending
      const sent = await sendMessage(conversation.id, user.id, failedMessage.content);

      if (sent) {
        // Replace with confirmed message
        displayedMessageIds.current.delete(failedMessage.id);
        displayedMessageIds.current.add(sent.id);

        setMessages((prev) =>
          prev.map((m) => (m.id === failedMessage.id ? { ...sent, senderName: failedMessage.senderName, senderAvatar: failedMessage.senderAvatar } : m))
        );

        // Remove from pending
        setPendingMessages(prev => {
          const next = new Map(prev);
          next.delete(failedMessage.id);
          return next;
        });
      } else {
        // Failed again
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMessage.id ? { ...m, pending: false, failed: true, error: 'Failed to send message' } : m
          )
        );

        setPendingMessages(prev => {
          const next = new Map(prev);
          const msg = next.get(failedMessage.id);
          if (msg) {
            next.set(failedMessage.id, { ...msg, pending: false, failed: true, error: 'Failed to send message' });
          }
          return next;
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMessage.id ? { ...m, pending: false, failed: true, error: errorMessage } : m
        )
      );

      setPendingMessages(prev => {
        const next = new Map(prev);
        const msg = next.get(failedMessage.id);
        if (msg) {
          next.set(failedMessage.id, { ...msg, pending: false, failed: true, error: errorMessage });
        }
        return next;
      });
    }
  };

  // Handle typing indicator broadcast with debouncing
  const handleTyping = useCallback(() => {
    if (!user?.id) return;

    // Debounce the typing handler to avoid excessive calls (300ms)
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    typingDebounceRef.current = setTimeout(() => {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Broadcast typing if not already typing
      if (!isTypingRef.current) {
        broadcastTyping(conversation.id, user.id, true);
        isTypingRef.current = true;
      }

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          broadcastTyping(conversation.id, user.id, false);
          isTypingRef.current = false;
        }
      }, 3000);
    }, 300);
  }, [conversation.id, user?.id]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      // Send stopped-typing on unmount
      if (isTypingRef.current && user?.id) {
        broadcastTyping(conversation.id, user.id, false);
      }
    };
  }, [conversation.id, user?.id]);

  // Group messages by date for date separators
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 pb-4 border-b"
        style={{ borderColor: 'var(--color-bdr)' }}
      >
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surf-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {isGroup || isBroadcast ? (
          conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-acc-bg)' }}
            >
              {isBroadcast ? (
                <Radio className="w-5 h-5" style={{ color: 'var(--color-acc)' }} />
              ) : (
                <Users className="w-5 h-5" style={{ color: 'var(--color-acc)' }} />
              )}
            </div>
          )
        ) : (
          <Avatar className="h-11 w-11">
            <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
            <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-label font-semibold truncate" style={{ color: 'var(--color-t1)' }}>
              {conversation.name}
            </p>
            {isBroadcast && (
              <Radio className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />
            )}
          </div>
          {isGroup || isBroadcast ? (
            <p className="text-caption truncate" style={{ color: 'var(--color-t2)' }}>
              {conversation.memberCount
                ? `${conversation.memberCount} ${isBroadcast ? 'subscribers' : 'members'}`
                : conversation.participants.map((p) => p.name).join(', ')}
            </p>
          ) : (
            <div className="flex items-center gap-1">
              {conversation.participants.length > 0 && onlineUsers.has(conversation.participants[0].id) && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-caption" style={{ color: 'var(--color-t2)' }}>Online</p>
                </>
              )}
            </div>
          )}
        </div>
        {isGroupChat && (
          <button
            onClick={() => setShowGroupInfo(true)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--color-t2)' }}
            title="Group info"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
        {isBroadcast && (
          <button
            onClick={() => setShowChannelInfo(true)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--color-t2)' }}
            title="Channel info"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Connection Status Indicator */}
      {connectionStatus !== 'connected' && (
        <div
          className="px-4 py-2 text-sm text-center"
          style={{
            background: connectionStatus === 'reconnecting' ? 'rgba(255,179,0,0.15)' : 'rgba(var(--color-red-rgb, 239,68,68),0.1)',
            color: connectionStatus === 'reconnecting' ? '#FFB300' : 'var(--color-red)',
          }}
        >
          {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected - Messages may not be delivered'}
        </div>
      )}

      {/* Task 11: Brief "Reconnected" confirmation banner */}
      {showReconnected && connectionStatus === 'connected' && (
        <div
          className="px-4 py-2 text-sm text-center transition-opacity"
          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-acc)' }}
        >
          Reconnected
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1"
      >
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: '4px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)' }}
            />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-center text-caption mt-8" style={{ color: 'var(--color-t3)' }}>
            Send your first message!
          </p>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const showDateSep = !prevMsg || getDateLabel(prevMsg.createdAt) !== getDateLabel(msg.createdAt);
          const showSenderName = isGroup && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
          const time = new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          const isPending = msg.pending || pendingMessages.has(msg.id);
          const isFailed = msg.failed;

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ background: 'var(--color-surf-2)', color: 'var(--color-t2)' }}
                  >
                    {getDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}

              <div className={cn('flex gap-2 px-1', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && isGroup && (
                  <div className="w-7 flex-shrink-0">
                    {showSenderName && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                        <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
                <div className={cn('max-w-[75%]')}>
                  {showSenderName && (
                    <p className="text-xs ml-1 mb-0.5" style={{ color: 'var(--color-t2)' }}>{msg.senderName}</p>
                  )}
                  <div
                    className={cn(
                      'px-4 py-2 rounded-[16px] relative group',
                      isMe ? 'rounded-br-[4px]' : 'rounded-bl-[4px]',
                      isPending && 'opacity-75',
                      isFailed && 'opacity-50'
                    )}
                    style={
                      isFailed
                        ? { background: 'rgba(var(--color-red-rgb,239,68,68),0.1)' }
                        : isMe
                        ? { background: 'var(--color-acc)', color: '#fff' }
                        : { background: 'var(--color-surf-2)', color: 'var(--color-t1)' }
                    }
                  >
                    <p className="text-body break-words">{msg.content}</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className="text-[10px]"
                        style={{
                          color: isFailed
                            ? 'var(--color-red)'
                            : isMe
                            ? 'rgba(255,255,255,0.6)'
                            : 'var(--color-t3)',
                        }}
                      >
                        {isPending && !isFailed && 'Sending...'}
                        {isFailed && 'Failed'}
                        {!isPending && !isFailed && time}
                      </p>
                      {/* Task 10: Read receipt — show on sent messages */}
                      {isMe && !isPending && !isFailed && (() => {
                        const otherParticipants = conversation.participants.filter(
                          (p) => p.id !== user?.id
                        );
                        const isReadByAll = otherParticipants.length > 0 &&
                          otherParticipants.every((p) => {
                            const readAt = readReceipts.get(p.id);
                            return readAt && new Date(readAt) >= new Date(msg.createdAt);
                          });
                        return isReadByAll ? (
                          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <CheckCheck className="w-3 h-3" />
                            Read
                          </span>
                        ) : null;
                      })()}
                      {isFailed && isMe && (
                        <button
                          onClick={() => handleRetry(msg)}
                          className="text-[10px] hover:underline font-medium"
                          style={{ color: 'var(--color-red)' }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm" style={{ color: 'var(--color-t2)' }}>
          {typingUsers.map(userId => {
            const participant = conversation.participants.find(p => p.id === userId);
            return participant?.name;
          }).filter(Boolean).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-bdr)' }}>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button size="sm" disabled={!text.trim() || sending} onClick={handleSend}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Group Info Modal */}
      {isGroupChat && (
        <GroupInfoModal
          conversationId={conversation.id}
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          onGroupLeft={() => {
            setShowGroupInfo(false);
            onBack();
          }}
          onGroupDeleted={() => {
            setShowGroupInfo(false);
            onBack();
          }}
        />
      )}

      {/* Channel Info Modal */}
      {isBroadcast && (
        <ChannelInfoModal
          conversationId={conversation.id}
          open={showChannelInfo}
          onOpenChange={setShowChannelInfo}
          onChannelLeft={() => {
            setShowChannelInfo(false);
            onBack();
          }}
          onChannelDeleted={() => {
            setShowChannelInfo(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}
