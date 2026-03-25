import React from 'react';
import { Chip } from '../../design-system';
import { IconArrowRight } from '../../design-system/icons';

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      style={{
        width: 44,
        height: 26,
        borderRadius: 'var(--radius-full)',
        background: value ? 'var(--color-acc)' : 'var(--color-surf-2)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s ease',
        boxShadow: value ? '0 0 0 3px var(--color-acc-bg)' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surf)',
          boxShadow: 'var(--shadow-btn)',
          transition: 'left 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsRowVariant = 'default' | 'toggle' | 'destructive';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  secondaryText?: string;
  /** Accent chip label, e.g. "3 new" */
  badge?: string;
  variant?: SettingsRowVariant;
  /** Only used when variant="toggle" */
  toggleValue?: boolean;
  onToggle?: (next: boolean) => void;
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsRow({
  icon,
  label,
  secondaryText,
  badge,
  variant = 'default',
  toggleValue = false,
  onToggle,
  onPress,
}: SettingsRowProps) {
  const isDestructive = variant === 'destructive';
  const isToggle = variant === 'toggle';

  const rowStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-5)',
    background: 'none',
    border: 'none',
    cursor: isToggle ? 'default' : 'pointer',
    textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    background: isDestructive ? 'var(--color-red-bg)' : 'var(--color-surf-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: isDestructive ? 'var(--color-red)' : 'var(--color-t2)',
  };

  const content = (
    <>
      {/* Icon container */}
      <div style={iconContainerStyle}>{icon}</div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: isDestructive ? 'var(--color-red)' : 'var(--color-t1)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {label}
        </div>
        {secondaryText && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-t2)',
              marginTop: 2,
              lineHeight: 'var(--leading-normal)',
            }}
          >
            {secondaryText}
          </div>
        )}
      </div>

      {/* Right slot — mutually exclusive */}
      {badge && <Chip label={badge} variant="accent" />}
      {isToggle && !badge && (
        <ToggleSwitch value={toggleValue} onChange={onToggle ?? (() => {})} />
      )}
      {!isToggle && !badge && (
        <IconArrowRight
          size={14}
          style={{ color: 'var(--color-t3)', flexShrink: 0 }}
        />
      )}
    </>
  );

  // Toggle rows use a div (not a button) since the toggle itself is interactive
  if (isToggle) {
    return <div style={rowStyle}>{content}</div>;
  }

  return (
    <button style={rowStyle} onClick={onPress}>
      {content}
    </button>
  );
}
