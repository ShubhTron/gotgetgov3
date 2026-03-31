# Feed Components

This directory contains components for the Feed tab redesign.

## FeedHeader

The `FeedHeader` component is the top navigation bar for the Feed page.

### Features

- **Logo Display**: Shows "GotGetGo" with "Get" in italic green accent color
- **Context Pill**: Displays "Feed" label inline with the logo
- **Search Button**: Icon button for search functionality
- **Notification Bell**: Icon button with optional green dot indicator for new notifications
- **Avatar Button**: User profile button

### Props

```typescript
interface FeedHeaderProps {
  onSearchClick: () => void;        // Callback when search button is clicked
  onNotificationClick: () => void;  // Callback when notification bell is clicked
  onAvatarClick: () => void;        // Callback when avatar button is clicked
  hasNotifications: boolean;        // Whether to show notification dot indicator
}
```

### Styling

- Fixed height: 52px
- Background: `var(--color-bg)` (cream/beige #F4F3EF)
- Padding: 0 22px
- Fixed positioning at top of viewport
- Uses CSS custom properties from design system
- Inline styles following codebase patterns

### Requirements Validated

This component validates the following requirements from the Feed Tab Redesign spec:

- **Requirement 1.1**: Logo displays "GotGetGo" with "Get" in italic green accent
- **Requirement 1.2**: "Feed" context pill displayed inline with logo
- **Requirement 1.3**: Search icon button included
- **Requirement 1.4**: Notification bell with green dot indicator when notifications exist
- **Requirement 1.5**: User avatar button included
- **Requirement 1.6**: Cream/beige background color (#F4F3EF)
- **Requirement 1.7**: Fixed height of 52px

### Usage Example

```tsx
import { FeedHeader } from '@/components/feed';

function FeedPage() {
  const handleSearch = () => {
    // Open search interface
  };

  const handleNotifications = () => {
    // Open notifications panel
  };

  const handleProfile = () => {
    // Navigate to profile
  };

  return (
    <div>
      <FeedHeader
        onSearchClick={handleSearch}
        onNotificationClick={handleNotifications}
        onAvatarClick={handleProfile}
        hasNotifications={true}
      />
      {/* Rest of feed content */}
    </div>
  );
}
```

### Accessibility

- All buttons have proper `aria-label` attributes
- Notification button includes dynamic aria-label when notifications exist
- Notification dot has `aria-hidden="true"` as it's decorative
- Semantic HTML with `<header>` element
- Keyboard accessible (all buttons are focusable)
- Hover states for better user feedback

### Design Tokens Used

- `--color-bg`: Background color
- `--color-surf`: Surface color for pills and buttons
- `--color-t1`: Primary text color
- `--color-t2`: Secondary text color
- `--color-bdr`: Border color
- `--color-bdr-s`: Stronger border color (hover state)
- `--color-acc`: Accent color (green)
- `--color-acc-dk`: Dark accent color (green for "Get")
- `--font-display`: Display font (Cormorant) for logo
- `--font-body`: Body font (Figtree) for context pill

## HeroCard

The `HeroCard` component displays the user's latest match result prominently with detailed statistics and sharing options.

### Features

- **Dark Background with Radial Glow**: Dark background with radial green glow effect for visual emphasis
- **Eyebrow Label**: Shows "Match Result · [Sport] · [Time]" in uppercase
- **Headline with Opponent**: Displays "You vs [Opponent Name]" with opponent name in italic green accent
- **Score Badge**: Match score displayed in top-right badge with win/loss styling
- **Venue Details**: Club name and city displayed as subtitle
- **Pill Badges**: Time elapsed, ELO change with arrow, and location badges
- **Action Buttons**: Primary "Share Result" button and secondary options button
- **Seamless Connection**: Top radius 22px, bottom 0 to connect flush with ELO strip

### Props

```typescript
interface HeroCardProps {
  match: Match;              // Match data from database
  opponent: Profile;         // Opponent profile information
  club: Club | null;         // Club/venue information (optional)
  eloChange: number;         // ELO rating change (positive or negative)
  onShareClick: () => void;  // Callback when Share Result button is clicked
  onOptionsClick: () => void; // Callback when options button is clicked
}
```

### Styling

- Dark background: `var(--color-t1)` (#14120E)
- Radial gradient overlay: Green glow effect at 80% 0%
- Top border radius: 22px
- Bottom border radius: 0 (connects to ELO strip)
- Padding: 20px 20px 18px
- Uses CSS custom properties from design system
- Inline styles following codebase patterns

### Requirements Validated

This component validates the following requirements from the Feed Tab Redesign spec:

- **Requirement 3.1**: Dark background with radial green glow effect
- **Requirement 3.2**: Eyebrow label showing "Match Result · [Sport] · [Time]"
- **Requirement 3.3**: Headline with opponent name in italic green accent
- **Requirement 3.4**: Score badge in top-right of headline area
- **Requirement 3.5**: Venue details as subtitle text
- **Requirement 3.6**: Pill badges for time elapsed, ELO change, and location
- **Requirement 3.7**: Primary "Share Result" button
- **Requirement 3.8**: Secondary options button with three-dot icon
- **Requirement 3.9**: Top radius 22px, bottom 0
- **Requirement 3.10**: Connects flush to ELO strip below

### Usage Example

```tsx
import { HeroCard } from '@/components/feed';

function FeedPage() {
  const handleShare = () => {
    // Open share dialog
  };

  const handleOptions = () => {
    // Open options menu
  };

  return (
    <div>
      <HeroCard
        match={latestMatch}
        opponent={opponentProfile}
        club={venueClub}
        eloChange={14}
        onShareClick={handleShare}
        onOptionsClick={handleOptions}
      />
      {/* ELO strip would go here */}
    </div>
  );
}
```

### Accessibility

- All buttons have proper `aria-label` attributes
- Semantic HTML with `<h2>` for headline
- Keyboard accessible (all buttons are focusable)
- Hover states for better user feedback
- Color contrast meets WCAG standards for dark background

### Design Tokens Used

- `--color-t1`: Dark background color
- `--color-t3`: Secondary text color (eyebrow, pill text)
- `--color-bg`: Light text color (headline)
- `--color-acc`: Accent color (green for opponent name, win badge, positive ELO)
- `--color-acc-dk`: Dark accent color (hover state)
- `--color-red`: Red color (negative ELO)
- `--color-surf-2`: Light surface color (loss badge)
- `--color-bdr`: Border color
- `--font-display`: Display font (Cormorant) for headline
- `--font-body`: Body font (Figtree) for all other text

### Icons Used

- `Share2` from lucide-react: Share Result button
- `MoreVertical` from lucide-react: Options button
- `Clock` from lucide-react: Time elapsed pill
- `TrendingUp` from lucide-react: ELO change pill (rotated 180° for negative)
- `MapPin` from lucide-react: Location pill

## ELOStrip

The `ELOStrip` component displays rating changes and trends, attaching seamlessly below the HeroCard component.

### Features

- **Rating Change Display**: Shows ELO change with plus/minus indicator and trending arrow
- **Current Rating**: Displays the user's current total rating prominently
- **Sparkline Chart**: SVG-based sparkline showing rating trend over recent matches
- **Seamless Connection**: Top radius 0, bottom 18px to connect flush with HeroCard above
- **Light Background**: Uses light surface color to contrast with dark HeroCard
- **Responsive Layout**: Flexbox layout with rating info on left, sparkline on right

### Props

```typescript
interface ELOStripProps {
  eloChange: number;        // ELO rating change (positive or negative)
  currentElo: number;       // Current total ELO rating
  sparklineData: number[];  // Array of recent ELO values for sparkline chart
}
```

### Styling

- Background: `var(--color-surf-2)` (#F0EFEB)
- Border: 1px solid `var(--color-bdr)` (no top border)
- Top border radius: 0 (connects to HeroCard)
- Bottom border radius: 18px
- Padding: 14px 20px 16px
- Uses CSS custom properties from design system
- Inline styles following codebase patterns

### Requirements Validated

This component validates the following requirements from the Feed Tab Redesign spec:

- **Requirement 4.1**: Attaches directly below Hero_Card with no gap
- **Requirement 4.2**: Displays sparkline chart showing rating trend
- **Requirement 4.3**: Displays rating change with plus/minus indicator
- **Requirement 4.4**: Displays current total rating
- **Requirement 4.5**: Uses light background color (#F0EFEB)
- **Requirement 4.6**: Uses rounded corners on bottom only (18px radius)
- **Requirement 4.7**: Displays "Rating after today" label above change amount

### Usage Example

```tsx
import { HeroCard, ELOStrip } from '@/components/feed';

function FeedPage() {
  // Sample sparkline data (last 10 matches)
  const sparklineData = [1180, 1195, 1188, 1205, 1198, 1210, 1205, 1218, 1212, 1226];

  return (
    <div>
      <HeroCard
        match={latestMatch}
        opponent={opponentProfile}
        club={venueClub}
        eloChange={14}
        onShareClick={handleShare}
        onOptionsClick={handleOptions}
      />
      <ELOStrip
        eloChange={14}
        currentElo={1226}
        sparklineData={sparklineData}
      />
    </div>
  );
}
```

### Sparkline Implementation

The sparkline chart is implemented using SVG with the following features:

- **Auto-scaling**: Automatically scales to fit the data range
- **Smooth Path**: Uses SVG path with rounded line joins
- **Fixed Dimensions**: 80px width × 32px height
- **Padding**: 2px padding to prevent clipping
- **Color**: Uses accent green color (`var(--color-acc)`)
- **Stroke Width**: 2px for visibility
- **Empty State**: Gracefully handles empty sparklineData array

### Sparkline Algorithm

```typescript
// Normalize data to fit within SVG viewport
const min = Math.min(...data);
const max = Math.max(...data);
const range = max - min || 1; // Avoid division by zero

// Map each data point to x,y coordinates
const points = data.map((value, index) => {
  const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
  const y = height - padding - ((value - min) / range) * (height - 2 * padding);
  return `${x},${y}`;
});

// Generate SVG path: M x1,y1 L x2,y2 L x3,y3 ...
const path = `M ${points.join(' L ')}`;
```

### Accessibility

- SVG has `aria-label="Rating trend sparkline"` for screen readers
- Color-coded indicators (green for positive, red for negative)
- Clear visual hierarchy with label, change, and total rating
- Semantic HTML structure

### Design Tokens Used

- `--color-surf-2`: Light background color
- `--color-bdr`: Border color
- `--color-t1`: Primary text color (current rating)
- `--color-t2`: Secondary text color (label)
- `--color-acc`: Accent color (green for positive change, sparkline)
- `--color-red`: Red color (negative change)
- `--font-body`: Body font (Figtree) for all text

### Icons Used

- `TrendingUp` from lucide-react: Rating change indicator (rotated 180° for negative)

### Edge Cases Handled

1. **Empty Sparkline Data**: Component renders without sparkline when `sparklineData` is empty
2. **Zero Change**: Displays "+0" with green color (treated as positive)
3. **Negative Change**: Arrow rotates 180° and uses red color
4. **Single Data Point**: Sparkline gracefully handles single value (flat line)
5. **Identical Values**: Handles case where all sparkline values are the same (avoids division by zero)

### Performance Considerations

- **Lightweight SVG**: Simple path-based sparkline with minimal DOM nodes
- **No External Dependencies**: Pure SVG implementation, no charting library needed
- **Efficient Rendering**: Sparkline path calculated once per render
- **Small Data Set**: Designed for 10-20 data points (recent match history)
