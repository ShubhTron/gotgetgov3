import { useState, useEffect } from 'react';
import { useSystemTheme, type Theme } from './useSystemTheme';

export type { Theme };

export interface UseThemeOptions {
  followSystem?: boolean;
  dbTheme?: Theme | null;
}

export interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  isSystemTheme: boolean;
}

/**
 * Hook for managing application theme with system integration.
 * 
 * Manages the application theme with support for system theme detection,
 * database preferences, localStorage persistence, and manual overrides.
 * 
 * Priority order: dbTheme > localStorage > system > default (light)
 * 
 * @param options - Configuration options
 * @param options.followSystem - Whether to sync with system theme changes (default: false)
 * @param options.dbTheme - Theme preference from database (overrides all other sources)
 * 
 * @returns {UseThemeReturn} Object containing:
 *   - theme: Current active theme
 *   - setTheme: Function to manually set theme (disables system following)
 *   - toggle: Function to toggle between light and dark
 *   - isSystemTheme: Whether currently following system theme
 * 
 * @example
 * ```tsx
 * // Basic usage (backward compatible)
 * const { theme, toggle } = useTheme();
 * 
 * // With system theme following
 * const { theme, setTheme, isSystemTheme } = useTheme({ followSystem: true });
 * 
 * // With database preference
 * const { theme } = useTheme({ dbTheme: user.darkMode ? 'dark' : 'light' });
 * ```
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const { followSystem = false, dbTheme } = options;
  const { systemTheme } = useSystemTheme();

  // Initialize theme state with priority logic
  const [theme, setThemeState] = useState<Theme>(() => {
    // Priority: dbTheme > localStorage > system > default
    if (dbTheme) return dbTheme;
    
    try {
      const stored = localStorage.getItem('gg-theme') as Theme | null;
      if (stored) return stored;
    } catch (error) {
      console.warn('localStorage unavailable:', error);
    }
    
    if (followSystem && systemTheme) return systemTheme;
    return 'light';
  });

  // Track whether currently following system theme
  const [isSystemTheme, setIsSystemTheme] = useState(() => {
    // Following system if: followSystem enabled AND no dbTheme AND no localStorage preference
    if (!followSystem) return false;
    if (dbTheme) return false;
    
    try {
      const stored = localStorage.getItem('gg-theme');
      return !stored;
    } catch (error) {
      return true; // If localStorage unavailable, follow system
    }
  });

  // Sync with system theme changes when following system
  useEffect(() => {
    if (followSystem && isSystemTheme && systemTheme) {
      setThemeState(systemTheme);
    }
  }, [followSystem, isSystemTheme, systemTheme]);

  // Sync with database theme changes
  useEffect(() => {
    if (dbTheme) {
      setThemeState(dbTheme);
      setIsSystemTheme(false);
    }
  }, [dbTheme]);

  // Apply theme to DOM and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Only persist to localStorage if not following system
    if (!isSystemTheme) {
      try {
        localStorage.setItem('gg-theme', theme);
      } catch (error) {
        console.warn('Failed to save theme preference:', error);
      }
    }
  }, [theme, isSystemTheme]);

  // Manual theme setter - disables system following
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setIsSystemTheme(false); // Manual override disables system following
  };

  // Toggle between light and dark - disables system following
  const toggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggle, isSystemTheme };
}
