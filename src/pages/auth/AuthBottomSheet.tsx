import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthBottomSheetProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onToggleMode: () => void;
}

export function AuthBottomSheet({ mode, onClose, onToggleMode }: AuthBottomSheetProps) {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useState(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const handler = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          navigate('/onboarding');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate('/discover');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 56, paddingLeft: 48, paddingRight: 16, borderRadius: 12,
    border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)',
    color: 'var(--color-t1)', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const providerBtnStyle: React.CSSProperties = {
    width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, borderRadius: 12, border: '1px solid var(--color-bdr)',
    background: 'var(--color-surf-2)', color: 'var(--color-t1)',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
  };

  const providers = [
    {
      id: 'google',
      label: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      onClick: handleGoogleSignIn,
    },
    {
      id: 'apple',
      label: 'Apple',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      ),
      onClick: () => {},
    },
    {
      id: 'phone',
      label: 'Phone',
      icon: <Phone className="w-5 h-5" />,
      onClick: () => {},
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      onClick: () => setShowEmailForm(true),
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: keyboardOffset, zIndex: 50,
          background: 'var(--color-surf)', backdropFilter: 'blur(24px)',
          borderRadius: '20px 20px 0 0', maxHeight: '90dvh', overflow: 'hidden',
          borderTop: '1px solid var(--color-bdr)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 12px' }}>
          <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--color-bdr)' }} />
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-surf-2)', border: 'none', borderRadius: '50%', cursor: 'pointer',
          }}
        >
          <X className="w-5 h-5" style={{ color: 'var(--color-t2)' }} />
        </button>

        <div style={{ padding: '0 24px 32px', overflowY: 'auto', maxHeight: 'calc(90dvh - 48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--color-t1)', marginBottom: 8 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)' }}>
              {mode === 'signin'
                ? 'Sign in to continue playing'
                : 'Join thousands of racquet sports players'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16, padding: 16, background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', borderRadius: 12 }}
            >
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--color-red)' }}>{error}</p>
            </motion.div>
          )}

          {!showEmailForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {providers.map((provider) => (
                <motion.button
                  key={provider.id}
                  onClick={provider.onClick}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={providerBtnStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-acc)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-acc-bg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-bdr)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf-2)'; }}
                >
                  {provider.icon}
                  <span>Continue with {provider.label}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-acc)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}
              >
                ← Back to all options
              </button>

              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative' }}>
                  <User className="w-5 h-5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />
                </motion.div>
              )}

              <div style={{ position: 'relative' }}>
                <Mail className="w-5 h-5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock className="w-5 h-5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 48 }}
                  required minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                style={{
                  width: '100%', height: 56, borderRadius: 12, border: 'none',
                  background: 'var(--color-acc)', color: 'var(--color-bg)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(22,212,106,0.3)',
                }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid var(--color-bg)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </motion.form>
          )}

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={onToggleMode}
              style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--color-acc)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <p style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', lineHeight: 1.6 }}>
            By continuing, you agree to our{' '}
            <a href="/terms" style={{ color: 'var(--color-acc)', fontWeight: 500 }}>Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: 'var(--color-acc)', fontWeight: 500 }}>Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </>
  );
}
