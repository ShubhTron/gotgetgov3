// Connection request types — placeholder for future implementation
export type ConnectionRequestStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: ConnectionRequestStatus;
  message?: string | null;
  created_at: string;
  updated_at: string;
}
