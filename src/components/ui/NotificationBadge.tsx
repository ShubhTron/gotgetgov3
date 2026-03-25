import * as React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const MAX_COUNT = 99;

export function NotificationBadge({ count, className, style }: NotificationBadgeProps) {
  if (!count || count === 0) return null;

  const displayCount = count > MAX_COUNT ? `${MAX_COUNT}+` : String(count);

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1',
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px]',
        'px-1 rounded-full',
        'text-[10px] font-bold leading-none',
        className
      )}
      style={{ background: 'var(--color-red)', color: '#fff', ...style }}
      role="status"
      aria-label={`${count} unread`}
    >
      {displayCount}
    </span>
  );
}
