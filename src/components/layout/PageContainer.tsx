import type { ReactNode, CSSProperties } from 'react';

interface PageContainerProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * Centers page content and enforces responsive max-width via CSS custom
 * properties (--content-max-w). Full-width on mobile, constrained + centered
 * on tablet (640px), desktop (720px), and wide desktop (800px).
 */
export function PageContainer({ children, style, className }: PageContainerProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: 'var(--content-max-w)',
        margin: '0 auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
