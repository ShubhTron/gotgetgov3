import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, ChevronDown, ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TimeRangePicker, type TimeRange } from '@/components/ui/TimeRangePicker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { type ClubRole } from '@/types/database';
import {
  type Step,
  buildSteps,
  toggleRole,
  STEP_TITLES,
  STEP_DESCRIPTIONS,
  STEP_LABELS,
  getSportsStepTitle,
  getSportsStepDesc,
} from './onboardingUtils';
import { useClubSearch, type SelectedClub } from '@/hooks/useClubSearch';

type SelectedClubWithRole = SelectedClub & { membershipRole?: ClubRole };

const SPORT_IMAGES: Record<string, string> = {
  platform_tennis: 'https://images.pexels.com/photos/5067821/pexels-photo-5067821.jpeg?auto=compress&cs=tinysrgb&w=400',
  padel: 'https://images.pexels.com/photos/8224718/pexels-photo-8224718.jpeg?auto=compress&cs=tinysrgb&w=400',
  tennis: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400',
  squash: 'https://images.pexels.com/photos/7648097/pexels-photo-7648097.jpeg?auto=compress&cs=tinysrgb&w=400',
  pickleball: 'https://images.pexels.com/photos/8224681/pexels-photo-8224681.jpeg?auto=compress&cs=tinysrgb&w=400',
  beach_tennis: 'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=400',
};

interface AvailabilityEntry {
  day: number;
  ranges: TimeRange[];
}

interface LessonPackage {
  id: string;           // client-side uuid for list key
  name: string;
  durationMinutes: number;
  price: number | null;
  currency: string;
  isPackage: boolean;
  packageCount: number | null;
}

const DEFAULT_LESSONS: LessonPackage[] = [
  { id: crypto.randomUUID(), name: 'Private (60 min)', durationMinutes: 60, price: null, currency: 'USD', isPackage: false, packageCount: null },
  { id: crypto.randomUUID(), name: 'Group (90 min)',   durationMinutes: 90, price: null, currency: 'USD', isPackage: false, packageCount: null },
];

interface OnboardingData {
  locationCity: string;
  locationLat: number | null;
  locationLng: number | null;
  locationDetected: boolean;
  selectedSports: SportType[];
  sportLevels: Record<SportType, number>;
  showRatings: Record<SportType, boolean>;
  externalRatings: Record<SportType, string>;
  fullName: string;
  avatarUrl: string;
  avatarFile?: File;
  selectedClubs: SelectedClubWithRole[];
  availability: AvailabilityEntry[];
  bio: string;

  // --- new fields ---
  selectedRoles: ClubRole[];
  coachSports: SportType[];
  coachClubs: SelectedClubWithRole[];
  coachSpecialties: Record<SportType, string[]>;
  coachLessons: LessonPackage[];
  coachProfileId: string | null;
}

const skillValueToString = (value: number): string => {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  return levels[Math.min(value, levels.length - 1)] || 'beginner';
};

