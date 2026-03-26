import React, { useState, useRef, type KeyboardEvent } from 'react';
import { CalendarPlus } from 'lucide-react';
import {
  IconSmile,
  IconPaperclip,
  IconArrowRight,
} from '../../design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageComposerProps {
  onSend: (text: string) => void;
  sending: boolean;
  /** Optional error text shown briefly above the composer */
  sendError?: string | null;
  /** Opens the suggest time sheet */
  onSuggestTime?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fixed-bottom message composer bar.
 * - Pill-shaped input (design system rule: no box borders, pill bg)
 * - Enter key sends; Shift+Enter inserts newline
 * - Send button disabled when input is empty or sending is in progress
 * - Icon buttons (+, emoji, clip) are stubs for future functionality
 */
export function MessageComposer({ onSend, sending, sendError, onSuggestTime }: MessageComposerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !sending;

  function handleSend() {
    if (!canSend) return;
    onSend(text);
    setText('');
    // Keep focus on input after sending
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        // Tonal top separator — no border
        paddingTop: 8,
        paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      {/* Send error feedback */}
      {sendError && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-red)',
            textAlign: 'center',
            margin: '0 0 6px',
          }}
        >
          {sendError}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        {/* Suggest time button */}
        <IconButton aria-label="Suggest a time" disabled={sending} onClick={onSuggestTime}>
          <CalendarPlus size={18} />
        </IconButton>

        {/* Emoji button (stub) */}
        <IconButton aria-label="Emoji picker" disabled={sending}>
          <IconSmile size={20} />
        </IconButton>

        {/* Text input */}
        <div
          style={{
            flex: 1,
            background: 'var(--color-surf-2)',
            borderRadius: 'var(--radius-full)',
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            minHeight: 40,
          }}
        >
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            disabled={sending}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-t1)',
              lineHeight: 1.4,
              maxHeight: 100,
              overflowY: 'auto',
              padding: 0,
              // Scrollbar hide
              scrollbarWidth: 'none',
            } as React.CSSProperties}
          />
        </div>

        {/* Attachment (stub) */}
        <IconButton aria-label="Attach file" disabled={sending}>
          <IconPaperclip size={20} />
        </IconButton>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            background: canSend ? 'var(--color-acc)' : 'var(--color-surf-2)',
            border: 'none',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s ease, transform 0.1s ease',
            transform: canSend ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {sending ? (
            <Spinner />
          ) : (
            <IconArrowRight
              size={16}
              style={{ color: canSend ? '#fff' : 'var(--color-t3)' }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Icon button helper ───────────────────────────────────────────────────────

function IconButton({
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
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
        flexShrink: 0,
        color: 'var(--color-t2)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Minimal spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 'var(--radius-full)',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}
