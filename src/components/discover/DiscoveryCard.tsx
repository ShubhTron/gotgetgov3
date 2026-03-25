/**
 * DiscoveryCard Component
 *
 * Premium discovery card with full-bleed image background, badges, player information,
 * and image optimization. Supports multiple content types.
 */

import React, { useState } from 'react';
import { User, Building, Trophy, Calendar, Award, Info, CheckCircle } from 'lucide-react';
import type { Player, Club, Coach, Competition, Event } from '@/types/discover';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DiscoveryCardProps {
  type: 'player' | 'club' | 'coach' | 'competition' | 'event';
  data: Player | Club | Coach | Competition | Event;
  onInfoTap?: () => void;
}

const SPORT_ICONS: Record<string, string> = {
  tennis: '🎾',
  pickleball: '🏓',
  badminton: '🏸',
  squash: '🎾',
  table_tennis: '🏓',
};

const CONTENT_TYPE_ICONS = {
  player: User,
  club: Building,
  coach: Award,
  competition: Trophy,
  event: Calendar,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getBackgroundImage(data: Player | Club | Coach | Competition | Event, type: string): string {
  if (type === 'player' && 'avatarUrl' in data) {
    return (data as Player).avatarUrl || '';
  }
  if (type === 'club' && 'coverImageUrl' in data) {
    return (data as Club).coverImageUrl || '';
  }
  if (type === 'coach' && 'avatarUrl' in data) {
    return (data as Coach).avatarUrl || '';
  }
  return '';
}

function generateSrcSet(baseUrl: string, isMobile: boolean): string {
  if (!baseUrl) return '';
  const width = isMobile ? 800 : 1200;
  const height = isMobile ? 1200 : 1600;
  return `${baseUrl}?w=${width}&h=${height}&q=80 1x, ${baseUrl}?w=${width * 2}&h=${height * 2}&q=80 2x, ${baseUrl}?w=${width * 3}&h=${height * 3}&q=80 3x`;
}

function getBlurPlaceholder(baseUrl: string): string {
  if (!baseUrl) return '';
  return `${baseUrl}?w=40&h=60&q=10&blur=20`;
}

// ============================================================================
// Main Component
// ============================================================================

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ type, data, onInfoTap }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isMobile = window.innerWidth <= 768;
  const backgroundImage = getBackgroundImage(data, type);
  const ContentTypeIcon = CONTENT_TYPE_ICONS[type];

  const isPlayer = type === 'player';
  const player = isPlayer ? (data as Player) : null;

  return (
    <div
      className="discovery-card"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        backgroundColor: 'var(--color-surf)',
      }}
    >
      {/* Full-bleed background image with blur-up technique */}
      {backgroundImage && !imageError && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${getBlurPlaceholder(backgroundImage)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
              opacity: imageLoaded ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
            }}
          />
          <picture>
            <source
              type="image/webp"
              srcSet={generateSrcSet(backgroundImage.replace(/\.(jpg|jpeg|png)$/i, '.webp'), isMobile)}
            />
            <img
              src={backgroundImage}
              srcSet={generateSrcSet(backgroundImage, isMobile)}
              alt={isPlayer ? player?.fullName : ''}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
              }}
            />
          </picture>
        </>
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content type badge (top-left) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: '32px',
          height: '32px',
          borderRadius: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-t1)',
        }}
      >
        <ContentTypeIcon size={18} />
      </div>

      {/* Sport badge (top-right) */}
      {isPlayer && player?.sport && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: '32px',
            height: '32px',
            borderRadius: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {SPORT_ICONS[player.sport] || '🎾'}
        </div>
      )}

      {/* Info icon button (44x44px touch target) */}
      {onInfoTap && (
        <button
          onClick={onInfoTap}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: '44px',
            height: '44px',
            borderRadius: 9999,
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease-out',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-t1)',
            }}
          >
            <Info size={18} />
          </div>
        </button>
      )}

      {/* Player information section (bottom) */}
      {isPlayer && player && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 8,
            color: 'var(--color-t1)',
          }}
        >
          {/* Player name with verified badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                margin: 0,
                fontFamily: 'var(--font-display)',
              }}
            >
              {player.fullName}
            </h2>
            {player.verified && (
              <CheckCircle
                size={20}
                style={{ color: 'var(--color-acc)', flexShrink: 0 }}
              />
            )}
          </div>

          {/* Metadata row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.875rem',
              color: 'var(--color-t2)',
              marginBottom: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            {player.age && <span>{player.age}</span>}
            {player.age && player.distance !== undefined && <span>•</span>}
            {player.distance !== undefined && <span>{player.distance} mi</span>}
            {player.level && <span>•</span>}
            {player.level && <span style={{ textTransform: 'capitalize' }}>{player.level}</span>}
            {player.rating && player.ratingSystem && (
              <>
                <span>•</span>
                <span>{player.ratingSystem} {player.rating}</span>
              </>
            )}
          </div>

          {/* Trust indicators row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.75rem',
              color: 'var(--color-t2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {player.mutualConnections !== undefined && player.mutualConnections > 0 && (
              <span style={{ color: 'var(--color-acc)' }}>
                {player.mutualConnections} mutual {player.mutualConnections === 1 ? 'connection' : 'connections'}
              </span>
            )}
            {player.responseRate && (
              <span>{player.responseRate} response rate</span>
            )}
          </div>

          {/* Common clubs badges */}
          {player.clubIds && player.clubIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                marginTop: 4,
                flexWrap: 'wrap',
              }}
            >
              {player.clubIds.slice(0, 3).map((clubId, index) => (
                <div
                  key={clubId}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '0.75rem',
                    color: 'var(--color-t2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Club {index + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoveryCard;
