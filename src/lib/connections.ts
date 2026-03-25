import { supabase } from './supabase';

/**
 * Creates a connection between two users
 * Prevents duplicate connections and self-connections
 * Creates bidirectional connections for messaging compatibility
 * 
 * @param userId - The ID of the user initiating the connection
 * @param connectedUserId - The ID of the user to connect with
 * @returns Object with success status and optional error message
 */
export async function createConnection(
  userId: string,
  connectedUserId: string
): Promise<{ success: boolean; error?: string }> {
  // Prevent self-connection
  if (userId === connectedUserId) {
    return { success: false, error: 'Cannot connect with yourself' };
  }

  // Check if connection already exists (bidirectional check)
  const { data: existing } = await supabase
    .from('connections')
    .select('id, status')
    .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${userId})`)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Connection already exists' };
  }

  // Try to use SECURITY DEFINER function first (if available after migration)
  const { error: rpcError } = await supabase.rpc('create_bidirectional_connection', {
    p_user_id: userId,
    p_connected_user_id: connectedUserId,
  });

  if (!rpcError) {
    return { success: true };
  }

  // Fallback: Create bidirectional connections manually
  // This ensures compatibility even if the function isn't available yet
  const { error: error1 } = await supabase
    .from('connections')
    .insert({
      user_id: userId,
      connected_user_id: connectedUserId,
      status: 'accepted',
    });

  if (error1) {
    return { success: false, error: error1.message };
  }

  // Create reverse connection
  const { error: error2 } = await supabase
    .from('connections')
    .insert({
      user_id: connectedUserId,
      connected_user_id: userId,
      status: 'accepted',
    });

  if (error2) {
    // If reverse connection fails, try to clean up the first one
    await supabase
      .from('connections')
      .delete()
      .eq('user_id', userId)
      .eq('connected_user_id', connectedUserId);
    
    return { success: false, error: error2.message };
  }

  return { success: true };
}

/**
 * Checks the connection status between two users
 * Queries bidirectionally to find connections in either direction
 * 
 * @param userId - The ID of the first user
 * @param targetUserId - The ID of the second user
 * @returns Connection status: 'none', 'pending', or 'accepted'
 */
export async function getConnectionStatus(
  userId: string,
  targetUserId: string
): Promise<'none' | 'pending' | 'accepted'> {
  // Check accepted connections in the connections table
  const { data: connData } = await supabase
    .from('connections')
    .select('status')
    .or(`and(user_id.eq.${userId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${userId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (connData) return 'accepted';

  // Check pending connection requests in either direction
  const { data: reqData } = await supabase
    .from('connection_requests')
    .select('status')
    .or(`and(requester_id.eq.${userId},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${userId})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (reqData) return 'pending';

  return 'none';
}
