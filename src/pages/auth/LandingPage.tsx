import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestTutorial } from '@/contexts/GuestTutorialContext';
import { AuthBottomSheet } from './AuthBottomSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIsDesktop } from '@/hooks/useIsDesktop';

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
  const isDesktop = useIsDesktop();

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

      <div
        className="relative min-h-screen flex flex-col"
        style={{
          maxWidth: isDesktop ? 1100 : 384,
          margin: '0 auto',
          paddingLeft: isDesktop ? 48 : 24,
          paddingRight: isDesktop ? 48 : 24,
        }}
      >
        {isDesktop ? (
          /* ── Desktop: two-column split ── */
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            alignItems: 'center',
            gap: 48,
            paddingTop: 80,
            paddingBottom: 48,
          }}>
            {/* LEFT col */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
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

              {/* CTAs */}
              <motion.div variants={itemVariants}>
                <Button
                  variant="default"
                  size="lg"
                  style={{ width: '100%', boxShadow: '0 4px 24px rgba(22,212,106,0.3)', marginBottom: 12 }}
                  onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
                >
                  Get Started
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => { enterGuestMode(); startTutorial(); navigate('/discover'); }}
                >
                  Continue as Guest
                </Button>

                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)', textAlign: 'center', marginTop: 12 }}>
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
            </motion.div>

            {/* RIGHT col */}
            <motion.div
              custom={0.3}
              variants={heroVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <DiscoverCardPreview />
            </motion.div>
          </div>
        ) : (
          /* ── Mobile: original single-column layout ── */
          <>
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
          </>
        )}
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

function DiscoverCardPreview() {
  return (
    <div style={{
      width: 300,
      background: 'var(--color-surf)',
      borderRadius: 24,
      border: '1px solid var(--color-bdr)',
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4ade80 0%, #16d46a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#000',
          }}>A</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-t1)' }}>Alex Rivera</div>
            <div style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 999, marginTop: 3,
              background: 'var(--color-acc-bg)', color: 'var(--color-acc)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10,
              textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            }}>Tennis · Intermediate</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-acc)' }}>82%</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-t3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Match</div>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
        {([['Availability', 'Flexible'], ['Preferred time', 'Weekends'], ['Home club', 'City TC'], ['Schedule match', '2h overlap']] as const).map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-t3)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-t1)', marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--color-bdr)' }}>
        <div style={{
          flex: 1, padding: '13px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--color-surf-2)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--color-t2)',
        }}>✕ Pass</div>
        <div style={{
          flex: 1.5, padding: '13px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--color-acc)',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#000',
        }}>⚡ Connect</div>
      </div>
    </div>
  );
}
