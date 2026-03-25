/**
 * ProfileDetailsView Component
 *
 * Scrollable profile details section that reveals progressively in fullscreen mode.
 * Displays About, More Info, Match History, Performance Graph, and Latest Updates sections.
 */

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Trophy, Calendar } from 'lucide-react';
import type { Player } from './PlayerCard';

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
  sport: string;
}

export interface PerformanceDataPoint {
  date: string;
  rating: number;
}

export interface LatestUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'achievement' | 'match' | 'tournament' | 'news';
}

export interface ProfileDetailsViewProps {
  player: Player;
  profileDetails?: {
    bio?: string;
    interests?: string[];
    genderPreference?: string;
    occupation?: string;
    education?: string;
    pets?: string;
    hobbies?: string[];
    drinkingPreference?: string;
    smokingPreference?: string;
    matchHistory?: MatchHistoryItem[];
    performanceData?: PerformanceDataPoint[];
    latestUpdates?: LatestUpdate[];
  };
  scrollPosition?: number;
  onScrollChange?: (position: number) => void;
}

export function ProfileDetailsView({
  player,
  profileDetails,
}: ProfileDetailsViewProps) {
  return (
    <>
      <div className="w-full">
        <AboutSection bio={profileDetails?.bio} />
        <MoreInfoSection player={player} profileDetails={profileDetails} />
        <MatchHistorySection
          matchHistory={profileDetails?.matchHistory}
          playerName={player.fullName}
        />
        <PerformanceGraphSection
          performanceData={profileDetails?.performanceData}
          currentRating={player.eloRating || (player.rating ? parseFloat(player.rating) : undefined)}
          sport={player.sport}
        />
        <LatestUpdatesSection
          updates={profileDetails?.latestUpdates}
          playerName={player.fullName}
        />
      </div>
    </>
  );
}

interface AboutSectionProps {
  bio?: string;
}

function AboutSection({ bio }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!bio) return;
    const estimatedLines = bio.length / 50;
    if (estimatedLines > 3) {
      setNeedsTruncation(true);
      return;
    }
    if (bioRef.current) {
      const lineHeight = 21;
      const maxHeight = lineHeight * 3;
      const fullHeight = bioRef.current.scrollHeight;
      if (fullHeight > maxHeight) {
        setNeedsTruncation(true);
      }
    }
  }, [bio]);

  if (!bio) {
    return (
      <section
        className="px-6 py-4 rounded-t-xl"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      >
        <h3 className="text-xl font-semibold text-white mb-2">About</h3>
        <p style={{ color: 'var(--color-t3)', fontSize: '0.875rem' }}>No bio yet</p>
      </section>
    );
  }

  return (
    <section
      className="px-6 py-4 rounded-t-xl"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      <h3 className="text-[20px] font-semibold text-white mb-2">About</h3>
      <motion.p
        ref={bioRef}
        className="text-gray-300 font-normal"
        style={{
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: 1.5,
          maxHeight: isExpanded ? 'none' : needsTruncation ? '63px' : 'auto',
          overflow: 'hidden',
        }}
        initial={false}
        animate={{
          maxHeight: isExpanded ? 'none' : needsTruncation ? '63px' : 'auto',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {bio}
      </motion.p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ color: 'var(--color-acc)', marginTop: 8, fontSize: '12px' }}
          className="hover:underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </section>
  );
}

interface MoreInfoSectionProps {
  player: Player;
  profileDetails?: {
    interests?: string[];
    genderPreference?: string;
    occupation?: string;
    education?: string;
    pets?: string;
    hobbies?: string[];
    drinkingPreference?: string;
    smokingPreference?: string;
  };
}

