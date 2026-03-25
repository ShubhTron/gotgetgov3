import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check, XCircle, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateDirectConversation } from '@/lib/messaging';
import { SPORTS, type SportType } from '@/types';
import { getInitials } from '@/lib/avatar-utils';
import { SportIcon } from '@/components/ui';

interface PlayerProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  locationCity?: string;
  sports: {
    sport: SportType;
    level: string;
    rating?: string;
    ratingSystem?: string;
  }[];
}

interface InviteResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string | null;
  swipeId: string | null;
  onAccept?: () => void;
  onRefuse?: () => void;
}

export function InviteResponseModal({
  open,
  onOpenChange,
  playerId,
  swipeId,
  onAccept,
  onRefuse,
}: InviteResponseModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && playerId) {
      fetchPlayer(playerId);
    }
  }, [open, playerId]);

  const fetchPlayer = async (id: string) => {
    setLoading(true);

    const [profileRes, sportsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location_city')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('user_sport_profiles')
        .select('sport, self_assessed_level, official_rating, official_rating_system')
        .eq('user_id', id),
    ]);

    if (profileRes.data) {
      setPlayer({
        id: profileRes.data.id,
        fullName: profileRes.data.full_name || 'Unknown',
        avatarUrl: profileRes.data.avatar_url || undefined,
        bio: profileRes.data.bio || undefined,
        locationCity: profileRes.data.location_city || undefined,
        sports: sportsRes.data?.map((sp) => ({
          sport: sp.sport as SportType,
          level: sp.self_assessed_level || 'beginner',
          rating: sp.official_rating || undefined,
          ratingSystem: sp.official_rating_system || undefined,
        })) || [],
      });
    }

    setLoading(false);
  };

  const handleAccept = async () => {
    if (!player || !user) return;
    setProcessing(true);
    setError(null);

    // 1. Create connection (accepter → inviter)
    const { error: connError } = await supabase
      .from('connections')
      .upsert(
        { user_id: user.id, connected_user_id: player.id, status: 'accepted' },
        { onConflict: 'user_id,connected_user_id', ignoreDuplicates: true }
      );

    if (connError) {
      console.error('Failed to create connection:', connError);
      setError('Failed to connect. Please try again.');
      setProcessing(false);
      return;
    }

    // 2. Get or create direct conversation
    const { conversationId, error: convError } = await getOrCreateDirectConversation(user.id, player.id);

    if (convError || !conversationId) {
      console.error('Failed to create conversation:', convError);
      setError(convError || 'Failed to open chat. Please try again.');
      setProcessing(false);
      return;
    }

    // 3. Delete swipe record (best effort)
    if (swipeId) {
      const { error: deleteError } = await supabase.from('swipe_matches').delete().eq('id', swipeId);
      if (deleteError) {
        console.error('Failed to delete swipe record:', deleteError);
      }
    }

    // 4. Navigate to chat and close modal
    navigate('/circles', { state: { openConversationId: conversationId } });
    onOpenChange(false);
    onAccept?.();
    setProcessing(false);
  };

  const handleRefuse = async () => {
    if (!swipeId) return;

    setProcessing(true);

    // Delete the swipe match
    await supabase.from('swipe_matches').delete().eq('id', swipeId);

    // TODO: Create notification for the inviter
    // This will be implemented in the next phase

    setProcessing(false);
    onRefuse?.();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-surf)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90dvh', overflowY: 'auto',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr-s)' }} />
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--space-4) var(--space-2)' }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-surf-2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-t2)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '2px solid var(--color-acc)', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : player ? (
          <>
            {/* Avatar + name + location */}
            <div style={{ textAlign: 'center', padding: '0 var(--space-5) var(--space-5)' }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                margin: '0 auto var(--space-3)',
                border: '3px solid var(--color-acc)',
                overflow: 'hidden', background: 'var(--color-surf-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-t1)' }}>
                    {getInitials(player.fullName)}
                  </span>
                )}
              </div>

              {/* Invite Pending badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                background: 'color-mix(in srgb, #FFB300 12%, transparent)', color: '#FFB300',
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 'var(--space-3)',
              }}>
                <Calendar size={12} />
                Invite Pending
              </span>

              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
                fontWeight: 800, color: 'var(--color-t1)',
                margin: '0 0 var(--space-1)', letterSpacing: '-0.01em',
              }}>
                {player.fullName}
              </h2>

              {player.locationCity && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--color-t2)' }}>
                  <MapPin size={13} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)' }}>
                    {player.locationCity}
                  </span>
                </div>
              )}

              {player.bio && (
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                  color: 'var(--color-t2)', marginTop: 'var(--space-2)', lineHeight: 1.5,
                }}>
                  {player.bio}
                </p>
              )}
            </div>

            {/* Sports list */}
            {player.sports.length > 0 && (
              <div style={{ padding: '0 var(--space-5)', marginBottom: 'var(--space-5)' }}>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'var(--color-t2)', marginBottom: 'var(--space-3)', margin: '0 0 var(--space-3)',
                }}>
                  Sports
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {player.sports.map((sp, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)',
                      background: 'var(--color-surf-2)',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--color-acc-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-acc)',
                      }}>
                        <SportIcon sport={sp.sport} size="lg" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontWeight: 600,
                          fontSize: 'var(--text-sm)', color: 'var(--color-t1)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          margin: 0,
                        }}>
                          {SPORTS[sp.sport]?.name || sp.sport}
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                          color: 'var(--color-t2)', textTransform: 'capitalize', margin: 0,
                        }}>
                          {sp.level}
                        </p>
                      </div>
                      {sp.rating && (
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p style={{ color: 'var(--color-acc)', fontWeight: 700, fontSize: 'var(--text-sm)', margin: 0 }}>
                            {sp.rating}
                          </p>
                          {sp.ratingSystem && (
                            <p style={{ color: 'var(--color-t3)', fontSize: 10, margin: 0 }}>
                              {sp.ratingSystem}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ padding: '0 var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={handleRefuse}
                disabled={processing}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-red)', background: 'var(--color-red-bg)',
                  color: 'var(--color-red)', fontFamily: 'var(--font-body)', fontWeight: 700,
                  fontSize: 'var(--text-sm)', cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1,
                }}
              >
                <XCircle size={16} />
                Refuse
              </button>
              <button
                onClick={handleAccept}
                disabled={processing}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 'var(--radius-full)',
                  border: 'none', background: 'var(--color-acc)',
                  color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700,
                  fontSize: 'var(--text-sm)', cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(22,212,106,0.35)',
                }}
              >
                <Check size={16} />
                {processing ? 'Connecting…' : 'Accept'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                color: 'var(--color-red)', textAlign: 'center',
                margin: 'var(--space-2) var(--space-5) 0',
              }}>
                {error}
              </p>
            )}

            {/* Footer hint */}
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
              color: 'var(--color-t3)', textAlign: 'center',
              margin: 'var(--space-3) var(--space-5) 0',
              lineHeight: 1.5,
            }}>
              Accepting will open a chat where you can schedule a match
            </p>
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '48px var(--space-5)',
            fontFamily: 'var(--font-body)', color: 'var(--color-t2)',
          }}>
            Player not found
          </div>
        )}
      </div>
    </div>
  );
}
