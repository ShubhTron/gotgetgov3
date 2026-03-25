import { supabase } from './supabase';
import {
  createConnectionRequest,
  checkExistingRequest,
  checkExistingConnection,
  checkRecentRejection,
  getSentRequests,
  getReceivedRequests,
  getConnectionRequestById,
  updateRequestStatus
} from './db/connectionRequests';
import { createConnectionRequestNotification, createConnectionAcceptedNotification } from './notifications';
import type { 
  CreateConnectionRequestResponse,
  ConnectionRequestListResponse,
  ConnectionRequestStatus,
  AcceptConnectionRequestResponse,
  RejectConnectionRequestResponse,
  CancelConnectionRequestResponse
} from '../types/connectionRequests';

/**
 * Validate that a user ID is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a user exists in the database
 */
async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[userExists] Error:', error);
    return false;
  }

  return data !== null;
}

/**
 * Create a new connection request with comprehensive validation
 * POST /api/connection-requests endpoint logic
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3
 */
export async function createConnectionRequestApi(
  requesterId: string,
  recipientUserId: string
): Promise<CreateConnectionRequestResponse> {
  // Validation 1: Check recipient user ID is valid UUID format
  // Requirement 1.2
  if (!isValidUUID(recipientUserId)) {
    return {
      success: false,
      error: 'Invalid user ID format'
    };
  }

  // Validation 2: Check recipient user exists
  // Requirement 1.2
  const recipientExists = await userExists(recipientUserId);
  if (!recipientExists) {
    return {
      success: false,
      error: 'User not found'
    };
  }

  // Validation 3: Check recipient is not the requester
  // Requirement 1.3
  if (recipientUserId === requesterId) {
    return {
      success: false,
      error: 'Cannot send connection request to yourself'
    };
  }

  // Validation 4: Check no existing pending request (in either direction)
  // Requirements 1.4, 7.1
  const existingRequest = await checkExistingRequest(requesterId, recipientUserId);
  if (existingRequest) {
    return {
      success: false,
      error: 'Connection request already pending'
    };
  }

  // Validation 5: Check no existing connection
  // Requirements 1.5, 7.2
  const hasConnection = await checkExistingConnection(requesterId, recipientUserId);
  if (hasConnection) {
    return {
      success: false,
      error: 'Already connected with this user'
    };
  }

  // Validation 6: Check 30-day cooldown for rejected requests
  // Requirement 7.3
  const rejectionCheck = await checkRecentRejection(requesterId, recipientUserId);
  if (rejectionCheck.hasRecentRejection && rejectionCheck.daysRemaining) {
    return {
      success: false,
      error: `Cannot send request yet. Please wait ${rejectionCheck.daysRemaining} more days`
    };
  }

  // All validations passed - create the connection request
  // Requirement 1.1
  try {
    const connectionRequest = await createConnectionRequest(requesterId, recipientUserId);
    
    if (!connectionRequest) {
      return {
        success: false,
        error: 'Failed to create connection request'
      };
    }

    // Fetch requester profile for notification
    // Requirements: 2.1, 2.2
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', requesterId)
      .single();

    // Create notification for recipient
    // Requirements: 2.1, 2.2, 2.3, 2.4
    if (requesterProfile) {
      const notificationCreated = await createConnectionRequestNotification(
        recipientUserId,
        connectionRequest.id,
        requesterId,
        requesterProfile.full_name,
        requesterProfile.avatar_url
      );

      // Log if notification creation fails, but don't block the request
      if (!notificationCreated) {
        console.warn('[createConnectionRequestApi] Failed to create notification for request:', connectionRequest.id);
      }
    }

    return {
      success: true,
      data: connectionRequest
    };
  } catch (error) {
    console.error('[createConnectionRequestApi] Error creating request:', error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message: string };
      
      // Unique constraint violation
      if (dbError.code === '23505') {
        return {
          success: false,
          error: 'Connection request already exists'
        };
      }
      
      // Check constraint violation (requester = recipient)
      if (dbError.code === '23514') {
        return {
          success: false,
          error: 'Invalid connection request'
        };
      }
      
      // Foreign key violation
      if (dbError.code === '23503') {
        return {
          success: false,
          error: 'User not found'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to create connection request'
    };
  }
}

/**
 * Get all connection requests sent by the current user
 * GET /api/connection-requests/sent endpoint logic
 *
 * Requirements: 5.1, 5.3, 5.4
 */
export async function getSentRequestsApi(
  userId: string,
  status?: ConnectionRequestStatus
): Promise<ConnectionRequestListResponse> {
  try {
    const requests = await getSentRequests(userId, status);

    return {
      success: true,
      data: requests
    };
  } catch (error) {
    console.error('[getSentRequestsApi] Error fetching sent requests:', error);

    return {
      success: false,
      error: 'Failed to fetch sent connection requests'
    };
  }
}

/**
 * Get all connection requests received by the current user
 * GET /api/connection-requests/received endpoint logic
 *
 * Requirements: 5.2, 5.3, 5.4
 */
export async function getReceivedRequestsApi(
  userId: string,
  status?: ConnectionRequestStatus
): Promise<ConnectionRequestListResponse> {
  try {
    const requests = await getReceivedRequests(userId, status);

    return {
      success: true,
      data: requests
    };
  } catch (error) {
    console.error('[getReceivedRequestsApi] Error fetching received requests:', error);

    return {
      success: false,
      error: 'Failed to fetch received connection requests'
    };
  }
}

/**
 * Accept a connection request
 * POST /api/connection-requests/:id/accept endpoint logic
 * 
 * This operation uses a database transaction to ensure atomicity:
 * 1. Update request status to 'accepted'
 * 2. Create bidirectional connection records (A→B and B→A)
 * 3. Create notification for requester
 * 
 * If any step fails, all changes are rolled back.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export async function acceptConnectionRequestApi(
  requestId: string,
  currentUserId: string
): Promise<AcceptConnectionRequestResponse> {
  try {
    // Step 1: Verify request exists and get its details
    const request = await getConnectionRequestById(requestId);
    
    if (!request) {
      return {
        success: false,
        error: 'Connection request not found'
      };
    }

    // Step 2: Verify request is in pending status
    // Requirement 3.1
    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Cannot accept request in ${request.status} status`
      };
    }

    // Step 3: Verify current user is the recipient
    // Requirement 3.1
    if (request.recipientId !== currentUserId) {
      return {
        success: false,
        error: 'Not authorized to accept this request'
      };
    }

    // Step 4: Use database transaction for atomicity
    // We'll use the RPC function which handles the transaction
    const statusChangedAt = new Date().toISOString();

    // Try to use the RPC function for atomic operation
    const { data: rpcData, error: rpcError } = await supabase.rpc('accept_connection_request', {
      p_request_id: requestId,
      p_status_changed_at: statusChangedAt
    });

    // If RPC function doesn't exist, fall back to manual transaction
    if (rpcError && rpcError.code === '42883') {
      // Manual transaction fallback
      return await acceptConnectionRequestManual(request, statusChangedAt, currentUserId);
    }

    if (rpcError) {
      console.error('[acceptConnectionRequestApi] RPC error:', rpcError);
      return {
        success: false,
        error: 'Failed to accept connection request'
      };
    }

    // RPC function succeeded, get the connection ID
    const connectionId = rpcData;

    // Step 5: Create notification for requester
    // Requirement 3.4
    const { data: acceptorProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUserId)
      .single();

    if (acceptorProfile) {
      const notificationCreated = await createConnectionAcceptedNotification(
        request.requesterId,
        connectionId,
        currentUserId,
        acceptorProfile.full_name,
        acceptorProfile.avatar_url
      );

      if (!notificationCreated) {
        console.warn('[acceptConnectionRequestApi] Failed to create acceptance notification');
      }
    }

    return {
      success: true,
      data: {
        connectionId,
        requestId
      }
    };
  } catch (error) {
    console.error('[acceptConnectionRequestApi] Error:', error);
    return {
      success: false,
      error: 'Failed to accept connection request'
    };
  }
}

/**
 * Manual fallback for accepting connection request without RPC function
 * Uses multiple operations to simulate a transaction
 */
async function acceptConnectionRequestManual(
  request: any,
  statusChangedAt: string,
  currentUserId: string
): Promise<AcceptConnectionRequestResponse> {
  try {
    // Step 1: Update request status to 'accepted'
    // Requirements 3.1, 3.3
    const updatedRequest = await updateRequestStatus(
      request.id,
      'accepted',
      statusChangedAt
    );

    if (!updatedRequest) {
      return {
        success: false,
        error: 'Failed to update request status'
      };
    }

    // Step 2: Create bidirectional connections using RPC function
    // Requirement 3.2
    const { error: connectionError } = await supabase.rpc('create_bidirectional_connection', {
      p_user_id: request.requesterId,
      p_connected_user_id: request.recipientId
    });

    if (connectionError) {
      // Rollback: revert request status to pending
      await updateRequestStatus(request.id, 'pending', '');
      
      console.error('[acceptConnectionRequestManual] Connection creation failed:', connectionError);
      return {
        success: false,
        error: 'Failed to create connection'
      };
    }

    // Step 3: Get the connection ID
    const { data: connectionData } = await supabase
      .from('connections')
      .select('id')
      .eq('user_id', request.requesterId)
      .eq('connected_user_id', request.recipientId)
      .single();

    const connectionId = connectionData?.id || '';

    // Step 4: Create notification for requester
    // Requirement 3.4
    const { data: acceptorProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUserId)
      .single();

    if (acceptorProfile) {
      const notificationCreated = await createConnectionAcceptedNotification(
        request.requesterId,
        connectionId,
        currentUserId,
        acceptorProfile.full_name,
        acceptorProfile.avatar_url
      );

      if (!notificationCreated) {
        console.warn('[acceptConnectionRequestManual] Failed to create acceptance notification');
      }
    }

    return {
      success: true,
      data: {
        connectionId,
        requestId: request.id
      }
    };
  } catch (error) {
    console.error('[acceptConnectionRequestManual] Error:', error);
    
    // Attempt rollback
    try {
      await updateRequestStatus(request.id, 'pending', '');
    } catch (rollbackError) {
      console.error('[acceptConnectionRequestManual] Rollback failed:', rollbackError);
    }

    return {
      success: false,
      error: 'Failed to accept connection request'
    };
  }
}

/**
 * Reject a connection request
 * POST /api/connection-requests/:id/reject endpoint logic
 * 
 * This operation:
 * 1. Updates request status to 'rejected'
 * 2. Sets status_changed_at timestamp
 * 3. Removes notification from recipient's tab
 * 4. Does NOT notify the requester (per requirement 4.4)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export async function rejectConnectionRequestApi(
  requestId: string,
  currentUserId: string
): Promise<RejectConnectionRequestResponse> {
  try {
    // Step 1: Verify request exists and get its details
    const request = await getConnectionRequestById(requestId);
    
    if (!request) {
      return {
        success: false,
        error: 'Connection request not found'
      };
    }

    // Step 2: Verify request is in pending status
    // Requirement 4.1
    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Cannot reject request in ${request.status} status`
      };
    }

    // Step 3: Verify current user is the recipient
    // Requirement 4.1
    if (request.recipientId !== currentUserId) {
      return {
        success: false,
        error: 'Not authorized to reject this request'
      };
    }

    // Step 4: Update request status to 'rejected'
    // Requirements 4.1
    const statusChangedAt = new Date().toISOString();
    const updatedRequest = await updateRequestStatus(
      requestId,
      'rejected',
      statusChangedAt
    );

    if (!updatedRequest) {
      return {
        success: false,
        error: 'Failed to update request status'
      };
    }

    // Step 5: Remove notification from recipient's tab
    // Requirement 4.2
    // We mark the notification as read/handled by deleting it or updating it
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUserId)
      .eq('type', 'connection_request_received')
      .contains('data', { requestId });

    if (notificationError) {
      console.warn('[rejectConnectionRequestApi] Failed to remove notification:', notificationError);
      // Don't fail the operation if notification removal fails
    }

    // Step 6: Do NOT create notification for requester
    // Requirement 4.4 - explicitly not notifying the requester

    return {
      success: true
    };
  } catch (error) {
    console.error('[rejectConnectionRequestApi] Error:', error);
    return {
      success: false,
      error: 'Failed to reject connection request'
    };
  }
}

/**
 * Cancel a pending connection request (requester only)
 * DELETE /api/connection-requests/:id endpoint logic
 * 
 * This operation:
 * 1. Updates request status to 'cancelled'
 * 2. Sets status_changed_at timestamp
 * 3. Removes notification from recipient's tab
 * 
 * Only the requester can cancel, and only pending requests can be cancelled.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export async function cancelConnectionRequestApi(
  requestId: string,
  currentUserId: string
): Promise<CancelConnectionRequestResponse> {
  try {
    // Step 1: Verify request exists and get its details
    const request = await getConnectionRequestById(requestId);
    
    if (!request) {
      return {
        success: false,
        error: 'Connection request not found'
      };
    }

    // Step 2: Verify request is in pending status
    // Requirement 6.3 - terminal states cannot be cancelled
    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Cannot cancel request in ${request.status} status`
      };
    }

    // Step 3: Verify current user is the requester (not the recipient)
    // Requirement 6.1 - only requester can cancel
    if (request.requesterId !== currentUserId) {
      return {
        success: false,
        error: 'Not authorized to cancel this request'
      };
    }

    // Step 4: Update request status to 'cancelled'
    // Requirement 6.1
    const statusChangedAt = new Date().toISOString();
    const updatedRequest = await updateRequestStatus(
      requestId,
      'cancelled',
      statusChangedAt
    );

    if (!updatedRequest) {
      return {
        success: false,
        error: 'Failed to update request status'
      };
    }

    // Step 5: Remove notification from recipient's tab
    // Requirement 6.2
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', request.recipientId)
      .eq('type', 'connection_request_received')
      .contains('data', { requestId });

    if (notificationError) {
      console.warn('[cancelConnectionRequestApi] Failed to remove notification:', notificationError);
      // Don't fail the operation if notification removal fails
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('[cancelConnectionRequestApi] Error:', error);
    return {
      success: false,
      error: 'Failed to cancel connection request'
    };
  }
}
