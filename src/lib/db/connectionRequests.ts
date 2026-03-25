import { supabase } from '../supabase';
import type { ConnectionRequest, ConnectionRequestWithProfile } from '../../types/connectionRequests';

/**
 * Create a new connection request
 * Requirements: 1.1
 */
export async function createConnectionRequest(
  requesterId: string,
  recipientId: string
): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('[createConnectionRequest] Error:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    requesterId: data.requester_id,
    recipientId: data.recipient_id,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    statusChangedAt: data.status_changed_at
  };
}

/**
 * Get a connection request by ID
 * Requirements: 3.1, 4.1, 6.1
 */
export async function getConnectionRequestById(
  id: string
): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getConnectionRequestById] Error:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    requesterId: data.requester_id,
    recipientId: data.recipient_id,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    statusChangedAt: data.status_changed_at
  };
}

/**
 * Get all connection requests sent by a user
 * Requirements: 5.1
 */
export async function getSentRequests(
  userId: string,
  status?: string
): Promise<ConnectionRequestWithProfile[]> {
  let query = supabase
    .from('connection_requests')
    .select(`
      *,
      recipient:profiles!connection_requests_recipient_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('requester_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[getSentRequests] Error:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.id,
    requesterId: item.requester_id,
    recipientId: item.recipient_id,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    statusChangedAt: item.status_changed_at,
    recipientProfile: item.recipient ? {
      id: item.recipient.id,
      fullName: item.recipient.full_name,
      avatarUrl: item.recipient.avatar_url
    } : undefined
  }));
}

/**
 * Get all connection requests received by a user
 * Requirements: 5.2
 */
export async function getReceivedRequests(
  userId: string,
  status?: string
): Promise<ConnectionRequestWithProfile[]> {
  let query = supabase
    .from('connection_requests')
    .select(`
      *,
      requester:profiles!connection_requests_requester_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('recipient_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[getReceivedRequests] Error:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.id,
    requesterId: item.requester_id,
    recipientId: item.recipient_id,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    statusChangedAt: item.status_changed_at,
    requesterProfile: item.requester ? {
      id: item.requester.id,
      fullName: item.requester.full_name,
      avatarUrl: item.requester.avatar_url
    } : undefined
  }));
}

/**
 * Update the status of a connection request
 * Requirements: 3.1, 4.1, 6.1
 */
export async function updateRequestStatus(
  id: string,
  status: string,
  statusChangedAt: string
): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from('connection_requests')
    .update({
      status,
      status_changed_at: statusChangedAt
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateRequestStatus] Error:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    requesterId: data.requester_id,
    recipientId: data.recipient_id,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    statusChangedAt: data.status_changed_at
  };
}

/**
 * Check if a connection request exists between two users (in either direction)
 * Requirements: 1.4, 7.1
 */
export async function checkExistingRequest(
  userId1: string,
  userId2: string
): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error('[checkExistingRequest] Error:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    requesterId: data.requester_id,
    recipientId: data.recipient_id,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    statusChangedAt: data.status_changed_at
  };
}

/**
 * Check if a connection exists between two users (in either direction)
 * Requirements: 1.5, 7.2
 */
export async function checkExistingConnection(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .or(`and(user_id.eq.${userId1},connected_user_id.eq.${userId2}),and(user_id.eq.${userId2},connected_user_id.eq.${userId1})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (error) {
    console.error('[checkExistingConnection] Error:', error);
    return false;
  }

  return data !== null;
}

/**
 * Check if there was a recent rejection (within 30 days) between two users
 * Requirements: 7.3
 */
export async function checkRecentRejection(
  requesterId: string,
  recipientId: string
): Promise<{ hasRecentRejection: boolean; daysRemaining?: number }> {
  // Calculate the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('connection_requests')
    .select('status_changed_at')
    .eq('requester_id', requesterId)
    .eq('recipient_id', recipientId)
    .eq('status', 'rejected')
    .gte('status_changed_at', thirtyDaysAgo.toISOString())
    .order('status_changed_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('[checkRecentRejection] Error:', error);
    return { hasRecentRejection: false };
  }

  if (!data || !data.status_changed_at) {
    return { hasRecentRejection: false };
  }

  // Calculate days remaining in cooldown period
  const rejectionDate = new Date(data.status_changed_at);
  const now = new Date();
  const daysSinceRejection = Math.floor((now.getTime() - rejectionDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = 30 - daysSinceRejection;

  return {
    hasRecentRejection: daysRemaining > 0,
    daysRemaining: daysRemaining > 0 ? daysRemaining : undefined
  };
}
