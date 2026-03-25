import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { supabase } from '@/lib/supabase';
import { sampleFeed as mockFeed } from '@/data/mock';
import { getInitials } from '@/lib/avatar-utils';

type NewsFilter = 'all' | 'circles' | 'club' | 'competitions';

interface FeedItem {
  id: string;
  type: 'announcement' | 'match_result' | 'ladder_movement' | 'event' | 'achievement' | 'connection_accepted';
  title?: string;
  content?: string;
  imageUrl?: string;
  author: { id: string; name: string; avatarUrl?: string };
  audienceLabel?: string;
  metadata?: {
    winner?: string;
    loser?: string;
    score?: string;
    positionChange?: number;
    eventName?: string;
    eventId?: string;
    eventDate?: string;
    achievement?: string;
    connectedUser?: { id: string; name: string; avatarUrl?: string };
  };
  reactions: { like: number; celebrate: number; fire: number };
  comments: number;
  createdAt: string;
  category?: NewsFilter;
}

/* ── greeting helper ───────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── mini avatar ───────────────────────────────────────────────────────── */
function MiniAvatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.15)',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.36, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

/* ── category badge config ─────────────────────────────────────────────── */
const categoryConfig: Record<string, { label: string; accent: string }> = {
  announcement:        { label: 'News',        accent: 'rgba(255,255,255,0.18)' },
  match_result:        { label: 'Match',        accent: 'rgba(22,212,106,0.35)' },
  ladder_movement:     { label: 'Ladder',       accent: 'rgba(139,92,246,0.35)' },
  event:               { label: 'Event',        accent: 'rgba(255,179,0,0.35)'  },
  achievement:         { label: 'Achievement',  accent: 'rgba(255,179,0,0.35)'  },
  connection_accepted: { label: 'Social',       accent: 'rgba(255,255,255,0.18)' },
};

