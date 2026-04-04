# Global Theme Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global `ThemeContext` so system theme preference is detected once on app load and shared consistently across all pages.

**Architecture:** A new `ThemeProvider` wraps the app in `App.tsx` and calls `useTheme({ followSystem: true })` once. All pages that need theme access consume `useThemeContext()` instead of calling `useTheme()` directly. `SettingsPage` routes its toggle through the context so changes persist to localStorage and survive navigation.

**Tech Stack:** React context, existing `useTheme`/`useSystemTheme` hooks, Vitest + @testing-library/react

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/contexts/ThemeContext.tsx` | Single theme state source; exposes `{ theme, setTheme, toggle }` |
| Create | `src/contexts/__tests__/ThemeContext.test.tsx` | Tests for context provider and hook |
| Modify | `src/App.tsx` | Wrap `AppRoutes` in `<ThemeProvider>` |
| Modify | `src/pages/settings/SettingsPage.tsx` | Replace manual `setAttribute` with `setTheme()` from context |
| Modify | `src/pages/profile/ProfilePage.tsx` | Replace `useTheme()` with `useThemeContext()` |

---

## Task 1: Create ThemeContext

**Files:**
- Create: `src/contexts/ThemeContext.tsx`
- Create: `src/contexts/__tests__/ThemeContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/ThemeContext.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to confirm it fails**

```
npx vitest run src/contexts/__tests__/ThemeContext.test.tsx
```

Expected: FAIL — `ThemeProvider` and `useThemeContext` not found.

- [ ] **Step 3: Create ThemeContext.tsx**

Create `src/contexts/ThemeContext.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, toggle } = useTheme({ followSystem: true });

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```
npx vitest run src/contexts/__tests__/ThemeContext.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/ThemeContext.tsx src/contexts/__tests__/ThemeContext.test.tsx
git commit -m "feat: add ThemeContext with global system theme detection"
```

---

## Task 2: Wire ThemeProvider into App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add ThemeProvider to App.tsx**

In `src/App.tsx`, add the import and wrap `AppRoutes`:

```tsx
import { ThemeProvider } from './contexts/ThemeContext';
```

Change the `App` function body from:

```tsx
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuestTutorialProvider>
          <FilterProvider>
            <FullscreenProvider>
              <AppRoutes />
              <TutorialSpotlight />
            </FullscreenProvider>
          </FilterProvider>
        </GuestTutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

To:

```tsx
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <GuestTutorialProvider>
            <FilterProvider>
              <FullscreenProvider>
                <AppRoutes />
                <TutorialSpotlight />
              </FullscreenProvider>
            </FilterProvider>
          </GuestTutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app in ThemeProvider for global theme initialization"
```

---

## Task 3: Fix SettingsPage to use ThemeContext

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`

- [ ] **Step 1: Add import and replace darkMode state**

In `src/pages/settings/SettingsPage.tsx`:

Add import at the top (after the existing imports):

```tsx
import { useThemeContext } from '../../contexts/ThemeContext';
```

Inside `SettingsPage()`, add this line after the existing hook calls:

```tsx
const { theme, setTheme } = useThemeContext();
```

Replace:

```tsx
const [darkMode,      setDarkMode]      = useState(profile?.dark_mode ?? false);
```

With:

```tsx
const darkMode = theme === 'dark';
```

- [ ] **Step 2: Replace handleDarkMode body**

Replace:

```tsx
async function handleDarkMode(next: boolean) {
    setDarkMode(next);
    await updateProfile({ dark_mode: next });
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }
```

With:

```tsx
async function handleDarkMode(next: boolean) {
    setTheme(next ? 'dark' : 'light');
    await updateProfile({ dark_mode: next });
  }
```

- [ ] **Step 3: Verify build compiles**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/SettingsPage.tsx
git commit -m "fix: SettingsPage routes theme toggle through ThemeContext"
```

---

## Task 4: Fix ProfilePage to use ThemeContext

**Files:**
- Modify: `src/pages/profile/ProfilePage.tsx`

- [ ] **Step 1: Swap import and hook call**

In `src/pages/profile/ProfilePage.tsx`:

Replace:

```tsx
import { useTheme } from '@/hooks/useTheme';
```

With:

```tsx
import { useThemeContext } from '@/contexts/ThemeContext';
```

Replace:

```tsx
const { theme, toggle } = useTheme();
```

With:

```tsx
const { theme, toggle } = useThemeContext();
```

- [ ] **Step 2: Verify build compiles**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run all theme tests**

```
npx vitest run src/contexts/__tests__/ThemeContext.test.tsx src/hooks/__tests__/useTheme-basic.test.ts
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/profile/ProfilePage.tsx
git commit -m "fix: ProfilePage uses shared ThemeContext instead of local useTheme"
```

---

## Verification

After all tasks complete, manually verify:

1. Open app with system dark mode on — app opens dark on every page including Landing, Onboarding, Discover
2. Navigate to Settings, toggle to light — stays light when navigating between pages
3. Reload — light preference persists (from localStorage)
4. Navigate to Profile — theme toggle still works and is in sync with Settings
