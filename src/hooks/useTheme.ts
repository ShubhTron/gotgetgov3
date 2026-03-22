import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme(initial: Theme = 'light', dbTheme?: Theme | null) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (dbTheme) return dbTheme;
    return (localStorage.getItem('gg-theme') as Theme) ?? initial;
  });

  useEffect(() => {
    if (dbTheme) setTheme(dbTheme);
  }, [dbTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gg-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggle };
}