const S = `
  :root{--text-muted:var(--color-t2);--text-dim:var(--color-t3)}
  .ob-root{background:var(--color-bg);font-family:var(--font-body);min-height:100vh;min-height:100dvh;position:relative;overflow:hidden}
  .ob-court-bg{position:fixed;inset:0;background:var(--color-bg);z-index:0}
  .ob-hero-gradient{position:fixed;inset:0;z-index:1;background:radial-gradient(ellipse 55% 22% at 50% 0%,rgba(22,212,106,0.07) 0%,transparent 100%)}
  .ob-grain{position:fixed;inset:0;pointer-events:none;z-index:2;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")}
  .ob-court-lines{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;height:52%;z-index:1;pointer-events:none}
  .ob-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:1;background:radial-gradient(circle,rgba(22,212,106,0.06) 0%,transparent 70%);filter:blur(56px)}
  .ob-content{position:relative;z-index:10;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;max-width:480px;margin:0 auto;padding:0 20px}
  .ob-header{display:flex;align-items:center;justify-content:space-between;padding:16px 0 0;gap:12px}
  .ob-back-btn{width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--color-surf);border:1px solid var(--color-bdr);color:var(--color-t1);cursor:pointer;transition:background 0.2s,transform 0.15s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  .ob-back-btn:hover{background:var(--color-surf-2)}.ob-back-btn:active{transform:scale(0.94)}.ob-back-btn:disabled{opacity:0.25;cursor:not-allowed}
  .ob-skip-btn{font-family:var(--font-body);font-weight:500;font-size:0.9rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-t2);background:none;border:none;cursor:pointer;padding:8px 4px;transition:color 0.2s}
  .ob-skip-btn:hover{color:var(--color-t1)}
  /* ── Progress — Kinetic bar style ── */
  .ob-progress-wrap{flex:1;display:flex;align-items:center;justify-content:center}
  .ob-app-name{font-family:'Georgia','Times New Roman',serif;font-weight:400;font-size:1.25rem;letter-spacing:0.01em;color:var(--color-t1);line-height:1;text-transform:none}
  .ob-app-name em{font-style:italic;color:var(--color-acc)}
  .ob-dots{display:none}
  .ob-dot{display:none}
  .ob-progress-band{display:flex;flex-direction:column;gap:6px;padding:20px 0 0}
  .ob-progress-meta{display:flex;align-items:center;justify-content:space-between}
  .ob-step-counter{font-family:var(--font-body);font-size:0.62rem;font-weight:700;letter-spacing:0.14em;color:var(--color-t3);text-transform:uppercase}
  .ob-step-label{font-family:var(--font-body);font-size:0.62rem;font-weight:700;letter-spacing:0.14em;color:var(--color-acc);text-transform:uppercase}
  .ob-progress-bar-track{width:100%;height:2px;border-radius:var(--radius-full);background:var(--color-bdr);overflow:hidden}
  .ob-progress-bar-fill{height:100%;border-radius:var(--radius-full);background:var(--color-acc);box-shadow:0 0 6px rgba(22,212,106,0.4);transition:width 0.45s cubic-bezier(0.22,1,0.36,1)}
  .ob-divider{display:none}
  .ob-step-title{font-family:'Georgia','Times New Roman',serif;font-weight:400;font-size:clamp(1.75rem,8vw,2.4rem);color:var(--color-t1);line-height:1.15;letter-spacing:-0.3px;margin:24px 0 12px;text-transform:none}
  .ob-step-title span{color:var(--color-acc);font-style:italic}
  .ob-step-desc{font-family:var(--font-body);font-weight:400;font-size:0.875rem;color:var(--color-t3);margin-bottom:20px;letter-spacing:0.01em}
  .ob-card{background:transparent;border:none;border-radius:0;padding:0}
  .ob-input{width:100%;padding:14px 16px;background:var(--color-surf);border:1px solid var(--color-bdr);border-radius:12px;color:var(--color-t1);font-family:var(--font-body);font-size:0.95rem;font-weight:500;outline:none;transition:border-color 0.2s,background 0.2s;box-sizing:border-box;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  .ob-input::placeholder{color:var(--color-t3)}.ob-input:focus{border-color:var(--color-acc);background:var(--color-acc-bg)}
  .ob-textarea{width:100%;padding:14px 16px;background:var(--color-surf);border:1px solid var(--color-bdr);border-radius:12px;color:var(--color-t1);font-family:var(--font-body);font-size:0.95rem;font-weight:500;outline:none;resize:none;transition:border-color 0.2s,background 0.2s;box-sizing:border-box;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  .ob-textarea::placeholder{color:var(--color-t3)}.ob-textarea:focus{border-color:var(--color-acc);background:var(--color-acc-bg)}
  .ob-label{font-family:var(--font-body);font-size:0.7rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-t3);margin-bottom:8px;display:block}
  .ob-sport-card{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:1/1;cursor:pointer;border:2px solid var(--color-bdr-s);transition:border-color 0.2s,transform 0.15s}
  .ob-sport-card.selected{border-color:var(--color-acc)}.ob-sport-card:hover{transform:scale(1.02)}.ob-sport-card:active{transform:scale(0.97)}
  .ob-skill-btn{padding:10px 8px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.04em;border:1px solid var(--color-bdr);background:var(--color-surf);color:var(--color-t2);cursor:pointer;transition:all 0.15s;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  .ob-skill-btn.active{background:var(--color-acc);border-color:var(--color-acc);color:var(--color-bg);box-shadow:0 2px 12px rgba(22,212,106,0.4)}
  .ob-skill-btn:hover:not(.active){background:var(--color-surf-2);color:var(--color-t1)}

  /* ── Skill slider — comprehensive fix ── */
  .ob-skill-slider-wrap{padding:0 0 8px}
  .ob-skill-display{display:none}
  .ob-skill-level-name{display:none}
  .ob-skill-level-desc{display:none}

  /* ── Jersey Card ── */
  .ob-sport-section{
    margin-bottom:16px;
    position:relative;
    background:#08111e;
    border:1px solid rgba(255,255,255,0.07);
    border-radius:22px;
    padding:18px 18px 16px;
    overflow:hidden;
    box-shadow:0 8px 36px rgba(0,0,0,0.35),0 1px 0 rgba(255,255,255,0.05) inset;
    transition:transform 0.2s,box-shadow 0.2s;
    min-height:168px;
  }
  .ob-sport-section:active{transform:scale(0.995)}
  .ob-sport-section-bg{
    position:absolute;inset:0;
    background-size:cover;background-position:center;
    transform:scale(1.06);
    z-index:0;
  }
  .ob-sport-section-overlay{
    position:absolute;inset:0;z-index:1;
    background:linear-gradient(150deg,rgba(4,10,22,0.87) 0%,rgba(4,10,22,0.6) 55%,rgba(4,10,22,0.82) 100%);
  }
  .ob-sport-section-content{position:relative;z-index:2}

  /* sport header row */
  .ob-sport-section-name{
    font-family:var(--font-body);font-weight:700;
    font-size:0.6rem;text-transform:uppercase;letter-spacing:0.2em;
    color:rgba(255,255,255,0.45);margin-bottom:10px;
    display:flex;align-items:center;justify-content:space-between;
  }

  /* level display — refined, minimal */
  .ob-skill-inline{
    display:flex;flex-direction:column;gap:4px;
    margin-bottom:14px;
  }
  .ob-skill-inline-name{
    font-family:var(--font-body);font-weight:600;
    font-size:1.35rem;letter-spacing:0.01em;text-transform:none;
    color:#fff;line-height:1.2;
    transition:color 0.15s;
  }
  .ob-skill-inline-desc{
    font-family:var(--font-body);font-size:0.75rem;font-weight:400;
    color:rgba(255,255,255,0.45);line-height:1.4;font-style:normal;
    transition:color 0.15s;
  }

  /* ── Level chips — 44px touch targets ── */
  .ob-level-chips{
    display:grid;grid-template-columns:repeat(4,1fr);
    gap:6px;
  }
  .ob-level-chip{
    height:40px;border-radius:10px;
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.05);
    font-family:var(--font-body);font-weight:500;
    font-size:0.7rem;text-transform:none;letter-spacing:0.01em;
    color:rgba(255,255,255,0.4);
    cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.18s cubic-bezier(0.22,1,0.36,1);
    user-select:none;
  }
  .ob-level-chip:hover:not(.active){
    background:rgba(255,255,255,0.1);
    color:rgba(255,255,255,0.75);
    border-color:rgba(255,255,255,0.22);
  }
  .ob-level-chip:active{transform:scale(0.95)}
  .ob-level-chip.active{
    background:rgba(22,212,106,0.12);
    border-color:rgba(22,212,106,0.6);
    color:var(--color-acc);font-weight:600;
  }

  /* PTI rating toggle — compact inline link style */
  .ob-rating-toggle{
    display:inline-flex;align-items:center;gap:5px;
    margin-top:10px;
    padding:7px 12px 7px 10px;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:10px;
    font-family:var(--font-body);font-size:0.68rem;font-weight:600;
    letter-spacing:0.05em;text-transform:uppercase;
    color:rgba(255,255,255,0.4);
    cursor:pointer;transition:color 0.2s,background 0.2s,border-color 0.2s;
    min-height:36px;
  }
  .ob-rating-toggle:hover{color:var(--color-acc);background:rgba(22,212,106,0.1);border-color:rgba(22,212,106,0.3)}

  /* legacy hidden */
  .ob-skill-card,.ob-skill-card-num,.ob-skill-card-check,
  .ob-skill-card-strip,.ob-skill-card-icon,.ob-skill-card-body,
  .ob-skill-card-rank{display:none}
  .ob-day-btn{aspect-ratio:1/1;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.04em;border:1px solid var(--color-bdr);background:var(--color-surf);color:var(--color-t2);cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  .ob-day-btn.active{background:var(--color-acc);border-color:var(--color-acc);color:var(--color-bg);box-shadow:0 2px 10px rgba(22,212,106,0.35);backdrop-filter:none}
  .ob-cta{width:100%;height:48px;border-radius:14px;cursor:pointer;background:var(--color-acc);color:var(--color-bg);font-family:var(--font-display);font-weight:800;font-size:1rem;letter-spacing:0.12em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;border:none;transition:box-shadow 0.25s,transform 0.15s,opacity 0.3s,filter 0.3s,background 0.2s;box-shadow:0 4px 20px rgba(22,212,106,0.4),0 1px 0 rgba(255,255,255,0.1) inset;position:relative;overflow:hidden}
  .ob-cta::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 50%);pointer-events:none}
  .ob-cta:hover:not(:disabled){box-shadow:0 6px 28px rgba(22,212,106,0.55),0 1px 0 rgba(255,255,255,0.1) inset;transform:translateY(-1px)}
  .ob-cta:active:not(:disabled){transform:scale(0.97);box-shadow:0 2px 10px rgba(22,212,106,0.3)}
  .ob-cta.pressed{background:transparent;border:2px solid var(--color-acc);color:var(--color-acc);box-shadow:none;animation:ob-pulse 0.45s ease forwards}
  .ob-cta:disabled{opacity:0.35;cursor:not-allowed;transform:none;box-shadow:none;filter:saturate(0.4)}
  @keyframes ob-pulse{0%{box-shadow:0 0 0 0 rgba(22,212,106,0.5)}60%{box-shadow:0 0 0 10px rgba(22,212,106,0)}100%{box-shadow:0 0 0 0 rgba(22,212,106,0)}}
  .ob-cta-sticky{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;align-items:flex-end;z-index:20;pointer-events:none;padding:32px 20px 36px;background:linear-gradient(0deg,var(--color-bg) 60%,transparent 100%)}
  .ob-cta-sticky .ob-cta{pointer-events:auto;width:100%;max-width:440px}
  .ob-sport-section{margin-bottom:28px}
  .ob-modal-overlay{position:fixed;inset:0;z-index:100;background:rgba(4,10,28,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}
  .ob-modal{background:var(--color-surf);border:1px solid var(--color-bdr);border-top:1px solid var(--color-acc);border-radius:20px;padding:28px 24px 24px;max-width:340px;width:100%;box-shadow:0 0 0 1px rgba(22,212,106,0.15),0 20px 60px rgba(0,0,0,0.15),0 0 80px rgba(22,212,106,0.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .ob-modal-icon-wrap{width:52px;height:52px;border-radius:14px;background:var(--color-acc-bg);border:1px solid var(--color-bdr);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 0 28px rgba(22,212,106,0.2),inset 0 1px 0 rgba(22,212,106,0.2)}
  .ob-modal-title{font-family:var(--font-display);font-weight:900;font-size:clamp(1.6rem,7vw,2rem);text-transform:uppercase;color:var(--color-t1);margin-bottom:8px;text-align:center;letter-spacing:-0.5px;line-height:1.1}
  .ob-modal-desc{font-family:var(--font-body);font-size:0.875rem;font-weight:400;color:var(--color-t2);margin-bottom:24px;line-height:1.6;text-align:center}
  .ob-modal-btns{display:flex;gap:8px}
  .ob-modal-btn-secondary{flex:1;height:50px;border-radius:12px;background:var(--color-acc);border:none;color:var(--color-bg);font-family:var(--font-display);font-weight:800;font-size:1rem;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;transition:background 0.18s;box-shadow:0 4px 16px rgba(22,212,106,0.4)}
  .ob-modal-btn-secondary:hover{opacity:0.9}
  .ob-modal-btn-primary{flex:1;height:50px;border-radius:12px;background:var(--color-surf);border:1px solid var(--color-bdr);color:var(--color-t2);font-family:var(--font-display);font-weight:700;font-size:1rem;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;transition:background 0.18s,color 0.18s}
  .ob-modal-btn-primary:hover{background:var(--color-surf-2);color:var(--color-t1)}
  .ob-success-check{width:72px;height:72px;border-radius:50%;background:var(--color-acc-bg);border:2px solid var(--color-acc);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 0 32px rgba(22,212,106,0.3)}
  .ob-spinner{width:20px;height:20px;border-radius:50%;border:2px solid var(--color-bdr);border-top-color:var(--color-t1);animation:ob-spin 0.7s linear infinite}
  @keyframes ob-spin{to{transform:rotate(360deg)}}
  /* ── Role rows ── */
  .ob-role-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;border:1px solid var(--color-bdr);background:var(--color-surf);cursor:pointer;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s;position:relative;user-select:none;box-sizing:border-box;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
  .ob-role-row:hover:not(.disabled){border-color:rgba(22,212,106,0.55);background:rgba(22,212,106,0.03);box-shadow:0 2px 8px rgba(22,212,106,0.08)}
  .ob-role-row:active:not(.disabled){transform:scale(0.98)}
  .ob-role-row.selected{border:1.5px solid rgba(22,212,106,0.85);background:rgba(22,212,106,0.05);box-shadow:0 2px 12px rgba(22,212,106,0.14),0 0 0 1px rgba(22,212,106,0.08)}
  .ob-role-row.disabled{opacity:0.45;cursor:not-allowed;pointer-events:none}
  .ob-role-row-icon{width:44px;height:44px;border-radius:12px;flex-shrink:0;background:rgba(0,0,0,0.04);border:1px solid var(--color-bdr);display:flex;align-items:center;justify-content:center;color:var(--color-t2);transition:background 0.15s,border-color 0.15s,color 0.15s}
  .ob-role-row.selected .ob-role-row-icon{background:rgba(22,212,106,0.1);border-color:rgba(22,212,106,0.2);color:rgba(22,212,106,0.9)}
  .ob-role-row-body{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
  .ob-role-row-title{font-family:'Georgia','Times New Roman',serif;font-weight:400;font-size:0.975rem;letter-spacing:0.01em;color:var(--color-t1);line-height:1.2}
  .ob-role-row-desc{font-family:var(--font-body);font-size:0.72rem;font-weight:400;color:var(--color-t3);line-height:1.3}
  .ob-role-row.selected .ob-role-row-desc{color:var(--color-t2)}
  .ob-role-row-lock{flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--color-t3)}
  .ob-coming-soon-badge{font-family:var(--font-body);font-size:0.58rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:var(--color-t3);border-radius:var(--radius-full);padding:3px 8px;color:var(--color-bg);white-space:nowrap;flex-shrink:0;opacity:0.7}
  /* particle burst */
  .ob-particle{position:absolute;border-radius:50%;pointer-events:none;animation:ob-particle-out 0.6s ease-out forwards}
  @keyframes ob-particle-out{0%{transform:translate(-50%,-50%) scale(1);opacity:0.9}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0);opacity:0}}
  .ob-club-result{padding:12px 14px;border-radius:10px;font-family:var(--font-body);font-size:0.9rem;font-weight:500;color:var(--color-t1);background:var(--color-surf);border:1px solid var(--color-bdr);cursor:pointer;transition:background 0.15s;text-align:left;width:100%}
  .ob-club-result:hover{background:var(--color-surf-2)}
  .ob-club-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:var(--color-acc-bg);border:1px solid var(--color-bdr);font-family:var(--font-body);font-size:0.82rem;font-weight:500;color:var(--color-t1)}
  .ob-lesson-row{display:flex;flex-direction:column;gap:8px;padding:14px;background:var(--color-surf);border:1px solid var(--color-bdr);border-radius:12px}
  .ob-specialty-group{display:flex;flex-direction:column;gap:10px}
  .ob-specialty-group-label{font-family:var(--font-display);font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-t2);margin:0}
`;

