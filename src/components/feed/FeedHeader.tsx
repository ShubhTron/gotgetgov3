import { Search, Bell, User } from 'lucide-react';
import { getInitials } from '@/lib/avatar-utils';

interface FeedHeaderProps {
  onSearchClick: () => void;
  onNotificationClick: () => void;
  onAvatarClick: () => void;
  hasNotifications: boolean;
}

export function FeedHeader({
  onSearchClick,
  onNotificationClick,
  onAvatarClick,
  hasNotifications,
}: FeedHeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-bdr)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        zIndex: 100,
      }}
    >
      {/* Logo and Context Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-t1)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Got<span style={{ fontStyle: 'italic', color: 'var(--color-acc-dk)' }}>Get</span>Go
        </h1>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 99,
            background: 'var(--color-surf)',
            border: '1px solid var(--color-bdr)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-t2)',
            }}
          >
            Feed
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          aria-label="Search"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-t2)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surf)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Search size={20} />
        </button>

        {/* Notification Button */}
        <button
          onClick={onNotificationClick}
          aria-label={`Notifications${hasNotifications ? ' - You have new notifications' : ''}`}
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-t2)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surf)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Bell size={20} />
          {hasNotifications && (
            <span
              className="notification-dot"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-acc)',
                border: '1.5px solid var(--color-bg)',
              }}
            />
          )}
        </button>

        {/* Avatar Button */}
        <button
          onClick={onAvatarClick}
          aria-label="Profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--color-surf)',
            border: '1px solid var(--color-bdr)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-t2)',
            transition: 'border-color 0.2s',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-bdr-s)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-bdr)';
          }}
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