function MoreInfoSection({ player, profileDetails }: MoreInfoSectionProps) {
  const interests = profileDetails?.interests || [];
  const genderPreference = profileDetails?.genderPreference;
  const occupation = profileDetails?.occupation;
  const education = profileDetails?.education;
  const pets = profileDetails?.pets;
  const hobbies = profileDetails?.hobbies || [];
  const drinkingPreference = profileDetails?.drinkingPreference;
  const smokingPreference = profileDetails?.smokingPreference;

  const hasInfo =
    interests.length > 0 ||
    genderPreference ||
    occupation ||
    education ||
    pets ||
    hobbies.length > 0 ||
    drinkingPreference ||
    smokingPreference;

  if (!hasInfo) {
    return (
      <section
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          padding: '16px 24px',
        }}
      >
        <h3 className="text-[20px] font-semibold text-white mb-2">More Info</h3>
        <p style={{ color: 'var(--color-t3)', fontSize: '0.875rem' }}>No additional info</p>
      </section>
    );
  }

  return (
    <section
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        padding: '16px 24px',
      }}
    >
      <h3 className="text-[20px] font-semibold text-white mb-3">More Info</h3>
      <div className="space-y-3">
        {genderPreference && (
          <div className="flex items-center text-sm text-gray-300">
            <span className="text-gray-400 min-w-[100px]">Looking for:</span>
            <span>{genderPreference}</span>
          </div>
        )}
        {occupation && (
          <div className="flex items-center text-sm text-gray-300">
            <span className="text-gray-400 min-w-[100px]">Occupation:</span>
            <span>{occupation}</span>
          </div>
        )}
        {education && (
          <div className="flex items-center text-sm text-gray-300">
            <span className="text-gray-400 min-w-[100px]">Education:</span>
            <span>{education}</span>
          </div>
        )}
        {pets && (
          <div className="flex items-center text-sm text-gray-300">
            <span className="text-gray-400 min-w-[100px]">Pets:</span>
            <span>{pets}</span>
          </div>
        )}
        {hobbies.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm block mb-2">Hobbies:</span>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {hobbies.map((hobby, index) => (
                <span
                  key={index}
                  style={{
                    background: 'var(--color-surf)',
                    color: 'var(--color-t1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                  }}
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}
        {interests.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm block mb-2">Interests:</span>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {interests.map((interest, index) => (
                <span
                  key={index}
                  style={{
                    background: 'var(--color-surf)',
                    color: 'var(--color-t1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
        {drinkingPreference && (
          <div className="flex items-center text-sm text-gray-300" style={{ gap: '8px' }}>
            <span className="text-gray-400 min-w-[100px]">🍷 Drinking:</span>
            <span>{drinkingPreference}</span>
          </div>
        )}
        {smokingPreference && (
          <div className="flex items-center text-sm text-gray-300" style={{ gap: '8px' }}>
            <span className="text-gray-400 min-w-[100px]">🚬 Smoking:</span>
            <span>{smokingPreference}</span>
          </div>
        )}
      </div>
    </section>
  );
}

interface MatchHistorySectionProps {
  matchHistory?: MatchHistoryItem[];
  playerName: string;
}

function MatchHistorySection({ matchHistory }: MatchHistorySectionProps) {
  const mockMatches: MatchHistoryItem[] = [
    { id: '1', opponent: 'John Smith', result: 'win', score: '6-4, 6-3', date: '2 days ago', sport: 'Tennis' },
    { id: '2', opponent: 'Sarah Johnson', result: 'loss', score: '4-6, 6-7', date: '5 days ago', sport: 'Tennis' },
    { id: '3', opponent: 'Mike Davis', result: 'win', score: '6-2, 6-4', date: '1 week ago', sport: 'Tennis' },
    { id: '4', opponent: 'Emma Wilson', result: 'win', score: '7-5, 6-3', date: '2 weeks ago', sport: 'Tennis' },
    { id: '5', opponent: 'Alex Brown', result: 'loss', score: '3-6, 4-6', date: '3 weeks ago', sport: 'Tennis' },
  ];

  const matches = matchHistory || mockMatches;
  const wins = matches.filter(m => m.result === 'win').length;
  const losses = matches.filter(m => m.result === 'loss').length;

  return (
    <section
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        padding: '16px 24px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[20px] font-semibold text-white">Match History</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-400 font-medium">{wins}W</span>
          <span className="text-gray-500">-</span>
          <span className="text-red-400 font-medium">{losses}L</span>
        </div>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'var(--color-surf)' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-2 h-2 rounded-full ${match.result === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="flex-1">
                <p style={{ color: 'var(--color-t1)' }} className="text-sm font-medium">{match.opponent}</p>
                <p style={{ color: 'var(--color-t3)' }} className="text-xs">{match.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                {match.result === 'win' ? 'W' : 'L'}
              </p>
              <p style={{ color: 'var(--color-t3)' }} className="text-xs">{match.score}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface PerformanceGraphSectionProps {
  performanceData?: PerformanceDataPoint[];
  currentRating?: number;
  sport: string;
}

function PerformanceGraphSection({ performanceData, currentRating, sport }: PerformanceGraphSectionProps) {
  const mockData: PerformanceDataPoint[] = [
    { date: '6 months ago', rating: 1100 },
    { date: '5 months ago', rating: 1085 },
    { date: '4 months ago', rating: 1120 },
    { date: '3 months ago', rating: 1095 },
    { date: '2 months ago', rating: 1050 },
    { date: '1 month ago', rating: 1030 },
    { date: 'Now', rating: currentRating || 1067 },
  ];

  const data = performanceData || mockData;
  const firstRating = data[0]?.rating || 0;
  const lastRating = data[data.length - 1]?.rating || currentRating || 0;
  const ratingChange = lastRating - firstRating;
  const isPositive = ratingChange >= 0;

  const ratings = data.map(d => d.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const range = maxRating - minRating || 100;

  const width = 100;
  const height = 120;
  const padding = 10;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - padding - ((point.rating - minRating) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <section
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        padding: '16px 24px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[20px] font-semibold text-white">Performance</h3>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{ratingChange}
          </span>
        </div>
      </div>

      {/* Rating Display */}
      <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--color-surf)' }}>
        <div className="flex items-baseline gap-2 mb-1">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-3xl font-bold text-white">{lastRating}</span>
          <span style={{ color: 'var(--color-t3)' }} className="text-sm uppercase">{sport}</span>
        </div>
        <p style={{ color: 'var(--color-t3)' }} className="text-xs">Current Rating</p>
      </div>

      {/* Graph */}
      <div className="relative w-full rounded-lg p-4" style={{ height: `${height + 20}px`, background: 'var(--color-surf)' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="perf-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-acc)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-acc)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#perf-gradient)" opacity="0.3" />
          <path d={pathD} fill="none" stroke="var(--color-acc)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--color-t3)' }}>
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    </section>
  );
}

interface LatestUpdatesSectionProps {
  updates?: LatestUpdate[];
  playerName: string;
}

function LatestUpdatesSection({ updates }: LatestUpdatesSectionProps) {
  const mockUpdates: LatestUpdate[] = [
    { id: '1', title: 'Tournament Victory', description: 'Won the City Championship Finals', date: '3 days ago', type: 'achievement' },
    { id: '2', title: 'Winning Streak', description: 'Currently on a 5-match winning streak', date: '1 week ago', type: 'match' },
    { id: '3', title: 'New Personal Best', description: 'Reached career-high rating of 1100', date: '2 weeks ago', type: 'achievement' },
  ];

  const displayUpdates = updates || mockUpdates;

  if (displayUpdates.length === 0) {
    return (
      <section
        className="rounded-b-xl"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          padding: '16px 24px',
        }}
      >
        <h3 className="text-[20px] font-semibold text-white mb-2">Latest Updates</h3>
        <p style={{ color: 'var(--color-t3)', fontSize: '0.875rem' }}>No recent updates</p>
      </section>
    );
  }

  const getUpdateIcon = (type: LatestUpdate['type']) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'tournament':
        return <Trophy className="w-4 h-4 text-blue-400" />;
      case 'match':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <section
      className="rounded-b-xl"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        padding: '16px 24px',
      }}
    >
      <h3 className="text-[20px] font-semibold text-white mb-3">Latest Updates</h3>
      <div className="space-y-3">
        {displayUpdates.map((update) => (
          <div
            key={update.id}
            className="p-3 rounded-lg"
            style={{ background: 'var(--color-surf)' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getUpdateIcon(update.type)}</div>
              <div className="flex-1">
                <p style={{ color: 'var(--color-t1)' }} className="text-sm font-medium mb-1">{update.title}</p>
                <p style={{ color: 'var(--color-t2)' }} className="text-xs mb-2">{update.description}</p>
                <p style={{ color: 'var(--color-t3)' }} className="text-xs">{update.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
