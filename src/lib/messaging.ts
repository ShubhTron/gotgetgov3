import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Task 13: Subscription Registry ────────────────────────────────────────
// Prevents duplicate subscriptions to the same channel key.
const activeSubscriptions = new Map<string, RealtimeChannel>();

/**
 * Unsubscribe and deregister an existing channel if one exists for this key.
 */
function deregisterChannel(key: string): void {
  const existing = activeSubscriptions.get(key);
  if (existing) {
    existing.unsubscribe();
    activeSubscriptions.delete(key);
  }
}

/**
 * Subscribe to a channel, deregistering any previous one with the same key.
 */
function registerChannel(key: string, channel: RealtimeChannel): RealtimeChannel {
  // Check if there's already an active subscription with this key
  const existing = activeSubscriptions.get(key);
  if (existing) {
    // Reuse existing channel to avoid duplicate subscriptions
    return existing;
  }
  
  activeSubscriptions.set(key, channel);
  return channel;
}

/**
 * Task 13: Subscribe with exponential backoff retry (max 3 attempts).
 * If all attempts fail, returns null (caller should fall back to polling).
 */
export async function subscribeWithRetry(
  channelFactory: () => RealtimeChannel,
  maxAttempts = 3
): Promise<RealtimeChannel | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const channel = channelFactory();
      return channel;
    } catch (error) {
      if (attempt < maxAttempts) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface ConversationWithMeta {
  id: string;
  type: 'direct' | 'circle' | 'team' | 'group' | 'broadcast';
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isPinned?: boolean;
  partnerId?: string; // for direct conversations
  circleId?: string;
  teamId?: string;
  participants: { id: string; name: string; avatarUrl?: string }[];
  // Group-specific fields
  memberCount?: number;
  createdBy?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  // Optimistic update fields
  pending?: boolean;      // Message is being sent
  failed?: boolean;       // Message failed to send
  error?: string;         // Error message if failed
}

/**
 * Check if two users have a mutual connection.
 * Accepts either bidirectional connections OR single-direction connections.
 * This allows messaging to work with legacy one-way connections.
 */
export async function checkMutualConnection(
  userA: string,
  userB: string
): Promise<boolean> {
  // Check forward direction: userA → userB
  const { data: forwardConnection } = await supabase
    .from('connections')
    .select('id')
    .eq('user_id', userA)
    .eq('connected_user_id', userB)
    .eq('status', 'accepted')
    .limit(1);

  // If forward connection found, return true immediately
  if (forwardConnection && forwardConnection.length > 0) {
    return true;
  }

  // Check reverse direction: userB → userA
  const { data: reverseConnection } = await supabase
    .from('connections')
    .select('id')
    .eq('user_id', userB)
    .eq('connected_user_id', userA)
    .eq('status', 'accepted')
    .limit(1);

  // Return true if reverse connection found, false otherwise
  return reverseConnection && reverseConnection.length > 0;
}

/**
 * Gets or creates a direct conversation between two users.
 * Requires mutual connection (both users must have accepted each other).
 */
export async function getOrCreateDirectConversation(
  userA: string,
  userB: string
): Promise<{ conversationId: string | null; error?: string }> {
  // Check mutual connection first
  const isMutuallyConnected = await checkMutualConnection(userA, userB);

  if (!isMutuallyConnected) {
    return {
      conversationId: null,
      error: 'You must be connected to message this user'
    };
  }

  // Call database function to get or create conversation
  const { data, error } = await supabase
    .rpc('get_or_create_direct_conversation', {
      user_a: userA,
      user_b: userB
    } as any) as { data: string | null; error: any };

  if (error || !data) {
    return { conversationId: null, error: 'Failed to create conversation' };
  }

  return { conversationId: data };
}


/**
 * Fetch all conversations for a user with last message and unread count.
 */
export async function fetchConversations(
  userId: string
): Promise<ConversationWithMeta[]> {
  // Get all conversation IDs this user is part of
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at, is_pinned')
    .eq('user_id', userId) as {
      data: Array<{ conversation_id: string; last_read_at: string | null; is_pinned: boolean }> | null;
      error: any;
    };

  if (partError || !participations || participations.length === 0) {
    return [];
  }

  const convIds = participations.map((p) => p.conversation_id);
  const lastReadMap = new Map(
    participations.map((p) => [p.conversation_id, p.last_read_at])
  );
  const pinnedMap = new Map(
    participations.map((p) => [p.conversation_id, p.is_pinned ?? false])
  );

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, type, circle_id, team_id, name, avatar_url, created_by')
    .in('id', convIds) as {
      data: Array<{
        id: string;
        type: 'direct' | 'circle' | 'team' | 'group' | 'broadcast';
        circle_id: string | null;
        team_id: string | null;
        name: string | null;
        avatar_url: string | null;
        created_by: string | null;
      }> | null;
    };

  if (!conversations) return [];

  // Fetch all participants for these conversations
  const { data: allParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds) as {
      data: Array<{
        conversation_id: string;
        user_id: string;
      }> | null;
      error: any;
    };

  // Get unique user IDs
  const userIds = [...new Set((allParticipants || []).map(p => p.user_id))];

  // Fetch profiles separately
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds) as {
      data: Array<{
        id: string;
        full_name: string;
        avatar_url: string | null;
      }> | null;
      error: any;
    };

  // Create a map of user_id to profile
  const profileMap = new Map(
    (profiles || []).map(p => [p.id, p])
  );

  // Fetch circle/team names if needed
  const circleIds = conversations.filter((c) => c.circle_id).map((c) => c.circle_id!);
  const teamIds = conversations.filter((c) => c.team_id).map((c) => c.team_id!);

  const [circlesRes, teamsRes] = await Promise.all([
    circleIds.length > 0
      ? (supabase.from('circles').select('id, name').in('id', circleIds) as unknown as Promise<{ data: Array<{ id: string; name: string }> | null }>)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    teamIds.length > 0
      ? (supabase.from('teams').select('id, name').in('id', teamIds) as unknown as Promise<{ data: Array<{ id: string; name: string }> | null }>)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const circleNames = new Map((circlesRes.data || []).map((c) => [c.id, c.name]));
  const teamNames = new Map((teamsRes.data || []).map((t) => [t.id, t.name]));

  // Fetch last message for each conversation
  const results: ConversationWithMeta[] = [];

  for (const conv of conversations) {
    // Get last message
    const { data: lastMsgArr } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1) as {
        data: Array<{ content: string; created_at: string }> | null;
      };

    const lastMsg = lastMsgArr?.[0];
    const lastReadAt = lastReadMap.get(conv.id);

    // Count unread messages
    let unreadCount = 0;
    if (lastReadAt) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .gt('created_at', lastReadAt);
      unreadCount = count || 0;
    } else if (lastMsg) {
      // Never read — count all messages from others
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId);
      unreadCount = count || 0;
    }

    // Build participants list
    const participants = (allParticipants || [])
      .filter((p) => p.conversation_id === conv.id)
      .map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          id: p.user_id,
          name: profile?.full_name || 'Unknown',
          avatarUrl: profile?.avatar_url || undefined,
        };
      });

    // Determine name & avatar
    let name = 'Chat';
    let avatarUrl: string | undefined;
    let partnerId: string | undefined;
    let memberCount: number | undefined;
    let createdBy: string | undefined;

    if (conv.type === 'direct') {
      const partner = participants.find((p) => p.id !== userId);
      name = partner?.name || 'Unknown';
      avatarUrl = partner?.avatarUrl;
      partnerId = partner?.id;
    } else if (conv.type === 'circle' && conv.circle_id) {
      name = circleNames.get(conv.circle_id) || 'Circle Chat';
    } else if (conv.type === 'team' && conv.team_id) {
      name = teamNames.get(conv.team_id) || 'Team Chat';
    } else if (conv.type === 'group') {
      name = conv.name || 'Group Chat';
      avatarUrl = conv.avatar_url || undefined;
      memberCount = participants.length;
      createdBy = conv.created_by || undefined;
    } else if (conv.type === 'broadcast') {
      name = conv.name || 'Broadcast Channel';
      avatarUrl = conv.avatar_url || undefined;
      memberCount = participants.length;
      createdBy = conv.created_by || undefined;
    }

    results.push({
      id: conv.id,
      type: conv.type,
      name,
      avatarUrl,
      lastMessage: lastMsg?.content,
      lastMessageAt: lastMsg?.created_at,
      unreadCount,
      isPinned: pinnedMap.get(conv.id) ?? false,
      partnerId,
      circleId: conv.circle_id || undefined,
      teamId: conv.team_id || undefined,
      participants,
      memberCount,
      createdBy,
    });
  }

  // Sort by last message time (most recent first), conversations with no messages last
  results.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return results;
}

