import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useThemeContext } from '../ThemeContext';

vi.mock('../../hooks/useSystemTheme', () => ({
  useSystemTheme: () => ({ systemTheme: 'dark', isSupported: true }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('uses system theme on first load when no localStorage preference', () => {
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('uses localStorage preference over system theme', () => {
    localStorage.setItem('gg-theme', 'light');
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    expect(result.current.theme).toBe('light');
  });

  it('setTheme updates theme and persists to localStorage', () => {
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    act(() => { result.current.setTheme('light'); });
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('gg-theme')).toBe('light');
  });

  it('toggle switches theme', () => {
    localStorage.setItem('gg-theme', 'light');
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('dark');
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useThemeContext())).toThrow(
      'useThemeContext must be used within ThemeProvider'
    );
  });
});
