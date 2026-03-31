import type { ConversationItem } from '@/types/circles';
import type { Profile } from '@/types/database';
import { CirclesListView } from './CirclesListView';

// ─── Props Interface ──────────────────────────────────────────────────────────

interface CirclesViewProps {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  onOpenChat: (item: ConversationItem) => void;
  onNewChat: (contactId: string, contactProfile: Profile) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CirclesView({
  conversations,
  loading,
  error,
  onOpenChat,
  onNewChat,
  scrollContainerRef,
}: CirclesViewProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CirclesListView
        conversations={conversations}
        loading={loading}
        error={error}
        onOpenChat={onOpenChat}
        onNewChat={onNewChat}
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  );
}
