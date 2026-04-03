import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, UserPlus, UserCheck, Trophy, AlertTriangle,
  Clock, MessageCircle, Heart, History,
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestTutorial } from '@/contexts/GuestTutorialContext';
import { supabase } from '@/lib/supabase';
import { acceptConnectionRequestApi, rejectConnectionRequestApi } from '@/lib/connectionRequestApi';
import { confirmResult, disputeResult } from '@/lib/scoring';
import { getOrCreateDirectConversation } from '@/lib/messaging';
import type { Notification } from '@/types/database';
import { ACTIVITY_NOTIFICATION_TYPES } from '@/types/database';
import { InteractiveSwipeNotification } from '@/components/notifications/InteractiveSwipeNotification';
import { getInitials } from '@/lib/avatar-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'requests' | 'matches';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now  = new Date();
  const diffMs   = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs  < 24) return `${diffHrs}h ago`;
  if (diffDays < 7)  return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getGroup(dateString: string): 'today' | 'week' | 'earlier' {
  const diffMs   = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1)  return 'today';
  if (diffDays < 7)  return 'week';
  return 'earlier';
}

function isRequestType(n: Notification) {
  return n.type === 'connection_request_received' || n.type === 'swipe_right_received';
}

function isMatchType(n: Notification) {
  return ['score_reminder', 'score_confirmation_request', 'score_disputed', 'match_result'].includes(n.type);
}

// ─── Icon bubble ──────────────────────────────────────────────────────────────

function IconBubble({ bg, icon }: { bg: string; icon: React.ReactNode }) {
  return (
    <div style={{
      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
  );
}

// ─── Avatar initials bubble ───────────────────────────────────────────────────

function AvatarBubble({ name, avatarUrl, size = 46 }: { name: string; avatarUrl?: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 3, flexShrink: 0, overflow: 'hidden',
      background: 'var(--color-surf-2)', border: '1.5px solid var(--color-bdr)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: size * 0.33, color: 'var(--color-t2)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

// ─── Card base ────────────────────────────────────────────────────────────────

function Card({ notification, left, children }: {
  notification: Notification;
  left: React.ReactNode;
  children: React.ReactNode;
}) {
  const unread = !notification.read;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 14px 14px 14px',
      borderRadius: 16,
      background: unread ? 'var(--color-surf)' : 'var(--color-surf)',
      border: `1px solid ${unread ? 'var(--color-bdr)' : 'var(--color-bdr)'}`,
      position: 'relative',
    }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {unread && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-red)', flexShrink: 0, marginTop: 4,
        }} />
      )}
    </div>
  );
}

// ─── Timestamp ────────────────────────────────────────────────────────────────

function TimeStamp({ date }: { date: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)',
      textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
    }}>
      {formatTime(date)}
    </span>
  );
}

// ─── Bold name helper ─────────────────────────────────────────────────────────

function Bold({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 700, color: 'var(--color-t1)' }}>{children}</span>;
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  label, onClick, variant = 'primary', disabled, icon,
}: {
  label: string; onClick: () => void; variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean; icon?: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--color-acc)', color: '#fff', border: 'none' },
    ghost:   { background: 'var(--color-surf-2)', color: 'var(--color-t1)', border: '1px solid var(--color-bdr)' },
    danger:  { background: 'rgba(255,59,48,0.1)', color: 'var(--color-red)', border: '1px solid rgba(255,59,48,0.25)' },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 16px', borderRadius: 999,
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s',
        ...styles[variant],
      }}
    >
      {icon}{label}
    </button>
  );
}

// ─── Notification cards ───────────────────────────────────────────────────────

