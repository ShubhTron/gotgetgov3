import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, User, MessageCircle } from 'lucide-react';
import type { Notification } from '@/types/database';
import type { SwipeRightNotificationData } from '@/types/swipeNotifications';
import { acceptConnectionFromNotification, rejectConnectionFromNotification } from '@/lib/notifications';

interface InteractiveSwipeNotificationProps {
  notification: Notification;
  currentUserId: string;
  onAccepted: () => void;
  onRejected: (id: string) => void;
}

export function InteractiveSwipeNotification({
  notification,
  currentUserId,
  onAccepted,
  onRejected,
}: InteractiveSwipeNotificationProps) {
  const navigate = useNavigate();
  const data = notification.data as unknown as SwipeRightNotificationData;
  const [connectionState, setConnectionState] = useState(data.connection_state ?? 'pending');
  const [conversationId, setConversationId] = useState(data.conversation_id ?? null);
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentState = data.connection_state ?? 'pending';
    const currentConvId = data.conversation_id ?? null;
    setConnectionState(currentState);
    setConversationId(currentConvId);
    if (currentState === 'rejected') {
      onRejected(notification.id);
    }
  }, [data.connection_state, data.conversation_id, notification.id, onRejected]);

  const isUnread = !notification.read;
  const accentColor = '#FF6B35';

  const handleAccept = async () => {
    setLoading('accept');
    setError(null);
    const result = await acceptConnectionFromNotification(notification.id, currentUserId);
    setLoading(null);
    if (result.success && result.conversationId) {
      setConnectionState('accepted');
      setConversationId(result.conversationId);
      onAccepted();
    } else {
      if (result.error === 'Notification already processed') {
        if (data.connection_state === 'accepted' && data.conversation_id) {
          setConnectionState('accepted');
          setConversationId(data.conversation_id);
        } else if (data.connection_state === 'rejected') {
          setConnectionState('rejected');
          onRejected(notification.id);
        }
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.');
      }
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    setError(null);
    const result = await rejectConnectionFromNotification(notification.id, currentUserId);
    setLoading(null);
    if (result.success) {
      setConnectionState('rejected');
      onRejected(notification.id);
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  const handleViewProfile = () => navigate(`/profile/${data.swiper_id}`);
  const handleSendMessage = () => { if (conversationId) navigate(`/chat/${conversationId}`); };

  if (connectionState === 'rejected') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 24,
        borderRadius: 16,
        background: 'var(--color-surf)',
        border: `1px solid ${isUnread ? accentColor + '40' : 'var(--color-bdr)'}`,
        borderLeft: `3px solid ${isUnread ? accentColor : 'var(--color-bdr)'}`,
        position: 'relative',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Heart size={18} color={accentColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)', margin: '0 0 2px' }}>
          <span style={{ fontWeight: 600 }}>{notification.title}</span>
        </p>
        {notification.body && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t2)', margin: '0 0 2px' }}>
            {notification.body}
          </p>
        )}
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)', margin: '0 0 10px' }}>
          {formatTime(notification.created_at)}
        </p>
        {error && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-red)', margin: '0 0 8px' }}>
            {error}
          </p>
        )}

        {connectionState === 'pending' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleAccept}
              disabled={loading !== null}
              aria-label="Accept connection"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 16px', background: 'var(--color-acc)', color: 'var(--color-bg)',
                border: 'none', borderRadius: 24, fontFamily: 'var(--font-body)',
                fontWeight: 600, cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              <Heart size={14} />
              {loading === 'accept' ? 'Accepting…' : 'Accept'}
            </button>

            <button
              onClick={handleReject}
              disabled={loading !== null}
              aria-label="Reject connection"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 16px', background: 'rgba(255,59,48,0.12)',
                color: 'var(--color-red)', border: '1px solid rgba(255,59,48,0.3)',
                borderRadius: 24, fontFamily: 'var(--font-body)', fontWeight: 600,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              <X size={14} />
              {loading === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>

            <button
              onClick={handleViewProfile}
              disabled={loading !== null}
              aria-label="View swiper profile"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 16px', background: 'var(--color-surf-2)',
                color: 'var(--color-t2)', border: '1px solid var(--color-bdr)',
                borderRadius: 24, fontFamily: 'var(--font-body)', fontWeight: 600,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              <User size={14} />
              View Profile
            </button>
          </div>
        )}

        {connectionState === 'accepted' && (
          <button
            onClick={handleSendMessage}
            disabled={!conversationId}
            aria-label="Send message"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 16px', background: 'var(--color-acc)', color: 'var(--color-bg)',
              border: 'none', borderRadius: 24, fontFamily: 'var(--font-body)', fontWeight: 600,
              cursor: conversationId ? 'pointer' : 'not-allowed',
              opacity: conversationId ? 1 : 0.6, transition: 'opacity 0.15s',
            }}
          >
            <MessageCircle size={14} />
            Send Message
          </button>
        )}
      </div>

      {isUnread && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
