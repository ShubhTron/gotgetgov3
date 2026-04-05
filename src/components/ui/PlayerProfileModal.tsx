import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Swords } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { checkMutualConnection } from '@/lib/messaging';
import { useAuth } from '@/contexts/AuthContext';

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
  isConnected?: boolean;
}

interface PlayerProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string | null;
  onChallenge?: (playerId: string) => void;
  onMessage?: (playerId: string) => void;
}

export function PlayerProfileModal({
  open,
  onOpenChange,
  playerId,
  onChallenge,
  onMessage,
}: PlayerProfileModalProps) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMutuallyConnected, setIsMutuallyConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && playerId) {
      fetchPlayer(playerId);
      checkConnection(playerId);
    }
  }, [open, playerId]);

  const checkConnection = async (targetUserId: string) => {
    if (!user?.id || user.id === targetUserId) {
      setIsMutuallyConnected(false);
      return;
    }
    const mutualConnection = await checkMutualConnection(user.id, targetUserId);
    setIsMutuallyConnected(mutualConnection);
  };

  const fetchPlayer = async (id: string) => {
    setLoading(true);
    const [profileRes, sportsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url, bio, location_city').eq('id', id).maybeSingle(),
      supabase.from('user_sport_profiles').select('sport, self_assessed_level, official_rating, official_rating_system').eq('user_id', id),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0" showCloseButton={false}>
        <div className="relative">
          <div style={{ height: 128, background: 'linear-gradient(135deg, var(--color-acc-bg), var(--color-surf))' }} />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <Avatar className="h-24 w-24 ring-4" style={{ '--tw-ring-color': 'var(--color-bg)' } as React.CSSProperties}>
              <AvatarImage src={player?.avatarUrl} alt={player?.fullName || '?'} />
              <AvatarFallback>{getInitials(player?.fullName || '?')}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div style={{ paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, maxWidth: 560, width: '100%' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid var(--color-acc)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : player ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--color-t1)', marginBottom: 4 }}>
                  {player.fullName}
                </h2>
                {player.locationCity && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <MapPin className="w-4 h-4" style={{ color: 'var(--color-t3)' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t3)' }}>{player.locationCity}</span>
                  </div>
                )}
              </div>

              {player.bio && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', textAlign: 'center', marginBottom: 24 }}>
                  {player.bio}
                </p>
              )}

              {player.sports.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-t1)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Sports
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {player.sports.map((sp, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--color-surf-2)', borderRadius: 12 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-acc-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18 }}>{SPORTS[sp.sport]?.icon || '🎾'}</span>
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)' }}>
                              {SPORTS[sp.sport]?.name || sp.sport}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', textTransform: 'capitalize' }}>{sp.level}</p>
                          </div>
                        </div>
                        {sp.rating && (
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--color-acc)' }}>{sp.rating}</p>
                            {sp.ratingSystem && (
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>{sp.ratingSystem}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                {onChallenge && (
                  <Button className="flex-1" onClick={() => onChallenge(player.id)}>
                    <Swords className="w-4 h-4" />
                    Challenge
                  </Button>
                )}
                {onMessage && isMutuallyConnected && user?.id !== player.id && (
                  <Button variant="secondary" className="flex-1" onClick={() => onMessage(player.id)}>
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                )}
              </div>
              {onMessage && !isMutuallyConnected && user?.id !== player.id && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', textAlign: 'center', marginTop: 12 }}>
                  Connect to message this player
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-t3)', fontFamily: 'var(--font-body)' }}>
              Player not found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