/* ── main page ─────────────────────────────────────────────────────────── */
export function NewsPage() {
  const { user } = useAuth();
  const { newsFilter } = useFilters();
  const [feed, setFeed] = useState<FeedItem[]>(mockFeed as FeedItem[]);

  const activeFilter = (newsFilter as NewsFilter) || 'all';
  const hasClubs = true;

  useEffect(() => {
    if (user) fetchAcceptedConnections();
  }, [user]);

  const fetchAcceptedConnections = async () => {
    if (!user) return;
    const { data: connections } = await supabase
      .from('connections')
      .select(`id, user_id, connected_user_id, status, updated_at,
        user:user_id (id, full_name, avatar_url),
        connected:connected_user_id (id, full_name, avatar_url)`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (connections && connections.length > 0) {
      const connectionItems: FeedItem[] = connections.map((conn) => {
        const userProfile = conn.user as unknown as { id: string; full_name: string; avatar_url: string | null };
        const connectedProfile = conn.connected as unknown as { id: string; full_name: string; avatar_url: string | null };
        return {
          id: `connection-${conn.id}`,
          type: 'connection_accepted' as const,
          author: { id: userProfile?.id || conn.user_id, name: userProfile?.full_name || 'Player', avatarUrl: userProfile?.avatar_url || undefined },
          metadata: { connectedUser: { id: connectedProfile?.id || conn.connected_user_id, name: connectedProfile?.full_name || 'Player', avatarUrl: connectedProfile?.avatar_url || undefined } },
          reactions: { like: Math.floor(Math.random() * 10), celebrate: Math.floor(Math.random() * 5), fire: Math.floor(Math.random() * 3) },
          comments: Math.floor(Math.random() * 5),
          createdAt: conn.updated_at,
          category: 'circles' as const,
        };
      });
      setFeed((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = connectionItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }
  };

  const filteredFeed = feed.filter((item) => activeFilter === 'all' || item.category === activeFilter);

  /* empty state */
  if (!hasClubs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: 'var(--color-bg)', minHeight: '60vh' }}>
        <div style={{ width: 80, height: 80, background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Building2 size={36} style={{ color: 'var(--color-t3)' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-t1)', marginBottom: 8, textAlign: 'center' }}>
          Join a club to see what's happening
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', textAlign: 'center', maxWidth: 280, marginBottom: 24 }}>
          Connect with your local clubs to see match results, announcements, and more.
        </p>
        <button style={{
          padding: '12px 28px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-acc)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Find Clubs
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg)', paddingBottom: 32 }}>

      {/* ── Greeting header ──────────────────────────────────────────────── */}
      <div style={{ padding: '22px 20px 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
          color: 'var(--color-t1)', letterSpacing: '-0.02em', margin: 0,
        }}>
          {greeting()}
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14,
          color: 'var(--color-t2)', marginTop: 4, marginBottom: 0,
        }}>
          Latest updates from your network
        </p>
      </div>

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 14px' }}>
        {filteredFeed.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ── FeedCard ──────────────────────────────────────────────────────────── */
function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);
  const config = categoryConfig[item.type] || { label: 'Update', accent: 'rgba(255,255,255,0.18)' };

  const gradient = (() => {
    switch (item.type) {
      case 'event':           return 'linear-gradient(160deg,rgba(22,212,106,0.75) 0%,rgba(8,80,44,0.95) 100%)';
      case 'match_result':    return 'linear-gradient(160deg,rgba(16,180,90,0.6) 0%,rgba(5,40,20,0.95) 100%)';
      case 'ladder_movement': return 'linear-gradient(160deg,rgba(139,92,246,0.75) 0%,rgba(45,15,100,0.95) 100%)';
      default:                return 'linear-gradient(160deg,rgba(50,50,60,0.8) 0%,rgba(10,10,15,0.97) 100%)';
    }
  })();

  const headline = (() => {
    if (item.type === 'match_result' && item.metadata)
      return `${item.metadata.winner} defeated ${item.metadata.loser}`;
    if (item.type === 'ladder_movement' && item.metadata)
      return `${item.metadata.winner} moved up ${item.metadata.positionChange} spots!`;
    if (item.type === 'event' && item.metadata)
      return item.metadata.eventName || '';
    if (item.type === 'achievement' && item.metadata)
      return item.metadata.achievement || '';
    if (item.type === 'connection_accepted' && item.metadata?.connectedUser)
      return `${item.author.name} & ${item.metadata.connectedUser.name} are now connected`;
    return item.title || '';
  })();

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 18,
      minHeight: 300,
      background: '#111',
      boxShadow: '0 6px 28px rgba(0,0,0,0.35)',
    }}>
      {/* Background */}
      {item.imageUrl
        ? <img src={item.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      }

      {/* Dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)', pointerEvents: 'none' }} />

      {/* Category badge */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}>
        <div style={{
          padding: '5px 12px', borderRadius: 99,
          background: config.accent,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Bottom content */}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '20px 18px 16px', zIndex: 10, color: '#fff' }}>

        {/* Headline */}
        {headline && (
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700,
            margin: '0 0 14px', lineHeight: 1.25,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}>
            {headline}
          </h2>
        )}
        {item.type === 'announcement' && item.content && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '-8px 0 14px', lineHeight: 1.4 }}>
            {item.content}
          </p>
        )}

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <MiniAvatar name={item.author.name} avatarUrl={item.author.avatarUrl} />
          <div>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, display: 'block', color: '#fff' }}>
              {item.author.name}
            </span>
            {item.audienceLabel && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                {item.audienceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            onClick={() => setLiked((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#f472b6' : 'rgba(255,255,255,0.85)', transition: 'color 0.2s', padding: 0 }}
          >
            <Heart size={19} fill={liked ? '#f472b6' : 'none'} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>
              {item.reactions.like + (liked ? 1 : 0)}
            </span>
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', padding: 0 }}>
            <MessageCircle size={19} />
            {item.comments > 0 && (
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>{item.comments}</span>
            )}
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', padding: 0, marginLeft: 'auto' }}>
            <Share2 size={19} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
