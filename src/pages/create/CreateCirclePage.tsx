import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

type GroupType = 'circle' | 'team';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function CreateCirclePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('circle');
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitedMembers, setInvitedMembers] = useState<Connection[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const [sportsRes, connectionsRes] = await Promise.all([
      supabase.from('user_sport_profiles').select('sport').eq('user_id', user!.id),
      supabase.from('connections').select(`
        id,
        connected_user_id,
        profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)
      `).eq('user_id', user!.id).eq('status', 'accepted'),
    ]);

    if (sportsRes.data) {
      setUserSports(sportsRes.data.map((d) => d.sport as SportType));
    }

    if (connectionsRes.data) {
      const connectionList = connectionsRes.data
        .filter((d) => d.profiles)
        .map((d) => {
          const profile = d.profiles as unknown as { id: string; full_name: string; avatar_url?: string };
          return {
            id: profile.id,
            name: profile.full_name,
            avatarUrl: profile.avatar_url,
          };
        });
      setConnections(connectionList);
    }
  };

  const selectMember = (member: Connection) => {
    if (!invitedMembers.find((m) => m.id === member.id)) {
      setInvitedMembers([...invitedMembers, member]);
    }
    setShowMemberPicker(false);
  };

  const removeMember = (id: string) => {
    setInvitedMembers(invitedMembers.filter((m) => m.id !== id));
  };

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
    !invitedMembers.find((m) => m.id === c.id)
  );

  const canSubmit = name.trim() &&
    (groupType === 'circle' || (groupType === 'team' && selectedSport));

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setIsSubmitting(true);

    try {
      if (groupType === 'circle') {
        const { data: circle, error: circleError } = await supabase.from('circles').insert({
          name: name.trim(),
          created_by: user.id,
        }).select().single();

        if (circleError) {
          console.error('Circle creation error:', circleError);
          throw circleError;
        }

        const { error: memberError } = await supabase.from('circle_members').insert({
          circle_id: circle.id,
          user_id: user.id,
          role: 'admin',
        });

        if (memberError) {
          console.error('Circle member insert error:', memberError);
        }

        for (const member of invitedMembers) {
          const { error: inviteError } = await supabase.from('circle_members').insert({
            circle_id: circle.id,
            user_id: member.id,
            role: 'member',
          });
          if (inviteError) {
            console.error('Invite member error:', inviteError);
          }
        }
      } else {
        const { data: team, error: teamError } = await (supabase.from('teams') as any).insert({
          name: name.trim(),
          sport: selectedSport,
          created_by: user.id,
        }).select().single();

        if (teamError) {
          console.error('Team creation error:', teamError);
          throw teamError;
        }

        const { error: memberError } = await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: user.id,
        });

        if (memberError) {
          console.error('Team member insert error:', memberError);
        }

        for (const member of invitedMembers) {
          const { error: inviteError } = await supabase.from('team_members').insert({
            team_id: team.id,
            user_id: member.id,
          });
          if (inviteError) {
            console.error('Team invite member error:', inviteError);
          }
        }
      }

      navigate('/circles');
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surf)' }}>
      <div className="sticky top-0 z-10 safe-top" style={{ background: 'var(--color-surf)', borderBottom: '1px solid var(--color-bdr)' }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="p-2 -ml-2"
            style={{ color: 'var(--color-t2)' }}
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-h3 font-bold" style={{ color: 'var(--color-t1)' }}>Create Circle / Team</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
            Name *
          </label>
          <Input
            placeholder={groupType === 'circle' ? 'e.g. Tuesday Night Crew' : 'e.g. Smith & Jones'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
            Type *
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => { setGroupType('circle'); setInvitedMembers(invitedMembers.slice(0, 10)); }}
              className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
              style={groupType === 'circle'
                ? { background: 'var(--color-acc)', color: '#fff' }
                : { background: '#f3f4f6', color: 'var(--color-t2)' }}
            >
              Circle
            </button>
            <button
              onClick={() => { setGroupType('team'); setInvitedMembers(invitedMembers.slice(0, 1)); }}
              className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
              style={groupType === 'team'
                ? { background: 'var(--color-acc)', color: '#fff' }
                : { background: '#f3f4f6', color: 'var(--color-t2)' }}
            >
              Team
            </button>
          </div>
          <p className="text-caption mt-2" style={{ color: 'var(--color-t3)' }}>
            {groupType === 'circle'
              ? 'A group for organizing play sessions with multiple people.'
              : 'A doubles pair for competing together.'}
          </p>
        </div>

        {groupType === 'team' && (
          <div>
            <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
              Sport *
            </label>
            <div className="flex flex-wrap gap-2">
              {userSports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className="px-4 py-2 rounded-full text-label font-medium transition-colors"
                  style={selectedSport === sport
                    ? { background: 'var(--color-acc)', color: '#fff' }
                    : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                >
                  {SPORTS[sport]?.name || sport}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
            Invite Members (Optional)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {invitedMembers.map((member) => (
              <div key={member.id} className="relative group">
                <button
                  onClick={() => {}}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative">
                    <Avatar size="lg">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-caption max-w-[64px] truncate" style={{ color: 'var(--color-t2)' }}>
                    {member.name.split(' ')[0]}
                  </span>
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowMemberPicker(true)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{ border: '2px dashed var(--color-bdr)', color: 'var(--color-t3)' }}
              >
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-caption" style={{ color: 'var(--color-t3)' }}>Invite</span>
            </button>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </div>

      <AnimatePresence>
        {showMemberPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMemberPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[16px] max-h-[70vh] overflow-hidden"
              style={{ background: 'var(--color-surf)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-bdr)' }} />
              </div>
              <div className="px-4 pb-4">
                <h3 className="text-h3 font-bold mb-4" style={{ color: 'var(--color-t1)' }}>
                  Select Members
                </h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-t3)' }} />
                  <Input
                    placeholder="Search connections..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {filteredConnections.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--color-t3)' }}>No connections found</p>
                  ) : (
                    filteredConnections.map((connection) => (
                      <button
                        key={connection.id}
                        onClick={() => selectMember(connection)}
                        className="w-full flex items-center gap-3 p-3 rounded-[8px] transition-colors hover:opacity-80"
                      >
                        <Avatar>
                          <AvatarImage src={connection.avatarUrl} />
                          <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-label font-medium" style={{ color: 'var(--color-t1)' }}>{connection.name}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
