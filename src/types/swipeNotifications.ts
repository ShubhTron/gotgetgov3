// Swipe Right Notification Types

/**
 * Data structure for swipe_right_received notifications
 * Requirements: 2.4, 7.1, 11.1
 */
export interface SwipeRightNotificationData {
  swiper_id: string;       // UUID of the user who swiped right
  target_user_id: string;  // UUID of the user who received the swipe (notification owner)
  sport: string;           // Sport context (e.g., 'tennis', 'padel')
  connection_state: 'pending' | 'accepted' | 'rejected';
  conversation_id?: string; // Set after connection is accepted
}
