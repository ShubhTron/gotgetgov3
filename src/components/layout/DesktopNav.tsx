import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Newspaper, Calendar, Users } from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { TABS, type TabId } from '../../types';

interface DesktopNavProps {
  unreadMessages?: number;
}

const tabIcons: Record<TabId, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  discover: Compass,
  news: Newspaper,
  schedule: Calendar,
  circles: Users,
};

export function DesktopNav({ unreadMessages = 0 }: DesktopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find((tab) => location.pathname.startsWith(tab.path))?.id || 'discover';

  return (
    <nav
      className="hidden lg:flex items-center"
      style={{ gap: 4 }}
      role="navigation"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const Icon = tabIcons[tab.id];
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'circles' && unreadMessages > 0;

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              minHeight: 36, padding: '0 14px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: isActive ? 'var(--color-acc-bg)' : 'transparent',
              color: isActive ? 'var(--color-acc)' : 'var(--color-t2)',
              fontFamily: 'var(--font-body)',
              fontSize: 14, fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t1)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t2)';
              }
            }}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {showBadge && <NotificationBadge count={unreadMessages} />}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
