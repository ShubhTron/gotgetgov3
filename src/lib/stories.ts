/**
 * Stories Service - Fetch and manage stories from Supabase
 * 
 * Provides functions to:
 * - Fetch active stories (not expired, within 24 hours)
 * - Subscribe to real-time story updates
 * - Track story views
 * - Filter stories by audience (connections vs everyone)
 * 
 * Requirements: 7.11, 27.1
 */

import { supabase } from './supabase';
import type { Story } from '../components/discover/StoryViewer';

/**
 * Fetch active stories for a specific user
 * Filters out expired stories (older than 24 hours)
 * 
 * @param userId - The user ID to fetch stories for
 * @returns Array of active stories
 */
export async function fetchUserStories(userId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    // Log in development, silent in production
    if (import.meta.env.DEV) {
      console.warn('[fetchUserStories] Error:', error.message, error.code);
    }
    return [];
  }

  return data || [];
}

/**
 * Fetch all active stories from connections and public users
 * Groups stories by user_id
 * 
 * @param currentUserId - The current user's ID
 * @returns Map of user_id to stories array
 */
export async function fetchAllStories(currentUserId: string): Promise<Record<string, Story[]>> {
  // Fetch all active stories (RLS will filter based on audience and connections)
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    // Log in development, silent in production
    if (import.meta.env.DEV) {
      console.warn('[fetchAllStories] Error:', error.message, error.code);
    }
    return {};
  }

  // Group stories by user_id
  const storiesMap: Record<string, Story[]> = {};
  
  for (const story of data || []) {
    if (!storiesMap[story.user_id]) {
      storiesMap[story.user_id] = [];
    }
    storiesMap[story.user_id].push(story);
  }

  return storiesMap;
}

/**
 * Subscribe to real-time story updates
 * Calls the callback when new stories are created or existing stories are deleted
 * 
 * @param callback - Function to call when stories change
 * @returns Unsubscribe function
 */
/**
 * @deprecated Stories table is not in the supabase_realtime publication.
 * The old postgres_changes subscription was a no-op. Stories now refresh
 * on page navigation (fetchAllStories on mount).
 */

/**
 * Track that a user has viewed a story
 * Inserts a record into story_views table
 * 
 * @param storyId - The story ID
 * @param viewerId - The viewer's user ID
 */
export async function trackStoryView(storyId: string, viewerId: string): Promise<void> {
  const { error } = await supabase
    .from('story_views')
    .insert({
      story_id: storyId,
      viewer_id: viewerId,
    });

  if (error && error.code !== '23505') {
    // Log unexpected errors in development (ignore duplicate key violations)
    if (import.meta.env.DEV) {
      console.warn('[trackStoryView] Error:', error.message, error.code);
    }
  }
}

/**
 * Fetch story views for the current user
 * Returns a set of story IDs that have been viewed
 * 
 * @param viewerId - The viewer's user ID
 * @returns Set of viewed story IDs
 */
export async function fetchViewedStoryIds(viewerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('story_views')
    .select('story_id')
    .eq('viewer_id', viewerId);

  if (error) {
    // Silently handle missing table - return empty set
    return new Set();
  }

  return new Set((data || []).map(v => v.story_id));
}

/**
 * Create a new story
 * 
 * @param userId - The user creating the story
 * @param type - Story type (image, video, text, match_result)
 * @param content - Story content (URL or text)
 * @param audience - Story audience (everyone or connections)
 * @returns The created story or null if error
 */
export async function createStory(
  userId: string,
  type: 'image' | 'video' | 'text' | 'match_result',
  content: string,
  audience: 'everyone' | 'connections' = 'everyone'
): Promise<Story | null> {
  // Stories expire after 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      type,
      content,
      audience,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Log in development for debugging
    if (import.meta.env.DEV) {
      console.error('[createStory] Failed to create story:', error.message, error.code);
    }
    return null;
  }

  return data;
}

/**
 * Delete a story
 * 
 * @param storyId - The story ID to delete
 * @returns True if successful, false otherwise
 */
export async function deleteStory(storyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId);

  if (error) {
    // Log in development for debugging
    if (import.meta.env.DEV) {
      console.error('[deleteStory] Failed to delete story:', error.message, error.code);
    }
    return false;
  }

  return true;
}
