/**
 * FeedHeader Component Usage Example
 * 
 * This file demonstrates how to use the FeedHeader component.
 * It is not part of the production code but serves as documentation.
 */

import { FeedHeader } from './FeedHeader';

export function FeedHeaderExample() {
  return (
    <div>
      {/* Example 1: Header with notifications */}
      <FeedHeader
        onSearchClick={() => console.log('Search clicked')}
        onNotificationClick={() => console.log('Notifications clicked')}
        onAvatarClick={() => console.log('Avatar clicked')}
        hasNotifications={true}
      />

      {/* Example 2: Header without notifications */}
      <FeedHeader
        onSearchClick={() => console.log('Search clicked')}
        onNotificationClick={() => console.log('Notifications clicked')}
        onAvatarClick={() => console.log('Avatar clicked')}
        hasNotifications={false}
      />
    </div>
  );
}