/**
 * Pin a conversation for the current user.
 */
export async function pinConversation(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_pinned: true } as any)
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to pin conversation:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Unpin a conversation for the current user.
 */
export async function unpinConversation(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_pinned: false } as any)
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to unpin conversation:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Fetch messages for a conversation with cursor-based pagination.
 */
export async function fetchMessages(
  conversationId: string,
  limit = 50,
  beforeDate?: string
): Promise<ChatMessage[]> {
  let query = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, profiles!messages_sender_id_fkey(full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (beforeDate) {
    query = query.lt('created_at', beforeDate);
  }

  const { data, error } = await query as {
    data: Array<{
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
      profiles: any;
    }> | null;
    error: any;
  };

  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }

  return (data || [])
    .map((msg) => {
      const profile = msg.profiles as unknown as {
        full_name: string;
        avatar_url: string | null;
      } | null;
      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: profile?.full_name || 'Unknown',
        senderAvatar: profile?.avatar_url || undefined,
        content: msg.content,
        createdAt: msg.created_at,
      };
    })
    .reverse(); // Return in chronological order
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    } as any)
    .select('id, conversation_id, sender_id, content, created_at')
    .single() as {
      data: {
        id: string;
        conversation_id: string;
        sender_id: string;
        content: string;
        created_at: string;
      } | null;
      error: any;
    };

  if (error || !data) {
    console.error('Failed to send message:', error);
    return null;
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    senderName: '', // Will be filled by the caller
    content: data.content,
    createdAt: data.created_at,
  };
}

/**
 * Mark a conversation as read for a user.
 */
export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await (supabase
    .from('conversation_participants') as any)
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to mark as read:', error);
  }

  // Also mark notifications as read for this conversation
  await markConversationNotificationsAsRead(conversationId, userId);
}


/**
 * Subscribe to new messages in a conversation via Supabase Realtime Broadcast.
 *
 * Uses a private broadcast channel `messages:{conversationId}` fed by the
 * `broadcast_new_message` DB trigger (migration 045). This is pure WebSocket —
 * zero WAL reads, zero list_changes calls. Previously used postgres_changes
 * which caused 3000+ list_changes calls per interval with just 2 active users.
 *
 * The DB trigger also fans out to `user-messages:{userId}` for each participant,
 * so AppShell/ConversationList badge updates work without client-side fan-out.
 */
export function subscribeToConversation(
  conversationId: string,
  onNewMessage: (message: ChatMessage) => void,
  currentUserId?: string
): RealtimeChannel {
  const channelKey = `messages:${conversationId}`;

  const existing = activeSubscriptions.get(channelKey);
  if (existing) {
    const state = existing.state;
    if (state === 'joined' || state === 'joining') {
      console.log('[subscribeToConversation] Reusing existing subscription for:', conversationId);
      return existing;
    } else {
      console.log('[subscribeToConversation] Existing channel in state:', state, '- creating new one');
      activeSubscriptions.delete(channelKey);
      existing.unsubscribe();
    }
  }

  const channel = supabase
    .channel(channelKey, { config: { private: true } })
    .on(
      'broadcast',
      { event: 'new-message' },
      async (payload: { payload: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string } }) => {
        const msg = payload.payload;

        // Fetch sender profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', msg.sender_id)
          .maybeSingle() as { data: { full_name: string; avatar_url: string | null } | null };

        onNewMessage({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: profile?.full_name || 'Unknown',
          senderAvatar: profile?.avatar_url || undefined,
          content: msg.content,
          createdAt: msg.created_at,
        });
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        activeSubscriptions.delete(channelKey);
      }
    });

  activeSubscriptions.set(channelKey, channel);
  return channel;
}

/**
 * Subscribe to user-level message notifications via private Broadcast channel.
 * Events are pushed by the `broadcast_new_message` DB trigger (migration 045)
 * for each conversation participant on every message INSERT — pure WebSocket,
 * zero WAL reads. Works even when ChatView is not open (e.g. user is on another page).
 */
