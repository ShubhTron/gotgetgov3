import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Avatar, IconCheckCheck } from '../../design-system';
import { SportCard } from './SportCard';
import { MatchProposalCard } from './MatchProposalCard';
import type { MessageWithSender, SportCardPayload, MatchProposalPayload, AttachmentPayload } from '../../types/circles';
import { SPORT_CARD_PREFIX, MATCH_PROPOSAL_PREFIX, ATTACHMENT_PREFIX } from '../../types/circles';
import { formatFileSize } from '../../lib/attachments';
import type { Profile } from '../../types/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Parses a sport card payload from a message content string */
function parseSportCard(content: string): SportCardPayload | null {
  if (!content.startsWith(SPORT_CARD_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(SPORT_CARD_PREFIX.length)) as SportCardPayload;
  } catch {
    return null;
  }
}

/** Parses a match proposal payload from a message content string */
function parseMatchProposal(content: string): MatchProposalPayload | null {
  if (!content.startsWith(MATCH_PROPOSAL_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(MATCH_PROPOSAL_PREFIX.length)) as MatchProposalPayload;
  } catch {
    return null;
  }
}

/** Parses an attachment payload from a message content string */
function parseAttachment(content: string): AttachmentPayload | null {
  if (!content.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(ATTACHMENT_PREFIX.length)) as AttachmentPayload;
  } catch {
    return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatBubbleProps {
  msg: MessageWithSender;
  /** Show avatar on the left (true for first message in a group from same sender) */
  showAvatar: boolean;
  /** Pre-fetched profiles for sport card participants */
  participantProfiles?: Profile[];
  /** Handlers for match proposal actions (received proposals only) */
  onAcceptProposal?: (messageId: string) => void;
  onAltProposal?: (messageId: string) => void;
  onDeclineProposal?: (messageId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A single chat message bubble.
 * - Sent (isMine): right-aligned, accent green background
 * - Received: left-aligned, surface-2 background
 * - Sport card: renders SportCard component instead of text
 *
 * Corner radii follow the "tail" convention:
 * - Received: bottom-left corner flattened (points toward sender avatar)
 * - Sent: bottom-right corner flattened (visual tail)
 */
export function ChatBubble({ msg, showAvatar, participantProfiles = [], onAcceptProposal, onAltProposal, onDeclineProposal }: ChatBubbleProps) {
  const attachment = parseAttachment(msg.message.content);
  const sportCard = !attachment ? parseSportCard(msg.message.content) : null;
  const proposal = !attachment && !sportCard ? parseMatchProposal(msg.message.content) : null;
  const isTemp = msg.message.id.startsWith('temp-');

  if (msg.isMine) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginBottom: 4,
          paddingLeft: 48, // keep sent bubbles from stretching full width
        }}
      >
        {attachment ? (
          <AttachmentBubble payload={attachment} isMine={true} isTemp={isTemp} />
        ) : sportCard ? (
          <SportCard
            goal={sportCard.goal}
            sport={sportCard.sport}
            title={sportCard.title}
            description={sportCard.description}
            participants={participantProfiles}
          />
        ) : proposal ? (
          <MatchProposalCard payload={proposal} isMine={true} />
        ) : (
          <div
            style={{
              background: 'var(--color-acc)',
              color: '#fff',
              borderRadius: `var(--radius-2xl) var(--radius-2xl) var(--radius-sm) var(--radius-2xl)`,
              padding: '10px 14px',
              maxWidth: '100%',
              wordBreak: 'break-word',
              opacity: isTemp ? 0.7 : 1,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {msg.message.content}
            </p>
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginTop: 3,
            marginRight: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: 'var(--color-t3)',
            }}
          >
            {formatTime(msg.message.created_at)}
          </span>
          {!isTemp && (
            <IconCheckCheck
              size={12}
              style={{ color: 'var(--color-acc)' }}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── Received bubble ────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 4,
        paddingRight: 48,
      }}
    >
      {/* Sender avatar (shown only for first message in a group) */}
      <div style={{ width: 28, flexShrink: 0 }}>
        {showAvatar && (
          <Avatar
            name={msg.sender?.full_name ?? '?'}
            imageUrl={msg.sender?.avatar_url ?? undefined}
            size="sm"
          />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {attachment ? (
          <AttachmentBubble payload={attachment} isMine={false} isTemp={isTemp} />
        ) : sportCard ? (
          <SportCard
            goal={sportCard.goal}
            sport={sportCard.sport}
            title={sportCard.title}
            description={sportCard.description}
            participants={participantProfiles}
          />
        ) : proposal ? (
          <MatchProposalCard
            payload={proposal}
            isMine={false}
            onAccept={() => onAcceptProposal?.(msg.message.id)}
            onAlt={() => onAltProposal?.(msg.message.id)}
            onDecline={() => onDeclineProposal?.(msg.message.id)}
          />
        ) : (
          <div
            style={{
              background: 'var(--color-surf-2)',
              color: 'var(--color-t1)',
              borderRadius: `var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm)`,
              padding: '10px 14px',
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {msg.message.content}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: 'var(--color-t3)',
            marginTop: 3,
            marginLeft: 2,
          }}
        >
          {formatTime(msg.message.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Attachment bubble ────────────────────────────────────────────────────────

function AttachmentBubble({
  payload,
  isMine,
  isTemp,
}: {
  payload: AttachmentPayload;
  isMine: boolean;
  isTemp: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const bubbleBg    = isMine ? 'var(--color-acc)' : 'var(--color-surf-2)';
  const textColor   = isMine ? '#fff' : 'var(--color-t1)';
  const subColor    = isMine ? 'rgba(255,255,255,0.65)' : 'var(--color-t3)';
  const borderRadius = isMine
    ? 'var(--radius-2xl) var(--radius-2xl) var(--radius-sm) var(--radius-2xl)'
    : 'var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm)';

  return (
    <>
      <div style={{
        maxWidth: 240,
        opacity: isTemp ? 0.7 : 1,
        borderRadius,
        overflow: 'hidden',
        background: bubbleBg,
      }}>
        {/* ── Image ── */}
        {payload.type === 'image' && (
          <img
            src={payload.url}
            alt={payload.name}
            onClick={() => setLightboxOpen(true)}
            style={{
              display: 'block',
              width: '100%',
              maxHeight: 220,
              objectFit: 'cover',
              cursor: 'pointer',
            }}
          />
        )}

        {/* ── Video ── */}
        {payload.type === 'video' && (
          <video
            src={payload.url}
            controls
            preload="metadata"
            style={{
              display: 'block',
              width: '100%',
              maxHeight: 220,
              background: '#000',
            }}
          />
        )}

        {/* ── Audio ── */}
        {payload.type === 'audio' && (
          <div style={{ padding: '12px 14px 10px' }}>
            <p style={{
              margin: '0 0 6px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: textColor,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {payload.name}
            </p>
            <audio
              src={payload.url}
              controls
              style={{ width: '100%', height: 36 }}
            />
          </div>
        )}

        {/* ── Document ── */}
        {payload.type === 'document' && (
          <a
            href={payload.url}
            download={payload.name}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--color-surf)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileText size={20} color={textColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: textColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {payload.name}
              </p>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: subColor,
                marginTop: 2,
              }}>
                {formatFileSize(payload.size)}
              </p>
            </div>
            <Download size={16} color={subColor} style={{ flexShrink: 0 }} />
          </a>
        )}

        {/* ── Caption (optional text alongside the attachment) ── */}
        {payload.caption && (
          <div style={{ padding: '8px 14px 12px' }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: textColor,
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}>
              {payload.caption}
            </p>
          </div>
        )}
      </div>

      {/* ── Image lightbox ── */}
      {lightboxOpen && payload.type === 'image' && (
        <ImageLightbox
          src={payload.url}
          alt={payload.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: 12,
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
