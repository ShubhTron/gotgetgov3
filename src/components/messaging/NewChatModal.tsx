import { useState, useEffect } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/avatar-utils';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
}

export function NewChatModal({ open, onOpenChange, onSelectUser }: NewChatModalProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadConnections();
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) {
      setSearch('');
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

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    onOpenChange(false);
  };

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
          <div className="max-h-96 overflow-y-auto space-y-1">
            {loading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-acc)', borderTopColor: 'transparent' }} />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <MessageCircle className="w-10 h-10 mb-3" style={{ color: 'var(--color-t3)' }} />
                <p className="text-sm" style={{ color: 'var(--color-t2)' }}>
                  {connections.length === 0 ? 'No connections yet' : 'No results'}
                </p>
              </div>
            )}
            {!loading && filtered.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleSelectUser(conn.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:opacity-80 text-left"
                style={{ background: 'var(--color-surf-2)' }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conn.avatarUrl} alt={conn.name} />
                  <AvatarFallback>{getInitials(conn.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-t1)' }}>
                  {conn.name}
                </span>
                <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
