import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, UserCheck, Trophy, AlertTriangle, Clock, MessageCircle } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { acceptConnectionRequestApi, rejectConnectionRequestApi } from '@/lib/connectionRequestApi';
import { confirmResult, disputeResult } from '@/lib/scoring';
import { getOrCreateDirectConversation } from '@/lib/messaging';
import type { Notification } from '@/types/database';
import { ACTIVITY_NOTIFICATION_TYPES } from '@/types/database';
import { InteractiveSwipeNotification } from '@/components/notifications/InteractiveSwipeNotification';
import { getInitials } from '@/lib/avatar-utils';

const spacing = { xs: 8, sm: 16, md: 24, xxl: 48 } as const;
const radius = { xl: 16, xxxl: 999 } as const;
const typography = {
  display: { small: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 } },
  body: {
    large: { fontFamily: 'var(--font-body)', fontWeight: 600 },
    medium: { fontFamily: 'var(--font-body)' },
    small: { fontFamily: 'var(--font-body)' },
  },
  caption: { large: { fontFamily: 'var(--font-body)', fontSize: 11 } },
} as const;

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const markReadTimer = setTimeout(() => markAllRead(), 1500);
    // Subscribe to realtime notification broadcasts
    const channel: RealtimeChannel = supabase
      .channel(`user-notifications:${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        const newNotification = payload.payload as Notification;
        setNotifications((prev) => [newNotification, ...prev]);
      })
      .subscribe();
    return () => { clearTimeout(markReadTimer); channel.unsubscribe(); };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('notifications').select('*').eq('user_id', user.id)
      .in('type', ACTIVITY_NOTIFICATION_TYPES).order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false).in('type', ACTIVITY_NOTIFICATION_TYPES);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAccept = async (notification: Notification) => {
    const requestId = notification.data.requestId as string;
    setActionLoading(notification.id);
    const result = await acceptConnectionRequestApi(requestId, user!.id);
    if (result.success) setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setActionLoading(null);
  };

  const handleReject = async (notification: Notification) => {
    const requestId = notification.data.requestId as string;
    setActionLoading(notification.id);
    const result = await rejectConnectionRequestApi(requestId, user!.id);
    if (result.success) setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${spacing.xxl}px 0` }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--color-acc)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: spacing.md, paddingRight: spacing.md, paddingBottom: spacing.md, maxWidth: 640, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, paddingTop: spacing.xs }}>
        <h1 style={{ fontFamily: typography.display.small.fontFamily, fontSize: typography.display.small.fontSize, fontWeight: typography.display.small.fontWeight, color: 'var(--color-t1)', margin: 0 }}>
          Notifications
        </h1>
        {notifications.filter((n) => !n.read).length > 0 && (
          <span style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)' }}>
            {notifications.filter((n) => !n.read).length} unread
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${spacing.xxl}px ${spacing.md}px`, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surf)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <Bell size={28} color="var(--color-t3)" />
          </div>
          <p style={{ fontFamily: typography.body.large.fontFamily, fontWeight: 600, color: 'var(--color-t1)', margin: 0, marginBottom: 4 }}>All caught up</p>
          <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t3)', margin: 0 }}>No new notifications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {notifications.map((notification) => {
            if (notification.type === 'swipe_right_received') {
              return (
                <InteractiveSwipeNotification
                  key={notification.id}
                  notification={notification}
                  currentUserId={user!.id}
                  onAccepted={fetchNotifications}
                  onRejected={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
                />
              );
            }
            if (notification.type === 'connection_request_received') {
              return (
                <ConnectionRequestNotification
                  key={notification.id} notification={notification}
                  isLoading={actionLoading === notification.id}
                  onAccept={() => handleAccept(notification)} onReject={() => handleReject(notification)}
                />
              );
            }
            if (notification.type === 'connection_request_accepted') {
              return <ConnectionAcceptedNotification key={notification.id} notification={notification} onMessage={(conversationId) => navigate(`/chat/${conversationId}`)} />;
            }
            if (notification.type === 'score_reminder') {
              return (
                <ScoreReminderNotification key={notification.id} notification={notification}
                  onCta={() => {
                    const challengeId = notification.data.challengeId as string | undefined;
                    navigate('/results', { state: { openScoreModal: true, challengeId } });
                  }}
                />
              );
            }
            if (notification.type === 'score_confirmation_request') {
              return <ScoreConfirmationRequestNotification key={notification.id} notification={notification} currentUserId={user!.id} onActionDone={() => fetchNotifications()} />;
            }
            if (notification.type === 'score_disputed') {
              return <ScoreDisputedNotification key={notification.id} notification={notification} />;
            }
            return <GenericNotification key={notification.id} notification={notification} />;
          })}
        </div>
      )}
    </div>
  );
}

// --- Shared card base ---
function NotifCard({ notification, accentColor, icon, children }: {
  notification: Notification;
  accentColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const isUnread = !notification.read;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      background: 'var(--color-surf)',
      border: `1px solid ${isUnread ? accentColor + '40' : 'var(--color-bdr)'}`,
      borderLeft: `3px solid ${isUnread ? accentColor : 'var(--color-bdr)'}`,
      position: 'relative',
    }}>
      {/* Icon bubble */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: accentColor + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {isUnread && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}

// --- Connection Request ---
interface ConnectionRequestNotificationProps {
  notification: Notification;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function ConnectionRequestNotification({ notification, isLoading, onAccept, onReject }: ConnectionRequestNotificationProps) {
  const data = notification.data as { requesterName: string; requesterAvatarUrl: string | null };
  return (
    <NotifCard notification={notification} accentColor="var(--color-acc)" icon={<UserPlus size={18} color="var(--color-acc)" />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: 4 }}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={data.requesterAvatarUrl ?? undefined} alt={data.requesterName} />
          <AvatarFallback>{getInitials(data.requesterName)}</AvatarFallback>
        </Avatar>
        <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t1)', margin: 0 }}>
          <span style={{ fontWeight: 600 }}>{data.requesterName}</span> wants to connect
        </p>
      </div>
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: '0 0 10px' }}>{formatTime(notification.created_at)}</p>
      <div style={{ display: 'flex', gap: spacing.xs }}>
        <button onClick={onAccept} disabled={isLoading}
          style={{ padding: `6px ${spacing.sm}px`, background: 'var(--color-acc)', color: '#fff', border: 'none', borderRadius: radius.xxxl, fontFamily: typography.body.small.fontFamily, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          {isLoading ? 'Accepting…' : 'Accept'}
        </button>
        <button onClick={onReject} disabled={isLoading}
          style={{ padding: `6px ${spacing.sm}px`, background: 'var(--color-surf-2)', color: 'var(--color-t2)', border: '1px solid var(--color-bdr)', borderRadius: radius.xxxl, fontFamily: typography.body.small.fontFamily, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          Ignore
        </button>
      </div>
    </NotifCard>
  );
}

// --- Connection Accepted ---
function ConnectionAcceptedNotification({ notification, onMessage }: { notification: Notification; onMessage: (conversationId: string) => void }) {
  const data = notification.data as { acceptorName: string; acceptorAvatarUrl: string | null; conversation_id?: string };
  const conversationId = data.conversation_id;

  return (
    <NotifCard notification={notification} accentColor="var(--color-acc)" icon={<UserCheck size={18} color="var(--color-acc)" />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: 4 }}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={data.acceptorAvatarUrl ?? undefined} alt={data.acceptorName} />
          <AvatarFallback>{getInitials(data.acceptorName)}</AvatarFallback>
        </Avatar>
        <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t1)', margin: 0 }}>
          <span style={{ fontWeight: 600 }}>{data.acceptorName}</span> accepted your connection
        </p>
      </div>
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: '0 0 10px' }}>{formatTime(notification.created_at)}</p>
      {conversationId && (
        <button
          onClick={() => onMessage(conversationId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: `6px ${spacing.sm}px`,
            background: 'var(--color-acc)',
            color: '#fff',
            border: 'none',
            borderRadius: radius.xxxl,
            fontFamily: typography.body.small.fontFamily,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <MessageCircle size={14} />
          Send Message
        </button>
      )}
    </NotifCard>
  );
}

// --- Score Reminder ---
function ScoreReminderNotification({ notification, onCta }: { notification: Notification; onCta: () => void }) {
  const data = notification.data as { opponentName?: string };
  const opponentName = data.opponentName ?? 'your opponent';
  return (
    <NotifCard notification={notification} accentColor="#FFB300" icon={<Clock size={18} color="#FFB300" />}>
      <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t1)', margin: '0 0 4px' }}>
        You played with <span style={{ fontWeight: 600 }}>{opponentName}</span> yesterday. Add the score?
      </p>
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: '0 0 10px' }}>{formatTime(notification.created_at)}</p>
      <button onClick={onCta}
        style={{ padding: `6px ${spacing.sm}px`, background: '#FFB300', color: '#fff', border: 'none', borderRadius: radius.xxxl, fontFamily: typography.body.small.fontFamily, fontWeight: 600, cursor: 'pointer' }}>
        Add Score
      </button>
    </NotifCard>
  );
}

// --- Score Confirmation Request ---
function ScoreConfirmationRequestNotification({ notification, currentUserId, onActionDone }: { notification: Notification; currentUserId: string; onActionDone: () => void }) {
  const [loading, setLoading] = useState<'confirm' | 'dispute' | null>(null);
  const data = notification.data as { submitterName?: string; sport?: string; resultId?: string };
  const submitterName = data.submitterName ?? 'Someone';
  const sport = data.sport ?? 'match';
  const resultId = data.resultId ?? '';

  const handleConfirm = async () => {
    if (!resultId) return;
    setLoading('confirm');
    await confirmResult(resultId);
    setLoading(null);
    onActionDone();
  };

  const handleDispute = async () => {
    if (!resultId) return;
    setLoading('dispute');
    await disputeResult(resultId, currentUserId);
    setLoading(null);
    onActionDone();
  };

  return (
    <NotifCard notification={notification} accentColor="var(--color-acc)" icon={<Trophy size={18} color="var(--color-acc)" />}>
      <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t1)', margin: '0 0 4px' }}>
        <span style={{ fontWeight: 600 }}>{submitterName}</span> submitted a score for your <span style={{ fontWeight: 600 }}>{sport}</span> match
      </p>
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: '0 0 10px' }}>{formatTime(notification.created_at)}</p>
      <div style={{ display: 'flex', gap: spacing.xs }}>
        <button onClick={handleConfirm} disabled={loading !== null}
          style={{ padding: `6px ${spacing.sm}px`, background: 'var(--color-acc)', color: '#fff', border: 'none', borderRadius: radius.xxxl, fontFamily: typography.body.small.fontFamily, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading === 'confirm' ? 'Confirming…' : 'Confirm'}
        </button>
        <button onClick={handleDispute} disabled={loading !== null}
          style={{ padding: `6px ${spacing.sm}px`, background: 'rgba(255,59,48,0.12)', color: 'var(--color-red)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: radius.xxxl, fontFamily: typography.body.small.fontFamily, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading === 'dispute' ? 'Disputing…' : 'Dispute'}
        </button>
      </div>
    </NotifCard>
  );
}

// --- Score Disputed ---
function ScoreDisputedNotification({ notification }: { notification: Notification }) {
  const data = notification.data as { sport?: string };
  const sport = data.sport ?? 'match';
  return (
    <NotifCard notification={notification} accentColor="var(--color-red)" icon={<AlertTriangle size={18} color="var(--color-red)" />}>
      <p style={{ fontFamily: typography.body.medium.fontFamily, color: 'var(--color-t1)', margin: '0 0 4px' }}>
        Your submitted score for the <span style={{ fontWeight: 600 }}>{sport}</span> match has been disputed
      </p>
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: 0 }}>{formatTime(notification.created_at)}</p>
    </NotifCard>
  );
}

// --- Generic ---
function GenericNotification({ notification }: { notification: Notification }) {
  return (
    <NotifCard notification={notification} accentColor="var(--color-acc)" icon={<Bell size={18} color="var(--color-acc)" />}>
      <p style={{ fontFamily: typography.body.medium.fontFamily, fontWeight: 600, color: 'var(--color-t1)', margin: '0 0 2px' }}>{notification.title}</p>
      {notification.body && (
        <p style={{ fontFamily: typography.body.small.fontFamily, color: 'var(--color-t2)', margin: '0 0 4px' }}>{notification.body}</p>
      )}
      <p style={{ fontFamily: typography.caption.large.fontFamily, fontSize: typography.caption.large.fontSize, color: 'var(--color-t3)', margin: 0 }}>{formatTime(notification.created_at)}</p>
    </NotifCard>
  );
}

// --- Helpers ---
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