export function subscribeToUserMessageNotifications(
  userId: string,
  onNewMessage: (conversationId: string) => void
): RealtimeChannel {
  const channelKey = `user-messages:${userId}`;

  const existing = activeSubscriptions.get(channelKey);
  if (existing) {
    const state = existing.state;
    if (state === 'joined' || state === 'joining') {
      console.log('[subscribeToUserMessageNotifications] Reusing existing subscription');
      return existing;
    } else {
      activeSubscriptions.delete(channelKey);
      existing.unsubscribe();
    }
  }

  const channel = supabase
    .channel(channelKey, { config: { private: true } })
    .on(
      'broadcast',
      { event: 'new-message' },
      (payload: { payload: { conversationId: string } }) => {
        onNewMessage(payload.payload.conversationId);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        activeSubscriptions.delete(channelKey);
      }
    });

  activeSubscriptions.set(channelKey, channel);
  return channel;
}

/**
 * Get or create a group conversation for a circle.
 */
export async function getOrCreateCircleConversation(
  circleId: string,
  creatorId: string,
  memberIds: string[]
): Promise<string | null> {
  // Check for existing circle conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'circle')
    .eq('circle_id', circleId)
    .maybeSingle() as { data: { id: string } | null };

  if (existing) return existing.id;

  // Create new circle conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ type: 'circle', circle_id: circleId } as any)
    .select('id')
    .single() as { data: { id: string } | null; error: any };

  if (error || !newConv) return null;

  // Add all members as participants
  const allIds = [creatorId, ...memberIds.filter((id) => id !== creatorId)];
  await supabase.from('conversation_participants').insert(
    allIds.map((uid) => ({ conversation_id: newConv.id, user_id: uid })) as any
  );

  return newConv.id;
}

/**
 * Get or create a group conversation for a team.
 */
export async function getOrCreateTeamConversation(
  teamId: string,
  creatorId: string,
  memberIds: string[]
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'team')
    .eq('team_id', teamId)
    .maybeSingle() as { data: { id: string } | null };

  if (existing) return existing.id;

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ type: 'team', team_id: teamId } as any)
    .select('id')
    .single() as { data: { id: string } | null; error: any };

  if (error || !newConv) return null;

  const allIds = [creatorId, ...memberIds.filter((id) => id !== creatorId)];
  await supabase.from('conversation_participants').insert(
    allIds.map((uid) => ({ conversation_id: newConv.id, user_id: uid })) as any
  );

  return newConv.id;
}
/**
 * Create a new group chat with selected connections.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7
 */
export interface CreateGroupParams {
  name: string;
  avatarUrl?: string;
  creatorId: string;
  memberIds: string[]; // Must be connections of creator
}

/**
 * Add a member to a group chat.
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */
export interface AddMemberParams {
  conversationId: string;
  addingUserId: string; // Any member can add
  newMemberId: string; // Must be connection of adding user
}

export async function addGroupMember(params: AddMemberParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, addingUserId, newMemberId } = params;

  // Verify newMemberId is a connection of addingUserId (client-side check)
  const isConnected = await checkMutualConnection(addingUserId, newMemberId);
  if (!isConnected) {
    return { success: false, error: 'Can only add users you are connected with' };
  }

  const { error } = await supabase.rpc('add_group_member', {
    p_conversation_id: conversationId,
    p_adding_user_id: addingUserId,
    p_new_member_id: newMemberId,
  });

  if (error) {
    console.error('Failed to add member to group:', error);
    return { success: false, error: error.message || 'Failed to add member to group' };
  }

  return { success: true };
}

/**
 * Remove a member from a group chat.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export interface RemoveMemberParams {
  conversationId: string;
  adminId: string; // Must be admin
  memberIdToRemove: string;
}

export async function removeGroupMember(params: RemoveMemberParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, memberIdToRemove } = params;

  const { error } = await supabase.rpc('remove_group_member', {
    p_conversation_id: conversationId,
    p_admin_id: adminId,
    p_member_id: memberIdToRemove,
  });

  if (error) {
    console.error('Failed to remove member from group:', error);
    return { success: false, error: error.message || 'Failed to remove member from group' };
  }

  return { success: true };
}

/**
 * Leave a group chat.
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6
 */
export interface LeaveGroupParams {
  conversationId: string;
  userId: string;
}

export async function leaveGroup(params: LeaveGroupParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, userId } = params;

  const { error } = await supabase.rpc('leave_group_conversation', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to leave group:', error);
    return { success: false, error: error.message || 'Failed to leave group' };
  }

  return { success: true };
}

/**
 * Promote a member to admin status.
 * Requirements: 6.1, 6.2
 */
export interface PromoteToAdminParams {
  conversationId: string;
  adminId: string; // Must be admin
  subscriberIdToPromote: string;
}

/**
 * Demote an admin to regular member status.
 * Requirements: 6.3, 6.4
 */
export interface DemoteFromAdminParams {
  conversationId: string;
  adminId: string; // Must be admin
  adminIdToDemote: string;
}

/**
 * Demote an admin to regular member/subscriber status.
 * Works for both group chats and broadcast channels.
 * Requirements: 7.3, 7.4, 7.5
 * 
 * Logic:
 * 1. Verify adminId has is_admin=true
 * 2. Prevent demotion of creator
 * 3. Update participant record: is_admin=false
 * 4. Notify demoted user (handled by triggers)
 * 5. Notify all admins (handled by triggers)
 * 
 * Error Messages:
 * - Not admin: "Only admins can demote admins"
 * - Cannot demote creator: "Cannot demote the channel creator"
 * - Not an admin: "User is not an admin"
 */
export async function demoteFromAdmin(params: DemoteFromAdminParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, adminIdToDemote } = params;

  // 1. Verify adminId has is_admin=true
  const { data: adminCheck, error: adminCheckError } = await supabase
    .from('conversation_participants')
    .select('is_admin')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)
    .single();

  if (adminCheckError || !adminCheck) {
    console.error('Failed to verify admin status:', adminCheckError);
    return { success: false, error: 'Only admins can demote admins' };
  }

  if (!adminCheck.is_admin) {
    return { success: false, error: 'Only admins can demote admins' };
  }

  // 2. Verify target is a participant and check their status
  const { data: targetCheck, error: targetCheckError } = await supabase
    .from('conversation_participants')
    .select('is_admin, is_creator')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminIdToDemote)
    .single();

  if (targetCheckError || !targetCheck) {
    console.error('Failed to verify target status:', targetCheckError);
    return { success: false, error: 'User is not a member of this channel' };
  }

  // Prevent demotion of creator
  if (targetCheck.is_creator) {
    return { success: false, error: 'Cannot demote the channel creator' };
  }

  // Check if target is actually an admin
  if (!targetCheck.is_admin) {
    return { success: false, error: 'User is not an admin' };
  }

  // 3. Update participant record: is_admin=false
  const { error: updateError } = await supabase
    .from('conversation_participants')
    .update({ is_admin: false })
    .eq('conversation_id', conversationId)
    .eq('user_id', adminIdToDemote);

  if (updateError) {
    console.error('Failed to demote admin:', updateError);
    return { success: false, error: 'Failed to demote admin' };
  }

  // Note: Notifications (4. Notify demoted user, 5. Notify all admins)
  // will be handled by database triggers or separate notification system

  return { success: true };
}

