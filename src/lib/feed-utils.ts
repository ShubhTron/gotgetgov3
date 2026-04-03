/**
 * Feed utility functions for the Feed Tab Redesign
 * Provides distance calculation, time formatting, ELO calculation, and initials extraction
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param venueLat - Venue's latitude
 * @param venueLng - Venue's longitude
 * @returns Distance in miles (rounded to nearest integer)
 */
export function calculateDistance(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (venueLat - userLat) * Math.PI / 180;
  const dLng = (venueLng - userLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(venueLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

/**
 * Format timestamp as relative time
 * @param date - ISO timestamp string
 * @returns Formatted relative time string (e.g., "2h ago", "Today", "Yesterday")
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

/**
 * Calculate ELO rating change for a match
 * Uses simplified K-factor calculation (K=32)
 * @param isWin - Whether the player won the match
 * @returns ELO change (positive for win, negative for loss)
 */
export function calculateEloChange(isWin: boolean): number {
  // Simplified K-factor calculation
  // In a real implementation, this would consider opponent rating
  return isWin ? 14 : -12;
}

/**
 * Extract initials from user name for avatar display
 * @param name - User's full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  
  // Take first letter of first word and first letter of second word
  return (words[0][0] + words[1][0]).toUpperCase();
}
