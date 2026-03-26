# Implementation Plan: URL Routing

## Overview

This plan implements URL-based routing for the GotGetGo sports app using react-router-dom v6. The implementation will replace the current conditional rendering approach with proper URL-based navigation, enabling browser history integration, deep linking, and authentication gating while preserving existing UI/UX and Framer Motion animations.

## Tasks

- [x] 1. Install dependencies and configure router
  - Install react-router-dom and @types/react-router-dom packages
  - Wrap application with BrowserRouter in main.tsx
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Create route wrapper components
  - [x] 2.1 Create ProtectedRoute component
    - Implement authentication check using useAuth hook
    - Redirect unauthenticated users to /welcome with location state
    - Show AppLoader during authentication loading state
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 2.2 Write property test for ProtectedRoute
    - **Property 3: Unauthenticated users are redirected from protected routes**
    - **Property 4: Authenticated users can access protected routes**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 2.3 Create PublicRoute component
    - Implement authentication check using useAuth hook
    - Redirect authenticated users to /discover
    - Show AppLoader during authentication loading state
    - _Requirements: 2.4_
  
  - [ ]* 2.4 Write property test for PublicRoute
    - **Property 1: Authenticated users are redirected from auth routes**
    - **Validates: Requirements 2.4**
  
  - [x] 2.5 Create RootRedirect component
    - Implement conditional redirect based on authentication state
    - Redirect authenticated users to /discover
    - Redirect unauthenticated users to /welcome
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 2.6 Write unit tests for RootRedirect
    - Test redirect for authenticated user
    - Test redirect for guest user
    - Test redirect for unauthenticated user
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Refactor App.tsx to use Routes
  - [x] 3.1 Replace conditional rendering with Routes component
    - Define public auth routes (/welcome, /signin, /signup)
    - Define protected app routes (/discover, /play, /connect, /me)
    - Add root redirect route (/)
    - Add catch-all 404 route (*)
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 9.4_
  
  - [ ]* 3.2 Write unit tests for App route configuration
    - Test that each route path renders correct component
    - Test that invalid routes render NotFoundPage
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 9.1, 9.4_

- [ ] 4. Refactor AuthFlow to use router hooks
  - [x] 4.1 Replace useState with useLocation and useNavigate
    - Use useLocation to derive current screen from URL path
    - Use useNavigate for screen transitions
    - Implement post-authentication redirect using location state
    - Remove local state management for screen switching
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.5, 11.1, 11.4_
  
  - [ ]* 4.2 Write property test for post-authentication redirect
    - **Property 5: Post-authentication redirect preserves destination**
    - **Validates: Requirements 5.4, 5.5, 10.2**
  
  - [ ]* 4.3 Write unit tests for AuthFlow navigation
    - Test navigation between welcome, signin, signup screens
    - Test back button navigation
    - Test continue as guest redirects to /discover
    - _Requirements: 2.5, 11.1, 11.4_

- [ ] 5. Refactor Shell and BottomTabBar to use router hooks
  - [x] 5.1 Update Shell to derive active tab from URL
    - Use useLocation to determine active tab from pathname
    - Use useNavigate for tab change handler
    - Remove local state management for active tab
    - Update nested Routes for tab content
    - _Requirements: 3.5, 3.6, 11.2, 11.3_
  
  - [x] 5.2 Update BottomTabBar to use navigation handler
    - Accept onChange handler that uses navigate
    - Ensure active tab highlighting reflects current URL
    - _Requirements: 3.5, 3.6, 11.2_
  
  - [ ]* 5.3 Write property test for tab navigation
    - **Property 2: Active tab reflects current URL**
    - **Validates: Requirements 3.6**
  
  - [ ]* 5.4 Write unit tests for Shell and BottomTabBar
    - Test tab change triggers navigation
    - Test active tab derived from URL
    - Test each tab route renders correct page component
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 6. Create NotFoundPage component
  - [x] 6.1 Implement 404 page with design system styling
    - Create component with 404 message
    - Add "Go Home" button that navigates to /discover or /welcome
    - Match app's visual design system (colors, typography, layout)
    - Maintain mobile-first constraints (max-width: 430px, 100dvh)
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 6.2 Write property test for NotFoundPage
    - **Property 11: Invalid routes render 404 page**
    - **Validates: Requirements 9.1**
  
  - [ ]* 6.3 Write unit tests for NotFoundPage
    - Test home button navigates to correct route based on auth state
    - Test layout constraints are maintained
    - _Requirements: 9.2, 8.1, 8.2_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement browser history navigation tests
  - [ ]* 8.1 Write property tests for browser history
    - **Property 6: Browser back navigation updates URL**
    - **Property 7: Browser forward navigation updates URL**
    - **Property 8: Navigation creates history entries**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [ ]* 8.2 Write unit tests for browser history integration
    - Test back button navigates to previous route
    - Test forward button navigates to next route
    - Test history length increases with navigation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Implement animation and layout preservation tests
  - [ ]* 9.1 Write property test for animation preservation
    - **Property 9: Framer Motion animations are preserved**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 9.2 Write property test for layout constraints
    - **Property 10: Layout constraints are maintained**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ]* 9.3 Write unit tests for animations and layout
    - Test Framer Motion variants applied during route transitions
    - Test max-width constraint maintained across routes
    - Test 100dvh height maintained across routes
    - Test safe-area-inset support on notched devices
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Implement deep linking tests
  - [ ]* 10.1 Write property test for deep linking
    - **Property 12: Deep links to auth screens render correctly**
    - **Property 13: Query parameters are preserved**
    - **Validates: Requirements 10.1, 10.4**
  
  - [ ]* 10.2 Write unit tests for deep linking
    - Test direct navigation to auth screens
    - Test deep link to protected route redirects then returns
    - Test bookmarked tab screen renders correctly
    - Test query parameters preserved in URLs
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11. Implement authentication state change tests
  - [ ]* 11.1 Write property test for auth state changes
    - **Property 14: Route protection updates on auth state change**
    - **Validates: Requirements 12.2**
  
  - [ ]* 11.2 Write unit tests for AuthContext integration
    - Test route protection re-evaluates on auth state change
    - Test sign out redirects to /welcome
    - Test sign in redirects to preserved destination or /discover
    - Test router doesn't cause unnecessary AuthContext re-renders
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests should use fast-check with minimum 100 iterations
- Unit tests should use @testing-library/react with MemoryRouter
- All route transitions must preserve existing Framer Motion animations
- All routes must maintain mobile-first design constraints (max-width: 430px, 100dvh)