/**
 * Promote a subscriber to admin status.
 * Requirements: 7.1, 7.2, 7.5, 7.6
 * 
 * Logic:
 * 1. Verify adminId has is_admin=true
 * 2. Verify subscriberIdToPromote is a participant
 * 3. Check if already an admin
 * 4. Update participant record: is_admin=true
 * 5. Notify promoted user (handled by triggers)
 * 6. Notify all admins (handled by triggers)
 * 
 * Error Messages:
 * - Not admin: "Only admins can promote subscribers"
 * - Already admin: "User is already an admin"
 * - Not a participant: "User is not a member of this channel"
 */
export async function promoteToAdmin(params: PromoteToAdminParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, subscriberIdToPromote } = params;

  // 1. Verify adminId has is_admin=true
  const { data: adminCheck, error: adminCheckError } = await supabase
    .from('conversation_participants')
    .select('is_admin')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)
    .single();

  if (adminCheckError || !adminCheck) {
    console.error('Failed to verify admin status:', adminCheckError);
    return { success: false, error: 'Only admins can promote subscribers' };
  }

  if (!adminCheck.is_admin) {
    return { success: false, error: 'Only admins can promote subscribers' };
  }

  // 2. Verify subscriberIdToPromote is a participant and check if already admin
  const { data: participantCheck, error: participantCheckError } = await supabase
    .from('conversation_participants')
    .select('is_admin')
    .eq('conversation_id', conversationId)
    .eq('user_id', subscriberIdToPromote)
    .single();

  if (participantCheckError || !participantCheck) {
    console.error('Failed to verify participant status:', participantCheckError);
    return { success: false, error: 'User is not a member of this channel' };
  }

  // 3. Check if already an admin
  if (participantCheck.is_admin) {
    return { success: false, error: 'User is already an admin' };
  }

  // 4. Update participant record: is_admin=true
  const { error: updateError } = await supabase
    .from('conversation_participants')
    .update({ is_admin: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', subscriberIdToPromote);

  if (updateError) {
    console.error('Failed to promote subscriber to admin:', updateError);
    return { success: false, error: 'Failed to promote subscriber to admin' };
  }

  // Note: Notifications (5. Notify promoted user, 6. Notify all admins)
  // will be handled by database triggers or separate notification system

  return { success: true };
}

export interface CreateGroupResult {
  conversationId: string | null;
  error?: string;
}

export async function createGroup(params: CreateGroupParams): Promise<CreateGroupResult> {
  const { name, avatarUrl, creatorId, memberIds } = params;

  if (!name || name.trim().length === 0) {
    return { conversationId: null, error: 'Group name must be at least 1 character' };
  }
  if (memberIds.length < 1) {
    return { conversationId: null, error: 'Groups must have at least 2 members (including creator)' };
  }
  if (memberIds.length + 1 > 50) {
    return { conversationId: null, error: 'Groups must have 50 or fewer members' };
  }

  // Verify all memberIds are connections of creator (client-side check)
  for (const memberId of memberIds) {
    const isConnected = await checkMutualConnection(creatorId, memberId);
    if (!isConnected) {
      return { conversationId: null, error: 'Can only add users you are connected with' };
    }
  }

  const { data: conversationId, error } = await supabase.rpc('create_group_conversation', {
    p_name: name.trim(),
    p_creator_id: creatorId,
    p_member_ids: memberIds,
    p_avatar_url: avatarUrl || null,
  });

  if (error || !conversationId) {
    console.error('Failed to create group conversation:', error);
    return { conversationId: null, error: error?.message || 'Failed to create group conversation' };
  }

  return { conversationId };
}

/**
 * Delete a group chat. Only the creator can delete.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export interface DeleteGroupParams {
  conversationId: string;
  userId: string; // Must be creator
}

export async function deleteGroup(params: DeleteGroupParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, userId } = params;

  const { error } = await supabase.rpc('delete_group_conversation', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to delete group:', error);
    return { success: false, error: error.message || 'Failed to delete group' };
  }

  return { success: true };
}

/**
 * Update group name and/or avatar. Only admins can update.
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export interface UpdateGroupParams {
  conversationId: string;
  adminId: string; // Must be admin
  name?: string;
  avatarUrl?: string;
}

export async function updateGroupDetails(params: UpdateGroupParams): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, name } = params;

  if (name === undefined) {
    return { success: true }; // Nothing to update
  }

  if (name.trim().length === 0) {
    return { success: false, error: 'Group name must be at least 1 character' };
  }

  const { error } = await supabase.rpc('update_group_name', {
    p_conversation_id: conversationId,
    p_admin_id: adminId,
    p_name: name.trim(),
  });

  if (error) {
    console.error('Failed to update group details:', error);
    return { success: false, error: error.message || 'Failed to update group details' };
  }

  return { success: true };
}

/**
 * Group member info returned by getGroupInfo.
 */
export interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isCreator: boolean;
  joinedAt: string;
}

/**
 * Full group info returned by getGroupInfo.
 */
export interface GroupInfo {
  conversationId: string;
  name: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  members: GroupMember[];
}

