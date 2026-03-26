# Design Document: URL Routing

## Overview

This design implements URL-based routing for the GotGetGo sports app using react-router-dom v6. The current implementation uses conditional rendering with local state (`useState`) to switch between authentication screens and main app tabs, all on the root path "/". This design introduces proper URL-based navigation with browser history integration, deep linking support, and authentication gating while preserving the existing UI/UX and Framer Motion animations.

The routing system will:
- Map URLs to specific screens (auth screens and main app tabs)
- Protect main app routes from unauthenticated access
- Support browser back/forward navigation
- Enable deep linking and bookmarking
- Preserve existing Framer Motion animations during route transitions
- Maintain mobile-first design constraints (max-width: 430px, 100dvh)

## Architecture

### High-Level Structure

```
BrowserRouter (root level in main.tsx)
├── AuthProvider (existing context)
└── Routes
    ├── Public Routes (accessible without auth)
    │   ├── /welcome → WelcomeScreen
    │   ├── /signin → SignInScreen
    │   └── /signup → SignUpScreen
    ├── Protected Routes (require auth or guest)
    │   ├── / → Redirect to /discover or /welcome
    │   ├── /discover → DiscoverPage
    │   ├── /play → PlayPage
    │   ├── /connect → ConnectPage
    │   └── /me → MePage
    └── Catch-all
        └── * → NotFoundPage
```

### Routing Strategy

The design uses a declarative routing approach with react-router-dom v6:

1. **BrowserRouter**: Wraps the entire application at the root level (main.tsx)
2. **Routes Component**: Defines all route patterns and their corresponding components
3. **Protected Route Wrapper**: A custom component that checks authentication state and redirects if necessary
4. **Programmatic Navigation**: Uses `useNavigate` hook to replace `useState` in AuthFlow and BottomTabBar

### Integration Points

- **AuthContext**: Provides authentication state (`user`, `isGuest`, `loading`) to routing logic
- **AuthFlow**: Refactored to use `useNavigate` instead of local state for screen transitions
- **BottomTabBar**: Refactored to use `useNavigate` and `useLocation` to sync with URL
- **Shell**: Derives active tab from current URL path using `useLocation`

## Components and Interfaces

### 1. Router Configuration (main.tsx)

The BrowserRouter will wrap the application at the root level:

```typescript
// main.tsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### 2. App Component Refactor (App.tsx)

The App component will be refactored to use Routes instead of conditional rendering:

```typescript
// App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/welcome" element={<PublicRoute><AuthFlow /></PublicRoute>} />
        <Route path="/signin" element={<PublicRoute><AuthFlow /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><AuthFlow /></PublicRoute>} />
        
        {/* Protected app routes */}
        <Route path="/discover" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
        <Route path="/connect" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
        <Route path="/me" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
        
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
```

### 3. ProtectedRoute Component

A wrapper component that checks authentication state and redirects unauthenticated users:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isGuest, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <AppLoader />;
  }
  
  if (!user && !isGuest) {
    // Store intended destination for post-auth redirect
    return <Navigate to="/welcome" state={{ from: location.pathname }} replace />;
  }
  
  return <>{children}</>;
}
```

### 4. PublicRoute Component

A wrapper component that redirects authenticated users away from auth screens:

```typescript
interface PublicRouteProps {
  children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { user, isGuest, loading } = useAuth();
  
  if (loading) {
    return <AppLoader />;
  }
  
  if (user || isGuest) {
    return <Navigate to="/discover" replace />;
  }
  
  return <>{children}</>;
}
```

### 5. RootRedirect Component

Handles the root path "/" by redirecting based on authentication state:

```typescript
function RootRedirect() {
  const { user, isGuest, loading } = useAuth();
  
  if (loading) {
    return <AppLoader />;
  }
  
  return <Navigate to={user || isGuest ? "/discover" : "/welcome"} replace />;
}
```

### 6. AuthFlow Refactor

The AuthFlow component will be refactored to:
- Use `useLocation` to determine which screen to show based on URL path
- Use `useNavigate` instead of `useState` for screen transitions
- Support post-authentication redirect to preserved destination

```typescript
export function AuthFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();
  
  // Determine screen from URL path
  const screen: AuthScreen = 
    location.pathname === '/signin' ? 'signin' :
    location.pathname === '/signup' ? 'signup' :
    'welcome';
  
  // Navigation handlers
  const handleNavigate = (screen: AuthScreen) => {
    navigate(`/${screen}`);
  };
  
  const handleContinueAsGuest = () => {
    continueAsGuest();
    // Router will automatically redirect to /discover via ProtectedRoute
  };
  
  // Rest of component remains the same, but uses handleNavigate
  // instead of setScreen
}
```

### 7. Shell Refactor

