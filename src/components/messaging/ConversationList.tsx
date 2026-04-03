import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Users, Plus, Search, Pin, PinOff, MessageCircle, Radio, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchConversations,
  subscribeToUserMessageNotifications,
  pinConversation,
  unpinConversation,
  getOrCreateDirectConversation,
  type ConversationWithMeta,
} from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { searchUserById, determineSearchType, isValidUserIdFormat } from '@/lib/userId';
import type { Profile } from '@/types';
import { ChatView } from './ChatView';
import { CreateGroupModal } from './CreateGroupModal';
import { CreateBroadcastModal } from './CreateBroadcastModal';
import { ContactsStrip } from './ContactsStrip';
import { ComposeMenu } from './ComposeMenu';
import { NewChatModal } from './NewChatModal';
import { getInitials } from '@/lib/avatar-utils';
import { cn } from '@/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatConvTime(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

// ─── ConversationAvatar sub-component ────────────────────────────────────────

function ConvAvatar({ conversation }: { conversation: ConversationWithMeta }) {
  if (conversation.type === 'direct') {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
        <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
      </Avatar>
    );
  }
  if (conversation.type === 'broadcast') {
    if (conversation.avatarUrl) {
      return (
        <img
          src={conversation.avatarUrl}
          alt={conversation.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
        <Radio className="w-6 h-6" style={{ color: '#3b82f6' }} />
      </div>
    );
  }
  if (conversation.type === 'group' && conversation.avatarUrl) {
    return (
      <img
        src={conversation.avatarUrl}
        alt={conversation.name}
        className="w-12 h-12 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--color-acc-bg)' }}
    >
      <Users className="w-6 h-6" style={{ color: 'var(--color-acc)' }} />
    </div>
  );
}

// ─── SwipeableRow ─────────────────────────────────────────────────────────────

interface SwipeableRowProps {
  conversation: ConversationWithMeta;
  onSelect: (c: ConversationWithMeta) => void;
  onPinToggle: (c: ConversationWithMeta) => void;
  isUserAdmin?: boolean;
}

function SwipeableRow({ conversation, onSelect, onPinToggle, isUserAdmin }: SwipeableRowProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const ACTION_WIDTH = 80;

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -(ACTION_WIDTH / 2)) {
      controls.start({ x: -ACTION_WIDTH, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  };

  const handleActionClick = async () => {
    await controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    onPinToggle(conversation);
  };

  const handleRowClick = () => {
    if (!isDragging.current) {
      onSelect(conversation);
    }
  };

  const isPinned = conversation.isPinned ?? false;

  return (
    <div className="relative overflow-hidden">
      {/* Action button behind the row */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
        style={{ width: ACTION_WIDTH, backgroundColor: isPinned ? 'var(--color-red)' : 'var(--color-acc)' }}
      >
        <button
          onClick={handleActionClick}
          className="flex flex-col items-center gap-1 text-white"
        >
          {isPinned ? (
            <PinOff className="w-5 h-5" />
          ) : (
            <Pin className="w-5 h-5" />
          )}
          <span className="text-[10px] font-medium">{isPinned ? 'Unpin' : 'Pin'}</span>
        </button>
      </div>

      {/* Draggable row */}
      <motion.div
        style={{ x, background: 'var(--color-surf)' }}
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.05}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={(e, info) => {
          handleDragEnd(e, info);
          setTimeout(() => { isDragging.current = false; }, 50);
        }}
        animate={controls}
        onClick={handleRowClick}
        className="relative flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <ConvAvatar conversation={conversation} />
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold leading-none">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-t1)' }}>
                {conversation.name}
              </p>
              {conversation.type === 'broadcast' && (
                <Radio className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
              )}
            </div>
            <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-t3)' }}>
              {formatConvTime(conversation.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <p
                className="text-xs truncate"
                style={{
                  color: conversation.unreadCount > 0 ? 'var(--color-t1)' : 'var(--color-t3)',
                  fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                }}
              >
                {conversation.lastMessage || 'No messages yet'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {conversation.type === 'broadcast' && conversation.memberCount && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  {conversation.memberCount} {conversation.memberCount === 1 ? 'subscriber' : 'subscribers'}
                </span>
              )}
              {conversation.type === 'broadcast' && isUserAdmin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  Admin
                </span>
              )}
              {isPinned && (
                <Pin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-t3)' }} />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main ConversationList ────────────────────────────────────────────────────

export function ConversationList() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComposeMenu, setShowComposeMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'group' | 'broadcast'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userAdminStatus, setUserAdminStatus] = useState<Map<string, boolean>>(new Map());

  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const subscriptionSetupRef = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (user?.id) loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || loading || conversations.length === 0 || subscriptionSetupRef.current) return;

    // Subscribe to user-level Broadcast for conversation list refresh.
    const channel = subscribeToUserMessageNotifications(user.id, () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(async () => {
        if (user?.id) {
          const updated = await fetchConversations(user.id);
          setConversations(updated);
        }
      }, 500);
    });

    subscriptionSetupRef.current = true;

    return () => {
      channel?.unsubscribe();
      subscriptionSetupRef.current = false;
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [user?.id, loading, conversations.length]);

  const loadConversations = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await fetchConversations(user.id);
    setConversations(data);

    // Fetch admin status for broadcast channels
    const broadcastIds = data.filter(c => c.type === 'broadcast').map(c => c.id);
    if (broadcastIds.length > 0) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, is_admin')
        .eq('user_id', user.id)
        .in('conversation_id', broadcastIds);

      if (participants) {
        const adminMap = new Map(
          participants.map(p => [p.conversation_id, p.is_admin ?? false])
        );
        setUserAdminStatus(adminMap);
      }
    }

    setLoading(false);
  };

  const handleGroupCreated = async (conversationId: string) => {
    await loadConversations();
    setConversations((prev) => {
      const newConv = prev.find((c) => c.id === conversationId);
      if (newConv) setSelectedConversation(newConv);
      return prev;
    });
  };

  const handlePinToggle = async (conversation: ConversationWithMeta) => {
    if (!user?.id) return;
    const isPinned = conversation.isPinned ?? false;
    if (isPinned) {
      await unpinConversation(conversation.id, user.id);
    } else {
      await pinConversation(conversation.id, user.id);
    }
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => c.id === conversation.id ? { ...c, isPinned: !isPinned } : c)
    );
  };

  // Debounced user search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const q = searchQuery.trim();
        const type = determineSearchType(q);
        if (type === 'id') {
          if (isValidUserIdFormat(q)) {
            const p = await searchUserById(q);
            setUserResults(p ? [p] : []);
          } else {
            setUserResults([]);
          }
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${q}%`)
            .limit(5);
          setUserResults((data as Profile[]) || []);
        }
      } catch {
        setUserResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleOpenUserConversation = async (userId: string) => {
    if (!user?.id) return;
    const { conversationId } = await getOrCreateDirectConversation(user.id, userId);
    if (conversationId) {
      const updated = await fetchConversations(user.id);
      setConversations(updated);
      const conv = updated.find((c) => c.id === conversationId);
      if (conv) setSelectedConversation(conv);
    }
  };

  // Navigate to ChatView if conversation selected — full-screen overlay below top header
  if (selectedConversation) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 top-16 z-50"
        style={{ background: 'var(--color-surf)' }}
      >
        <ChatView
          conversation={selectedConversation}
          onBack={() => {
            setSelectedConversation(null);
            loadConversations();
          }}
        />
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const directConvs = conversations.filter((c) => c.type === 'direct');
  const groupConvs = conversations.filter((c) => c.type === 'group');
  const broadcastConvs = conversations.filter((c) => c.type === 'broadcast');

  const tabConvs = activeTab === 'direct' ? directConvs : activeTab === 'group' ? groupConvs : broadcastConvs;

  const searched = searchQuery.trim()
    ? tabConvs.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tabConvs;

  const pinned = searched.filter((c) => c.isPinned);
  const unpinned = searched.filter((c) => !c.isPinned);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0 -mx-4 -mt-4">

      {/* ── Greeting header ── */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-t1)' }}>Hi {firstName} 👋</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-t2)' }}>
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'No new messages'}
            </p>
          </div>
          <button
            onClick={() => setShowComposeMenu(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-surf-2)' }}
          >
            <Plus className="w-4 h-4" style={{ color: 'var(--color-t1)' }} />
          </button>
        </div>

        {/* Contacts / Stories strip */}
        {!loading && (
          <ContactsStrip
            onContactPress={(userId) => {
              const existing = directConvs.find((c) => c.partnerId === userId);
              if (existing) setSelectedConversation(existing);
            }}
            onAddPress={() => setActiveTab('direct')}
          />
        )}
      </div>

      {/* ── Chats section ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Navigation - Glassmorphic */}
        <div className="px-4 pt-3 pb-0 sticky top-0 z-10">
          <div
            className="flex items-center gap-6 rounded-t-2xl px-4 shadow-lg"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <button
              onClick={() => setActiveTab('direct')}
              className={cn(
                'pb-3 text-sm font-semibold transition-all relative',
              )}
              style={{ color: activeTab === 'direct' ? 'var(--color-t1)' : 'var(--color-t2)' }}
            >
              <span>{directConvs.length} DM</span>
              {activeTab === 'direct' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--color-acc)' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className="pb-3 text-sm font-semibold transition-all relative"
              style={{ color: activeTab === 'group' ? 'var(--color-t1)' : 'var(--color-t2)' }}
            >
              <span>{groupConvs.length} Groups</span>
              {activeTab === 'group' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--color-acc)' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className="pb-3 text-sm font-semibold transition-all relative"
              style={{ color: activeTab === 'broadcast' ? 'var(--color-t1)' : 'var(--color-t2)' }}
            >
              <span>{broadcastConvs.length} Broadcast</span>
              {activeTab === 'broadcast' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--color-acc)' }}
                />
              )}
            </button>
            <button className="ml-auto pb-3 transition-colors" style={{ color: 'var(--color-t2)' }}>
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-2"
            style={{ background: 'var(--color-surf-2)' }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-t2)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-t1)' }}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: '2px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)' }}
            />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="flex-1 overflow-y-auto">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <>
                <div className="px-4 pt-2 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-t2)' }}>
                    Pinned
                  </p>
                </div>
                <div className="space-y-px">
                  {pinned.map((conv) => (
                    <SwipeableRow
                      key={conv.id}
                      conversation={conv}
                      onSelect={setSelectedConversation}
                      onPinToggle={handlePinToggle}
                      isUserAdmin={conv.type === 'broadcast' ? userAdminStatus.get(conv.id) : undefined}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Action buttons for group/broadcast tabs */}
            {(activeTab === 'group' || activeTab === 'broadcast') && (
              <div className="px-4 pt-3 pb-1 flex justify-end">
                {activeTab === 'group' && (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full"
                    style={{ background: 'var(--color-acc)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Group
                  </button>
                )}
                {activeTab === 'broadcast' && (
                  <button
                    onClick={() => setShowCreateBroadcast(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full"
                    style={{ background: 'var(--color-acc)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Broadcast
                  </button>
                )}
              </div>
            )}

            {unpinned.length === 0 && tabConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surf-2)' }}
                >
                  {activeTab === 'direct'
                    ? <MessageCircle className="w-8 h-8" style={{ color: 'var(--color-t3)' }} />
                    : activeTab === 'group'
                    ? <Users className="w-8 h-8" style={{ color: 'var(--color-t3)' }} />
                    : <Radio className="w-8 h-8" style={{ color: 'var(--color-t3)' }} />
                  }
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-t1)' }}>
                  {activeTab === 'direct' ? 'No direct messages yet' : activeTab === 'group' ? 'No group chats yet' : 'No broadcast channels yet'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-t3)' }}>
                  {activeTab === 'direct'
                    ? 'Start a conversation by tapping a contact above'
                    : activeTab === 'group'
                    ? 'Create a group chat to get started'
                    : 'Create a broadcast channel to send announcements'
                  }
                </p>
                {activeTab === 'group' && (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-full shadow"
                    style={{ background: 'var(--color-acc)' }}
                  >
                    <Plus className="w-4 h-4" />
                    New Group
                  </button>
                )}
                {activeTab === 'broadcast' && (
                  <button
                    onClick={() => setShowCreateBroadcast(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-full shadow"
                    style={{ background: 'var(--color-acc)' }}
                  >
                    <Plus className="w-4 h-4" />
                    New Broadcast
                  </button>
                )}
              </div>
            )}

            {unpinned.length > 0 && (
              <div className="space-y-px">
                {unpinned.map((conv) => (
                  <SwipeableRow
                    key={conv.id}
                    conversation={conv}
                    onSelect={setSelectedConversation}
                    onPinToggle={handlePinToggle}
                    isUserAdmin={conv.type === 'broadcast' ? userAdminStatus.get(conv.id) : undefined}
                  />
                ))}
              </div>
            )}

            {/* No search results */}
            {searchQuery.trim() && searched.length === 0 && !userSearchLoading && userResults.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <Search className="w-10 h-10 mb-3" style={{ color: 'var(--color-t3)' }} />
                <p className="text-sm" style={{ color: 'var(--color-t2)' }}>No results for "{searchQuery}"</p>
              </div>
            )}

            {/* User search results */}
            {searchQuery.trim() && (userSearchLoading || userResults.length > 0) && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-t2)' }}>
                  Users
                </p>
                {userSearchLoading && (
                  <div className="flex items-center gap-2 py-2">
                    <div
                      className="w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-t3)' }}>Searching users…</span>
                  </div>
                )}
                {!userSearchLoading && userResults.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? ''} />
                      <AvatarFallback>{getInitials(profile.full_name ?? '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-t1)' }}>
                        {profile.full_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenUserConversation(profile.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-full"
                      style={{ background: 'var(--color-acc)' }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-6" />
          </div>
        )}
      </div>

      <ComposeMenu
        open={showComposeMenu}
        onClose={() => setShowComposeMenu(false)}
        onNewChat={() => setShowNewChat(true)}
        onNewGroup={() => setShowCreateGroup(true)}
        onNewBroadcast={() => setShowCreateBroadcast(true)}
      />

      <NewChatModal
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onSelectUser={handleOpenUserConversation}
      />

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={handleGroupCreated}
      />

      <CreateBroadcastModal
        open={showCreateBroadcast}
        onOpenChange={setShowCreateBroadcast}
        userId={user?.id || ''}
        onChannelCreated={handleGroupCreated}
      />
    </div>
  );
}