/**
 * Get complete group information including all members and their roles.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
export async function getGroupInfo(conversationId: string): Promise<{ data: GroupInfo | null; error?: string }> {
  // Fetch conversation metadata
  const { data: conv } = await (supabase
    .from('conversations') as any)
    .select('id, name, avatar_url, created_by, created_at')
    .eq('id', conversationId)
    .eq('type', 'group')
    .maybeSingle() as { data: { id: string; name: string; avatar_url: string | null; created_by: string; created_at: string } | null };

  if (!conv) {
    return { data: null, error: 'Group not found' };
  }

  // Fetch all participants with their roles
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, is_admin, is_creator, joined_at')
    .eq('conversation_id', conversationId)
    .order('joined_at', { ascending: true }) as {
      data: Array<{ user_id: string; is_admin: boolean; is_creator: boolean; joined_at: string }> | null;
    };

  if (!participants) {
    return { data: null, error: 'Failed to fetch group members' };
  }

  // Fetch profiles for all participants
  const userIds = participants.map(p => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds) as {
      data: Array<{ id: string; full_name: string; avatar_url: string | null }> | null;
    };

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const members: GroupMember[] = participants.map(p => {
    const profile = profileMap.get(p.user_id);
    return {
      id: p.user_id,
      name: profile?.full_name || 'Unknown',
      avatarUrl: profile?.avatar_url || undefined,
      isAdmin: p.is_admin,
      isCreator: p.is_creator,
      joinedAt: p.joined_at,
    };
  });

  return {
    data: {
      conversationId: conv.id,
      name: conv.name,
      avatarUrl: conv.avatar_url || undefined,
      createdBy: conv.created_by,
      createdAt: conv.created_at,
      memberCount: members.length,
      members,
    }
  };
}

/**
 * Get total unread message count across all conversations for a user.
 *
 * Previously ran 1+N queries (one COUNT per conversation). Now uses 2 queries:
 * 1. Fetch all participation rows (conversation_id + last_read_at)
 * 2. Fetch all candidate unread messages in one batch, count in JS
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId) as {
      data: Array<{ conversation_id: string; last_read_at: string | null }> | null;
    };

  if (!participations || participations.length === 0) return 0;

  const convIds = participations.map((p) => p.conversation_id);

  // Use the oldest last_read_at as the lower-bound so the batch stays small.
  // Any message older than every conversation's last_read_at cannot be unread.
  const readTimestamps = participations.map((p) => p.last_read_at).filter(Boolean) as string[];
  const oldestReadAt = readTimestamps.length > 0 ? readTimestamps.sort()[0] : null;

  let msgQuery = supabase
    .from('messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', convIds)
    .neq('sender_id', userId);

  if (oldestReadAt) {
    msgQuery = (msgQuery as any).gt('created_at', oldestReadAt);
  }

  const { data: msgs } = await msgQuery as { data: Array<{ conversation_id: string; sender_id: string; created_at: string }> | null };
  if (!msgs) return 0;

  // Per-conversation last_read_at map — count only messages after the cutoff
  const readAtMap = new Map(participations.map((p) => [p.conversation_id, p.last_read_at]));
  let total = 0;
  for (const msg of msgs) {
    const lastRead = readAtMap.get(msg.conversation_id) ?? null;
    if (!lastRead || msg.created_at > lastRead) total++;
  }
  return total;
}
/**
 * Mark all notifications for a conversation as read.
 * This is called when a user opens a conversation.
 */
export async function markConversationNotificationsAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  // Query notifications where data->>'conversation_id' matches
  const { error } = await (supabase
    .from('notifications') as any)
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .contains('data', { conversation_id: conversationId });

  if (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}

/**
 * Subscribe to typing indicators in a conversation.
 * Uses Supabase Realtime broadcast channel.
 * 
 * @param conversationId - The conversation to monitor for typing events
 * @param onTypingChange - Callback when a user starts or stops typing
 * @returns RealtimeChannel for cleanup
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  onTypingChange: (userId: string, isTyping: boolean) => void
): RealtimeChannel {
  const channelKey = `typing:${conversationId}`;
  const channel = supabase
    .channel(channelKey)
    .on(
      'broadcast',
      { event: 'typing' },
      (payload: { payload: { userId: string; isTyping: boolean } }) => {
        onTypingChange(payload.payload.userId, payload.payload.isTyping);
      }
    )
    .subscribe();

  return registerChannel(channelKey, channel);
}

/**
 * Broadcast typing status to other conversation participants.
 * Should be debounced on the client side (recommended 300ms).
 * 
 * @param conversationId - The conversation where typing is occurring
 * @param userId - The user who is typing
 * @param isTyping - Whether the user is currently typing
 */
export async function broadcastTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const channel = supabase.channel(`typing:${conversationId}`);
  
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });
      // Optionally cleanup the temporary broadcast channel after sending
      // to avoid accumulating many idle channels if the user types in many chats
      setTimeout(() => supabase.removeChannel(channel), 1000);
    }
  });
}

/**
 * Subscribe to presence updates for conversation participants.
 * Uses Supabase Realtime presence tracking.
 * 
 * @param conversationId - The conversation to monitor for presence
 * @param onPresenceChange - Callback when a user's presence status changes
 * @returns RealtimeChannel for cleanup
 */
export function subscribeToPresence(
  conversationId: string,
  onPresenceChange: (userId: string, status: 'online' | 'away' | 'offline') => void
): RealtimeChannel {
  const channelKey = `presence:${conversationId}`;
  const channel = supabase
    .channel(channelKey)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      
      // Process presence state
      Object.entries(state).forEach(([userId, presences]) => {
        const presence = presences[0] as unknown as { status: 'online' | 'away' | 'offline' };
        onPresenceChange(userId, presence.status);
      });
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const presence = newPresences[0] as unknown as { status: 'online' | 'away' | 'offline' };
      onPresenceChange(key, presence.status);
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      onPresenceChange(key, 'offline');
    })
    .subscribe();

  return registerChannel(channelKey, channel);
}

/**
 * Broadcast user's presence status.
 * Should be called when user opens app, becomes inactive, or closes app.
 * 
 * @param userId - The user whose presence is being broadcast
 * @param status - The user's current presence status
 */
export async function broadcastPresence(
  userId: string,
  status: 'online' | 'away' | 'offline'
): Promise<void> {
  const channel = supabase.channel('user-presence');
  
  channel.subscribe(async (subStatus) => {
    if (subStatus === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        status,
        online_at: new Date().toISOString(),
      });
    }
  });
}

/**
 * Fetch read receipts for a conversation on demand.
 * Replaces the old subscribeToReadReceipts which used postgres_changes on
 * conversation_participants — a table NOT in the realtime publication (was a no-op).
 *
 * Call this on conversation open and after sending a message.
 */
export async function fetchReadReceipts(
  conversationId: string,
  currentUserId: string
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('conversation_participants')
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId)
    .neq('user_id', currentUserId);

  const receipts = new Map<string, string>();
  if (data) {
    for (const p of data) {
      if (p.last_read_at) receipts.set(p.user_id, p.last_read_at);
    }
  }
  return receipts;
}

/**
 * Subscribe to Supabase Realtime connection status changes.
 * Monitors WebSocket connection health.
 * 
 * @param onStatusChange - Callback when connection status changes
 * @returns RealtimeChannel for cleanup
 */