The Shell component will be refactored to:
- Derive active tab from URL path using `useLocation`
- Pass navigation handler to BottomTabBar that uses `useNavigate`

```typescript
function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Derive active tab from URL path
  const activeTab: TabId = 
    location.pathname === '/play' ? 'play' :
    location.pathname === '/connect' ? 'connect' :
    location.pathname === '/me' ? 'me' :
    'discover';
  
  const handleTabChange = (tab: TabId) => {
    navigate(`/${tab}`);
  };
  
  // Rest of component remains the same
  return (
    <div>
      <Header {...headerProps} />
      <Routes>
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
      <BottomTabBar active={activeTab} onChange={handleTabChange} />
    </div>
  );
}
```

### 8. NotFoundPage Component

A new component for handling 404 errors:

```typescript
function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  
  const homeRoute = user || isGuest ? '/discover' : '/welcome';
  
  return (
    <div style={{
      height: '100dvh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 72,
        color: 'var(--color-t1)',
        marginBottom: 16,
      }}>
        404
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        color: 'var(--color-t1)',
        marginBottom: 12,
      }}>
        Page Not Found
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-md)',
        color: 'var(--color-t2)',
        textAlign: 'center',
        marginBottom: 32,
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(homeRoute)}
        style={{
          height: 52,
          padding: '0 32px',
          borderRadius: 9999,
          background: 'var(--color-acc)',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          color: '#14120E',
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
  );
}
```

## Data Models

### Route Configuration

```typescript
type AuthScreen = 'welcome' | 'signin' | 'signup';
type TabId = 'discover' | 'play' | 'connect' | 'me';

interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected: boolean;
}

// Route mapping
const routes: RouteConfig[] = [
  // Public routes
  { path: '/welcome', element: <AuthFlow />, protected: false },
  { path: '/signin', element: <AuthFlow />, protected: false },
  { path: '/signup', element: <AuthFlow />, protected: false },
  
  // Protected routes
  { path: '/discover', element: <Shell />, protected: true },
  { path: '/play', element: <Shell />, protected: true },
  { path: '/connect', element: <Shell />, protected: true },
  { path: '/me', element: <Shell />, protected: true },
];
```

### Location State

For preserving intended destination after authentication:

```typescript
interface LocationState {
  from?: string; // The path user tried to access before being redirected to auth
}
```

### Navigation Hooks

