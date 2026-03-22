import React from 'react';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_PX = { sm: 32, md: 48, lg: 64, xl: 84 } as const;
const RADIUS = { sm: 'var(--radius-full)', md: 'var(--radius-full)', lg: 'var(--radius-full)', xl: 'var(--radius-xl)' } as const;
const FONT_SIZE = { sm: 11, md: 16, lg: 22, xl: 30 } as const;

export function Avatar({ name, imageUrl, size }: AvatarProps) {
  const px = SIZE_PX[size];
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      width: px, height: px,
      borderRadius: RADIUS[size],
      overflow: 'hidden',
      flexShrink: 0,
      background: 'linear-gradient(135deg, var(--color-acc-bg), rgba(13,158,80,0.25))',
    }}>
      {imageUrl ? (
        <img
          src={imageUrl} alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: FONT_SIZE[size],
          fontWeight: 'var(--weight-bold)' as any,
          color: 'var(--color-acc-dk)',
          userSelect: 'none',
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}
