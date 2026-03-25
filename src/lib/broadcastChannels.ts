/**
 * Broadcast Channels using Supabase Realtime Broadcast
 * 
 * This implementation follows Supabase best practices:
 * - Uses Realtime Broadcast for low-latency message delivery
 * - Stores channel metadata in database (conversations table)
 * - Uses private channels with RLS authorization
 * - Messages are ephemeral (can optionally persist with triggers)
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BroadcastChannel {
  id: string;
  name: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  subscriberCount: number;
  admins: string[];
  subscribers: string[];
}

export interface BroadcastMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
}

// ─── Channel Management ─────────────────────────────────────────────────────

/**
 * Create a new broadcast channel.
 * Channel metadata is stored in database, messages use Realtime Broadcast.
 */
export async function createBroadcastChannel(params: {
  name: string;
  avatarUrl?: string;
  creatorId: string;
  subscriberIds: string[];
}): Promise<{ channelId: string | null; error?: string }> {
  const { name, avatarUrl, creatorId, subscriberIds } = params;

  console.log('🚀 [createBroadcastChannel] Creating channel with Realtime Broadcast');

  // Validate
  if (!name?.trim()) {
    return { channelId: null, error: 'Channel name required' };
  }
  if (subscriberIds.length < 1 || subscriberIds.length > 500) {
    return { channelId: null, error: 'Must have 1-500 subscribers' };
  }

  try {
    // Create conversation record for metadata
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'broadcast',
        name: name.trim(),
        avatar_url: avatarUrl || null,
        created_by: creatorId,
      })
      .select('id')
      .single();

    if (convError || !conversation) {
      console.error('Failed to create channel:', convError);
      return { channelId: null, error: 'Failed to create channel' };
    }

    const channelId = conversation.id;

    // Add creator as admin
    const { error: creatorError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: channelId,
        user_id: creatorId,
        is_admin: true,
        is_creator: true,
      });

    if (creatorError) {
      console.error('Failed to add creator:', creatorError);
      await supabase.from('conversations').delete().eq('id', channelId);
      return { channelId: null, error: 'Failed to create channel' };
    }

    // Add subscribers
    const subscriberParticipants = subscriberIds.map(id => ({
      conversation_id: channelId,
      user_id: id,
      is_admin: false,
      is_creator: false,
    }));

    const { error: subscribersError } = await supabase
      .from('conversation_participants')
      .insert(subscriberParticipants);

    if (subscribersError) {
      console.error('Failed to add subscribers:', subscribersError);
      await supabase.from('conversations').delete().eq('id', channelId);
      return { channelId: null, error: 'Failed to create channel' };
    }

    console.log('✅ Channel created:', channelId);
    return { channelId };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { channelId: null, error: 'Failed to create channel' };
  }
}

/**
 * Get channel metadata and participant info.
 */
export async function getBroadcastChannel(channelId: string): Promise<BroadcastChannel | null> {
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, name, avatar_url, created_by, created_at')
    .eq('id', channelId)
    .eq('type', 'broadcast')
    .single();

  if (!conv) return null;

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, is_admin')
    .eq('conversation_id', channelId);

  if (!participants) return null;

  const admins = participants.filter(p => p.is_admin).map(p => p.user_id);
  const subscribers = participants.filter(p => !p.is_admin).map(p => p.user_id);

  return {
    id: conv.id,
    name: conv.name,
    avatarUrl: conv.avatar_url || undefined,
    createdBy: conv.created_by,
    createdAt: conv.created_at,
    subscriberCount: participants.length,
    admins,
    subscribers,
  };
}

/**
 * Check if a user is an admin of a channel.
 */
export async function isChannelAdmin(channelId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('conversation_participants')
    .select('is_admin')
    .eq('conversation_id', channelId)
    .eq('user_id', userId)
    .single();

  return data?.is_admin ?? false;
}

// ─── Realtime Broadcast Messaging ───────────────────────────────────────────

/**
 * Subscribe to broadcast messages from a channel.
 * Uses Supabase Realtime Broadcast for low-latency delivery.
 */
export function subscribeToBroadcastChannel(
  channelId: string,
  userId: string,
  onMessage: (message: BroadcastMessage) => void
): RealtimeChannel {
  console.log(`📡 [subscribeToBroadcastChannel] Subscribing to channel:${channelId}`);

  // Create a private channel with authorization
  const channel = supabase.channel(`broadcast:${channelId}`, {
    config: {
      private: true, // Requires RLS authorization
      broadcast: {
        self: false, // Don't send messages back to sender
      },
    },
  });

  // Listen for broadcast messages
  channel
    .on('broadcast', { event: 'message' }, (payload) => {
      console.log('📨 Received broadcast message:', payload);
      
      const msg = payload.payload as BroadcastMessage;
      onMessage(msg);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to broadcast channel:', channelId);
        // Set auth token for private channel authorization
        await supabase.realtime.setAuth(supabase.auth.session()?.access_token);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel subscription error');
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Channel subscription timed out');
      }
    });

  return channel;
}

/**
 * Send a broadcast message to a channel.
 * Only admins can send messages.
 */
