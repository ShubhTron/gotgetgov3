import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export interface UseSystemThemeReturn {
  systemTheme: Theme | null;
  isSupported: boolean;
}

/**
 * Hook for detecting and monitoring system theme preference.
 * 
 * Detects the user's operating system or browser theme preference using
 * the prefers-color-scheme media query. Listens for real-time changes
 * and updates when the system theme changes.
 * 
 * @returns {UseSystemThemeReturn} Object containing:
 *   - systemTheme: Current system theme ('light' | 'dark' | null if unsupported)
 *   - isSupported: Whether system theme detection is supported by the browser
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { systemTheme, isSupported } = useSystemTheme();
 *   
 *   if (!isSupported) {
 *     return <div>System theme detection not supported</div>;
 *   }
 *   
 *   return <div>System prefers: {systemTheme}</div>;
 * }
 * ```
 */
export function useSystemTheme(): UseSystemThemeReturn {
  // Initialize system theme state
  const [systemTheme, setSystemTheme] = useState<Theme | null>(() => {
    // SSR/Node environment check
    if (typeof window === 'undefined') return null;
    
    // Check if matchMedia API is available
    if (!window.matchMedia) return null;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('Error detecting system theme:', error);
      return null;
    }
  });

  // Check if system theme detection is supported
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 
           typeof window.matchMedia === 'function';
  });

  // Set up media query listener for real-time theme changes
  useEffect(() => {
    if (!isSupported) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        try {
          setSystemTheme(e.matches ? 'dark' : 'light');
        } catch (error) {
          console.error('Error handling theme change:', error);
        }
      };

      // Add event listener
      mediaQuery.addEventListener('change', handleChange);
      
      // Cleanup listener on unmount
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.error('Error setting up theme listener:', error);
    }
  }, [isSupported]);

  return { systemTheme, isSupported };
}