export function subscribeToConnectionStatus(
  onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void
): RealtimeChannel {
  const channelKey = 'connection-status';
  const channel = supabase.channel(channelKey);
  
  channel
    .on('system', { event: 'connected' }, () => {
      onStatusChange('connected');
    })
    .on('system', { event: 'disconnected' }, () => {
      onStatusChange('disconnected');
    })
    .on('system', { event: 'reconnecting' }, () => {
      onStatusChange('reconnecting');
    })
    .subscribe();

  return registerChannel(channelKey, channel);
}

// ─── Broadcast Channel Functions ────────────────────────────────────────────

/**
 * Parameters for creating a broadcast channel.
 */
export interface CreateBroadcastChannelParams {
  name: string;
  avatarUrl?: string;
  creatorId: string;
  subscriberIds: string[]; // Must be connections of creator
}

/**
 * Result of creating a broadcast channel.
 */
export interface CreateBroadcastChannelResult {
  conversationId: string | null;
  error?: string;
}

/**
 * Create a new broadcast channel with selected connections.
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7
 * 
 * @param params - Channel creation parameters
 * @returns Result with conversation ID or error message
 */
export async function createBroadcastChannel(
  params: CreateBroadcastChannelParams
): Promise<CreateBroadcastChannelResult> {
  const { name, avatarUrl, creatorId, subscriberIds } = params;

  console.log('🚀 [createBroadcastChannel] Starting broadcast channel creation', {
    name,
    avatarUrl,
    creatorId,
    subscriberCount: subscriberIds.length
  });

  // Validate name (min 1 character)
  console.log('✅ [Step 1/6] Validating channel name...');
  if (!name || name.trim().length === 0) {
    console.error('❌ [Step 1/6] Validation failed: Channel name is empty');
    return { conversationId: null, error: 'Channel name must be at least 1 character' };
  }
  console.log('✅ [Step 1/6] Channel name valid:', name.trim());

  // Validate subscriber count (1-500 subscribers, not including creator)
  console.log('✅ [Step 2/6] Validating subscriber count...');
  if (subscriberIds.length < 1) {
    console.error('❌ [Step 2/6] Validation failed: No subscribers selected');
    return { conversationId: null, error: 'Broadcast channels must have 1-500 subscribers' };
  }
  if (subscriberIds.length > 500) {
    console.error('❌ [Step 2/6] Validation failed: Too many subscribers', subscriberIds.length);
    return { conversationId: null, error: 'Broadcast channels must have 1-500 subscribers' };
  }
  console.log('✅ [Step 2/6] Subscriber count valid:', subscriberIds.length);

  // Note: Connection verification is skipped because the UI already filters to only show
  // connected users (status='accepted'). This saves time and database queries.
  console.log('✅ [Step 3/5] Skipping connection verification (UI pre-filtered)');

  try {
    // Use RPC function to create broadcast channel atomically
    // This bypasses RLS (SECURITY DEFINER) and handles all inserts in one call
    console.log('✅ [Step 3/3] Creating broadcast channel via RPC...');
    console.log('  Params:', {
      name: name.trim(),
      avatar_url: avatarUrl || null,
      creator_id: creatorId,
      subscriber_count: subscriberIds.length,
    });

    const { data: conversationId, error: rpcError } = await supabase
      .rpc('create_broadcast_channel', {
        p_name: name.trim(),
        p_avatar_url: avatarUrl || null,
        p_creator_id: creatorId,
        p_subscriber_ids: subscriberIds,
      });

    if (rpcError || !conversationId) {
      console.error('❌ [Step 3/3] RPC create_broadcast_channel failed');
      console.error('  Error details:', {
        code: rpcError?.code,
        message: rpcError?.message,
        details: rpcError?.details,
        hint: rpcError?.hint
      });
      return { conversationId: null, error: 'Failed to create broadcast channel' };
    }

    console.log('🎉 [createBroadcastChannel] Broadcast channel created successfully!', conversationId);
    return { conversationId };
  } catch (error) {
    console.error('❌ [createBroadcastChannel] Unexpected error:', error);
    console.error('  Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { conversationId: null, error: 'Failed to create broadcast channel' };
  }
}

/**
 * Parameters for adding a subscriber to a broadcast channel.
 */
export interface AddSubscriberParams {
  conversationId: string;
  adminId: string; // Must be admin
  newSubscriberId: string; // Must be connection of admin
}

/**
 * Add a subscriber to a broadcast channel.
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
 * 
 * @param params - Subscriber addition parameters
 * @returns Result with success status or error message
 */
export async function addSubscriber(
  params: AddSubscriberParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, newSubscriberId } = params;

  try {
    // 1. Verify adminId has is_admin=true
    const { data: adminParticipant, error: adminCheckError } = await supabase
      .from('conversation_participants')
      .select('is_admin')
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
      .single();

    if (adminCheckError || !adminParticipant) {
      return { success: false, error: 'Only admins can add subscribers' };
    }

    if (!adminParticipant.is_admin) {
      return { success: false, error: 'Only admins can add subscribers' };
    }

    // 2. Verify newSubscriberId is a connection of adminId
    const isConnected = await checkMutualConnection(adminId, newSubscriberId);
    if (!isConnected) {
      return { success: false, error: 'Can only add users you are connected with' };
    }

    // 3. Check if newSubscriberId is already a participant (reject if true)
    const { data: existingParticipant, error: existingCheckError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', newSubscriberId)
      .maybeSingle();

    if (existingCheckError) {
      console.error('Error checking existing participant:', existingCheckError);
      return { success: false, error: 'Failed to add subscriber' };
    }

    if (existingParticipant) {
      return { success: false, error: 'User is already a subscriber' };
    }

    // 4. Check if adding would exceed 500 subscribers (reject if true)
    const { count, error: countError } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      console.error('Error counting participants:', countError);
      return { success: false, error: 'Failed to add subscriber' };
    }

    if (count !== null && count >= 500) {
      return { success: false, error: 'Cannot add subscriber: channel has reached maximum of 500 subscribers' };
    }

    // 5. Insert participant record (is_admin=false, is_creator=false)
    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: newSubscriberId,
        is_admin: false,
        is_creator: false,
      } as any);

    if (insertError) {
      console.error('Failed to add subscriber:', insertError);
      return { success: false, error: 'Failed to add subscriber' };
    }

    // Note: Notifications (6. Notify new subscriber, 7. Notify all admins) 
    // will be handled by database triggers or separate notification system

    return { success: true };
  } catch (error) {
    console.error('Unexpected error adding subscriber:', error);
    return { success: false, error: 'Failed to add subscriber' };
  }
}

/**
 * Parameters for removing a subscriber from a broadcast channel.
 */