export async function sendBroadcastMessage(
  channelId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  content: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📤 [sendBroadcastMessage] Sending to channel:${channelId}`);

  // Verify sender is an admin
  const isAdmin = await isChannelAdmin(channelId, senderId);
  if (!isAdmin) {
    console.error('❌ User is not an admin');
    return { success: false, error: 'Only admins can send messages' };
  }

  // Create message object
  const message: BroadcastMessage = {
    id: crypto.randomUUID(),
    channelId,
    senderId,
    senderName,
    senderAvatar,
    content,
    timestamp: new Date().toISOString(),
  };

  // Get the channel
  const channel = supabase.channel(`broadcast:${channelId}`);

  // Send the message via broadcast
  const response = await channel
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'message',
          payload: message,
        });
      }
    });

  // Clean up the temporary channel after sending
  setTimeout(() => {
    supabase.removeChannel(channel);
  }, 1000);

  console.log('✅ Message sent');
  return { success: true };
}

/**
 * Unsubscribe from a broadcast channel.
 */
export function unsubscribeFromBroadcastChannel(channel: RealtimeChannel): void {
  console.log('🔌 Unsubscribing from broadcast channel');
  channel.unsubscribe();
  supabase.removeChannel(channel);
}

// ─── Admin Management ───────────────────────────────────────────────────────

/**
 * Promote a subscriber to admin.
 */
export async function promoteToAdmin(
  channelId: string,
  adminId: string,
  subscriberId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify requester is admin
  const isAdmin = await isChannelAdmin(channelId, adminId);
  if (!isAdmin) {
    return { success: false, error: 'Only admins can promote subscribers' };
  }

  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_admin: true })
    .eq('conversation_id', channelId)
    .eq('user_id', subscriberId);

  if (error) {
    console.error('Failed to promote subscriber:', error);
    return { success: false, error: 'Failed to promote subscriber' };
  }

  return { success: true };
}

/**
 * Demote an admin to subscriber.
 */
export async function demoteFromAdmin(
  channelId: string,
  adminId: string,
  targetAdminId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify requester is admin
  const isAdmin = await isChannelAdmin(channelId, adminId);
  if (!isAdmin) {
    return { success: false, error: 'Only admins can demote admins' };
  }

  // Check if target is creator
  const { data: target } = await supabase
    .from('conversation_participants')
    .select('is_creator')
    .eq('conversation_id', channelId)
    .eq('user_id', targetAdminId)
    .single();

  if (target?.is_creator) {
    return { success: false, error: 'Cannot demote the channel creator' };
  }

  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_admin: false })
    .eq('conversation_id', channelId)
    .eq('user_id', targetAdminId);

  if (error) {
    console.error('Failed to demote admin:', error);
    return { success: false, error: 'Failed to demote admin' };
  }

  return { success: true };
}

// ─── Subscriber Management ──────────────────────────────────────────────────

/**
 * Add a subscriber to a channel.
 */
export async function addSubscriber(
  channelId: string,
  adminId: string,
  newSubscriberId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isChannelAdmin(channelId, adminId);
  if (!isAdmin) {
    return { success: false, error: 'Only admins can add subscribers' };
  }

  // Check if already a participant
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', channelId)
    .eq('user_id', newSubscriberId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'User is already a subscriber' };
  }

  // Check subscriber limit
  const { count } = await supabase
    .from('conversation_participants')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', channelId);

  if (count && count >= 500) {
    return { success: false, error: 'Channel has reached maximum of 500 subscribers' };
  }

  const { error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: channelId,
      user_id: newSubscriberId,
      is_admin: false,
      is_creator: false,
    });

  if (error) {
    console.error('Failed to add subscriber:', error);
    return { success: false, error: 'Failed to add subscriber' };
  }

  return { success: true };
}

/**
 * Remove a subscriber from a channel.
 */
export async function removeSubscriber(
  channelId: string,
  adminId: string,
  subscriberId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isChannelAdmin(channelId, adminId);
  if (!isAdmin) {
    return { success: false, error: 'Only admins can remove subscribers' };
  }

  // Check if target is admin
  const { data: target } = await supabase
    .from('conversation_participants')
    .select('is_admin')
    .eq('conversation_id', channelId)
    .eq('user_id', subscriberId)
    .single();

  if (target?.is_admin) {
    return { success: false, error: 'Cannot remove admins. Demote them first.' };
  }

  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', channelId)
    .eq('user_id', subscriberId);

  if (error) {
    console.error('Failed to remove subscriber:', error);
    return { success: false, error: 'Failed to remove subscriber' };
  }

  return { success: true };
}

/**
 * Leave a broadcast channel.
 */
export async function leaveChannel(
  channelId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('is_creator, is_admin')
    .eq('conversation_id', channelId)
    .eq('user_id', userId)
    .single();

  if (!participant) {
    return { success: false, error: 'You are not a member of this channel' };
  }

  // If creator, handle transfer or deletion
  if (participant.is_creator) {
    const { data: otherAdmins } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', channelId)
      .eq('is_admin', true)
      .neq('user_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (otherAdmins && otherAdmins.length > 0) {
      // Transfer creator status
      await supabase
        .from('conversation_participants')
        .update({ is_creator: true })
        .eq('conversation_id', channelId)
        .eq('user_id', otherAdmins[0].user_id);
    } else {
      // Delete the channel
      await supabase.from('conversations').delete().eq('id', channelId);
      return { success: true };
    }
  }

  // Remove participant
  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', channelId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to leave channel:', error);
    return { success: false, error: 'Failed to leave channel' };
  }

  return { success: true };
}
