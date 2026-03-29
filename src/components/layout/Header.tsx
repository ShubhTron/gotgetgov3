import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Trophy, LogIn, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';
import { NotificationBadge } from '../ui/NotificationBadge';
import { getInitials } from '@/lib/avatar-utils';

interface HeaderProps {
  onSearchClick?: () => void;
  onCreateClick?: () => void;
  notificationCount?: number;
}

export function Header({ onSearchClick, notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate();
  const { user, profile, isGuest, signOut } = useAuth();
  const { tutorialStep, registerTarget } = useGuestTutorial();
  const avatarInitials = getInitials(profile?.full_name ?? 'Me');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (tutorialStep === 'go_to_notifications') {
      registerTarget('go_to_notifications', bellRef.current);
    }
    return () => {
      if (tutorialStep === 'go_to_notifications') {
        registerTarget('go_to_notifications', null);
      }
    };
  }, [tutorialStep, registerTarget]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const iconBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 'var(--radius-full)',
    background: 'none', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, position: 'relative',
    color: 'var(--color-t1)',
  };

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 110,
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-bdr)',
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px var(--space-5)',
        maxWidth: 480, margin: '0 auto',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/discover')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Home"
        >
          <img src="/logo.png" alt="GotGetGo" style={{ height: 32, width: 'auto', display: 'block' }} />
        </button>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={iconBtn} onClick={onSearchClick} aria-label="Search">
            <Search size={20} strokeWidth={2} />
          </button>

          <button style={iconBtn} onClick={() => navigate('/results')} aria-label="Results">
            <Trophy size={20} strokeWidth={2} />
          </button>

          <button ref={bellRef} style={{ ...iconBtn, position: 'relative' }} onClick={() => navigate('/notifications')} aria-label="Notifications">
            <Bell size={20} strokeWidth={2} />
            <NotificationBadge count={notificationCount} />
          </button>

          {/* Avatar — no session → /auth, logged-in → dropdown */}
          {!user ? (
            <button
              onClick={() => navigate('/auth')}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--color-acc)', border: 'none',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-bg)',
              }}
              aria-label="Sign In"
            >
              <LogIn size={18} strokeWidth={2} />
            </button>
          ) : (
            <div ref={menuRef} style={{ position: 'relative' }}>
              {/* Avatar trigger */}
              <button
                onClick={() => setIsMenuOpen((o) => !o)}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--color-acc)', border: 'none',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                  color: 'var(--color-bg)', overflow: 'hidden',
                  outline: isMenuOpen ? '2px solid var(--color-acc)' : 'none',
                  outlineOffset: 2,
                }}
                aria-label="Profile menu"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name ?? 'Me'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  avatarInitials
                )}
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--color-surf)',
                  border: '1px solid var(--color-bdr)',
                  borderRadius: 12, padding: '6px 0',
                  minWidth: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
                  zIndex: 200,
                }}>
                  {/* User info */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-bdr)', marginBottom: 4 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-t1)', lineHeight: 1.3 }}>
                      {profile?.full_name ?? 'My Account'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', marginTop: 1 }}>
                      View your profile
                    </div>
                  </div>

                  <MenuItem icon={<User size={15} />} label="Profile" onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} />
                  <MenuItem icon={<Settings size={15} />} label="Settings" onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} />

                  <div style={{ borderTop: '1px solid var(--color-bdr)', margin: '4px 0' }} />

                  <MenuItem
                    icon={<LogOut size={15} />}
                    label="Sign out"
                    danger
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await signOut();
                      navigate('/auth');
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────

function MenuItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: hovered ? 'var(--color-surf-2)' : 'none',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        color: danger ? 'var(--color-red, #ff3b30)' : 'var(--color-t1)',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
        transition: 'background 0.1s',
      }}
    >
      <span style={{ opacity: 0.75, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