function SwipeRightCard({ n, currentUserId, onAccepted, onRejected }: {
  n: Notification; currentUserId: string;
  onAccepted: () => void; onRejected: (id: string) => void;
}) {
  const data = n.data as { senderName?: string; senderAvatarUrl?: string | null; sport?: string; requestId?: string; swiper_id?: string };
  const [name, setName] = useState(data.senderName ?? 'Someone');
  const [avatarUrl, setAvatarUrl] = useState(data.senderAvatarUrl);
  const sport = data.sport ?? 'a sport';
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const [done, setDone] = useState(false);

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
        setName(profile.full_name ?? 'Someone');
        setAvatarUrl(profile.avatar_url);
      }
    }
    fetchSwiperProfile();
  }, [data.senderName, data.swiper_id]);

  async function accept() {
    if (!data.requestId) return;
    setLoading('accept');
    const r = await acceptConnectionRequestApi(data.requestId, currentUserId);
    if (r.success) { setDone(true); onAccepted(); }
    setLoading(null);
  }
  async function reject() {
    if (!data.requestId) return;
    setLoading('reject');
    const r = await rejectConnectionRequestApi(data.requestId, currentUserId);
    if (r.success) onRejected(n.id);
    setLoading(null);
  }

  return (
    <Card notification={n} left={avatarUrl ? <AvatarBubble name={name} avatarUrl={avatarUrl} /> : <IconBubble bg="rgba(255,59,80,0.15)" icon={<Heart size={20} color="#FF3B50" fill="#FF3B50" />} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          <Bold>{name}</Bold> swiped right on you
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: '2px 0 10px' }}>
        Interested in playing {sport}
      </p>
      {done ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-acc)', fontWeight: 600 }}>✅ Connected!</p>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn label={loading === 'accept' ? 'Accepting…' : 'Accept'} onClick={accept} disabled={loading !== null} />
          <ActionBtn label="Reject" onClick={reject} variant="ghost" disabled={loading !== null} />
        </div>
      )}
    </Card>
  );
}

function ConnectionRequestCard({ n, onAccept, onReject, loading }: {
  n: Notification; onAccept: () => void; onReject: () => void; loading: boolean;
}) {
  const data = n.data as { requesterName?: string; requesterAvatarUrl?: string | null };
  const name = data.requesterName ?? 'Someone';
  return (
    <Card notification={n} left={<AvatarBubble name={name} avatarUrl={data.requesterAvatarUrl} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          <Bold>{name}</Bold> wants to connect
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <ActionBtn label={loading ? 'Accepting…' : 'Accept'} onClick={onAccept} disabled={loading} />
        <ActionBtn label="Ignore" onClick={onReject} variant="ghost" disabled={loading} />
      </div>
    </Card>
  );
}

function ConnectionAcceptedCard({ n, navigate }: { n: Notification; navigate: ReturnType<typeof useNavigate> }) {
  const data = n.data as { acceptorName?: string; acceptorAvatarUrl?: string | null; conversation_id?: string };
  const name = data.acceptorName ?? 'Someone';
  const { user } = useAuth();

  async function sendMessage() {
    if (!data.conversation_id || !user) return;
    navigate('/circles', { state: { openConversationId: data.conversation_id } });
  }

  return (
    <Card notification={n} left={<AvatarBubble name={name} avatarUrl={data.acceptorAvatarUrl} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          <Bold>{name}</Bold> accepted your connection
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: '2px 0 10px' }}>
        You can now coordinate games.
      </p>
      <ActionBtn
        label="Send Message"
        onClick={sendMessage}
        icon={<MessageCircle size={13} />}
      />
    </Card>
  );
}

function ScoreReminderCard({ n, onCta }: { n: Notification; onCta: () => void }) {
  const data = n.data as { opponentName?: string };
  return (
    <Card notification={n} left={<IconBubble bg="rgba(255,179,0,0.15)" icon={<Clock size={20} color="#FFB300" />} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          You played with <Bold>{data.opponentName ?? 'your opponent'}</Bold> yesterday. Add the score?
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      <div style={{ marginTop: 10 }}>
        <ActionBtn label="Add Score" onClick={onCta} />
      </div>
    </Card>
  );
}

function ScoreConfirmationCard({ n, currentUserId, onDone }: {
  n: Notification; currentUserId: string; onDone: () => void;
}) {
  const data = n.data as { submitterName?: string; sport?: string; resultId?: string; submittedBy?: string };
  const [submitterName, setSubmitterName] = useState(data.submitterName ?? 'Someone');
  const [loading, setLoading] = useState<'confirm' | 'dispute' | null>(null);

  // Fetch submitter's profile if name is not available
  useEffect(() => {
    async function fetchSubmitterProfile() {
      if (data.submitterName || !data.submittedBy) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.submittedBy)
        .single();
      
      if (profile) {
        setSubmitterName(profile.full_name ?? 'Someone');
      }
    }
    fetchSubmitterProfile();
  }, [data.submitterName, data.submittedBy]);

  async function confirm() {
    if (!data.resultId) return;
    setLoading('confirm');
    await confirmResult(data.resultId);
    setLoading(null); onDone();
  }
  async function dispute() {
    if (!data.resultId) return;
    setLoading('dispute');
    await disputeResult(data.resultId, currentUserId);
    setLoading(null); onDone();
  }

  return (
    <Card notification={n} left={<IconBubble bg="rgba(22,212,106,0.15)" icon={<Trophy size={20} color="var(--color-acc)" />} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          <Bold>{submitterName}</Bold> submitted a score for your <Bold>{data.sport ?? 'match'}</Bold>
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <ActionBtn label={loading === 'confirm' ? 'Confirming…' : 'Confirm'} onClick={confirm} disabled={loading !== null} />
        <ActionBtn label={loading === 'dispute' ? 'Disputing…' : 'Dispute'} onClick={dispute} variant="danger" disabled={loading !== null} />
      </div>
    </Card>
  );
}

function ScoreDisputedCard({ n }: { n: Notification }) {
  const data = n.data as { sport?: string };
  return (
    <Card notification={n} left={<IconBubble bg="rgba(255,59,48,0.12)" icon={<AlertTriangle size={20} color="var(--color-red)" />} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
          Your score for the <Bold>{data.sport ?? 'match'}</Bold> has been disputed
        </p>
        <TimeStamp date={n.created_at} />
      </div>
    </Card>
  );
}

function GenericCard({ n }: { n: Notification }) {
  return (
    <Card notification={n} left={<IconBubble bg="var(--color-surf-2)" icon={<Bell size={20} color="var(--color-t2)" />} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)', margin: 0 }}>
          {n.title}
        </p>
        <TimeStamp date={n.created_at} />
      </div>
      {n.body && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: '2px 0 0', lineHeight: 1.4 }}>
          {n.body}
        </p>
      )}
    </Card>
  );
}

