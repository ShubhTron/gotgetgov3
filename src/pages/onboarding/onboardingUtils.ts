import { type ClubRole } from '@/types/database';

export type Step =
  | 'roles'
  | 'profile'
  | 'location_club'
  | 'coach_sports'
  | 'coach_lessons'
  | 'sports'
  | 'skill'
  | 'availability'
  | 'bio';

export function buildSteps(roles: ClubRole[]): Step[] {
  const steps: Step[] = ['roles', 'profile', 'location_club'];
  if (roles.includes('coach')) {
    steps.push('coach_sports', 'coach_lessons');
  }
  if (roles.includes('player')) {
    steps.push('sports');
  }
  if (roles.includes('player')) {
    steps.push('skill');
  }
  steps.push('availability', 'bio');
  return steps;
}

export function toggleRole(roles: ClubRole[], role: ClubRole): ClubRole[] {
  const has = roles.includes(role);
  if (has && roles.length === 1) return roles;
  return has ? roles.filter(r => r !== role) : [...roles, role];
}

export const STEP_TITLES: Record<Step, string> = {
  roles: 'What describes you the best?',
  profile: 'Set up your profile',
  location_club: 'Find your club',
  coach_sports: 'What sports do you coach?',
  coach_lessons: 'Your lesson packages',
  sports: 'What sports do you play?',
  skill: "What's your skill level?",
  availability: 'When can you play?',
  bio: 'Tell us about yourself',
};

export const STEP_DESCRIPTIONS: Record<Step, string> = {
  roles: 'Pick one or more — you can always change this later.',
  profile: 'This is how other players will see you.',
  location_club: 'Find and join your home club.',
  coach_sports: 'Select the sports you coach or teach.',
  coach_lessons: 'Set up your lesson packages and pricing.',
  sports: "Select all the sports you're interested in.",
  skill: 'This helps us match you with similar players.',
  availability: "Tap days you're typically available.",
  bio: 'A brief bio helps other players get to know you.',
};

export const STEP_LABELS: Record<Step, string> = {
  roles:         'ROLE SELECTION',
  profile:       'YOUR PROFILE',
  location_club: 'YOUR CLUB',
  sports:        'SPORTS',
  skill:         'SKILL LEVEL',
  availability:  'AVAILABILITY',
  bio:           'ABOUT YOU',
  coach_sports:  'COACHING',
  coach_lessons: 'LESSON PACKAGES',
};

export function getSportsStepTitle(roles: ClubRole[]): string {
  const isPlayer = roles.includes('player');
  const isCoach = roles.includes('coach');
  if (isPlayer && isCoach) return 'What sports do you play or coach?';
  if (isCoach) return 'What sports do you coach?';
  return 'What sports do you play?';
}

export function getSportsStepDesc(roles: ClubRole[]): string {
  const isPlayer = roles.includes('player');
  const isCoach = roles.includes('coach');
  if (isPlayer && isCoach) return "Select all the sports you're interested in playing or coaching.";
  if (isCoach) return "Select all the sports you coach or teach.";
  return "Select all the sports you're interested in.";
}
