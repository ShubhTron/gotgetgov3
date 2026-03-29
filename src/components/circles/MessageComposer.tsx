import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { CalendarPlus, FileText, Image, Camera, Headphones, X, Mic, Film } from 'lucide-react';
import {
  IconSmile,
  IconPaperclip,
  IconArrowRight,
} from '../../design-system';
import { getAttachmentType, formatFileSize } from '../../lib/attachments';
import type { AttachmentPayload } from '../../types/circles';

// ─── Emoji data ────────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
      '🥰','😍','🤩','😘','😎','🤓','😏','😒','😔','😪','😴','😷','🤒',
      '🤕','🥳','🤯','😤','😠','😡','🤬','😈','💀','🙈','🙉','🙊',
    ],
  },
  {
    label: 'Sports',
    emojis: [
      '🎾','⚽','🏀','🏈','⚾','🥎','🏐','🏉','🥏','🎱','🏓','🏸',
      '🥊','🥋','⛳','🎯','🏆','🥇','🥈','🥉','🏅','🎖','🤸','⛹',
      '🏃','🚴','🏊','🤽','🧗','🏋','🤼','🤺','🏇','⛷','🏂','🤿',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍','👎','👏','🙌','🤝','🤜','🤛','✊','👊','💪','🦾','🖐',
      '✋','👋','🤙','☝','👆','👇','👉','👈','🤞','🤟','🤘','🤙',
      '💅','🤲','🙏','✍','💪',
    ],
  },
  {
    label: 'Hearts',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕',
      '💞','💓','💗','💖','💘','💝','🔥','✨','⭐','🌟','💫','⚡',
      '🌈','☀️','🌊','❄️','🎉','🎊','🎈',
    ],
  },
];

// ─── Attachment options ────────────────────────────────────────────────────────

