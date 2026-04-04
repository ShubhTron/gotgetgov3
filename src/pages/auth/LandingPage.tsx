import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestTutorial } from '@/contexts/GuestTutorialContext';
import { AuthBottomSheet } from './AuthBottomSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  { icon: Users,      label: 'Find opponents nearby' },
  { icon: Trophy,     label: 'Join competitions'      },
  { icon: TrendingUp, label: 'Track your progress'    },
];

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { ...SPRING, delay } }),
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

const featureCardVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (delay: number) => ({ opacity: 1, x: 0, transition: { ...SPRING, delay } }),
};

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const navigate = useNavigate();
  const { enterGuestMode } = useAuth();
  const { startTutorial } = useGuestTutorial();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('gotgetgo_ref', ref);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <style>{`
        .lp-court-bg {
          position: absolute; inset: 0;
          background-image: url(/pickleball-paddle-court.webp);
          background-size: cover; background-position: center;
          filter: blur(12px);
          opacity: 0.15;
          transform: scale(1.08);
        }
        .lp-hero-gradient {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-acc-bg) 0%, transparent 65%),
            linear-gradient(180deg, transparent 0%, transparent 70%, var(--color-bg) 100%);
        }
        .lp-green-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, var(--color-acc-bg) 0%, transparent 70%);
          filter: blur(48px);
        }
        .lp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-acc), transparent);
          opacity: 0.35;
        }
      `}</style>

      <div className="lp-court-bg" />
      <div className="lp-hero-gradient" />
      <div className="lp-green-orb" style={{ width: 400, height: 400, top: -120, right: -100 }} />
      <div className="lp-green-orb" style={{ width: 280, height: 280, bottom: 64, left: -80, opacity: 0.6 }} />

      <div className="relative min-h-screen flex flex-col mx-auto" style={{ maxWidth: 384, paddingLeft: 24, paddingRight: 24 }}>
        {/* Hero */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col justify-center"
          style={{ paddingTop: 80, paddingBottom: 24 }}
        >
          {/* Logo + wordmark */}
          <motion.div variants={itemVariants} className="flex flex-col items-start" style={{ marginBottom: 32 }}>
            <div className="relative" style={{ marginBottom: 24 }}>
              <div style={{
                position: 'absolute', inset: '-40px',
                background: 'radial-gradient(circle, rgba(22,212,106,0.4) 0%, rgba(22,212,106,0.15) 40%, transparent 70%)',
                filter: 'blur(20px)', borderRadius: '50%',
              }} />
              <img
                src="/logo.png"
                alt="GotGetGo"
                className="relative object-contain"
                style={{ width: 80, height: 80, filter: 'drop-shadow(0 0 12px rgba(22,212,106,0.5))' }}
              />
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(3rem, 16vw, 5rem)',
              color: 'var(--color-t1)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textAlign: 'left',
            }}>
              Got<em style={{ color: 'var(--color-acc)', fontStyle: 'italic' }}>Get</em>Go
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16,
              color: 'var(--color-t2)', marginTop: 8, textAlign: 'left',
            }}>
              Find opponents. Play matches. Climb ladders.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="lp-divider" style={{ marginBottom: 32 }} />

          {/* Feature cards */}
          <motion.div variants={itemVariants}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-t3)', marginBottom: 8,
            }}>
              Built for racquet players
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  custom={0.55 + i * 0.09}
                  variants={featureCardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-acc-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <f.icon size={16} strokeWidth={2} style={{ color: 'var(--color-acc)' } as React.CSSProperties} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--color-t1)',
                    }}>
                      {f.label}
                    </span>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          custom={0.85}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          style={{ paddingBottom: 48 }}
        >
          <Button
            variant="outline"
            size="lg"
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => { enterGuestMode(); startTutorial(); navigate('/discover'); }}
          >
            Continue as Guest
          </Button>

          <Button
            variant="default"
            size="lg"
            style={{ width: '100%', boxShadow: '0 4px 24px rgba(22,212,106,0.3)' }}
            onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
          >
            Get Started
          </Button>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)', textAlign: 'center', marginTop: 24 }}>
            Already have an account?{' '}
            <button
              onClick={() => { setAuthMode('signin'); setShowAuth(true); }}
              style={{
                color: 'var(--color-acc)', fontFamily: 'var(--font-body)', fontWeight: 600,
                fontSize: 14, background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>

      {showAuth && (
        <AuthBottomSheet
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onToggleMode={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')}
        />
      )}
    </div>
  );
}
