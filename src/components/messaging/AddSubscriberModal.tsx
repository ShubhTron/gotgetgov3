import { useState, useEffect } from 'react';
import { Search, Check, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { addSubscriber } from '@/lib/messaging';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface AddSubscriberModalProps {
  conversationId: string;
  currentParticipantIds: string[];
  currentSubscriberCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriberAdded: () => void;
}

export function AddSubscriberModal({
  conversationId,
  currentParticipantIds,
  currentSubscriberCount,
  open,
  onOpenChange,
  onSubscriberAdded,
}: AddSubscriberModalProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user?.id) {
      loadConnections();
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSearch('');
      setError('');
    }
  }, [open]);

  const loadConnections = async () => {
    if (!user?.id) return;
    setLoading(true);

    const participantSet = new Set(currentParticipantIds);

    const [outRes, inRes] = await Promise.all([
      (supabase
        .from('connections')
        .select('profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')) as any,
      (supabase
        .from('connections')
        .select('profiles!connections_user_id_fkey(id, full_name, avatar_url)')
        .eq('connected_user_id', user.id)
        .eq('status', 'accepted')) as any,
    ]);

    const seen = new Set<string>();
    const list: Connection[] = [];

    for (const row of (outRes.data || [])) {
      const p = row.profiles;
      if (p && !seen.has(p.id) && !participantSet.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined });
      }
    }
    for (const row of (inRes.data || [])) {
      const p = row.profiles;
      if (p && !seen.has(p.id) && !participantSet.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined });
      }
    }

    setConnections(list.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user?.id || !selectedId) return;
    setSubmitting(true);
    setError('');

    const result = await addSubscriber({
      conversationId,
      adminId: user.id,
      newSubscriberId: selectedId,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to add subscriber');
      return;
    }

    onSubscriberAdded();
    onOpenChange(false);
  };

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const atLimit = currentSubscriberCount >= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subscriber</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
        {atLimit ? (
          <p className="text-sm text-center rounded-lg py-3 px-4" style={{ color: '#FFB300', background: 'rgba(255,179,0,0.08)' }}>
            This channel has reached the maximum of 500 subscribers.
          </p>
        ) : (
          <>
            {currentSubscriberCount >= 450 && (
              <p className="text-sm rounded-lg py-2 px-3" style={{ color: '#FFB300', background: 'rgba(255,179,0,0.08)' }}>
                <Radio className="w-3.5 h-3.5 inline mr-1" />
                {500 - currentSubscriberCount} spots remaining
              </p>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-t3)' }} />
              <input
                type="text"
                placeholder="Search connections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
                style={{
                  border: '1px solid var(--color-bdr)',
                  background: 'var(--color-surf)',
                  color: 'var(--color-t1)',
                }}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-acc)', borderTopColor: 'transparent' }} />
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: 'var(--color-t3)' }}>
                  {connections.length === 0 ? 'All your connections are already in this channel' : 'No results'}
                </p>
              )}
              {!loading && filtered.map((conn) => {
                const isSelected = selectedId === conn.id;
                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedId(isSelected ? null : conn.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    )}
                    style={isSelected ? { background: 'var(--color-acc-bg)' } : undefined}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={conn.avatarUrl} alt={conn.name} />
                      <AvatarFallback>{getInitials(conn.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-t1)' }}>
                      {conn.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: 'var(--color-red)' }}>{error}</p>
            )}

            <Button
              onClick={handleAdd}
              disabled={!selectedId || submitting}
              className="w-full"
            >
              {submitting ? 'Adding...' : 'Add to Channel'}
            </Button>
          </>
        )}
      </div>
      </DialogContent>
    </Dialog>
  );
}
