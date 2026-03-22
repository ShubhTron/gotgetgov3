import React from 'react';
import { IconSearch, IconBell, IconSun, IconMoon, Avatar } from '../../design-system';
import type { Theme } from '../../hooks/useTheme';

interface HeaderProps {
  userAvatarUrl?: string;
  userName: string;
  theme: Theme;
  onThemeToggle: () => void;
}

export function Header({ userAvatarUrl, userName, theme, onThemeToggle }: HeaderProps) {
  const iconBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 'var(--radius-full)',
    background: 'var(--color-surf)',
    border: '1px solid var(--color-bdr)',
    boxShadow: 'var(--shadow-btn)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    position: 'relative',
  };

  return (
    <div style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 var(--space-5)',
      background: 'var(--color-bg)',
      position: 'relative', zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-regular)',
        color: 'var(--color-t1)',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        userSelect: 'none',
      }}>
        Got<em style={{ fontStyle: 'italic', color: 'var(--color-acc-dk)' }}>Get</em>Go
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Search */}
        <button style={iconBtn} aria-label="Search">
          <IconSearch size={16} style={{ color: 'var(--color-t1)' }} />
        </button>

        {/* Bell */}
        <button style={iconBtn} aria-label="Notifications">
          <IconBell size={16} style={{ color: 'var(--color-t1)' }} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 6.5, height: 6.5, borderRadius: 'var(--radius-full)',
            background: 'var(--color-acc)',
            border: '1.5px solid var(--color-bg)',
          }} />
        </button>

        {/* Avatar */}
        <div style={iconBtn}>
          <Avatar name={userName} imageUrl={userAvatarUrl} size="sm" />
        </div>

        {/* Theme toggle */}
        <button style={iconBtn} aria-label="Toggle theme" onClick={onThemeToggle}>
          {theme === 'light'
            ? <IconMoon size={16} style={{ color: 'var(--color-t1)' }} />
            : <IconSun  size={16} style={{ color: 'var(--color-t1)' }} />
          }
        </button>
      </div>
    </div>
  );
}
