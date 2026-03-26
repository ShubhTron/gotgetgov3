import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, IconSearch, IconPencil } from '../../design-system';
import { StoriesStrip } from '../../components/circles/StoriesStrip';
import { ConversationRow } from '../../components/circles/ConversationRow';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { ConversationItem } from '../../types/circles';
import type { Profile } from '../../types/database';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CirclesListViewProps {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  onOpenChat: (item: ConversationItem) => void;
  onNewChat: (contactId: string, contactProfile: Profile) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CirclesListView({ conversations, loading, error, onOpenChat, onNewChat }: CirclesListViewProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<Profile[]>([]);

  // Load all accepted connections once on mount so search is instant
  useEffect(() => {
    if (!profile) return;
    supabase
      .from('connections')
      .select('connected_user_id, profiles!connections_connected_user_id_fkey(id, full_name, avatar_url, last_seen)')
      .eq('user_id', profile.id)
      .eq('status', 'accepted')
      .then(({ data }) => {
        const profiles = (data ?? []).map((row: any) => row.profiles as Profile).filter(Boolean);
        setAllContacts(profiles);
      });
  }, [profile]);

  const q = searchQuery.trim().toLowerCase();

  const filtered = q
    ? conversations.filter((c) =>
        c.displayName.toLowerCase().includes(q) ||
        (c.lastMessage?.content ?? '').toLowerCase().includes(q)
      )
    : conversations;

  // Contacts that match the search but don't yet have a direct conversation
  const existingDmIds = new Set(
    conversations
      .filter((c) => c.conversation.type === 'direct')
      .map((c) => c.otherParticipants[0]?.profile?.id)
      .filter(Boolean)
  );
  const contactSuggestions = q
    ? allContacts.filter(
        (p) =>
          (p.full_name ?? '').toLowerCase().includes(q) &&
          !existingDmIds.has(p.id)
      )
    : [];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Search bar & New Chat ──────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Search bar */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--color-surf-2)',
              borderRadius: 'var(--radius-full)',
              padding: '10px 14px',
              border: '1.5px solid var(--color-acc)',
            }}
          >
            <IconSearch size={15} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search or start a new circle"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-t1)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-t3)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* New Chat button */}
          <button
            aria-label="New message"
            onClick={() => setNewChatOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-acc)',
              flexShrink: 0,
            }}
          >
            <IconPencil size={20} />
          </button>
        </div>
      </div>

      {/* ── Stories strip ───────────────────────────────────────────────── */}
      {profile && (
        <div style={{ flexShrink: 0 }}>
          <StoriesStrip
            currentUser={profile as Profile}
            conversations={conversations}
          />
        </div>
      )}

      {/* ── Section label ────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div style={{ padding: '4px 16px 2px', flexShrink: 0 }}>
          <SectionLabel label="Messages" />
        </div>
      )}

      {/* ── Conversation list ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 8,
        } as React.CSSProperties}
      >
        {loading && <SkeletonList />}

        {!loading && error && (
          <ErrorBanner message={error} />
        )}

        {!loading && !error && filtered.length === 0 && contactSuggestions.length === 0 && (
          <EmptyState hasSearch={searchQuery.trim().length > 0} />
        )}

        {!loading &&
          !error &&
          filtered.map((item) => (
            <ConversationRow
              key={item.conversation.id}
              item={item}
              onClick={onOpenChat}
            />
          ))}

        {/* ── Contact suggestions (search results for new circles) ───────── */}
        {!loading && contactSuggestions.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 2px' }}>
              <SectionLabel label="Start a new circle" />
            </div>
            {contactSuggestions.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onNewChat(contact.id, contact)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Avatar name={contact.full_name ?? '?'} imageUrl={contact.avatar_url ?? undefined} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.full_name ?? 'Unknown'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-acc)', margin: 0, fontWeight: 600 }}>
                    Start conversation
                  </p>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── New Chat Sheet ──────────────────────────────────────────────── */}
      {profile && (
        <NewChatSheet
          open={newChatOpen}
          myUserId={profile.id}
          existingConversations={conversations}
          onClose={() => setNewChatOpen(false)}
          onSelect={(contactId, contactProfile) => {
            setNewChatOpen(false);
            onNewChat(contactId, contactProfile);
          }}
        />
      )}
    </div>
  );
}

// ─── New Chat Sheet ───────────────────────────────────────────────────────────

interface NewChatSheetProps {
  open: boolean;
  myUserId: string;
  existingConversations: ConversationItem[];
  onClose: () => void;
  onSelect: (contactId: string, contactProfile: Profile) => void;
}

function NewChatSheet({ open, myUserId, existingConversations, onClose, onSelect }: NewChatSheetProps) {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingContacts(true);
    supabase
      .from('connections')
      .select('connected_user_id, profiles!connections_connected_user_id_fkey(id, full_name, avatar_url, last_seen)')
      .eq('user_id', myUserId)
      .eq('status', 'accepted')
      .then(({ data }) => {
        const profiles = (data ?? [])
          .map((row: any) => row.profiles as Profile)
          .filter(Boolean);
        setContacts(profiles);
        setLoadingContacts(false);
      });
  }, [open, myUserId]);

  const filtered = contactSearch.trim()
    ? contacts.filter((p) =>
        (p.full_name ?? '').toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  // Mark contacts who already have a conversation (to show "existing" hint)
  const existingIds = new Set(
    existingConversations
      .filter((c) => c.conversation.type === 'direct')
      .map((c) => c.otherParticipants[0]?.profile?.id)
      .filter(Boolean)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1201,
              background: 'var(--color-surf)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              maxHeight: '80dvh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>
                  New Message
                </h2>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--color-bdr)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surf-2)', borderRadius: 'var(--radius-full)', padding: '9px 14px', marginBottom: 12 }}>
                <IconSearch size={14} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  autoFocus
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
              {loadingContacts && (
                <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2.5px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}

              {!loadingContacts && filtered.length === 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t3)', textAlign: 'center', padding: '32px 16px', margin: 0 }}>
                  {contactSearch.trim() ? 'No contacts match your search.' : 'No connected contacts yet.'}
                </p>
              )}

              {!loadingContacts && filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact.id, contact)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar name={contact.full_name ?? '?'} imageUrl={contact.avatar_url ?? undefined} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact.full_name ?? 'Unknown'}
                    </p>
                    {existingIds.has(contact.id) && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>
                        Existing conversation
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        color: 'var(--color-t3)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              flexShrink: 0,
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                height: 13,
                width: `${55 + i * 10}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: 11,
                width: `${40 + i * 8}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 40 }}>💬</span>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-t2)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {hasSearch
          ? 'No conversations match your search.'
          : 'No circles yet.\nConnect with players on Discover.'}
      </p>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: '12px 16px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-red-bg)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-red)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}
