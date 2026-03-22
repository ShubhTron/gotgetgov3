import { useState, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { BottomTabBar, type TabId } from './components/layout/BottomTabBar';
import { DiscoverPage } from './pages/DiscoverPage';
import { PlayPage } from './pages/PlayPage';
import { ConnectPage } from './pages/ConnectPage';
import { MePage } from './pages/MePage';

function Shell() {
  const { profile } = useAuth();
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('discover');

  const pageMap: Record<TabId, ReactNode> = {
    discover: <DiscoverPage />,
    play:     <PlayPage />,
    connect:  <ConnectPage />,
    me:       <MePage />,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', overflow: 'hidden',
      background: 'var(--color-bg)',
      maxWidth: 430, margin: '0 auto',
    }}>
      <Header
        userAvatarUrl={profile?.avatar_url ?? undefined}
        userName={profile?.full_name ?? 'User'}
        theme={theme}
        onThemeToggle={toggle}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 83 }}>
        {pageMap[activeTab]}
      </div>
      <BottomTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
