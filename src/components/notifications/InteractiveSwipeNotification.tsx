import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import type { Notification } from '@/types/database';
import type { SwipeRightNotificationData } from '@/types/swipeNotifications';
import { acceptConnectionFromNotification, rejectConnectionFromNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

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
  const [swiperName, setSwiperName] = useState(data.senderName ?? 'Someone');
  const [swiperAvatar, setSwiperAvatar] = useState(data.senderAvatarUrl);

  useEffect(() => {
    const currentState = data.connection_state ?? 'pending';
    const currentConvId = data.conversation_id ?? null;
    setConnectionState(currentState);
    setConversationId(currentConvId);
    if (currentState === 'rejected') {
      onRejected(notification.id);
    }
  }, [data.connection_state, data.conversation_id, notification.id, onRejected]);

  // Fetch swiper's profile if name is not available
  useEffect(() => {
    async function fetchSwiperProfile() {
      if (data.senderName || !data.swiper_id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', data.swiper_id)
        .single();
      
      if (profile) {
        setSwiperName(profile.full_name ?? 'Someone');
        setSwiperAvatar(profile.avatar_url);
      }
    }
    fetchSwiperProfile();
  }, [data.senderName, data.swiper_id]);

  const isUnread = !notification.read;

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
  const handleSendMessage = () => { 
    if (conversationId) {
      navigate('/circles', { state: { openConversationId: conversationId } });
    }
  };

  if (connectionState === 'rejected') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 14px 14px 14px',
        borderRadius: 16,
        background: 'var(--color-surf)',
        border: `1px solid var(--color-bdr)`,
        position: 'relative',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        background: 'rgba(255,59,80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Heart size={20} color="#FF3B50" fill="#FF3B50" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: 'var(--color-t1)' }}>{swiperName}</span> swiped right on you
          </p>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)',
            textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
          }}>
            {formatTime(notification.created_at)}
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: '2px 0 10px' }}>
          {notification.body ?? 'Interested in playing'}
        </p>
        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-red)', margin: '0 0 8px' }}>
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
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', background: 'var(--color-acc)', color: '#fff',
                border: 'none', borderRadius: 999, fontFamily: 'var(--font-body)',
                fontWeight: 700, fontSize: 13, cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading === 'accept' ? 'Accepting…' : 'Accept'}
            </button>

            <button
              onClick={handleReject}
              disabled={loading !== null}
              aria-label="Reject connection"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', background: 'var(--color-surf-2)',
                color: 'var(--color-t2)', border: '1px solid var(--color-bdr)',
                borderRadius: 999, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        )}

        {connectionState === 'accepted' && (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-acc)', fontWeight: 600, margin: '0 0 10px' }}>
              ✅ Connected! You can now message {swiperName}.
            </p>
            <button
              onClick={handleSendMessage}
              disabled={!conversationId}
              aria-label="Send message"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'var(--color-acc)', color: '#fff',
                border: 'none', borderRadius: 999, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                cursor: conversationId ? 'pointer' : 'not-allowed',
                opacity: conversationId ? 1 : 0.6, transition: 'opacity 0.15s',
              }}
            >
              <MessageCircle size={14} />
              Send Message
            </button>
          </div>
        )}
      </div>

      {isUnread && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-red)', flexShrink: 0, marginTop: 4 }} />
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
