/**
 * ELO rating system mapped to skill levels.
 * Each level has a fixed range. A player's exact ELO within that range
 * is seeded from their user ID so it stays consistent across renders.
 */
export const ELO_RANGES: Record<
  string,
  { min: number; max: number; badge: string; badgeClass: string }
> = {
  beginner:     { min: 500,  max: 799,  badge: 'Bronze',   badgeClass: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' },
  intermediate: { min: 800,  max: 1099, badge: 'Silver',   badgeClass: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  advanced:     { min: 1100, max: 1399, badge: 'Gold',     badgeClass: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  expert:       { min: 1400, max: 1699, badge: 'Platinum', badgeClass: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
  professional: { min: 1700, max: 2000, badge: 'Diamond',  badgeClass: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
};

/**
 * Returns a stable ELO for a player, seeded by their userId so it never
 * randomly changes between renders.
 */

export function getLevelElo(level: string, userId: string): number {
  const range = ELO_RANGES[level.toLowerCase()];
  if (!range) return 900;

  // Lightweight string hash (djb2-style, always positive)
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash) ^ userId.charCodeAt(i);
  }
  const t = (Math.abs(hash) % 1000) / 1000; // 0..1
  return Math.round(range.min + t * (range.max - range.min));
}

/** Tier name + badge styling for a given ELO value */
export function getEloMeta(elo: number) {
  for (const meta of Object.values(ELO_RANGES)) {
    if (elo >= meta.min && elo <= meta.max) return meta;
  }
  return ELO_RANGES['beginner'];
  //check if at 900 it returns beginner ( it shouldnt)
}

/**
 * Scoring: players within ±150 ELO are a great match.
 * Returns 0–50 points (mirrors the skill component in DiscoverPage).
 */
export function eloMatchScore(myElo: number, theirElo: number): number {
  const diff = Math.abs(myElo - theirElo);
  if (diff <= 50)  return 50;
  if (diff <= 150) return 40;
  if (diff <= 300) return 25;
  if (diff <= 500) return 10;
  return 0;
}
