import { useState, useEffect } from 'react';
import { Search, Check, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createBroadcastChannel } from '@/lib/messaging';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CreateBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onChannelCreated: (conversationId: string) => void;
}

export function CreateBroadcastModal({ open, onOpenChange, userId, onChannelCreated }: CreateBroadcastModalProps) {
  const { user } = useAuth();
  const [channelName, setChannelName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && userId) {
      loadConnections();
    }
  }, [open, userId]);

  useEffect(() => {
    if (!open) {
      setChannelName('');
      setAvatarUrl(null);
      setAvatarFile(null);
      setSelectedIds(new Set());
      setSearch('');
      setError('');
    }
  }, [open]);

  const loadConnections = async () => {
    if (!userId) return;
    setLoading(true);

    const [outRes, inRes] = await Promise.all([
      (supabase
        .from('connections')
        .select('profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)')
        .eq('user_id', userId)
        .eq('status', 'accepted')) as any,
      (supabase
        .from('connections')
        .select('profiles!connections_user_id_fkey(id, full_name, avatar_url)')
        .eq('connected_user_id', userId)
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
      } else if (next.size < 500) {
        next.add(id);
      }
      return next;
    });
  };

  const handleAvatarChange = (url: string | null, file?: File) => {
    setAvatarUrl(url);
    setAvatarFile(file || null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !userId) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `channel-avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error('Failed to upload avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreate = async () => {
    if (!userId || !channelName.trim() || selectedIds.size === 0) return;

    console.log('[CreateBroadcastModal] Starting channel creation process');
    console.log('  Channel name:', channelName.trim());
    console.log('  Creator ID:', userId);
    console.log('  Selected subscribers:', selectedIds.size);
    console.log('  Avatar file:', avatarFile ? 'Yes' : 'No');

    setSubmitting(true);
    setError('');

    // Upload avatar if provided
    let uploadedAvatarUrl: string | undefined = undefined;
    if (avatarFile) {
      console.log('[CreateBroadcastModal] Uploading avatar...');
      const url = await uploadAvatar();
      if (url) {
        uploadedAvatarUrl = url;
        console.log('[CreateBroadcastModal] Avatar uploaded:', url);
      } else {
        console.warn('[CreateBroadcastModal] Avatar upload failed, continuing without avatar');
      }
    }

    console.log('[CreateBroadcastModal] Calling createBroadcastChannel...');
    const result = await createBroadcastChannel({
      name: channelName.trim(),
      avatarUrl: uploadedAvatarUrl,
      creatorId: userId,
      subscriberIds: [...selectedIds],
    });

    setSubmitting(false);

    if (result.error || !result.conversationId) {
      console.error('[CreateBroadcastModal] Channel creation failed:', result.error);
      setError(result.error || 'Failed to create broadcast channel');
      return;
    }

    console.log('[CreateBroadcastModal] Channel created successfully:', result.conversationId);
    onChannelCreated(result.conversationId);
    onOpenChange(false);
  };

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = channelName.trim().length > 0 && selectedIds.size >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Broadcast Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
        {/* Broadcast icon and description */}
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-acc-bg)' }}>
          <Radio className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />
          <p className="text-sm" style={{ color: 'var(--color-t2)' }}>
            Only admins can send messages. Subscribers will receive announcements.
          </p>
        </div>

        {/* Avatar upload */}
        <div className="flex justify-center">
          <ImageUpload
            value={avatarUrl}
            name={channelName || 'Channel'}
            onChange={handleAvatarChange}
            size="lg"
          />
        </div>

        {/* Channel name */}
        <div>
          <Input
            placeholder="Channel name (required)"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Subscriber count */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-t2)' }}>
          <Radio className="w-4 h-4" />
          <span>{selectedIds.size} of 500 subscribers selected</span>
        </div>

        {/* Selected subscriber chips */}
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
            const isMaxReached = selectedIds.size >= 500 && !isSelected;
            return (
              <button
                key={conn.id}
                onClick={() => !isMaxReached && toggleSelect(conn.id)}
                disabled={isMaxReached}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  isMaxReached && 'opacity-50 cursor-not-allowed'
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
          onClick={handleCreate}
          disabled={!canCreate || submitting}
          className="w-full"
        >
          {submitting ? 'Creating...' : `Create Broadcast Channel (${selectedIds.size} subscribers)`}
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
