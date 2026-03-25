import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Trophy, LogIn, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { DesktopNav } from './DesktopNav';
import { CreateMenu, type CreateMenuItem } from './CreateMenu';
import { SearchModal } from './SearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { FilterProvider, useFilters } from '../../contexts/FilterContext';
import { supabase } from '../../lib/supabase';
import { SPORTS, type SportType } from '../../types';
import { cn } from '../../lib/utils';
import { getTotalUnreadCount, subscribeToUserMessageNotifications } from '../../lib/messaging';
import { NotificationBadge } from '../ui/NotificationBadge';
import { ACTIVITY_NOTIFICATION_TYPES } from '../../types/database';
import { getInitials } from '@/lib/avatar-utils';

interface AppShellProps {
  children: ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const navigate = useNavigate();
  const { user, profile, isGuest, signOut } = useAuth();
  const { updateFilters } = useFilters();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [userSports, setUserSports] = useState<string[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserSports();
    }
  }, [user]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const unreadDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user?.id) return;

    getTotalUnreadCount(user.id).then(setUnreadMessages);

    const channel = subscribeToUserMessageNotifications(user.id, () => {
      if (unreadDebounceRef.current) {
        clearTimeout(unreadDebounceRef.current);
      }
      unreadDebounceRef.current = setTimeout(() => {
        getTotalUnreadCount(user.id).then(setUnreadMessages);
      }, 1000);
    });

    return () => {
      channel.unsubscribe();
      if (unreadDebounceRef.current) {
        clearTimeout(unreadDebounceRef.current);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadNotifications = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .in('type', ACTIVITY_NOTIFICATION_TYPES);
      setUnreadNotifications(count ?? 0);
    };

    fetchUnreadNotifications();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id]);

  const fetchUserSports = async () => {
    const { data } = await supabase
      .from('user_sport_profiles')
      .select('sport')
      .eq('user_id', user!.id);

    if (data) {
      const sportNames = data.map((d: { sport: string }) => {
        const sport = d.sport as SportType;
        return SPORTS[sport]?.name || sport;
      });
      setUserSports(sportNames);
    }
  };

  const handleCreateSelect = (item: CreateMenuItem) => {
    switch (item) {
      case 'match':      navigate('/match/new');      break;
      case 'event':      navigate('/event/new');      break;
      case 'competition': navigate('/competition/new'); break;
      case 'circle':     navigate('/circle/new');     break;
      case 'announcement': navigate('/announcement/new'); break;
    }
  };

  const avatarInitials = getInitials(profile?.full_name ?? 'Me');

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden relative"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Desktop top nav */}
      <div
        className="hidden lg:block fixed top-0 left-0 right-0 z-50"
        style={{
          borderBottom: '1px solid var(--color-bdr)',
          background: 'rgba(17,16,9,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          height: 64,
        }}
      >
        <div
          className="h-full flex items-center justify-between"
          style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}
        >
          <div className="flex items-center" style={{ gap: 32 }}>
            <button
              onClick={() => navigate('/discover')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: 1, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-t1)', letterSpacing: '-0.01em' }}>
                GotGetGo
              </span>
            </button>
            <DesktopNav unreadMessages={unreadMessages} />
          </div>

          <div className="flex items-center" style={{ gap: 4 }}>
            <DesktopIconButton onClick={() => setIsSearchOpen(true)} label="Search">
              <Search size={20} strokeWidth={2} />
            </DesktopIconButton>
            <DesktopIconButton onClick={() => navigate('/results')} label="Results">
              <Trophy size={20} strokeWidth={2} />
            </DesktopIconButton>
            <div style={{ position: 'relative' }}>
              <DesktopIconButton onClick={() => navigate('/notifications')} label="Notifications">
                <Bell size={20} strokeWidth={2} />
              </DesktopIconButton>
              <NotificationBadge count={unreadNotifications} />
            </div>
            {/* Profile button — no session → /auth; logged-in opens dropdown */}
            {!user ? (
              <button
                onClick={() => navigate('/auth')}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--color-acc)', border: 'none',
                  cursor: 'pointer', marginLeft: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-bg)',
                }}
                aria-label="Sign In"
              >
                <LogIn size={20} strokeWidth={2} />
              </button>
            ) : (
              <div ref={profileMenuRef} style={{ position: 'relative', marginLeft: 4 }}>
                {/* Avatar trigger */}
                <button
                  onClick={() => setIsProfileMenuOpen((o) => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                  aria-label="Profile menu"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-acc)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                    color: 'var(--color-bg)', overflow: 'hidden',
                  }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name ?? 'Me'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      avatarInitials
                    )}
                  </div>
                  <ChevronDown size={13} strokeWidth={2.5} style={{ color: 'var(--color-t3)', transition: 'transform 0.15s', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {/* Dropdown */}
                {isProfileMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--color-surf)',
                    border: '1px solid var(--color-bdr)',
                    borderRadius: 12, padding: '6px 0',
                    minWidth: 200,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                    zIndex: 200,
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid var(--color-bdr)', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-t1)', lineHeight: 1.3 }}>
                        {profile?.full_name ?? 'My Account'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', marginTop: 1 }}>
                        View your profile
                      </div>
                    </div>

                    <ProfileMenuItem icon={<User size={15} />} label="Profile" onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} />
                    <ProfileMenuItem icon={<Settings size={15} />} label="Settings" onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} />

                    <div style={{ borderTop: '1px solid var(--color-bdr)', margin: '4px 0' }} />

                    <ProfileMenuItem
                      icon={<LogOut size={15} />}
                      label="Sign out"
                      danger
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
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
      </div>

      {/* Mobile header */}
      <div className="lg:hidden shrink-0 z-[110] relative">
        <Header
          onSearchClick={() => setIsSearchOpen(true)}
          onCreateClick={() => setIsCreateMenuOpen(true)}
          notificationCount={unreadNotifications}
        />
      </div>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
          'lg:pt-16'
        )}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </main>

      {/* Mobile tab bar */}
      <BottomTabBar
        unreadMessages={unreadMessages}
        onCreateClick={() => setIsCreateMenuOpen(true)}
      />

      {/* Overlays */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onFilterChange={updateFilters}
        userSports={userSports}
      />
      <CreateMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onSelect={handleCreateSelect}
      />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <FilterProvider>
      <AppShellContent>{children}</AppShellContent>
    </FilterProvider>
  );
}

function ProfileMenuItem({
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
        padding: '9px 16px', background: hovered ? 'var(--color-surf-2)' : 'none',
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

function DesktopIconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-t2)', transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t2)'; }}
    >
      {children}
    </button>
  );
}