```typescript
// useNavigate - for programmatic navigation
const navigate = useNavigate();
navigate('/discover');
navigate('/signin', { replace: true });

// useLocation - for reading current path
const location = useLocation();
const currentPath = location.pathname; // e.g., '/discover'
const state = location.state as LocationState;

// useParams - for future route parameters (not used in v1)
const params = useParams();
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties were identified as redundant or overlapping:

- Properties 5.4, 5.5, and 10.2 all test the same behavior: preserving intended destination for post-auth redirect
- Properties 7.1 and 7.2 both test animation preservation and can be combined
- Properties 8.1 and 8.2 both test layout constraints and can be combined
- Properties 5.2 and 5.3 test the same behavior (rendering protected routes) for different auth states and can be combined
- Property 6.4 is redundant with 6.1 and 6.2
- Property 10.3 is redundant with the example tests for specific tab routes

The following properties represent the unique, non-redundant correctness guarantees:

### Property 1: Authenticated users are redirected from auth routes

*For any* authenticated user (either signed in or guest), when navigating to any auth route (/welcome, /signin, /signup), the router should redirect to /discover.

**Validates: Requirements 2.4**

### Property 2: Active tab reflects current URL

*For any* tab route (/discover, /play, /connect, /me), when that route is active, the BottomTabBar should highlight the corresponding tab.

**Validates: Requirements 3.6**

### Property 3: Unauthenticated users are redirected from protected routes

*For any* protected route (/discover, /play, /connect, /me), when an unauthenticated user (not signed in and not guest) navigates to that route, the router should redirect to /welcome.

**Validates: Requirements 5.1**

### Property 4: Authenticated users can access protected routes

*For any* protected route (/discover, /play, /connect, /me) and any authenticated user (either signed in or guest), the router should render the requested route without redirecting.

**Validates: Requirements 5.2, 5.3**

### Property 5: Post-authentication redirect preserves destination

*For any* protected route, when an unauthenticated user attempts to access it, then authenticates, the router should redirect to the originally requested route (or /discover if no destination was preserved).

**Validates: Requirements 5.4, 5.5, 10.2**

### Property 6: Browser back navigation updates URL

*For any* sequence of route navigations, when the user clicks the browser back button, the URL should change to the previous route in the history stack.

**Validates: Requirements 6.1**

### Property 7: Browser forward navigation updates URL

*For any* sequence of route navigations where the user has gone back, when the user clicks the browser forward button, the URL should change to the next route in the history stack.

**Validates: Requirements 6.2**

### Property 8: Navigation creates history entries

*For any* route navigation, the browser history should record the navigation, increasing the history length.

**Validates: Requirements 6.3**

### Property 9: Framer Motion animations are preserved

*For any* route transition (between auth screens or between tab screens), the Framer Motion animation variants should be applied to the entering and exiting components.

**Validates: Requirements 7.1, 7.2**

### Property 10: Layout constraints are maintained

*For any* rendered route, the root container should maintain the max-width constraint of 430px and height of 100dvh.

**Validates: Requirements 8.1, 8.2**

### Property 11: Invalid routes render 404 page

*For any* route path that is not defined in the route configuration, the router should render the NotFoundPage component.

**Validates: Requirements 9.1**

### Property 12: Deep links to auth screens render correctly

*For any* auth screen deep link (/welcome, /signin, /signup), when accessed directly, the router should render the corresponding auth screen.

**Validates: Requirements 10.1**

### Property 13: Query parameters are preserved

*For any* route navigation with query parameters, the query parameters should be preserved in the URL after navigation.

**Validates: Requirements 10.4**

### Property 14: Route protection updates on auth state change

*For any* route, when the authentication state changes (user signs in, signs out, or becomes guest), the router should re-evaluate route protection and redirect if necessary.

**Validates: Requirements 12.2**

## Error Handling

### Authentication Loading State

While the AuthContext is loading (checking for existing session), the router should display the AppLoader component to prevent flickering between auth and protected routes.

```typescript
if (loading) {
  return <AppLoader />;
}
```

### Failed Navigation

If navigation fails (e.g., due to invalid route), the router will automatically render the NotFoundPage via the catch-all route pattern.

### Missing Location State

When redirecting after authentication, if the location state doesn't contain a `from` property, the router should default to redirecting to "/discover":

```typescript
const destination = location.state?.from || '/discover';
navigate(destination, { replace: true });
```

### Race Conditions

To prevent race conditions between authentication state changes and route protection checks, the ProtectedRoute and PublicRoute components should always check the `loading` state first before making routing decisions.

### Deep Link to Invalid Protected Route

If a user deep links to a protected route that doesn't exist (e.g., /invalid-route), the flow should be:
1. ProtectedRoute checks auth → redirects to /welcome with state
2. After auth, attempts to navigate to /invalid-route
3. Catch-all route renders NotFoundPage

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing

Unit tests should focus on:

1. **Specific route examples**:
   - Navigating to /welcome renders WelcomeScreen
   - Navigating to /signin renders SignInScreen
   - Navigating to /discover renders DiscoverPage
   - Root path "/" redirects correctly based on auth state

2. **Edge cases**:
   - 404 page provides correct home link based on auth state
   - Back button in AuthFlow navigates to previous route
   - Sign out redirects to /welcome

3. **Integration points**:
   - AuthContext integration with route protection
   - BottomTabBar click triggers navigation
   - AuthFlow navigation buttons trigger route changes

### Property-Based Testing

Property tests should use **fast-check** (JavaScript/TypeScript property-based testing library) with a minimum of 100 iterations per test.

Each property test must reference its design document property using the tag format:
```typescript
// Feature: url-routing, Property 1: Authenticated users are redirected from auth routes
```

Property tests should focus on:

1. **Route protection properties** (Properties 1, 3, 4):
   - Generate random auth states and route paths
   - Verify redirect behavior matches auth state

2. **Navigation properties** (Properties 2, 6, 7, 8):
   - Generate random navigation sequences
   - Verify history and UI state consistency

3. **Animation properties** (Property 9):
   - Generate random route transitions
   - Verify animation variants are applied

4. **Layout properties** (Property 10):
   - Generate random routes
   - Verify layout constraints are maintained

5. **Deep linking properties** (Properties 11, 12, 13):
   - Generate random URLs with query params
   - Verify correct rendering and param preservation

6. **State change properties** (Properties 5, 14):
   - Generate random auth state transitions
   - Verify route protection updates correctly

### Testing Configuration

```typescript
// Example property test configuration
import fc from 'fast-check';

// Feature: url-routing, Property 3: Unauthenticated users are redirected from protected routes
test('unauthenticated users are redirected from protected routes', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('/discover', '/play', '/connect', '/me'),
      (protectedRoute) => {
        // Test logic here
        // Verify redirect to /welcome
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Environment

- **Testing Library**: @testing-library/react for component testing
- **Router Testing**: Use `MemoryRouter` for isolated route testing
- **Property Testing**: fast-check for property-based tests
- **Mock Context**: Mock AuthContext for different auth states

### Coverage Goals

- Unit test coverage: 90%+ for routing logic
- Property test coverage: All 14 properties implemented
- Integration test coverage: All navigation flows tested end-to-end
