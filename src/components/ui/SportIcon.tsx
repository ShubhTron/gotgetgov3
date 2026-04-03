import { cn } from '@/lib/utils';

interface SportIconProps {
  sport: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function SportIcon({ sport, className, size = 'md' }: SportIconProps) {
  const iconClass = cn(sizeClasses[size], className);

  switch (sport) {
    case 'platform_tennis':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 2h10a3 3 0 0 1 3 3v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V5a3 3 0 0 1 3-3z" />
          <circle cx="9" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case 'tennis':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="11" cy="9" rx="7" ry="8" />
          <path d="M4 9c0-3 3.5-5.5 7-5.5S18 6 18 9" />
          <path d="M4 9c0 3 3.5 5.5 7 5.5s7-2.5 7-5.5" />
          <line x1="11" y1="1" x2="11" y2="17" />
          <path d="M8 17l0 5" />
          <ellipse cx="8" cy="22" rx="1.5" ry="0.5" />
        </svg>
      );
    case 'padel':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 2h10a4 4 0 0 1 4 4v7a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V6a4 4 0 0 1 4-4z" />
          <circle cx="9.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case 'squash':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="7" rx="5" ry="5" />
          <line x1="12" y1="12" x2="12" y2="22" />
          <line x1="7" y1="5" x2="17" y2="5" />
          <line x1="7" y1="7" x2="17" y2="7" />
          <line x1="7" y1="9" x2="17" y2="9" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      );
    case 'pickleball':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="15" rx="6" />
          <circle cx="9.5" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <line x1="12" y1="17" x2="12" y2="22" />
        </svg>
      );
    case 'beach_tennis':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="11" cy="9" rx="7" ry="8" />
          <path d="M4 6c3 4 7 6 11 6" />
          <path d="M4 12c3-4 7-6 11-6" />
          <line x1="8" y1="17" x2="8" y2="22" />
          <circle cx="19" cy="4" r="2" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="9" rx="6" ry="7" />
          <line x1="12" y1="16" x2="12" y2="22" />
        </svg>
      );
  }
}
