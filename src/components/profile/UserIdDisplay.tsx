import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { formatUserIdForDisplay } from '@/lib/userId';
import { cn } from '@/lib/utils';

interface UserIdDisplayProps {
  userId: string;
  className?: string;
}

export function UserIdDisplay({ userId, className }: UserIdDisplayProps) {
  const [copied, setCopied] = useState(false);
  const displayId = formatUserIdForDisplay(userId);

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or when Clipboard API is unavailable
        const textArea = document.createElement('textarea');
        textArea.value = displayId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy user ID:', err);
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <p style={{ fontSize: 14, color: 'var(--color-t2)', margin: 0 }}>Your User ID</p>
        <p style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-t1)', margin: 0 }}>
          {displayId}
        </p>
      </div>
      <button
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          border: copied ? '1px solid var(--color-acc)' : '1px solid var(--color-bdr)',
          background: copied ? 'var(--color-acc-bg)' : 'var(--color-surf)',
          color: copied ? 'var(--color-acc)' : 'var(--color-t2)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: 14,
          fontWeight: 500,
        }}
        aria-label={copied ? 'Copied to clipboard' : 'Copy user ID to clipboard'}
      >
        {copied ? (
          <>
            <Check style={{ width: 16, height: 16 }} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy style={{ width: 16, height: 16 }} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
