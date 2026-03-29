// Connection request types
export type ConnectionRequestStatus = 'pending' | 'accepted' | 'declined' | 'rejected' | 'cancelled';

export interface ConnectionRequest {
  id: string;
  // DB column names (snake_case)
  from_user_id?: string;
  to_user_id?: string;
  // New DB schema field names
  requester_id?: string;
  recipient_id?: string;
  // camelCase aliases used by API layer
  requesterId: string;
  recipientId: string;
  status: ConnectionRequestStatus;
  message?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt?: string | null;
}

export interface ConnectionRequestWithProfile extends ConnectionRequest {
  requesterProfile?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  recipientProfile?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface CreateConnectionRequestResponse {
  success: boolean;
  data?: ConnectionRequest;
  error?: string;
}

export interface ConnectionRequestListResponse {
  success: boolean;
  data?: ConnectionRequestWithProfile[];
  error?: string;
}

export interface AcceptConnectionRequestResponse {
  success: boolean;
  data?: {
    connectionId: string;
    requestId: string;
  };
  error?: string;
}

export interface RejectConnectionRequestResponse {
  success: boolean;
  error?: string;
}

export interface CancelConnectionRequestResponse {
  success: boolean;
  error?: string;
}
