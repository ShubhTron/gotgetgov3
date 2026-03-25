import { supabase } from './supabase';
import { createConnection } from './connections';
import { getOrCreateDirectConversation } from './messaging';
import type { NotificationType } from '../types/database';
import type { SwipeRightNotificationData } from '../types/swipeNotifications';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string | null,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
        read: false
      } as any);

    if (error) {
      console.error('[createNotification] Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[createNotification] Unexpected error:', error);
    return false;
  }
}

/**
 * Create a connection request received notification
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function createConnectionRequestNotification(
  recipientId: string,
  requestId: string,
  requesterId: string,
  requesterName: string,
  requesterAvatarUrl: string | null
): Promise<boolean> {
  return createNotification(
    recipientId,
    'connection_request_received',
    `${requesterName} wants to connect with you`,
    'View their profile and decide whether to accept',
    {
      requestId,
      requesterId,
      requesterName,
      requesterAvatarUrl
    }
  );
}

/**
 * Create a connection request accepted notification
 * Requirements: 3.4
 */
export async function createConnectionAcceptedNotification(
  requesterId: string,
  connectionId: string,
  acceptorId: string,
  acceptorName: string,
  acceptorAvatarUrl: string | null
): Promise<boolean> {
  return createNotification(
    requesterId,
    'connection_request_accepted',
    `${acceptorName} accepted your connection request`,
    'You can now message each other',
    {
      connectionId,
      acceptorId,
      acceptorName,
      acceptorAvatarUrl
    }
  );
}

/**
 * Accept a connection from a swipe_right_received notification.
 * - Creates a bidirectional connection
 * - Creates or retrieves a direct conversation
 * - Updates notification data with accepted state and conversation_id
 * - Sends confirmation notification to the swiper
 * Requirements: 3.1, 3.6, 5.1–5.5, 6.1, 6.3, 7.3, 9.1, 9.2, 11.2
 */
export async function acceptConnectionFromNotification(
  notificationId: string,
  currentUserId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    // Fetch and validate notification ownership + pending state
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', currentUserId)
      .single() as { data: any; error: any };

    if (fetchError || !notification) {
      return { success: false, error: 'Notification not found' };
    }

    const data = notification.data as unknown as SwipeRightNotificationData;
    if (data.connection_state !== 'pending') {
      return { success: false, error: 'Notification already processed' };
    }

    const swiperId = data.swiper_id;

    // Create bidirectional connection (handles race condition — succeeds even if exists)
    await createConnection(currentUserId, swiperId);

    // Get or create direct conversation
    const { conversationId, error: convError } = await getOrCreateDirectConversation(currentUserId, swiperId);
    if (convError || !conversationId) {
      return { success: false, error: convError ?? 'Failed to create conversation' };
    }

    // Update notification data to accepted state
    const updatedData: SwipeRightNotificationData = {
      ...data,
      connection_state: 'accepted',
      conversation_id: conversationId,
    };

    const { error: updateError } = await (supabase.from('notifications') as any)
      .update({ data: updatedData })
      .eq('id', notificationId);

    if (updateError) {
      console.error('[acceptConnectionFromNotification] Update error:', updateError);
      return { success: false, error: 'Failed to update notification' };
    }

    // Fetch target user's profile for the confirmation notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUserId)
      .single() as { data: any; error: any };

    const targetName = (profile as any)?.full_name ?? 'Someone';
    const targetAvatarUrl = (profile as any)?.avatar_url ?? null;

    // Notify the swiper that their connection was accepted
    await createNotification(
      swiperId,
      'connection_request_accepted',
      `You and ${targetName} are connected`,
      'You can now message each other',
      {
        acceptorId: currentUserId,
        acceptorName: targetName,
        acceptorAvatarUrl: targetAvatarUrl,
        connectionId: conversationId,
        conversation_id: conversationId,
      }
    );

    return { success: true, conversationId };
  } catch (err) {
    console.error('[acceptConnectionFromNotification] Unexpected error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a connection from a swipe_right_received notification.
 * Deletes the notification — does NOT notify the swiper.
 * Requirements: 4.1–4.4, 7.4
 */
export async function rejectConnectionFromNotification(
  notificationId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch and validate notification ownership + pending state
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, data')
      .eq('id', notificationId)
      .eq('user_id', currentUserId)
      .single() as { data: any; error: any };

    if (fetchError || !notification) {
      return { success: false, error: 'Notification not found' };
    }

    const data = (notification as any).data as unknown as SwipeRightNotificationData;
    if (data.connection_state !== 'pending') {
      return { success: false, error: 'Notification already processed' };
    }

    // Delete the notification so it no longer appears in the tab
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      console.error('[rejectConnectionFromNotification] Delete error:', deleteError);
      return { success: false, error: 'Failed to remove notification' };
    }

    return { success: true };
  } catch (err) {
    console.error('[rejectConnectionFromNotification] Unexpected error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
