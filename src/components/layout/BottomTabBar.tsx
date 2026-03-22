import React from 'react';
import { IconCompass, IconPlay, IconPlus, IconMessageCircle, IconUser } from '../../design-system';

export type TabId = 'discover' | 'play' | 'connect' | 'me';

interface BottomTabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS = [
  { id: 'discover' as TabId, label: 'Discover', Icon: IconCompass },
  { id: 'play'     as TabId, label: 'Play',     Icon: IconPlay },
  { id: 'connect'  as TabId, label: 'Connect',  Icon: IconMessageCircle },
  { id: 'me'       as TabId, label: 'Me',        Icon: IconUser },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 83,
      background: 'var(--color-bg)',
      borderTop: '1px solid var(--color-bdr)',
      display: 'flex', alignItems: 'flex-start',
      paddingTop: 10,
      zIndex: 200,
    }}>
      {/* Discover */}
      <TabButton tab={TABS[0]} active={active} onChange={onChange} />
      {/* Play */}
      <TabButton tab={TABS[1]} active={active} onChange={onChange} />

      {/* Create — center, inert */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-full)',
          background: 'var(--color-t1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -12, cursor: 'default',
        }}>
          <IconPlus size={22} style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Connect */}
      <TabButton tab={TABS[2]} active={active} onChange={onChange} />
      {/* Me */}
      <TabButton tab={TABS[3]} active={active} onChange={onChange} />
    </div>
  );
}

function TabButton({ tab, active, onChange }: {
  tab: typeof TABS[number];
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  const isActive = tab.id === active;
  return (
    <button
      onClick={() => onChange(tab.id)}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer',
        color: isActive ? 'var(--color-tab-on)' : 'var(--color-tab-off)',
        padding: '2px 0',
      }}
    >
      <tab.Icon size={22} style={{ color: 'inherit' }} />
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-medium)' as any,
        color: 'inherit',
      }}>
        {tab.label}
      </span>
      {isActive && (
        <div style={{
          width: 6, height: 6, borderRadius: 'var(--radius-full)',
          background: 'var(--color-acc)',
          marginTop: -2,
        }} />
      )}
    </button>
  );
}
