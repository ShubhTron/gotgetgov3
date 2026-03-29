import { supabase } from './supabase';
import type { Database } from '../types/database';

// Helper types for common query patterns
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Type-safe table access
export function getTable<T extends TableName>(tableName: T) {
  return supabase.from(tableName);
}

// Helper for queries with joins that TypeScript struggles with
export function queryWithJoin<T extends TableName>(
  tableName: T,
  selectQuery: string
) {
  return supabase.from(tableName).select(selectQuery);
}

// Common query patterns
export const queries = {
  // User sport profiles with sport info
  userSportProfiles: (userId: string) =>
    supabase
      .from('user_sport_profiles')
      .select('*')
      .eq('user_id', userId),

  // Connections with profile info
  connectionsWithProfiles: (userId: string) =>
    supabase
      .from('connections')
      .select(`
        *,
        profiles:connected_user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'connected'),

  // User clubs with club info
  userClubsWithDetails: (userId: string) =>
    supabase
      .from('user_clubs')
      .select(`
        *,
        clubs (
          id,
          name,
          logo_url,
          city
        )
      `)
      .eq('user_id', userId),
};