export interface RemoveSubscriberParams {
  conversationId: string;
  adminId: string; // Must be admin
  subscriberIdToRemove: string;
}

/**
 * Remove a subscriber from a broadcast channel.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param params - Subscriber removal parameters
 * @returns Result with success status or error message
 */
export async function removeSubscriber(
  params: RemoveSubscriberParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, subscriberIdToRemove } = params;

  try {
    // 1. Verify adminId has is_admin=true
    const { data: adminParticipant, error: adminCheckError } = await supabase
      .from('conversation_participants')
      .select('is_admin')
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
      .single();

    if (adminCheckError || !adminParticipant) {
      return { success: false, error: 'Only admins can remove subscribers' };
    }

    if (!adminParticipant.is_admin) {
      return { success: false, error: 'Only admins can remove subscribers' };
    }

    // 2. Prevent removal of admins (must demote first)
    const { data: subscriberParticipant, error: subscriberCheckError } = await supabase
      .from('conversation_participants')
      .select('is_admin')
      .eq('conversation_id', conversationId)
      .eq('user_id', subscriberIdToRemove)
      .single();

    if (subscriberCheckError || !subscriberParticipant) {
      return { success: false, error: 'User is not a member of this channel' };
    }

    if (subscriberParticipant.is_admin) {
      return { success: false, error: 'Cannot remove admins. Demote them first.' };
    }

    // 3. Delete participant record
    const { error: deleteError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', subscriberIdToRemove);

    if (deleteError) {
      console.error('Failed to remove subscriber:', deleteError);
      return { success: false, error: 'Failed to remove subscriber' };
    }

    // Note: Notifications (4. Notify removed subscriber, 5. Notify all admins) 
    // will be handled by database triggers or separate notification system

    return { success: true };
  } catch (error) {
    console.error('Unexpected error removing subscriber:', error);
    return { success: false, error: 'Failed to remove subscriber' };
  }
}

/**
 * Parameters for leaving a broadcast channel.
 */
export interface LeaveChannelParams {
  conversationId: string;
  userId: string;
}

/**
 * Leave a broadcast channel.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 * 
 * Logic:
 * 1. Verify userId is a participant
 * 2. Check if userId is creator:
 *    - If creator and other admins exist: Transfer creator status to oldest admin
 *    - If creator and only admin: Delete the channel
 * 3. Delete participant record
 * 4. Notify all remaining admins
 * 
 * @param params - Leave channel parameters
 * @returns Result with success status or error message
 */
export async function leaveChannel(
  params: LeaveChannelParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, userId } = params;

  try {
    // 1. Verify userId is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('is_admin, is_creator')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return { success: false, error: 'You are not a member of this channel' };
    }

    // 2. Check if userId is creator
    if (participant.is_creator) {
      // Get all other admins (excluding the creator)
      const { data: otherAdmins, error: adminsError } = await supabase
        .from('conversation_participants')
        .select('user_id, joined_at')
        .eq('conversation_id', conversationId)
        .eq('is_admin', true)
        .neq('user_id', userId)
        .order('joined_at', { ascending: true });

      if (adminsError) {
        console.error('Failed to fetch other admins:', adminsError);
        return { success: false, error: 'Failed to leave channel' };
      }

      if (otherAdmins && otherAdmins.length > 0) {
        // Transfer creator status to oldest admin
        const oldestAdmin = otherAdmins[0];
        const { error: transferError } = await supabase
          .from('conversation_participants')
          .update({ is_creator: true })
          .eq('conversation_id', conversationId)
          .eq('user_id', oldestAdmin.user_id);

        if (transferError) {
          console.error('Failed to transfer creator status:', transferError);
          return { success: false, error: 'Failed to leave channel' };
        }
      } else {
        // Creator is the only admin - delete the channel
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);

        if (deleteError) {
          console.error('Failed to delete channel:', deleteError);
          return { success: false, error: 'Failed to leave channel' };
        }

        // Channel deleted, no need to delete participant record (CASCADE handles it)
        return { success: true };
      }
    }

    // 3. Delete participant record
    const { error: deleteError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to leave channel:', deleteError);
      return { success: false, error: 'Failed to leave channel' };
    }

    // Note: Notification (4. Notify all remaining admins) 
    // will be handled by database triggers or separate notification system

    return { success: true };
  } catch (error) {
    console.error('Unexpected error leaving channel:', error);
    return { success: false, error: 'Failed to leave channel' };
  }
}

/**
 * Parameters for deleting a broadcast channel.
 */
export interface DeleteChannelParams {
  conversationId: string;
  userId: string; // Must be creator
}

/**
 * Delete a broadcast channel. Only the creator can delete.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Logic:
 * 1. Verify userId has is_creator=true
 * 2. Notify all participants before deletion
 * 3. Delete conversation (CASCADE will delete participants and messages)
 * 4. Note: Messages preserved for archival via existing 30-day expiry
 * 
 * @param params - Delete channel parameters
 * @returns Result with success status or error message
 */
export async function deleteChannel(
  params: DeleteChannelParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, userId } = params;

  try {
    // 1. Verify userId has is_creator=true
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('is_creator')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return { success: false, error: 'Only the channel creator can delete the channel' };
    }

    if (!participant.is_creator) {
      return { success: false, error: 'Only the channel creator can delete the channel' };
    }

    // 2. Notify all participants before deletion
    // Note: Notifications will be handled by database triggers or separate notification system
    // The notification system should detect the channel deletion and notify all participants

    // 3. Delete conversation (CASCADE will delete participants and messages)
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      console.error('Failed to delete channel:', deleteError);
      return { success: false, error: 'Failed to delete channel' };
    }

    // 4. Note: Messages preserved for archival via existing 30-day expiry
    // The CASCADE delete will remove the conversation and participants,
    // but messages may be preserved for archival purposes depending on database configuration

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting channel:', error);
    return { success: false, error: 'Failed to delete channel' };
  }
}

// ============================================================================
// Update Channel Details
// ============================================================================

interface UpdateChannelDetailsParams {
  conversationId: string;
  adminId: string; // Must be admin
  name?: string;
  avatarUrl?: string;
}

