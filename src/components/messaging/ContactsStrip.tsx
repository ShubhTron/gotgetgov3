import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/avatar-utils';

interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ContactsStripProps {
  onContactPress?: (userId: string) => void;
  onAddPress?: () => void;
}

const RING_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fd7043,#ff8a65)',
  'linear-gradient(135deg,#26c6da,#00acc1)',
];

function ringGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return RING_GRADIENTS[Math.abs(hash) % RING_GRADIENTS.length];
}

export function ContactsStrip({ onContactPress, onAddPress }: ContactsStripProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [{ data: asSender }, { data: asReceiver }] = await Promise.all([
        supabase.from('connections').select('connected_user_id').eq('user_id', user!.id).eq('status', 'accepted').limit(20),
        supabase.from('connections').select('user_id').eq('connected_user_id', user!.id).eq('status', 'accepted').limit(20),
      ]);
      const ids = [...new Set([
        ...(asSender || []).map((r: any) => r.connected_user_id as string),
        ...(asReceiver || []).map((r: any) => r.user_id as string),
      ])].slice(0, 20);
      if (!ids.length) return;
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids);
      if (!profiles) return;
      setContacts(profiles.map((p: any) => ({
        id: p.id,
        name: (p.full_name as string).split(' ')[0],
        avatarUrl: p.avatar_url ?? undefined,
      })));
    }
    load();
  }, [user]);

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 px-4 w-max">
        {/* Add Story / New Chat */}
        <button
          onClick={onAddPress}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: 'var(--color-bdr)', background: 'var(--color-surf-2)' }}
          >
            <Plus className="w-5 h-5" style={{ color: 'var(--color-t2)' }} />
          </div>
          <span className="text-[11px] font-medium w-14 text-center truncate" style={{ color: 'var(--color-t2)' }}>Add Story</span>
        </button>

        {/* Contacts */}
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onContactPress?.(contact.id)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-14 h-14 rounded-full p-[2px] flex-shrink-0"
              style={{ background: ringGradient(contact.name) }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden"
                style={{ background: 'var(--color-surf)' }}
              >
                <Avatar className="w-full h-full rounded-full">
                  <AvatarImage src={contact.avatarUrl} alt={contact.name} className="rounded-full" />
                  <AvatarFallback className="text-sm rounded-full">{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] font-medium w-14 text-center truncate" style={{ color: 'var(--color-t1)' }}>{contact.name}</span>
          </button>
        ))}

        {contacts.length === 0 && (
          <div className="flex items-center h-14 px-2">
            <span className="text-xs" style={{ color: 'var(--color-t2)' }}>No connections yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
