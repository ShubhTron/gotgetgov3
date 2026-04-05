import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Newspaper, Calendar, Users, Plus } from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { TABS, type TabId } from '../../types';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';

interface BottomTabBarProps {
  unreadMessages?: number;
  onCreateClick?: () => void;
}

const tabIcons: Record<TabId, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  discover: Compass,
  news: Newspaper,
  schedule: Calendar,
  circles: Users,
};

export function BottomTabBar({ unreadMessages = 0, onCreateClick }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tutorialStep, registerTarget } = useGuestTutorial();
  const circlesTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (tutorialStep === 'go_to_messages') {
      registerTarget('go_to_messages', circlesTabRef.current);
    }
    return () => {
      if (tutorialStep === 'go_to_messages') {
        registerTarget('go_to_messages', null);
      }
    };
  }, [tutorialStep, registerTarget]);

  const activeTab = TABS.find((tab) => location.pathname.startsWith(tab.path))?.id || 'discover';

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2, 4);

  const renderTab = (tab: (typeof TABS)[0]) => {
    const Icon = tabIcons[tab.id];
    const isActive = activeTab === tab.id;
    const showBadge = tab.id === 'circles' && unreadMessages > 0;

    return (
      <button
        key={tab.id}
        ref={tab.id === 'circles' ? circlesTabRef : undefined}
        onClick={() => navigate(tab.path)}
        className="tab-btn"
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`tab-icon-wrap${isActive ? ' tab-icon-wrap--active' : ''}`}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.6}
              className={`tab-icon${isActive ? ' tab-icon--active' : ''}`}
            />
            {showBadge && <NotificationBadge count={unreadMessages} />}
          </div>
        </span>
        <span className={`tab-label${isActive ? ' tab-label--active' : ''}`}>
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Spacer so content scrolls above tab bar */}
      <div
        className="lg:hidden bottom-tab-spacer"
        style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}
      />

      <nav
        className="lg:hidden bottom-tab-bar"
        role="navigation"
        aria-label="Main navigation"
      >
        {leftTabs.map(renderTab)}

        {/* Center FAB — create action, visually distinct from nav tabs */}
        <button
          onClick={onCreateClick}
          className="tab-fab-btn"
          aria-label="Create"
        >
          <span className="tab-fab">
            <Plus size={20} strokeWidth={2.5} style={{ color: '#fff' }} />
          </span>
          <span className="tab-label" style={{ color: 'var(--color-t2)' }}>Create</span>
        </button>

        {rightTabs.map(renderTab)}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .bottom-tab-bar { display: none !important; }
          .bottom-tab-spacer { display: none !important; }
        }

        .bottom-tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 110;
          display: flex;
          align-items: stretch;
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: var(--color-surf);
          border-top: 1px solid var(--color-bdr);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 4px 4px;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.15s ease;
        }

        .tab-btn:active {
          opacity: 0.7;
          transform: scale(0.93);
          transition: transform 0.1s ease, opacity 0.1s ease;
        }

        .tab-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 28px;
        }

        .tab-icon {
          color: var(--color-tab-off);
          transition: color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: block;
        }

        .tab-icon--active {
          color: var(--color-acc);
          transform: scale(1.05);
        }

        .tab-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: var(--color-tab-off);
          line-height: 1;
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .tab-label--active {
          color: var(--color-acc);
          font-weight: 600;
        }

        /* FAB button */
        .tab-fab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 4px 4px;
          -webkit-tap-highlight-color: transparent;
        }

        .tab-fab-btn:active .tab-fab {
          transform: scale(0.88);
          transition: transform 0.1s ease;
        }

        .tab-fab {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-acc);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(22, 212, 106, 0.38);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
          flex-shrink: 0;
        }

        .tab-fab:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(22, 212, 106, 0.48);
        }
      `}</style>
    </>
  );
}
