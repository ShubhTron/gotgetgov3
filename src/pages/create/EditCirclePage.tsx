import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Search, Trash2, Save } from 'lucide-react';
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

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function EditCirclePage() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const { user } = useAuth();
  const groupType = (type === 'team' ? 'team' : 'circle') as GroupType;

  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id, groupType]);

  const fetchData = async () => {
    setLoading(true);

    const [connectionsOutRes, connectionsInRes] = await Promise.all([
      supabase.from('connections').select(`
        id,
        profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)
      `).eq('user_id', user!.id).eq('status', 'accepted'),
      supabase.from('connections').select(`
        id,
        profiles!connections_user_id_fkey(id, full_name, avatar_url)
      `).eq('connected_user_id', user!.id).eq('status', 'accepted'),
    ]);

    const connectionMap = new Map<string, Connection>();
    (connectionsOutRes.data as any[] || []).filter((d) => d.profiles).forEach((d) => {
      const profile = d.profiles as { id: string; full_name: string; avatar_url?: string };
      connectionMap.set(profile.id, { id: profile.id, name: profile.full_name, avatarUrl: profile.avatar_url });
    });
    (connectionsInRes.data as any[] || []).filter((d) => d.profiles).forEach((d) => {
      const profile = d.profiles as { id: string; full_name: string; avatar_url?: string };
      if (!connectionMap.has(profile.id)) {
        connectionMap.set(profile.id, { id: profile.id, name: profile.full_name, avatarUrl: profile.avatar_url });
      }
    });
    setConnections(Array.from(connectionMap.values()));

    if (groupType === 'circle') {
      const [circleRes, membersRes] = await Promise.all([
        supabase.from('circles').select('id, name').eq('id', id!).maybeSingle(),
        supabase.from('circle_members').select(`
          user_id,
          role,
          profiles(id, full_name, avatar_url)
        `).eq('circle_id', id!),
      ]);

      if (circleRes.data) {
        setName(circleRes.data.name);
      }

      if (membersRes.data) {
        const memberList = (membersRes.data as any[])
          .filter((m) => m.profiles)
          .map((m) => {
            const profile = m.profiles as { id: string; full_name: string; avatar_url?: string };
            return {
              id: profile.id,
              name: profile.full_name,
              avatarUrl: profile.avatar_url,
              role: m.role,
            };
          });
        setMembers(memberList);
      }
    } else {
      const [teamRes, membersRes] = await Promise.all([
        supabase.from('teams').select('id, name, sport').eq('id', id!).maybeSingle(),
        supabase.from('team_members').select(`
          user_id,
          profiles(id, full_name, avatar_url)
        `).eq('team_id', id!),
      ]);

      if (teamRes.data) {
        setName(teamRes.data.name);
        setSport(teamRes.data.sport as SportType);
      }

      if (membersRes.data) {
        const memberList = (membersRes.data as any[])
          .filter((m) => m.profiles)
          .map((m) => {
            const profile = m.profiles as { id: string; full_name: string; avatar_url?: string };
            return {
              id: profile.id,
              name: profile.full_name,
              avatarUrl: profile.avatar_url,
            };
          });
        setMembers(memberList);
      }
    }

    setLoading(false);
  };

  const addMember = async (connection: Connection) => {
    if (members.find((m) => m.id === connection.id)) return;

    if (groupType === 'circle') {
      const { error } = await (supabase.from('circle_members') as any).insert({
        circle_id: id,
        user_id: connection.id,
        role: 'member',
      });
      if (!error) {
        setMembers([...members, { ...connection, role: 'member' }]);
      }
    } else {
      const { error } = await (supabase.from('team_members') as any).insert({
        team_id: id,
        user_id: connection.id,
      });
      if (!error) {
        setMembers([...members, connection]);
      }
    }
    setShowMemberPicker(false);
  };

  const removeMember = async (memberId: string) => {
    if (memberId === user?.id) return;

    if (groupType === 'circle') {
      const { error } = await supabase.from('circle_members')
        .delete()
        .eq('circle_id', id)
        .eq('user_id', memberId);
      if (!error) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } else {
      const { error } = await supabase.from('team_members')
        .delete()
        .eq('team_id', id)
        .eq('user_id', memberId);
      if (!error) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (groupType === 'circle') {
      await supabase.from('circles').update({ name: name.trim() }).eq('id', id!);
    } else {
      await supabase.from('teams').update({ name: name.trim() }).eq('id', id!);
    }

    setIsSubmitting(false);
    navigate('/circles');
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this ${groupType}? This cannot be undone.`)) return;
    setIsDeleting(true);

    if (groupType === 'circle') {
      await supabase.from('circle_members').delete().eq('circle_id', id!);
      await supabase.from('circles').delete().eq('id', id!);
    } else {
      await supabase.from('team_members').delete().eq('team_id', id!);
      await supabase.from('teams').delete().eq('id', id!);
    }

    setIsDeleting(false);
    navigate('/circles');
  };

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
    !members.find((m) => m.id === c.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surf)' }}>
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-acc)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surf)' }}>
      <div className="sticky top-0 z-10 safe-top" style={{ background: 'var(--color-surf)', borderBottom: '1px solid var(--color-bdr)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2"
            style={{ color: 'var(--color-t2)' }}
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-h3 font-bold" style={{ color: 'var(--color-t1)' }}>
            Edit {groupType === 'circle' ? 'Circle' : 'Team'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {groupType === 'team' && sport && (
          <div>
            <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
              Sport
            </label>
            <div
              className="px-4 py-3 rounded-[8px]"
              style={{ background: '#f9fafb', color: 'var(--color-t2)' }}
            >
              {SPORTS[sport]?.name || sport}
            </div>
          </div>
        )}

        <div>
          <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
            Members
          </label>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-[8px]"
                style={{ background: '#f9fafb' }}
              >
                <Avatar>
                  <AvatarImage src={member.avatarUrl} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-label font-medium" style={{ color: 'var(--color-t1)' }}>
                    {member.name}
                  </p>
                  {member.role && (
                    <p className="text-caption capitalize" style={{ color: 'var(--color-t3)' }}>{member.role}</p>
                  )}
                </div>
                {member.id !== user?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 rounded-full transition-colors"
                    style={{ color: 'var(--color-red)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowMemberPicker(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-[8px] transition-colors"
              style={{ border: '2px dashed var(--color-bdr)', color: 'var(--color-t3)' }}
            >
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSubmitting} className="flex-1">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--color-bdr)' }}>
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full"
            style={{ color: 'var(--color-red)', borderColor: '#fecaca' }}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : `Delete ${groupType === 'circle' ? 'Circle' : 'Team'}`}
          </Button>
        </div>
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
                  Add Members
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
                        onClick={() => addMember(connection)}
                        className="w-full flex items-center gap-3 p-3 rounded-[8px] transition-colors hover:opacity-80"
                      >
                        <Avatar>
                          <AvatarImage src={connection.avatarUrl} />
                          <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-label font-medium" style={{ color: 'var(--color-t1)' }}>{connection.name}</p>
                        </div>
                        <Plus className="w-5 h-5" style={{ color: 'var(--color-t3)' }} />
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
