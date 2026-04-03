/**
 * Demonstration of Feed API caching functionality
 * This file shows how to use getCachedData and setCachedData functions
 */

import { getCachedData, setCachedData, type FeedData } from './feed-api';
import type { NewsFilter } from '@/types/feed';

/**
 * Example usage of the caching functions
 */
export function demonstrateCaching() {
  // Example 1: Store data in cache
  const mockFeedData: FeedData = {
    heroMatch: null,
    challenges: [],
    openMatches: [],
    weeklyMatches: [],
    tournaments: [],
  };

  console.log('Example 1: Storing data in cache');
  setCachedData('all', mockFeedData);
  console.log('✓ Data cached for "all" filter');

  // Example 2: Retrieve cached data
  console.log('\nExample 2: Retrieving cached data');
  const cachedData = getCachedData('all');
  if (cachedData) {
    console.log('✓ Retrieved cached data:', cachedData);
  } else {
    console.log('✗ No cached data found');
  }

  // Example 3: Cache expiration (5 minutes)
  console.log('\nExample 3: Cache TTL is 5 minutes');
  console.log('Cache will expire after 5 minutes and return null');

  // Example 4: Multiple filter caching
  console.log('\nExample 4: Caching multiple filters');
  const filters: NewsFilter[] = ['all', 'challenges', 'results', 'near_me', 'tournaments'];
  filters.forEach(filter => {
    setCachedData(filter, { ...mockFeedData });
    console.log(`✓ Cached data for "${filter}" filter`);
  });

  // Example 5: Cache size limit (max 5 entries)
  console.log('\nExample 5: Cache maintains maximum 5 entries');
  console.log('When adding a 6th entry, the oldest entry is evicted (LRU)');

  // Example 6: Typical usage in a component
  console.log('\nExample 6: Typical usage pattern');
  console.log(`
  async function loadFeedData(userId: string, filter: NewsFilter) {
    // Check cache first
    const cached = getCachedData(filter);
    if (cached) {
      console.log('Using cached data');
      return cached;
    }
    
    // Fetch fresh data if no cache
    const data = await fetchAllFeedData(userId, filter);
    
    // Store in cache for future use
    setCachedData(filter, data);
    
    return data;
  }
  `);
}

/**
 * Example of cache-aware data fetching
 */
export async function fetchWithCache(
  userId: string,
  filter: NewsFilter,
  fetchFunction: (userId: string) => Promise<FeedData>
): Promise<FeedData> {
  // Try to get cached data first
  const cached = getCachedData(filter);
  if (cached) {
    console.log(`Using cached data for filter: ${filter}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Fetching fresh data for filter: ${filter}`);
  const data = await fetchFunction(userId);

  // Cache the fresh data
  setCachedData(filter, data);

  return data;
}

/**
 * Example of cache invalidation
 */
export function invalidateCache(filter: NewsFilter) {
  // To invalidate cache, simply don't call getCachedData
  // or wait for TTL to expire (5 minutes)
  // The cache will automatically be cleared when expired
  console.log(`Cache for filter "${filter}" will expire after 5 minutes`);
}
