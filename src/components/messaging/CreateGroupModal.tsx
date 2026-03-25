import { useState, useEffect } from 'react';
import { Search, Check, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createGroup } from '@/lib/messaging';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      setGroupName('');
      setSelectedIds(new Set());
      setSearch('');
      setError('');
    }
  }, [open]);

  const loadConnections = async () => {
    if (!user?.id) return;
    setLoading(true);

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
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined });
      }
    }
    for (const row of (inRes.data || [])) {
      const p = row.profiles;
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined });
      }
    }

    setConnections(list.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 49) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!user?.id || !groupName.trim() || selectedIds.size === 0) return;
    setSubmitting(true);
    setError('');

    const result = await createGroup({
      name: groupName.trim(),
      creatorId: user.id,
      memberIds: [...selectedIds],
    });

    setSubmitting(false);

    if (result.error || !result.conversationId) {
      setError(result.error || 'Failed to create group');
      return;
    }

    onGroupCreated(result.conversationId);
    onOpenChange(false);
  };

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = groupName.trim().length > 0 && selectedIds.size >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
        {/* Group name */}
        <div>
          <Input
            placeholder="Group name (required)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Member count */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-t2)' }}>
          <Users className="w-4 h-4" />
          <span>{selectedIds.size} of 49 members selected</span>
        </div>

        {/* Selected member chips */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {[...selectedIds].map((id) => {
              const conn = connections.find((c) => c.id === id);
              if (!conn) return null;
              return (
                <button
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }}
                >
                  {conn.name}
                  <span style={{ color: 'var(--color-acc)', opacity: 0.7 }}>×</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
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

        {/* Connection list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-acc)', borderTopColor: 'transparent' }} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-t3)' }}>
              {connections.length === 0 ? 'No connections yet' : 'No results'}
            </p>
          )}
          {!loading && filtered.map((conn) => {
            const isSelected = selectedIds.has(conn.id);
            return (
              <button
                key={conn.id}
                onClick={() => toggleSelect(conn.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
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
          onClick={handleCreate}
          disabled={!canCreate || submitting}
          className="w-full"
        >
          {submitting ? 'Creating...' : `Create Group (${selectedIds.size + 1} members)`}
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
