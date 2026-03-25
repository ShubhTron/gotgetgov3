/**
 * Avatar utility functions for shadcn/ui Avatar component
 */

/**
 * Generate initials from a full name
 * @param name - Full name to generate initials from
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get className for Avatar size
 * @param size - Size variant (sm, md, lg, xl)
 * @returns Tailwind className for size
 */
export function getAvatarSizeClass(size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const sizeMap = {
    sm: 'h-8 w-8',      // 32px
    md: 'h-11 w-11',    // 44px
    lg: 'h-16 w-16',    // 64px
    xl: 'h-22 w-22',    // 88px
  };
  return sizeMap[size];
}