// ─── Group label ──────────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--color-t3)', margin: '16px 0 8px',
    }}>
      {label}
    </p>
  );
}

// ─── Tutorial connection card (guest mode only) ───────────────────────────────

function TutorialConnectionCard() {
  const navigate = useNavigate();
  const { tutorialStep, advanceTutorial, registerTarget } = useGuestTutorial();
  const [accepted, setAccepted] = useState(tutorialStep === 'go_to_messages');

  // Callback ref fires synchronously on attach/detach — no async timing issues
  const acceptBtnRef = useCallback((el: HTMLButtonElement | null) => {
    registerTarget('accept_connection', el);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (tutorialStep !== 'accept_connection' && tutorialStep !== 'go_to_messages') return null;

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        border: '1px solid var(--color-bdr)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar bubble */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: 'var(--color-acc-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
          color: 'var(--color-acc)',
        }}>
          ER
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', margin: 0, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: 'var(--color-t1)' }}>Emma Rodriguez</span> swiped right on you
            </p>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)', whiteSpace: 'nowrap' }}>
              Just now
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: '2px 0 10px' }}>
            Interested in playing Tennis
          </p>
          {accepted ? (
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-acc)', fontWeight: 600, margin: '0 0 10px' }}>
                ✅ Connected! You can now message Emma.
              </p>
              <button
                onClick={() => navigate('/circles')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--color-acc)', color: '#fff',
                  border: 'none', borderRadius: 999,
                  padding: '8px 16px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                }}
              >
                <MessageCircle size={14} />
                Send Message
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                ref={acceptBtnRef}
                onClick={() => { setAccepted(true); advanceTutorial('go_to_messages'); }}
                style={{
                  background: 'var(--color-acc)', color: '#fff',
                  border: 'none', borderRadius: 999,
                  padding: '8px 16px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                }}
              >
                Accept
              </button>
              <button
                style={{
                  background: 'none', color: 'var(--color-t2)',
                  border: '1px solid var(--color-bdr)', borderRadius: 999,
                  padding: '8px 16px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                }}
                disabled
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { user, isGuest } = useAuth();
  const { tutorialStep, advanceTutorial } = useGuestTutorial();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');

  // Tutorial: auto-advance when user arrives on this page
  useEffect(() => {
    if (isGuest && tutorialStep === 'go_to_notifications') {
      advanceTutorial('accept_connection');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const timer = setTimeout(() => markAllRead(), 1500);
    const channel: RealtimeChannel = supabase
      .channel(`user-notifications:${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        setNotifications((prev) => [payload.payload as Notification, ...prev]);
      })
      .subscribe();
    return () => { clearTimeout(timer); channel.unsubscribe(); };
  }, [user?.id]);

  async function fetchNotifications() {
    if (!user?.id) return;
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', user.id).in('type', ACTIVITY_NOTIFICATION_TYPES)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }

  async function markAllRead() {
    if (!user?.id) return;
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false).in('type', ACTIVITY_NOTIFICATION_TYPES);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleAccept(notification: Notification) {
    const requestId = notification.data.requestId as string;
    setActionLoading(notification.id);
    const result = await acceptConnectionRequestApi(requestId, user!.id);
    if (result.success) setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setActionLoading(null);
  }

  async function handleReject(notification: Notification) {
    const requestId = notification.data.requestId as string;
    setActionLoading(notification.id);
    const result = await rejectConnectionRequestApi(requestId, user!.id);
    if (result.success) setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setActionLoading(null);
  }

  // Filter by tab
  const filtered = useMemo(() => {
    if (tab === 'requests') return notifications.filter(isRequestType);
    if (tab === 'matches')  return notifications.filter(isMatchType);
    return notifications;
  }, [notifications, tab]);

  // Group
  const groups = useMemo(() => {
    const today: Notification[]   = [];
    const week: Notification[]    = [];
    const earlier: Notification[] = [];
    filtered.forEach((n) => {
      const g = getGroup(n.created_at);
      if (g === 'today')   today.push(n);
      else if (g === 'week') week.push(n);
      else earlier.push(n);
    });
    return { today, week, earlier };
  }, [filtered]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function renderCard(n: Notification) {
    if (n.type === 'swipe_right_received') {
      return <InteractiveSwipeNotification key={n.id} notification={n} currentUserId={user!.id} onAccepted={fetchNotifications} onRejected={(id) => setNotifications((p) => p.filter((x) => x.id !== id))} />;
    }
    if (n.type === 'connection_request_received') {
      return <ConnectionRequestCard key={n.id} n={n} loading={actionLoading === n.id} onAccept={() => handleAccept(n)} onReject={() => handleReject(n)} />;
    }
    if (n.type === 'connection_request_accepted') {
      return <ConnectionAcceptedCard key={n.id} n={n} navigate={navigate} />;
    }
    if (n.type === 'score_reminder') {
      return <ScoreReminderCard key={n.id} n={n} onCta={() => navigate('/results', { state: { openScoreModal: true, challengeId: n.data.challengeId } })} />;
    }
    if (n.type === 'score_confirmation_request') {
      return <ScoreConfirmationCard key={n.id} n={n} currentUserId={user!.id} onDone={fetchNotifications} />;
    }
    if (n.type === 'score_disputed') {
      return <ScoreDisputedCard key={n.id} n={n} />;
    }
    return <GenericCard key={n.id} n={n} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48, background: 'var(--color-bg)', minHeight: '100%' }}>
      <div style={{ padding: '20px 16px 0', maxWidth: 640, margin: '0 auto' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
            color: 'var(--color-t1)', margin: 0, letterSpacing: '-0.01em',
          }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <div style={{
              background: 'var(--color-red)', color: '#fff',
              borderRadius: 999, minWidth: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
              padding: '0 6px',
            }}>
              {unreadCount}
            </div>
          )}
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'requests', 'matches'] as FilterTab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 16px', borderRadius: 999,
                  background: active ? 'var(--color-acc)' : 'var(--color-surf)',
                  color: active ? '#fff' : 'var(--color-t2)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? 'none' : '1px solid var(--color-bdr)',
                } as React.CSSProperties}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>

        {/* ── Tutorial card (guest mode) ───────────────────────────────────── */}
        {isGuest && (
          <>
            <GroupLabel label="Today" />
            <TutorialConnectionCard />
          </>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {filtered.length === 0 && !isGuest && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0 32px', gap: 12 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: 'var(--color-surf)',
              border: '1px solid var(--color-bdr)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={26} color="var(--color-t3)" />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--color-t1)', margin: 0 }}>
              All caught up!
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: 0 }}>
              No {tab === 'all' ? '' : tab} notifications yet
            </p>
          </div>
        )}

        {/* ── Today ───────────────────────────────────────────────────────── */}
        {groups.today.length > 0 && (
          <>
            <GroupLabel label="Today" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.today.map(renderCard)}
            </div>
          </>
        )}

        {/* ── This week ────────────────────────────────────────────────────── */}
        {groups.week.length > 0 && (
          <>
            <GroupLabel label="This Week" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.week.map(renderCard)}
            </div>
          </>
        )}

        {/* ── Earlier ──────────────────────────────────────────────────────── */}
        {groups.earlier.length > 0 && (
          <>
            <GroupLabel label="Earlier" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.earlier.map(renderCard)}
            </div>
          </>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 32 }}>
            <History size={18} color="var(--color-t3)" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0, textAlign: 'center' }}>
              You're all caught up for the last 7 days.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