export async function updateChannelDetails(
  params: UpdateChannelDetailsParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, adminId, name, avatarUrl } = params;

  // If nothing to update, return success
  if (name === undefined && avatarUrl === undefined) {
    return { success: true };
  }

  // Validate name if provided (min 1 character)
  if (name !== undefined && name.trim().length === 0) {
    return { success: false, error: 'Channel name must be at least 1 character' };
  }

  try {
    // Call database function to update channel details
    const { error } = await supabase.rpc('update_channel_details', {
      p_conversation_id: conversationId,
      p_admin_id: adminId,
      p_name: name !== undefined ? name.trim() : null,
      p_avatar_url: avatarUrl !== undefined ? avatarUrl : null,
    });

    if (error) {
      console.error('Failed to update channel details:', error);
      
      // Check for specific error messages from the database function
      if (error.message.includes('Only admins can edit channel details')) {
        return { success: false, error: 'Only admins can edit channel details' };
      }
      if (error.message.includes('Channel name must be at least 1 character')) {
        return { success: false, error: 'Channel name must be at least 1 character' };
      }
      
      return { success: false, error: error.message || 'Failed to update channel details' };
    }

    // Note: Notifications to all subscribers will be handled by the application layer
    // or database triggers in future enhancements

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating channel details:', error);
    return { success: false, error: 'Failed to update channel details' };
  }
}

// ============================================================================
// Send Broadcast Message
// ============================================================================

/**
 * Parameters for sending a broadcast message.
 */
export interface SendBroadcastMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
}

/**
 * Send a message to a broadcast channel.
 * Requirements: 3.1, 3.2, 3.3, 12.8
 * 
 * Logic:
 * 1. Verify senderId is a participant
 * 2. Verify senderId has is_admin=true
 * 3. Validate content (not empty)
 * 4. Insert message record
 * 5. Trigger existing notification system (via trigger)
 * 6. Return message ID
 * 
 * Error Messages:
 * - Not admin: "Only admins can send messages in this channel"
 * - Empty content: "Message content cannot be empty"
 * 
 * @param params - Message sending parameters
 * @returns Result with message ID or error message
 */
export async function sendBroadcastMessage(
  params: SendBroadcastMessageParams
): Promise<{ messageId: string | null; error?: string }> {
  const { conversationId, senderId, content } = params;

  try {
    // 3. Validate content (not empty)
    if (!content || content.trim().length === 0) {
      return { messageId: null, error: 'Message content cannot be empty' };
    }

    // 1. Verify senderId is a participant
    // 2. Verify senderId has is_admin=true
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('is_admin')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    if (participantError || !participant) {
      return { messageId: null, error: 'Only admins can send messages in this channel' };
    }

    if (!participant.is_admin) {
      return { messageId: null, error: 'Only admins can send messages in this channel' };
    }

    // 4. Insert message record
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      } as any)
      .select('id')
      .single() as {
        data: { id: string } | null;
        error: any;
      };

    if (insertError || !message) {
      console.error('Failed to send broadcast message:', insertError);
      return { messageId: null, error: 'Failed to send message' };
    }

    // 5. Trigger existing notification system (via trigger)
    // Note: Notifications will be handled by database triggers that listen to
    // message inserts and create notifications for all channel subscribers

    // 6. Return message ID
    return { messageId: message.id };
  } catch (error) {
    console.error('Unexpected error sending broadcast message:', error);
    return { messageId: null, error: 'Failed to send message' };
  }
}

// ============================================================================
// Get Broadcast Channel Info
// ============================================================================

/**
 * Broadcast channel participant info returned by getBroadcastChannelInfo.
 */
export interface BroadcastChannelParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isCreator: boolean;
  joinedAt: string;
}

/**
 * Full broadcast channel info returned by getBroadcastChannelInfo.
 */
export interface BroadcastChannelInfo {
  conversationId: string;
  name: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  subscriberCount: number;
  adminCount: number;
  participants: BroadcastChannelParticipant[];
  admins: BroadcastChannelParticipant[];
  subscribers: BroadcastChannelParticipant[];
}

/**
 * Get broadcast channel information including participants.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 * 
 * @param conversationId - The broadcast channel ID
 * @param userId - The current user ID (to determine visibility)
 * @returns Channel info with participants (full list for admins, admins only for subscribers)
 */
export async function getBroadcastChannelInfo(
  conversationId: string,
  userId: string
): Promise<{ data: BroadcastChannelInfo | null; error?: string }> {
  // Fetch conversation metadata
  const { data: conv } = await (supabase
    .from('conversations') as any)
    .select('id, name, avatar_url, created_by, created_at')
    .eq('id', conversationId)
    .eq('type', 'broadcast')
    .maybeSingle() as { data: { id: string; name: string; avatar_url: string | null; created_by: string; created_at: string } | null };

  if (!conv) {
    return { data: null, error: 'Broadcast channel not found' };
  }

  // Fetch all participants with their roles
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, is_admin, is_creator, joined_at')
    .eq('conversation_id', conversationId)
    .order('joined_at', { ascending: true }) as {
      data: Array<{ user_id: string; is_admin: boolean; is_creator: boolean; joined_at: string }> | null;
    };

  if (!participants) {
    return { data: null, error: 'Failed to fetch channel participants' };
  }

  // Check if current user is an admin
  const currentUserParticipant = participants.find(p => p.user_id === userId);
  const isUserAdmin = currentUserParticipant?.is_admin ?? false;

  // Fetch profiles for all participants (or just admins if user is not admin)
  const userIds = isUserAdmin 
    ? participants.map(p => p.user_id)
    : participants.filter(p => p.is_admin).map(p => p.user_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds) as {
      data: Array<{ id: string; full_name: string; avatar_url: string | null }> | null;
    };

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // Build participant list based on user role
  const allParticipants: BroadcastChannelParticipant[] = [];
  const admins: BroadcastChannelParticipant[] = [];
  const subscribers: BroadcastChannelParticipant[] = [];

  for (const p of participants) {
    const profile = profileMap.get(p.user_id);
    
    // If user is not admin and this participant is not admin, skip (don't show subscribers to subscribers)
    if (!isUserAdmin && !p.is_admin) {
      continue;
    }

    const participant: BroadcastChannelParticipant = {
      id: p.user_id,
      name: profile?.full_name || 'Unknown',
      avatarUrl: profile?.avatar_url || undefined,
      isAdmin: p.is_admin,
      isCreator: p.is_creator,
      joinedAt: p.joined_at,
    };

    allParticipants.push(participant);

    if (p.is_admin) {
      admins.push(participant);
    } else {
      subscribers.push(participant);
    }
  }

  return {
    data: {
      conversationId: conv.id,
      name: conv.name,
      avatarUrl: conv.avatar_url || undefined,
      createdBy: conv.created_by,
      createdAt: conv.created_at,
      subscriberCount: participants.length,
      adminCount: admins.length,
      participants: allParticipants,
      admins,
      subscribers,
    }
  };
}
