/**
 * Basic verification tests for enhanced useTheme hook
 * Tests backward compatibility and new features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

// Mock useSystemTheme
vi.mock('../useSystemTheme', () => ({
  useSystemTheme: () => ({
    systemTheme: 'dark',
    isSupported: true,
  }),
}));

describe('useTheme - Basic Verification', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset DOM attribute
    document.documentElement.removeAttribute('data-theme');
  });

  it('should work with no arguments (backward compatibility)', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBeDefined();
    expect(result.current.toggle).toBeDefined();
    expect(result.current.setTheme).toBeDefined();
    expect(result.current.isSystemTheme).toBeDefined();
  });

  it('should default to light theme', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('light');
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('light');
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.theme).toBe('dark');
  });

  it('should set theme manually', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
  });

  it('should update DOM attribute', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should persist to localStorage when not following system', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(localStorage.getItem('gg-theme')).toBe('dark');
  });

  it('should prioritize dbTheme over other sources', () => {
    localStorage.setItem('gg-theme', 'light');
    
    const { result } = renderHook(() => useTheme({ dbTheme: 'dark' }));
    
    expect(result.current.theme).toBe('dark');
  });

  it('should prioritize localStorage over system theme', () => {
    localStorage.setItem('gg-theme', 'light');
    
    const { result } = renderHook(() => useTheme({ followSystem: true }));
    
    expect(result.current.theme).toBe('light');
    expect(result.current.isSystemTheme).toBe(false);
  });

  it('should follow system theme when enabled and no stored preference', () => {
    const { result } = renderHook(() => useTheme({ followSystem: true }));
    
    expect(result.current.theme).toBe('dark'); // From mocked systemTheme
    expect(result.current.isSystemTheme).toBe(true);
  });

  it('should disable system following on manual setTheme', () => {
    const { result } = renderHook(() => useTheme({ followSystem: true }));
    
    expect(result.current.isSystemTheme).toBe(true);
    
    act(() => {
      result.current.setTheme('light');
    });
    
    expect(result.current.isSystemTheme).toBe(false);
  });

  it('should disable system following on toggle', () => {
    const { result } = renderHook(() => useTheme({ followSystem: true }));
    
    expect(result.current.isSystemTheme).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isSystemTheme).toBe(false);
  });
});
