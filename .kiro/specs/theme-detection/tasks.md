# Implementation Plan: Theme Detection

## Overview

This implementation plan breaks down the theme detection feature into discrete coding tasks. The feature will detect the user's system theme preference (dark or light) on application load and respond to real-time changes. The implementation leverages the existing theme infrastructure and adds system preference detection using the `prefers-color-scheme` media query.

## Tasks

- [x] 1. Create useSystemTheme hook for system theme detection
  - Create `src/hooks/useSystemTheme.ts` file
  - Implement hook that detects system theme using `window.matchMedia('(prefers-color-scheme: dark)')`
  - Return current system theme ('light' | 'dark' | null) and isSupported flag
  - Set up media query event listener for real-time theme changes
  - Handle cleanup of event listener on unmount
  - Add error handling for unsupported browsers
  - Export TypeScript interfaces: `UseSystemThemeReturn`, `Theme`
  - _Requirements: 1.1, 2.1, 4.1_

- [ ]* 1.1 Write property test for system theme synchronization
  - **Property 1: System Theme Synchronization**
  - **Validates: Requirements 1.2, 1.3**
  - Install fast-check: `npm install --save-dev fast-check`
  - Create `src/hooks/__tests__/theme.properties.test.ts`
  - Test that application theme matches system preference for any system theme value
  - Run 100 iterations minimum

- [ ]* 1.2 Write unit tests for useSystemTheme hook
  - Create `src/hooks/useSystemTheme.test.ts`
  - Test returns 'dark' when system prefers dark mode
  - Test returns 'light' when system prefers light mode
  - Test returns null when matchMedia unsupported
  - Test sets isSupported to false when API unavailable
  - Test adds event listener on mount
  - Test removes event listener on unmount
  - Test updates state when system theme changes
  - Test handles listener errors gracefully
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1_

- [x] 2. Add inline theme initializer script to index.html
  - Open `index.html` file
  - Add inline `<script>` tag in `<head>` section before any other scripts
  - Implement IIFE that checks localStorage for 'gg-theme' preference
  - If no stored preference, query system theme using `window.matchMedia`
  - Set `data-theme` attribute on `document.documentElement`
  - Add try-catch error handling with fallback to 'light' theme
  - Add console warning for unsupported browsers
  - Keep script minimal (<1KB) for performance
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 5.1, 5.2, 5.3_

- [ ]* 2.1 Write unit tests for theme initializer script
  - Create `src/__tests__/theme-initializer.test.ts`
  - Test sets data-theme attribute on document element
  - Test uses system theme when no localStorage value
  - Test prefers localStorage over system theme
  - Test falls back to light when API unsupported
  - Test logs warning when detection unavailable
  - Test executes synchronously (no async operations)
  - _Requirements: 5.1, 5.2, 5.3, 4.1_

- [ ]* 2.2 Write property test for initialization before render
  - **Property 4: Initialization Before Render**
  - **Validates: Requirements 5.1, 5.3**
  - Test that data-theme attribute is set before React renders for any system theme
  - Verify CSS variables are defined after initialization
  - Run 100 iterations minimum

- [x] 3. Checkpoint - Verify core detection functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance useTheme hook with system integration
  - Open existing `src/hooks/useTheme.ts` file
  - Import and use `useSystemTheme` hook
  - Add `followSystem` option to `UseThemeOptions` interface
  - Add `isSystemTheme` property to `UseThemeReturn` interface
  - Implement priority logic: dbTheme > localStorage > system > default
  - Sync with system theme changes when `followSystem: true` and `isSystemTheme: true`
  - Manual `setTheme` call should disable system following
  - Maintain backward compatibility (default behavior unchanged)
  - Update DOM attribute and localStorage when theme changes
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ]* 4.1 Write property test for theme change event handling
  - **Property 2: Theme Change Event Handling**
  - **Validates: Requirements 2.1, 2.2, 2.3**
  - Test that application theme updates on system theme change for any theme transition
  - Verify listener properly handles theme change events
  - Run 100 iterations minimum

- [ ]* 4.2 Write property test for DOM state consistency
  - **Property 3: DOM State Consistency**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Test that data-theme attribute matches applied theme for any theme value
  - Verify CSS variables are correctly set for the active theme
  - Run 100 iterations minimum

- [ ]* 4.3 Write unit tests for enhanced useTheme hook
  - Create or update `src/hooks/useTheme.test.ts`
  - Test followSystem option enables system theme tracking
  - Test manual setTheme disables system following
  - Test isSystemTheme flag reflects current state
  - Test priority order: dbTheme > localStorage > system > default
  - Test localStorage persistence for manual preferences
  - Test DOM attribute updates when theme changes
  - Test backward compatibility with existing usage
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 5. Add error handling for edge cases
  - Add SSR/Node environment checks (`typeof window !== 'undefined'`)
  - Add localStorage access error handling with try-catch
  - Add media query listener error handling
  - Add console warnings for degraded functionality
  - Ensure graceful fallback to light theme in all error scenarios
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 5.1 Write unit tests for error handling
  - Test behavior when localStorage unavailable (private browsing)
  - Test behavior in SSR/Node environment (no window object)
  - Test media query listener error handling
  - Test fallback to light theme on errors
  - Test console warnings are logged appropriately
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Integration and wiring
  - Verify theme initializer script loads before React bundle
  - Ensure useSystemTheme hook is available for import
  - Verify enhanced useTheme hook maintains existing API
  - Test integration with existing components (AppShell, theme toggle)
  - Verify no theme flash occurs on initial page load
  - Test theme persistence across page reloads
  - _Requirements: 1.1, 1.4, 2.4, 3.3, 5.1, 5.2_

- [ ]* 6.1 Write integration tests
  - Create `src/__tests__/theme-integration.test.tsx`
  - Test theme persists across page reloads
  - Test manual theme toggle overrides system preference
  - Test system theme changes reflected in UI
  - Test theme works with existing components
  - Test no theme flash on initial load
  - Test rapid theme changes maintain stability
  - _Requirements: 1.1, 2.4, 3.3, 5.2_

- [ ] 7. Final checkpoint - Ensure all functionality complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses TypeScript with React
- Property tests require fast-check library installation
- Inline script must execute before React hydration to prevent theme flash
- Existing theme infrastructure (data-theme attribute, CSS variables) remains unchanged
- Manual theme toggle functionality is preserved and enhanced
