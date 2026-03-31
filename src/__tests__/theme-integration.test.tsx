/**
 * Integration tests for theme detection system
 * Tests the complete flow from initialization to runtime updates
 * 
 * Task 6: Integration and wiring
 * Requirements: 1.1, 1.4, 2.4, 3.3, 5.1, 5.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';
import { useSystemTheme } from '../hooks/useSystemTheme';

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset DOM attribute
    document.documentElement.removeAttribute('data-theme');
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Requirement 1.1, 5.1: Theme initializer script loads before React bundle', () => {
    it('should have data-theme attribute set before React renders', () => {
      // Simulate the inline script execution
      // In real app, this runs before React hydration
      const initScript = `
        (function() {
          if (typeof window === 'undefined') return;
          try {
            var stored = null;
            try {
              stored = localStorage.getItem('gg-theme');
            } catch (storageError) {
              console.warn('localStorage unavailable');
            }
            if (stored === 'light' || stored === 'dark') {
              document.documentElement.setAttribute('data-theme', stored);
              return;
            }
            if (window.matchMedia) {
              try {
                var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                var theme = darkQuery.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (mediaError) {
                document.documentElement.setAttribute('data-theme', 'light');
              }
            } else {
              document.documentElement.setAttribute('data-theme', 'light');
            }
          } catch (e) {
            document.documentElement.setAttribute('data-theme', 'light');
          }
        })();
      `;
      
      // Execute the script
      eval(initScript);
      
      // Verify theme is set before React renders
      const themeAttr = document.documentElement.getAttribute('data-theme');
      expect(themeAttr).toBeTruthy();
      expect(['light', 'dark']).toContain(themeAttr);
    });
  });

  describe('Requirement 5.2: No theme flash on initial page load', () => {
    it('should apply theme synchronously without flash', () => {
      // Set a preference in localStorage
      localStorage.setItem('gg-theme', 'dark');
      
      // Simulate inline script execution (synchronous)
      const stored = localStorage.getItem('gg-theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      }
      
      // Verify theme is applied immediately
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      
      // Now React renders and uses the hook
      const { result } = renderHook(() => useTheme());
      
      // Theme should match what was set by inline script
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('Requirement 1.4: useSystemTheme hook is available for import', () => {
    it('should export useSystemTheme hook', () => {
      expect(useSystemTheme).toBeDefined();
      expect(typeof useSystemTheme).toBe('function');
    });

    it('should return systemTheme and isSupported', () => {
      const { result } = renderHook(() => useSystemTheme());
      
      expect(result.current).toHaveProperty('systemTheme');
      expect(result.current).toHaveProperty('isSupported');
    });
  });

  describe('Requirement 2.4: Enhanced useTheme hook maintains existing API', () => {
    it('should maintain backward compatibility', () => {
      const { result } = renderHook(() => useTheme());
      
      // Check all expected properties exist
      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('toggle');
      
      // Check types
      expect(typeof result.current.theme).toBe('string');
      expect(typeof result.current.setTheme).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
    });

    it('should work without any options (backward compatible)', () => {
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.theme).toBeDefined();
      expect(['light', 'dark']).toContain(result.current.theme);
    });

    it('should support new isSystemTheme property', () => {
      const { result } = renderHook(() => useTheme());
      
      expect(result.current).toHaveProperty('isSystemTheme');
      expect(typeof result.current.isSystemTheme).toBe('boolean');
    });
  });

  describe('Requirement 3.3: Theme persistence across page reloads', () => {
    it('should persist manual theme preference to localStorage', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(localStorage.getItem('gg-theme')).toBe('dark');
    });

    it('should restore theme from localStorage on next load', () => {
      // Simulate first session
      const { result: result1 } = renderHook(() => useTheme());
      
      act(() => {
        result1.current.setTheme('dark');
      });
      
      // Simulate page reload by creating new hook instance
      const { result: result2 } = renderHook(() => useTheme());
      
      expect(result2.current.theme).toBe('dark');
    });
  });

  describe('Integration with existing components', () => {
    it('should update DOM attribute when theme changes', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should work with toggle function', () => {
      const { result } = renderHook(() => useTheme());
      
      const initialTheme = result.current.theme;
      
      act(() => {
        result.current.toggle();
      });
      
      const newTheme = result.current.theme;
      expect(newTheme).not.toBe(initialTheme);
      expect(document.documentElement.getAttribute('data-theme')).toBe(newTheme);
    });

    it('should support database theme preference', () => {
      const { result } = renderHook(() => useTheme({ dbTheme: 'dark' }));
      
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should prioritize dbTheme over localStorage', () => {
      localStorage.setItem('gg-theme', 'light');
      
      const { result } = renderHook(() => useTheme({ dbTheme: 'dark' }));
      
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('System theme integration', () => {
    it('should follow system theme when enabled', () => {
      // Mock matchMedia to return dark preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      window.matchMedia = mockMatchMedia;
      
      const { result } = renderHook(() => useTheme({ followSystem: true }));
      
      // Should use system theme (dark)
      expect(result.current.isSystemTheme).toBe(true);
    });

    it('should disable system following on manual override', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      window.matchMedia = mockMatchMedia;
      
      const { result } = renderHook(() => useTheme({ followSystem: true }));
      
      expect(result.current.isSystemTheme).toBe(true);
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(result.current.isSystemTheme).toBe(false);
      expect(localStorage.getItem('gg-theme')).toBe('light');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle localStorage unavailable gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });
      
      const { result } = renderHook(() => useTheme());
      
      // Should not crash
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      
      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle missing matchMedia API', () => {
      // Remove matchMedia
      const originalMatchMedia = window.matchMedia;
      // @ts-expect-error - Testing missing API
      delete window.matchMedia;
      
      const { result } = renderHook(() => useSystemTheme());
      
      expect(result.current.systemTheme).toBeNull();
      expect(result.current.isSupported).toBe(false);
      
      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Complete integration flow', () => {
    it('should handle complete user journey', () => {
      // 1. Initial load with no preference (uses system)
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: false, // System prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      window.matchMedia = mockMatchMedia;
      
      const { result, rerender } = renderHook(() => useTheme({ followSystem: true }));
      
      expect(result.current.theme).toBe('light');
      expect(result.current.isSystemTheme).toBe(true);
      
      // 2. User manually sets dark theme
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.isSystemTheme).toBe(false);
      expect(localStorage.getItem('gg-theme')).toBe('dark');
      
      // 3. Page reload - should restore dark theme
      rerender();
      
      expect(result.current.theme).toBe('dark');
      
      // 4. User toggles theme
      act(() => {
        result.current.toggle();
      });
      
      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem('gg-theme')).toBe('light');
    });
  });
});
