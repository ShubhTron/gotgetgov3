# Global Theme Context Design

**Date:** 2026-04-04  
**Status:** Approved

## Problem

The app correctly detects system theme in `index.html` before React loads, but individual pages override `data-theme` to `'light'` when they mount. Root causes:

1. `useTheme()` is called per-page with no global coordination — each instance defaults to `'light'` when no `localStorage` value exists, overwriting the system-detected theme.
2. `SettingsPage` bypasses `useTheme` entirely — it calls `document.documentElement.setAttribute('data-theme', ...)` directly without writing to `localStorage`, so the change is lost on navigation.
3. No global theme initialization in React — theme state is fragmented.

## Goal

- On first load (no saved preference): use system theme (`prefers-color-scheme`)
- After user manually sets theme in Settings: persist to `localStorage` and survive navigation
- Single source of truth for theme across all pages

## Solution: Global ThemeContext

### Priority order (unchanged from existing `useTheme`)

```
dbTheme (profile.dark_mode) > localStorage ('gg-theme') > system theme > 'light'
```

### Files to change

**`src/contexts/ThemeContext.tsx`** (new)
- Calls `useTheme({ followSystem: true })` once
- Exposes `{ theme, setTheme, toggle }` via React context
- Hook: `useThemeContext()` for consumers

**`src/App.tsx`**
- Wrap `AppRoutes` in `<ThemeProvider>`
- Theme initializes once on app mount, before any page renders

**`src/pages/settings/SettingsPage.tsx`**
- Replace `document.documentElement.setAttribute('data-theme', ...)` with `setTheme(next ? 'dark' : 'light')` from `useThemeContext()`
- Continue saving `profile.dark_mode` to DB (existing behavior kept)

**`src/pages/profile/ProfilePage.tsx`**
- Replace `useTheme()` with `useThemeContext()`

### Data flow

```
App load
  → index.html script sets data-theme from system (no flash)
  → React mounts → ThemeProvider → useTheme({ followSystem: true })
      → no localStorage? → use system theme, don't overwrite data-theme
      → has localStorage? → use stored value
  → User navigates between pages → ThemeContext value unchanged
  → User toggles in Settings → setTheme() → localStorage updated → data-theme updated
      → consistent on all subsequent navigations
```

## Out of scope

- Adding per-route theme overrides
- Animated theme transitions
- Removing the `profile.dark_mode` DB column