const ATTACH_OPTIONS = [
  { label: 'Document',        icon: FileText,   color: '#7C3AED', accept: '*/*',             capture: undefined },
  { label: 'Photos & videos', icon: Image,      color: '#2563EB', accept: 'image/*,video/*', capture: undefined },
  { label: 'Camera',          icon: Camera,     color: '#DC2626', accept: 'image/*',          capture: 'environment' as const },
  { label: 'Audio',           icon: Headphones, color: '#D97706', accept: 'audio/*',          capture: 'user' as const },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingAttachment {
  file: File;
  previewUrl: string;  // blob URL from URL.createObjectURL
  type: AttachmentPayload['type'];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageComposerProps {
  onSend: (text: string, attachment?: PendingAttachment) => void;
  sending: boolean;
  sendError?: string | null;
  onSuggestTime?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessageComposer({ onSend, sending, sendError, onSuggestTime }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);

  const inputRef        = useRef<HTMLTextAreaElement>(null);
  const pickerRef       = useRef<HTMLDivElement>(null);
  const attachMenuRef   = useRef<HTMLDivElement>(null);
  const emojiButtonRef  = useRef<HTMLButtonElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);

  // Hidden file input refs
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const canSend = (text.trim().length > 0 || pendingAttachment !== null) && !sending;

  // Revoke blob URL when attachment is dismissed or component unmounts
  useEffect(() => {
    return () => {
      if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.previewUrl);
    };
  }, [pendingAttachment]);

  // Close panels when clicking outside
  useEffect(() => {
    if (!showPicker && !showAttachMenu) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (showPicker &&
        pickerRef.current && !pickerRef.current.contains(t) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(t)
      ) setShowPicker(false);

      if (showAttachMenu &&
        attachMenuRef.current && !attachMenuRef.current.contains(t) &&
        attachButtonRef.current && !attachButtonRef.current.contains(t)
      ) setShowAttachMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker, showAttachMenu]);

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    if (!el) { setText(prev => prev + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end   = el.selectionEnd   ?? text.length;
    const text2 = text.slice(0, start) + emoji + text.slice(end);
    setText(text2);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleSend() {
    if (!canSend) return;
    onSend(text, pendingAttachment ?? undefined);
    setText('');
    setShowPicker(false);
    // Clear pending attachment state but do NOT revoke the blob URL here —
    // ChatDetailView still needs the File object for uploading.
    setPendingAttachment(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function triggerFileInput(index: number) {
    setShowAttachMenu(false);
    fileRefs.current[index]?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingAttachment({
        file,
        previewUrl: URL.createObjectURL(file),
        type: getAttachmentType(file),
      });
      setShowAttachMenu(false);
    }
    e.target.value = ''; // allow same file to be picked again
  }

  function dismissAttachment() {
    if (pendingAttachment) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
      setPendingAttachment(null);
    }
  }

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Hidden file inputs ─────────────────────────────────────────────── */}
      {ATTACH_OPTIONS.map((opt, i) => (
        <input
          key={opt.label}
          ref={el => { fileRefs.current[i] = el; }}
          type="file"
          accept={opt.accept}
          {...(opt.capture ? { capture: opt.capture } : {})}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      ))}

      {/* ── Attachment menu ────────────────────────────────────────────────── */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 4,
            width: 220,
            background: 'var(--color-surf-1)',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {ATTACH_OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                onClick={() => triggerFileInput(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < ATTACH_OPTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: opt.color + '26',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={opt.color} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--color-t1)',
                }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Emoji picker ───────────────────────────────────────────────────── */}
      {showPicker && (
        <div
          ref={pickerRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 4,
            background: 'var(--color-surf-1)',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            padding: '12px 10px',
            zIndex: 200,
            maxHeight: 260,
            overflowY: 'auto',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {EMOJI_CATEGORIES.map(cat => (
            <div key={cat.label} style={{ marginBottom: 10 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                color: 'var(--color-t3)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2,
              }}>
                {cat.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {cat.emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 22, lineHeight: 1, padding: '4px 3px', borderRadius: 6,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surf-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pending attachment preview strip ───────────────────────────────── */}
      {pendingAttachment && (
        <div style={{
          background: 'var(--color-bg)',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Thumbnail for images, icon for other types */}
          {pendingAttachment.type === 'image' ? (
            <img
              src={pendingAttachment.previewUrl}
              alt="preview"
              style={{
                height: 72,
                maxWidth: 110,
                borderRadius: 10,
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid var(--color-bdr)',
              }}
            />
          ) : (
            <div style={{
              width: 48, height: 48,
              borderRadius: 10,
              background: 'var(--color-surf-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {pendingAttachment.type === 'video'    && <Film     size={22} color="var(--color-t2)" />}
              {pendingAttachment.type === 'audio'    && <Mic      size={22} color="var(--color-t2)" />}
              {pendingAttachment.type === 'document' && <FileText size={22} color="var(--color-t2)" />}
            </div>
          )}

          {/* File name + size */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-t1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {pendingAttachment.file.name}
            </p>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-t3)',
              marginTop: 2,
            }}>
              {formatFileSize(pendingAttachment.file.size)}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissAttachment}
            style={{
              width: 28, height: 28,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} color="var(--color-t2)" />
          </button>
        </div>
      )}

      {/* ── Composer bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-bg)',
        paddingTop: 8,
        paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
        paddingLeft: 12,
        paddingRight: 12,
      }}>
        {sendError && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
            color: 'var(--color-red)', textAlign: 'center', margin: '0 0 6px',
          }}>
            {sendError}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* Suggest time */}
          <IconButton aria-label="Suggest a time" disabled={sending} onClick={onSuggestTime}>
            <CalendarPlus size={18} />
          </IconButton>

          {/* Attachment - Hidden from UI but backend functionality preserved */}
          {/* <button
            ref={attachButtonRef}
            aria-label="Attach file"
            disabled={sending}
            onClick={() => { setShowAttachMenu(v => !v); setShowPicker(false); }}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-full)',
              background: showAttachMenu ? 'var(--color-surf-2)' : 'none',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: showAttachMenu ? 'var(--color-acc)' : 'var(--color-t2)',
              opacity: sending ? 0.4 : 1, transition: 'background 0.15s, color 0.15s',
            }}
          >
            <IconPaperclip size={20} />
          </button> */}

          {/* Text input */}
          <div style={{
            flex: 1, background: 'var(--color-surf-2)',
            borderRadius: 'var(--radius-full)', padding: '9px 14px',
            display: 'flex', alignItems: 'center', minHeight: 40,
          }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              disabled={sending}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                resize: 'none', fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)', color: 'var(--color-t1)',
                lineHeight: 1.4, maxHeight: 100, overflowY: 'auto',
                padding: 0, scrollbarWidth: 'none',
              } as React.CSSProperties}
            />
          </div>

          {/* Emoji - Hidden from UI but backend functionality preserved */}
          {/* <button
            ref={emojiButtonRef}
            aria-label="Emoji picker"
            disabled={sending}
            onClick={() => { setShowPicker(v => !v); setShowAttachMenu(false); }}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-full)',
              background: showPicker ? 'var(--color-surf-2)' : 'none',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: showPicker ? 'var(--color-acc)' : 'var(--color-t2)',
              opacity: sending ? 0.4 : 1, transition: 'background 0.15s, color 0.15s',
            }}
          >
            <IconSmile size={20} />
          </button> */}

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            style={{
              width: 40, height: 40, borderRadius: 'var(--radius-full)',
              background: canSend ? 'var(--color-acc)' : 'var(--color-surf-2)',
              border: 'none', cursor: canSend ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.2s ease, transform 0.1s ease',
              transform: canSend ? 'scale(1)' : 'scale(0.95)',
            }}
          >
            {sending ? <Spinner /> : (
              <IconArrowRight size={16} style={{ color: canSend ? '#fff' : 'var(--color-t3)' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icon button helper ───────────────────────────────────────────────────────

function IconButton({ children, disabled, onClick, 'aria-label': ariaLabel }: {
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
        width: 36, height: 36, borderRadius: 'var(--radius-full)',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'var(--color-t2)', opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Minimal spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: 'var(--radius-full)',
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
