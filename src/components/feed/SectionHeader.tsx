interface SectionHeaderProps {
  label: string;
  linkText?: string;
  onLinkClick?: () => void;
}

export function SectionHeader({ label, linkText, onLinkClick }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-t3)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>

      {/* Optional Link */}
      {linkText && onLinkClick && (
        <button
          onClick={onLinkClick}
          aria-label={linkText}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-acc)',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-acc-dk)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-acc)';
          }}
        >
          {linkText}
        </button>
      )}
    </div>
  );
}
