import { useState, useEffect } from 'react';

export interface ResponsiveValues {
  isTablet: boolean;   // 768–1023px
  isDesktop: boolean;  // >= 1024px
  isWide: boolean;     // >= 1280px
  contentMaxWidth: number;
  bottomPadding: number;
}

function getValues(width: number): ResponsiveValues {
  const isDesktop = width >= 1024;
  const isWide = width >= 1280;
  const isTablet = width >= 768 && !isDesktop;

  let contentMaxWidth: number;
  if (isWide) contentMaxWidth = 800;
  else if (isDesktop) contentMaxWidth = 720;
  else if (isTablet) contentMaxWidth = 640;
  else contentMaxWidth = Infinity; // full width

  // Mirror --page-pb: desktop has no tab bar
  const bottomPadding = isDesktop ? 24 : 64 + 16;

  return { isTablet, isDesktop, isWide, contentMaxWidth, bottomPadding };
}

export function useResponsive(): ResponsiveValues {
  const [values, setValues] = useState<ResponsiveValues>(() =>
    typeof window !== 'undefined' ? getValues(window.innerWidth) : getValues(375)
  );

  useEffect(() => {
    let raf: number;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setValues(getValues(window.innerWidth)));
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return values;
}
