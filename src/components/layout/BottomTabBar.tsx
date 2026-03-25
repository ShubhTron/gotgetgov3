import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Newspaper, Calendar, Users, Plus } from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { TABS, type TabId } from '../../types';

interface BottomTabBarProps {
  unreadMessages?: number;
  onCreateClick?: () => void;
}

const tabIcons: Record<TabId, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  discover: Compass,
  news: Newspaper,
  schedule: Calendar,
  circles: Users,
};

export function BottomTabBar({ unreadMessages = 0, onCreateClick }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find((tab) => location.pathname.startsWith(tab.path))?.id || 'discover';

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2, 4);

  const renderTab = (tab: (typeof TABS)[0]) => {
    const Icon = tabIcons[tab.id];
    const isActive = activeTab === tab.id;
    const showBadge = tab.id === 'circles' && unreadMessages > 0;
    const color = isActive ? 'var(--color-tab-on)' : 'var(--color-tab-off)';

    return (
      <button
        key={tab.id}
        onClick={() => navigate(tab.path)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color,
          transition: 'color 0.2s',
          position: 'relative',
          padding: 0,
        }}
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div style={{ position: 'relative' }}>
          <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
          {showBadge && <NotificationBadge count={unreadMessages} />}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: isActive ? 600 : 400,
            fontFamily: 'var(--font-body)',
            lineHeight: 1,
          }}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Spacer so content scrolls above tab bar */}
      <div
        className="lg:hidden"
        style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}
      />

      <nav
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {leftTabs.map(renderTab)}

        {/* Center Create button */}
        <button
          onClick={onCreateClick}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label="Create"
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--color-acc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s, opacity 0.2s',
              flexShrink: 0,
              marginTop: -20,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Plus size={26} strokeWidth={2.5} style={{ color: '#fff' }} />
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              fontFamily: 'var(--font-body)',
              color: 'var(--color-tab-off)',
              lineHeight: 1,
            }}
          >
            Create
          </span>
        </button>

        {rightTabs.map(renderTab)}
      </nav>
    </>
  );
}