interface StepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

function useGoogleMaps(): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!key) return;

    const src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;

    // Avoid appending if script already exists
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }

    // Poll until window.google?.maps is available
    const interval = setInterval(() => {
      if ((window as Window & typeof globalThis & { google?: { maps?: unknown } }).google?.maps) {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { ready };
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [direction, setDirection] = useState(1);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    locationCity: '',
    locationLat: null,
    locationLng: null,
    locationDetected: false,
    selectedSports: [],
    sportLevels: {} as Record<SportType, number>,
    showRatings: {} as Record<SportType, boolean>,
    externalRatings: {} as Record<SportType, string>,
    fullName: user?.user_metadata?.full_name || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
    selectedClubs: [],
    availability: [
      { day: 1, ranges: [{ start: '18:00', end: '21:00' }] },
      { day: 2, ranges: [{ start: '18:00', end: '21:00' }] },
      { day: 3, ranges: [{ start: '18:00', end: '21:00' }] },
      { day: 4, ranges: [{ start: '18:00', end: '21:00' }] },
      { day: 5, ranges: [{ start: '18:00', end: '21:00' }] },
    ],
    bio: '',
    selectedRoles: ['player'],
    coachSports: [],
    coachClubs: [],
    coachSpecialties: {} as Record<SportType, string[]>,
    coachLessons: [],
    coachProfileId: null,
  });

  const steps = useMemo(() => buildSteps(data.selectedRoles), [data.selectedRoles]);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (data.locationCity) return;
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        if (d.city) setData(prev => ({ ...prev, locationCity: `${d.city}${d.region ? ', ' + d.region : ''}`, locationLat: d.latitude ?? null, locationLng: d.longitude ?? null }));
      })
      .catch(() => {});
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      setBtnPressed(true);
      setTimeout(() => { setBtnPressed(false); handleComplete(); }, 420);
    } else {
      setBtnPressed(true);
      setTimeout(() => { setBtnPressed(false); setDirection(1); setCurrentStep(p => p + 1); }, 420);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) { setDirection(-1); setCurrentStep(p => p - 1); }
  };

  const handleSkip = () => {
    if (step === 'roles') {
      setData(prev => ({ ...prev, selectedRoles: ['player'] }));
      setDirection(1);
      setCurrentStep(p => p + 1);
    } else if (step === 'skill') {
      setShowSkipConfirm(true);
    } else if (isLastStep) {
      handleComplete();
    } else {
      setDirection(1);
      setCurrentStep(p => p + 1);
    }
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    setDirection(1);
    setCurrentStep(p => p + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      let avatarUrl = data.avatarUrl;
      if (data.avatarFile) {
        const fileExt = data.avatarFile.name.split('.').pop();
        const fileName = `${user!.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, data.avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }
      await updateProfile({ full_name: data.fullName, avatar_url: avatarUrl || null, location_city: data.locationCity || null, location_country: null, location_lat: data.locationLat, location_lng: data.locationLng, bio: data.bio, onboarding_completed: true });
      for (const sport of data.selectedSports) {
        await (supabase.from('user_sport_profiles') as any).upsert({ user_id: user!.id, sport, self_assessed_level: skillValueToString(data.sportLevels[sport] ?? 1) });
      }
      for (const entry of data.availability) {
        for (const range of entry.ranges) {
          await supabase.from('availability').insert({ user_id: user!.id, day_of_week: entry.day, start_time: range.start, end_time: range.end });
        }
      }
      for (const club of data.selectedClubs) {
        await supabase.from('user_clubs').upsert({
          user_id: user!.id,
          club_id: club.id,
          is_home_club: data.selectedClubs.indexOf(club) === 0,
          role: club.membershipRole ?? 'player',
        });
      }
      const refUserId = localStorage.getItem('gotgetgo_ref');
      if (refUserId && refUserId !== user!.id) {
        await supabase.from('connections').upsert([{ user_id: user!.id, connected_user_id: refUserId, status: 'connected' }, { user_id: refUserId, connected_user_id: user!.id, status: 'connected' }]);
        localStorage.removeItem('gotgetgo_ref');
      }
      // Persist user roles
      try {
        await (supabase as any).from('user_roles').upsert({ user_id: user!.id, role: 'player' });
        for (const role of data.selectedRoles.filter(r => r !== 'player')) {
          await (supabase as any).from('user_roles').upsert({ user_id: user!.id, role });
        }
      } catch (err) {
        console.error('Role persistence error:', err);
      }
      // Persist coach data if coach role selected
      if (data.selectedRoles.includes('coach') && data.coachProfileId) {
        try {
          await (supabase as any).from('coach_profiles').update({ is_active: true }).eq('id', data.coachProfileId);
          for (const sport of data.coachSports) {
            await (supabase as any).from('coach_sports').upsert({
              coach_profile_id: data.coachProfileId,
              sport,
              specialties: data.coachSpecialties[sport] ?? [],
            });
          }
          for (const lesson of data.coachLessons) {
            await (supabase as any).from('coach_lessons').insert({
              coach_profile_id: data.coachProfileId,
              name: lesson.name,
              duration_minutes: lesson.durationMinutes,
              price: lesson.price,
              currency: lesson.currency,
              is_package: lesson.isPackage,
              package_count: lesson.packageCount,
            });
          }
          for (const club of data.coachClubs) {
            await (supabase as any).from('user_clubs').upsert({ user_id: user!.id, club_id: club.id, role: 'coach' });
          }
        } catch (err) {
          console.error('Coach data persistence error:', err);
        }
      }
      // Create broadcast channels for club admin
      if (data.selectedRoles.includes('club_admin')) {
        for (const club of data.selectedClubs) {
          try {
            const { data: existing } = await (supabase as any)
              .from('broadcast_channels')
              .select('id')
              .eq('club_id', club.id)
              .maybeSingle();
            if (!existing) {
              await (supabase as any).from('broadcast_channels').insert({
                club_id: club.id,
                created_by: user!.id,
                name: 'Announcements',
              });
            }
          } catch (err) {
            console.error('Broadcast channel error:', err);
          }
        }
      }
      setShowSuccess(true);
      setTimeout(() => navigate('/discover'), 3000);
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  };

  const stepTitle = step === 'sports' ? getSportsStepTitle(data.selectedRoles) : STEP_TITLES[step];
  const stepDesc = step === 'sports' ? getSportsStepDesc(data.selectedRoles) : STEP_DESCRIPTIONS[step];
  const titleWords = stepTitle.split(' ');
  const titleAccent = titleWords.pop();
  const titleMain = titleWords.join(' ');

  return (
    <>
      <style>{S}</style>
      <div className="ob-root">
        <div className="ob-court-bg" />
        <div className="ob-hero-gradient" />
        <div className="ob-grain" />
        <div className="ob-orb" style={{ width: 360, height: 360, top: -100, right: -80 }} />
        <div className="ob-orb" style={{ width: 260, height: 260, bottom: 80, left: -60, opacity: 0.55 }} />
        <div className="ob-content">
          <div className="ob-header">
            <button className="ob-back-btn" onClick={handleBack} disabled={isFirstStep} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="ob-progress-wrap" />
            <button className="ob-skip-btn" onClick={handleSkip}>Skip</button>
          </div>

          <div className="ob-progress-band">
            <div className="ob-progress-bar-track">
              <div
                className="ob-progress-bar-fill"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="ob-step-title">{titleMain} <span>{titleAccent}</span></h1>
                <p className="ob-step-desc">{stepDesc}</p>
                <div className="ob-card">
                  {step === 'roles' && <RolesStep data={data} setData={setData} />}
                  {step === 'location_club' && <LocationClubStep data={data} setData={setData} user={user} />}
                  {step === 'coach_sports' && <CoachSportsStep data={data} setData={setData} user={user} />}
                  {step === 'coach_lessons' && <CoachLessonsStep data={data} setData={setData} />}
                  {step === 'sports' && <SportsStep data={data} setData={setData} />}
                  {step === 'skill' && <SkillStep data={data} setData={setData} />}
                  {step === 'profile' && <ProfileStep data={data} setData={setData} onImagePickerChange={setImagePickerOpen} />}
                  {step === 'availability' && <AvailabilityStep data={data} setData={setData} />}
                  {step === 'bio' && <BioStep data={data} setData={setData} />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Sticky CTA — outside ob-content so fixed positioning works correctly */}
      <AnimatePresence>
        {(step !== 'sports' || data.selectedSports.length > 0) && !imagePickerOpen && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="ob-cta-sticky"
          >
            <button className={`ob-cta${btnPressed ? ' pressed' : ''}`} onClick={handleNext} disabled={
              loading ||
              (step === 'roles' && data.selectedRoles.length === 0) ||
              (step === 'coach_sports' && data.coachSports.length === 0)
            }>
              {loading ? <div className="ob-spinner" /> : <span>{isLastStep ? 'Complete Setup' : 'Continue'}</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSkipConfirm && <SkipConfirmModal onConfirm={confirmSkip} onCancel={() => setShowSkipConfirm(false)} />}
        {showSuccess && <SuccessModal />}
      </AnimatePresence>
    </>
  );
}

function SkipConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="ob-modal-overlay" onClick={onCancel}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }} className="ob-modal" onClick={e => e.stopPropagation()}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }} className="ob-modal-icon-wrap">
          <AlertCircle size={22} color="var(--color-acc)" strokeWidth={2.2} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.22 }}>
          <p className="ob-modal-title">Skip Skill Level?</p>
          <p className="ob-modal-desc">This helps us match you with similar players. Are you sure you want to skip?</p>
        </motion.div>
        <div className="ob-modal-btns">
          <button className="ob-modal-btn-primary" onClick={onConfirm}>Skip Anyway</button>
          <button className="ob-modal-btn-secondary" onClick={onCancel}>Go Back</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SuccessModal() {
  // Staggered particle dots for visual energy
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360,
    delay: i * 0.04,
    dist: 60 + Math.random() * 40,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 38% at 50% 0%, rgba(22,212,106,0.08) 0%, transparent 60%)', zIndex: 1 }} />

      {/* All content above background */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {/* Animated ring + check */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        {/* Outer pulse ring */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.5] }}
          transition={{ delay: 0.3, duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -24,
            borderRadius: '50%',
            border: '1px solid rgba(22,212,106,0.4)',
          }}
        />
        {/* Middle ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'absolute', inset: -12,
            borderRadius: '50%',
            border: '1px solid rgba(22,212,106,0.25)',
          }}
        />
        {/* Check circle — outlined style matching reference */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'transparent',
            border: '2.5px solid var(--color-acc)',
            boxShadow: '0 0 40px rgba(22,212,106,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Check size={38} color="var(--color-acc)" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Burst particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
              y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
            }}
            transition={{ delay: 0.45 + p.delay, duration: 0.7, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: i % 3 === 0 ? 6 : 4,
              height: i % 3 === 0 ? 6 : 4,
              borderRadius: '50%',
              background: i % 2 === 0 ? 'var(--color-acc)' : '#fff',
              marginTop: -3, marginLeft: -3,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', padding: '0 32px' }}
      >
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(2.4rem, 11vw, 3.2rem)',
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          lineHeight: 1.05,
          color: 'var(--color-t1)',
          margin: '0 0 6px',
        }}>
          You're <span style={{ color: 'var(--color-acc)' }}>in.</span>
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: '1rem',
          color: 'var(--color-t2)',
          margin: '0 0 40px',
          lineHeight: 1.5,
        }}>
          Your profile is live. Time to find your next match.
        </p>

        {/* Loading bar */}
        <div style={{ width: 160, height: 2, background: 'var(--color-bdr)', borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.7, duration: 1.8, ease: 'linear' }}
            style={{ height: '100%', background: `linear-gradient(90deg, var(--color-acc), var(--color-acc))`, borderRadius: 2 }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-t3)', marginTop: 12 }}
        >
          Taking you to discover
        </motion.p>
      </motion.div>
      </div>
    </motion.div>
  );
}

function SportsStep({ data, setData }: StepProps) {
  const toggleSport = (sport: SportType) => {
    setData(prev => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sport) ? prev.selectedSports.filter(s => s !== sport) : [...prev.selectedSports, sport],
    }));
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {Object.entries(SPORTS).map(([key, sport]) => {
        const isSelected = data.selectedSports.includes(key as SportType);
        const imageUrl = SPORT_IMAGES[key];
        return (
          <motion.button key={key} onClick={() => toggleSport(key as SportType)} whileTap={{ scale: 0.96 }} className={`ob-sport-card${isSelected ? ' selected' : ''}`} style={{ background: 'none', padding: 0 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'rgba(22,212,106,0.35)' : 'rgba(0,0,0,0.55)', transition: 'background 0.2s' }} />
            </div>
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--color-acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} color="var(--color-bg)" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#fff', textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {sport.name}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// Consistent green accent for all sport cards — elevated surface, brand-aligned
const SPORT_ACCENT = { bg: 'linear-gradient(180deg, rgba(22,212,106,0.1) 0%, rgba(10,30,20,0.06) 100%)', border: 'var(--color-bdr)', icon: 'var(--color-acc)' };

// Inline SVG sport icons — proper racquet shapes, tilted 45°, clearly distinct per sport
const SportIcon = ({ sport, color }: { sport: string; color: string }) => {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (sport) {
    case 'platform_tennis':
    case 'tennis':
    case 'beach_tennis':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <ellipse cx="9" cy="9" rx="6" ry="7" transform="rotate(-45 9 9)" {...s}/>
          <line x1="5" y1="9" x2="13" y2="9" {...s} strokeOpacity="0.6"/>
          <line x1="9" y1="5" x2="9" y2="13" {...s} strokeOpacity="0.6"/>
          <line x1="13.5" y1="13.5" x2="20" y2="20" {...s} strokeWidth={2.2}/>
        </svg>
      );
    case 'padel':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="10" height="12" rx="2" transform="rotate(-40 9 9)" {...s}/>
          <circle cx="8" cy="8" r="1" fill={color} stroke="none"/>
          <circle cx="11" cy="11" r="1" fill={color} stroke="none"/>
          <line x1="15" y1="15" x2="20" y2="20" {...s} strokeWidth={2.2}/>
        </svg>
      );
    case 'squash':
    case 'racquetball':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <ellipse cx="9" cy="8" rx="5" ry="6.5" transform="rotate(-35 9 8)" {...s}/>
          <line x1="6" y1="8" x2="12" y2="8" {...s} strokeOpacity="0.5"/>
          <line x1="9" y1="5" x2="9" y2="11" {...s} strokeOpacity="0.5"/>
          <line x1="13" y1="13" x2="20" y2="20" {...s} strokeWidth={2.2}/>
        </svg>
      );
    case 'pickleball':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <ellipse cx="9" cy="8" rx="6" ry="5" transform="rotate(-40 9 8)" {...s}/>
          <circle cx="7" cy="7" r="1" fill={color} stroke="none"/>
          <circle cx="10" cy="9" r="1" fill={color} stroke="none"/>
          <circle cx="11" cy="6" r="1" fill={color} stroke="none"/>
          <line x1="13" y1="13" x2="20" y2="20" {...s} strokeWidth={2.2}/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <ellipse cx="9" cy="9" rx="6" ry="7" transform="rotate(-45 9 9)" {...s}/>
          <line x1="5" y1="9" x2="13" y2="9" {...s} strokeOpacity="0.6"/>
          <line x1="9" y1="5" x2="9" y2="13" {...s} strokeOpacity="0.6"/>
          <line x1="13.5" y1="13.5" x2="20" y2="20" {...s} strokeWidth={2.2}/>
        </svg>
      );
  }
};


const CHIP_LABELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

function SkillStep({ data, setData }: StepProps) {
  const SKILL_META = [
    { label: 'Beginner',     desc: 'Just starting out, learning the basics' },
    { label: 'Intermediate', desc: 'Comfortable playing, improving consistency' },
    { label: 'Advanced',     desc: 'Competitive player, strong technique' },
    { label: 'Expert',       desc: 'Tournament-level, highly competitive' },
  ];

  if (data.selectedSports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div className="ob-icon-box" style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%' }}>
          <AlertCircle size={22} color="var(--color-acc)" strokeWidth={2.2} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--color-t2)' }}>Select at least one sport first.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.selectedSports.map((sport, i) => {
        const sportInfo = SPORTS[sport];
        const currentLevel = data.sportLevels[sport] ?? 1;

        return (
          <motion.div
            key={sport}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="ob-sport-section"
          >
            {/* Full sport photo background */}
            {SPORT_IMAGES[sport] && (
              <div
                className="ob-sport-section-bg"
                style={{ backgroundImage: `url(${SPORT_IMAGES[sport]})` }}
              />
            )}
            {/* Dark gradient overlay */}
            <div className="ob-sport-section-overlay" />

            <div className="ob-sport-section-content">
              {/* Sport name header */}
              <p className="ob-sport-section-name">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <SportIcon sport={sport} color="rgba(255,255,255,0.6)" />
                  </span>
                  {sportInfo?.name || sport}
                </span>
              </p>

              {/* Level display — big scoreboard name */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentLevel}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="ob-skill-inline"
                >
                  <span className="ob-skill-inline-name">{SKILL_META[currentLevel].label}</span>
                  <span className="ob-skill-inline-desc">{SKILL_META[currentLevel].desc}</span>
                </motion.div>
              </AnimatePresence>

              {/* Level chips — tap to select, 44px touch targets */}
              <div className="ob-level-chips" role="group" aria-label={`Skill level for ${sportInfo?.name || sport}`}>
                {SKILL_META.map((meta, idx) => (
                  <motion.button
                    key={idx}
                    className={`ob-level-chip${idx === currentLevel ? ' active' : ''}`}
                    onClick={() => setData(prev => ({ ...prev, sportLevels: { ...prev.sportLevels, [sport]: idx } }))}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.12 }}
                    aria-pressed={idx === currentLevel}
                  >
                    {CHIP_LABELS[idx]}
                  </motion.button>
                ))}
              </div>

              {/* PTI / official rating toggle */}
              {sportInfo?.officialRatingSystem && (
                <div>
                  <button
                    className="ob-rating-toggle"
                    onClick={() => setData(prev => ({ ...prev, showRatings: { ...prev.showRatings, [sport]: !prev.showRatings[sport] } }))}
                  >
                    <span>Have a {sportInfo?.officialRatingSystem} rating?</span>
                    <ChevronDown size={11} style={{ transform: data.showRatings[sport] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  <AnimatePresence>
                    {data.showRatings[sport] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: 10 }}>
                          <input
                            className="ob-input"
                            placeholder={`Enter your ${sportInfo?.officialRatingSystem} rating`}
                            value={data.externalRatings[sport] || ''}
                            onChange={e => setData(prev => ({ ...prev, externalRatings: { ...prev.externalRatings, [sport]: e.target.value } }))}
                            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


function ProfileStep({ data, setData, onImagePickerChange }: StepProps & { onImagePickerChange?: (open: boolean) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ImageUpload value={data.avatarUrl} name={data.fullName} onChange={(url, file) => setData(prev => ({ ...prev, avatarUrl: url || '', avatarFile: file }))} onOpenChange={onImagePickerChange} size="xl" />
      </div>
      <div>
        <label className="ob-label">Full Name</label>
        <input className="ob-input" placeholder="Enter your name" value={data.fullName} onChange={e => setData(prev => ({ ...prev, fullName: e.target.value }))} />
      </div>
    </div>
  );
}

function AvailabilityStep({ data, setData }: StepProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const toggleDay = (dayIndex: number) => {
    setData(prev => {
      const existing = prev.availability.find(a => a.day === dayIndex);
      if (existing) return { ...prev, availability: prev.availability.filter(a => a.day !== dayIndex) };
      return { ...prev, availability: [...prev.availability, { day: dayIndex, ranges: [{ start: '18:00', end: '21:00' }] }] };
    });
  };
  const selectedDays = [...data.availability].sort((a, b) => a.day - b.day);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((day, index) => {
          const isSelected = data.availability.some(a => a.day === index);
          return (
            <motion.button key={index} onClick={() => toggleDay(index)} whileTap={{ scale: 0.92 }} className={`ob-day-btn${isSelected ? ' active' : ''}`}>
              {day}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="popLayout">
        {selectedDays.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedDays.map(entry => (
              <motion.div key={entry.day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <TimeRangePicker dayLabel={fullDays[entry.day]} ranges={entry.ranges} onChange={ranges => setData(prev => ({ ...prev, availability: prev.availability.map(a => a.day === entry.day ? { ...a, ranges } : a) }))} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {selectedDays.length === 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-t3)', textAlign: 'center', padding: '12px 0' }}>
          Select the days you're typically available to play
        </p>
      )}
    </div>
  );
}

function spawnParticles(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const colors = ['rgba(22,212,106,0.9)', 'rgba(22,212,106,0.6)', 'rgba(255,255,255,0.7)', 'rgba(22,212,106,0.4)'];
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('span');
    p.className = 'ob-particle';
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 28 + Math.random() * 32;
    const size = 3 + Math.random() * 4;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};--dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;animation-delay:${Math.random() * 60}ms`;
    el.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function RolesStep({ data, setData }: StepProps) {
  const isPlayerSelected = data.selectedRoles.includes('player');
  const isCoachSelected = data.selectedRoles.includes('coach');
  const isClubAdminSelected = data.selectedRoles.includes('club_admin');

  const toggle = (role: ClubRole, e: React.MouseEvent<HTMLDivElement>) => {
    const wasSelected = data.selectedRoles.includes(role);
    if (!wasSelected) spawnParticles(e.currentTarget);
    setData(prev => ({ ...prev, selectedRoles: toggleRole(prev.selectedRoles, role) }));
  };

  const roles = [
    {
      key: 'player' as ClubRole,
      selected: isPlayerSelected,
      title: 'Player',
      desc: 'Find matches & connect',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c1.507 0 2.92.39 4.147 1.073A14.3 14.3 0 0 1 12.8 9.4a14.3 14.3 0 0 1-5.04-1.145A7.96 7.96 0 0 1 12 4zm-6.93 4.516A16.3 16.3 0 0 0 10.8 9.93a16.3 16.3 0 0 0-.93 5.07H4.05A7.97 7.97 0 0 1 5.07 8.516zm0 6.968A7.97 7.97 0 0 1 4.05 11h5.82a16.3 16.3 0 0 0 .93 5.07 16.3 16.3 0 0 0-5.73 1.414zM12 20a7.96 7.96 0 0 1-4.147-1.073A14.3 14.3 0 0 1 11.2 14.6a14.3 14.3 0 0 1 5.04 1.145A7.96 7.96 0 0 1 12 20zm6.93-4.516A16.3 16.3 0 0 0 13.2 14.07a16.3 16.3 0 0 0 .93-5.07h5.82a7.97 7.97 0 0 1-1.02 6.484zm1.02-8.484H14.13a16.3 16.3 0 0 0-.93-5.07 16.3 16.3 0 0 0 5.73-1.414A7.97 7.97 0 0 1 19.95 7z"/>
        </svg>
      ),
    },
    {
      key: 'coach' as ClubRole,
      selected: isCoachSelected,
      title: 'Coach',
      desc: 'Teach & build your roster',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
    },
    {
      key: 'club_admin' as ClubRole,
      selected: isClubAdminSelected,
      title: 'Club Admin',
      desc: 'Manage your club',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {roles.map(({ key, selected, title, desc, icon }) => (
        <motion.div
          key={key}
          className={`ob-role-row${selected ? ' selected' : ''}`}
          onClick={e => toggle(key, e)}
          animate={selected ? { scale: [1, 0.97, 1.01, 1] } : { scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="ob-role-row-icon"
            animate={selected ? { rotate: [0, -8, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {icon}
          </motion.div>
          <div className="ob-role-row-body">
            <span className="ob-role-row-title">{title}</span>
            <span className="ob-role-row-desc">{desc}</span>
          </div>
        </motion.div>
      ))}

      {/* Organizer — disabled */}
      <div className="ob-role-row disabled">
        <div className="ob-role-row-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
          </svg>
        </div>
        <div className="ob-role-row-body">
          <span className="ob-role-row-title">Organizer</span>
          <span className="ob-role-row-desc">Run tournaments</span>
        </div>
        <span className="ob-coming-soon-badge">Coming Soon</span>
      </div>
    </div>
  );
}

interface CoachStepProps extends StepProps {
  user: { id: string } | null;
}

function CoachSportsStep({ data, setData, user }: CoachStepProps) {
  useEffect(() => {
    async function ensureCoachProfile() {
      if (data.coachProfileId || !user) return;
      try {
        const { data: cp } = await (supabase as any)
          .from('coach_profiles')
          .insert({ user_id: user.id, is_active: false })
          .select('id')
          .single();
        if (cp) setData(prev => ({ ...prev, coachProfileId: cp.id }));
      } catch (err) {
        console.error('ensureCoachProfile error:', err);
      }
    }
    ensureCoachProfile();
  }, []);

  const toggleSport = (sport: SportType) => {
    setData(prev => ({
      ...prev,
      coachSports: prev.coachSports.includes(sport)
        ? prev.coachSports.filter(s => s !== sport)
        : [...prev.coachSports, sport],
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {Object.entries(SPORTS).map(([key, sport]) => {
        const isSelected = data.coachSports.includes(key as SportType);
        const imageUrl = SPORT_IMAGES[key];
        return (
          <motion.button
            key={key}
            onClick={() => toggleSport(key as SportType)}
            whileTap={{ scale: 0.96 }}
            className={`ob-sport-card${isSelected ? ' selected' : ''}`}
            style={{ background: 'none', padding: 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'rgba(22,212,106,0.35)' : 'rgba(0,0,0,0.55)', transition: 'background 0.2s' }} />
            </div>
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--color-acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Check size={12} color="var(--color-bg)" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#fff', textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {sport.name}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function CoachLessonsStep({ data, setData }: StepProps) {
  useEffect(() => {
    if (data.coachLessons.length === 0) {
      setData(prev => ({ ...prev, coachLessons: DEFAULT_LESSONS }));
    }
  }, []);

  const updateLesson = (id: string, field: keyof LessonPackage, value: string | number | boolean | null) => {
    setData(prev => ({
      ...prev,
      coachLessons: prev.coachLessons.map(l => l.id === id ? { ...l, [field]: value } : l),
    }));
  };

  const removeLesson = (id: string) => {
    setData(prev => ({ ...prev, coachLessons: prev.coachLessons.filter(l => l.id !== id) }));
  };

  const addLesson = () => {
    const newLesson: LessonPackage = {
      id: crypto.randomUUID(),
      name: '',
      durationMinutes: 60,
      price: null,
      currency: 'USD',
      isPackage: false,
      packageCount: null,
    };
    setData(prev => ({ ...prev, coachLessons: [...prev.coachLessons, newLesson] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.coachLessons.map(lesson => (
        <div key={lesson.id} className="ob-lesson-row" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 12, padding: '14px 14px 12px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="ob-input"
              placeholder="Lesson name"
              value={lesson.name}
              onChange={e => updateLesson(lesson.id, 'name', e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => removeLesson(lesson.id)}
              style={{ background: 'none', border: 'none', color: 'var(--color-t2)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
              aria-label="Remove lesson"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="ob-input"
              type="number"
              placeholder="Duration (min)"
              value={lesson.durationMinutes}
              onChange={e => updateLesson(lesson.id, 'durationMinutes', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              className="ob-input"
              type="number"
              placeholder="Price"
              value={lesson.price ?? ''}
              onChange={e => updateLesson(lesson.id, 'price', e.target.value === '' ? null : Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <select
              className="ob-input"
              value={lesson.currency}
              onChange={e => updateLesson(lesson.id, 'currency', e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`ob-skill-btn${lesson.isPackage ? ' active' : ''}`}
              onClick={() => updateLesson(lesson.id, 'isPackage', !lesson.isPackage)}
            >
              Package
            </button>
            {lesson.isPackage && (
              <input
                className="ob-input"
                type="number"
                placeholder="# sessions"
                value={lesson.packageCount ?? ''}
                onChange={e => updateLesson(lesson.id, 'packageCount', e.target.value === '' ? null : Number(e.target.value))}
                style={{ flex: 1 }}
              />
            )}
          </div>
        </div>
      ))}
      <button className="ob-skill-btn" onClick={addLesson} style={{ marginTop: 4 }}>
        + Add lesson
      </button>
    </div>
  );
}

function LocationClubStep({ data, setData, user }: CoachStepProps) {
  const { ready } = useGoogleMaps();
  const [query, setQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<SelectedClubWithRole | null>(null);
  const [membershipRole, setMembershipRole] = useState<ClubRole>('player');
  const [createError, setCreateError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const { results, loading } = useClubSearch(
    query,
    data.locationLat,
    data.locationLng,
    data.selectedSports.length > 0 ? data.selectedSports : data.coachSports
  );

  // GPS detection on mount; IP fallback already handled by OnboardingPage useEffect
  useEffect(() => {
    if (data.locationDetected) return;
    navigator.geolocation?.getCurrentPosition(
      pos => setData(prev => ({
        ...prev,
        locationLat: pos.coords.latitude,
        locationLng: pos.coords.longitude,
        locationDetected: true,
      })),
      () => { /* IP fallback already running */ }
    );
  }, []);

  const confirmClub = () => {
    if (!selectedClub) return;
    if (!data.selectedClubs.some(c => c.id === selectedClub.id)) {
      setData(prev => ({
        ...prev,
        selectedClubs: [...prev.selectedClubs, { ...selectedClub, membershipRole }],
      }));
    }
    setSelectedClub(null);
    setQuery('');
    setMembershipRole('player');
  };

  const removeClub = (clubId: string) => {
    setData(prev => ({ ...prev, selectedClubs: prev.selectedClubs.filter(c => c.id !== clubId) }));
  };

  // Membership role options = intersection of {player, coach, club_admin} with selectedRoles,
  // always including 'player'
  const membershipOptions: ClubRole[] = ['player'];
  if (data.selectedRoles.includes('coach')) membershipOptions.push('coach');
  if (data.selectedRoles.includes('club_admin')) membershipOptions.push('club_admin');

  const createClub = async () => {
    const name = query.trim();
    if (!name) return;
    setCreateError(null);
    const { data: newClub, error } = await (supabase as any)
      .from('clubs')
      .insert({ name, created_by: user?.id, is_verified: false })
      .select('id, name, city, state, logo_url, cover_image_url, location_lat, location_lng')
      .single();
    if (error) {
      setCreateError(error.message || 'Failed to create club. Please try again.');
      return;
    }
    if (newClub) {
      setSelectedClub(newClub as SelectedClubWithRole);
      setQuery('');
    }
  };

  const showCreateFallback = query.trim().length > 0 && results.length === 0 && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        className="ob-input"
        placeholder="Search for a club or facility..."
        value={query}
        onChange={e => { setQuery(e.target.value); setCreateError(null); }}
      />

      {/* Location indicator */}
      {data.locationCity ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--color-acc-bg)', border: '1px solid rgba(22,212,106,0.3)', borderRadius: 10 }}>
          <MapPin size={13} color="var(--color-acc)" strokeWidth={2.2} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-acc)' }}>
            Near {data.locationCity}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-t3)', marginLeft: 'auto' }}>
            Within 25 km
          </span>
        </div>
      ) : (
        <button
          className="ob-skill-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', padding: '12px 16px' }}
          onClick={() => {
            setLocating(true);
            navigator.geolocation?.getCurrentPosition(
              pos => {
                setData(prev => ({ ...prev, locationLat: pos.coords.latitude, locationLng: pos.coords.longitude, locationDetected: true }));
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`)
                  .then(r => r.json())
                  .then(d => setData(prev => ({ ...prev, locationCity: [d.city, d.principalSubdivision].filter(Boolean).join(', ') })))
                  .catch(() => {})
                  .finally(() => setLocating(false));
              },
              () => setLocating(false)
            );
          }}
          disabled={locating}
        >
          {locating
            ? <Loader2 size={14} strokeWidth={2.2} style={{ animation: 'spin 1s linear infinite' }} />
            : <MapPin size={14} strokeWidth={2.2} />}
          {locating ? 'Locating...' : 'Use My Location'}
        </button>
      )}

      {createError && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(255,100,100,0.9)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} strokeWidth={2.2} />
          {createError}
        </p>
      )}

      {!ready && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-t2)', margin: 0 }}>
          Search unavailable
        </p>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div className="ob-spinner" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map(club => (
            <button
              key={club.id}
              className="ob-club-result"
              onClick={() => setSelectedClub(club)}
            >
              {club.name}
            </button>
          ))}
        </div>
      )}

      {showCreateFallback && (
        <button
          className="ob-club-result"
          onClick={createClub}
        >
          + Create "{query.trim()}"
        </button>
      )}

      {selectedClub && (
        <div style={{ background: 'var(--color-acc-bg)', border: '1px solid var(--color-bdr)', borderRadius: 12, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-t2)', margin: 0 }}>
            {selectedClub.name} — Join as
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {membershipOptions.map(role => (
              <button
                key={role}
                className={`ob-skill-btn${membershipRole === role ? ' active' : ''}`}
                onClick={() => setMembershipRole(role)}
              >
                {role === 'club_admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="ob-skill-btn active"
            style={{ alignSelf: 'flex-start', padding: '10px 20px' }}
            onClick={confirmClub}
          >
            Confirm
          </button>
        </div>
      )}

      {data.selectedClubs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {data.selectedClubs.map(club => (
            <div
              key={club.id}
              className="ob-club-chip"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>{club.name}</span>
              <button
                onClick={() => removeClub(club.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-t1)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}
                aria-label={`Remove ${club.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BioStep({ data, setData }: StepProps) {
  const maxLength = 280;
  const remaining = maxLength - data.bio.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        className="ob-textarea"
        placeholder="Tell opponents a bit about your game, playing style, or what you're looking for in a match..."
        value={data.bio}
        onChange={e => setData(prev => ({ ...prev, bio: e.target.value.slice(0, maxLength) }))}
        rows={6}
        style={{ borderColor: remaining < 20 && remaining > 0 ? 'rgba(255,180,0,0.5)' : remaining === 0 ? 'rgba(255,60,60,0.5)' : undefined }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-t3)' }}>Optional — you can add this later</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: remaining < 20 && remaining > 0 ? 'rgba(255,180,0,0.8)' : remaining === 0 ? 'rgba(255,60,60,0.8)' : 'var(--color-t3)' }}>
          {remaining}
        </span>
      </div>
    </div>
  );
}
