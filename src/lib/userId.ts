import { supabase } from './supabase';
import type { Profile } from '../types/database';

/**
 * Converts UUID to user-friendly display ID
 * Uses first 8 characters of UUID, removes hyphens
 * 
 * @param uuid - The UUID from the profiles table
 * @returns Formatted user ID with # prefix (e.g., "#a3f5b2c1")
 */
export function formatUserIdForDisplay(uuid: string): string {
  const cleaned = uuid.replace(/-/g, '');
  const shortId = cleaned.substring(0, 8).toLowerCase();
  return `#${shortId}`;
}

/**
 * Normalizes user input for ID search
 * Removes # prefix and whitespace, converts to lowercase
 * 
 * @param input - Raw user input (e.g., "#A3F5B2C1" or "a3f5b2c1")
 * @returns Normalized ID without prefix (e.g., "a3f5b2c1")
 */
export function normalizeUserIdInput(input: string): string {
  return input.replace(/^#/, '').replace(/\s/g, '').toLowerCase();
}

/**
 * Validates if input is a potential user ID
 * Checks format: starts with # and has 8 hex characters
 * 
 * @param input - User input to validate
 * @returns true if input matches valid user ID format
 */
export function isValidUserIdFormat(input: string): boolean {
  const normalized = normalizeUserIdInput(input);
  return /^[0-9a-f]{8}$/.test(normalized);
}

/**
 * Searches for user by formatted ID
 * Queries profiles where UUID starts with the normalized ID
 * 
 * @param formattedId - User ID with or without # prefix
 * @returns Profile if found, null otherwise
 */
export async function searchUserById(
  formattedId: string
): Promise<Profile | null> {
  const normalized = normalizeUserIdInput(formattedId);
  
  // Fetch all profiles and filter client-side since UUID pattern matching
  // doesn't work well with Supabase query builder
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Search error:', error);
    return null;
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  // Filter client-side for UUIDs that start with the normalized ID
  const matchingProfile = data.find(profile => {
    const cleanedId = profile.id.replace(/-/g, '').toLowerCase();
    return cleanedId.startsWith(normalized);
  });
  
  return matchingProfile || null;
}
/**
 * Determines the search type based on query format
 * Queries starting with "#" are treated as ID searches
 * All other queries are treated as name-based searches
 * 
 * @param query - Raw search query from user input
 * @returns 'id' if query starts with #, 'name' otherwise
 */
export function determineSearchType(query: string): 'id' | 'name' {
  const trimmed = query.trim();
  return trimmed.startsWith('#') ? 'id' : 'name';
}
