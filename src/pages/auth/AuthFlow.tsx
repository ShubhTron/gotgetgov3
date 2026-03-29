import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { IconArrowLeft } from '../../design-system/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthScreen = 'welcome' | 'signin' | 'signup';

interface FloatingOrbProps {
  size: number;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  color: string;
  blur: number;
  animationDelay?: number;
}

interface SignInFields { email: string; password: string; rememberMe: boolean; }
interface SignInErrors { email?: string; password?: string; form?: string; }
interface SignUpFields { fullName: string; email: string; password: string; agreedToTerms: boolean; }
interface SignUpErrors { fullName?: string; email?: string; password?: string; agreedToTerms?: string; form?: string; }

// ─── Animation Variants ───────────────────────────────────────────────────────

const welcomeVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.30, ease: [0.33, 1, 0.68, 1] as const } },
  exit:    { opacity: 0, y: 20,    transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] as const } },
};

const cardVariants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1,    transition: { duration: 0.32, ease: [0.33, 1, 0.68, 1] as const } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] as const } },
};

const formVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0,   transition: { duration: 0.22, ease: [0.33, 1, 0.68, 1] as const } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] as const } },
};

// ─── Shared Style Constants ───────────────────────────────────────────────────

const CARD_TEXT_PRIMARY   = '#14120E';
const CARD_TEXT_SECONDARY = '#8A8880';
const ACCENT              = '#16D46A';
const ERROR_COLOR         = '#E84040';

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-2xl)',
  fontWeight: 400,
  color: CARD_TEXT_PRIMARY,
  letterSpacing: '-0.02em',
  flex: 1,
  textAlign: 'center',
  marginRight: 36,
};

const backBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9999,
  background: 'rgba(20,18,14,0.06)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const primaryCardBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 52,
  borderRadius: 9999,
  background: ACCENT,
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  fontWeight: 600,
  color: CARD_TEXT_PRIMARY,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  marginTop: 8,
};

const switchLinkContainerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: CARD_TEXT_SECONDARY,
  textAlign: 'center',
  marginTop: 'auto',
  paddingTop: 8,
};

const switchLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: ACCENT,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};

const forgotLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: ACCENT,
  cursor: 'pointer',
  padding: 0,
};

// ─── FloatingOrb ─────────────────────────────────────────────────────────────

function FloatingOrb({ size, top, left, right, bottom, color, blur, animationDelay = 0 }: FloatingOrbProps) {
  return (
    <div style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      filter: `blur(${blur}px)`,
      top, left, right, bottom,
      animation: `authOrbFloat 6s ease-in-out infinite`,
      animationDelay: `${animationDelay}s`,
      pointerEvents: 'none',
    }} />
  );
}

// ─── DecorativeBackground ─────────────────────────────────────────────────────

function DecorativeBackground() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(22,212,106,0.22) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 85% 100%, rgba(13,158,80,0.18) 0%, transparent 55%),
        radial-gradient(ellipse 50% 35% at 5% 80%, rgba(22,212,106,0.12) 0%, transparent 50%),
        #111009
      `,
    }}>
      <FloatingOrb size={300} top="-100px" left="-80px"  color="rgba(22,212,106,0.10)" blur={70} animationDelay={0} />
      <FloatingOrb size={220} top="12%"   right="-50px"  color="rgba(22,212,106,0.08)" blur={55} animationDelay={1.5} />
      <FloatingOrb size={170} top="42%"   left="18%"     color="rgba(13,158,80,0.09)"  blur={45} animationDelay={3.0} />
      <FloatingOrb size={130} bottom="28%" right="8%"    color="rgba(22,212,106,0.07)" blur={40} animationDelay={0.8} />
    </div>
  );
}

// ─── FloatingLabelInput ───────────────────────────────────────────────────────

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  trailingAction?: { label: string; onPress: () => void };
}

function FloatingLabelInput({ id, label, type, value, onChange, error, autoComplete, trailingAction }: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        position: 'relative',
        height: 56,
        borderRadius: 12,
        border: `1.5px solid ${error ? ERROR_COLOR : focused ? ACCENT : 'rgba(20,18,14,0.15)'}`,
        background: '#FAFAF8',
        transition: 'border-color 0.2s',
      }}>
        <label htmlFor={id} style={{
          position: 'absolute',
          left: 14,
          top: isFloating ? 8 : '50%',
          transform: isFloating ? 'translateY(0)' : 'translateY(-50%)',
          fontSize: isFloating ? 10 : 14,
          color: error ? ERROR_COLOR : focused ? ACCENT : CARD_TEXT_SECONDARY,
          fontFamily: 'var(--font-body)',
          fontWeight: isFloating ? 600 : 400,
          letterSpacing: isFloating ? '0.04em' : 0,
          transition: 'all 0.18s ease',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: trailingAction ? 56 : 0,
            height: isFloating ? 30 : 56,
            padding: '0 14px',
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: CARD_TEXT_PRIMARY,
            width: trailingAction ? 'calc(100% - 56px)' : '100%',
            boxSizing: 'border-box',
          }}
        />
        {trailingAction && (
          <button
            type="button"
            onClick={trailingAction.onPress}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: ACCENT,
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
            }}
          >
            {trailingAction.label}
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: ERROR_COLOR, paddingLeft: 4 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── CheckboxRow ──────────────────────────────────────────────────────────────

function CheckboxRow({ id, checked, onChange, label, error }: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  label: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        <div
          style={{
            width: 20, height: 20, flexShrink: 0,
            borderRadius: 6,
            border: `2px solid ${checked ? ACCENT : 'rgba(20,18,14,0.20)'}`,
            background: checked ? ACCENT : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            marginTop: 1,
            cursor: 'pointer',
          }}
        >
          {checked && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: CARD_TEXT_SECONDARY, lineHeight: 1.45 }}>
          {label}
        </span>
      </label>
      {error && (
        <span style={{ display: 'block', marginTop: 4, paddingLeft: 30, fontFamily: 'var(--font-body)', fontSize: 11, color: ERROR_COLOR }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── OrDivider ────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(20,18,14,0.10)' }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: CARD_TEXT_SECONDARY, fontWeight: 600, letterSpacing: '0.06em' }}>
        OR
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(20,18,14,0.10)' }} />
    </div>
  );
}

// ─── SocialGoogleButton ───────────────────────────────────────────────────────

function SocialGoogleButton({ onClick }: { onClick: () => Promise<{ error: Error | null }> }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await onClick();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      style={{
        width: '100%',
        height: 48,
        borderRadius: 9999,
        border: '1.5px solid rgba(20,18,14,0.15)',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        color: CARD_TEXT_PRIMARY,
        cursor: 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      {loading ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(232,64,64,0.08)',
      border: '1px solid rgba(232,64,64,0.20)',
      borderRadius: 10,
      padding: '10px 14px',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: ERROR_COLOR,
      lineHeight: 1.4,
    }}>
      {message}
    </div>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onNavigate, onContinueAsGuest }: {
  onNavigate: (s: AuthScreen) => void;
  onContinueAsGuest: () => void;
}) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '80px 28px 52px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="GotGetGo" style={{ height: 60, width: 'auto', marginBottom: 28 }} />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '0 0 12px',
        }}>
          Welcome Back!
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-md)',
          color: 'rgba(255,255,255,0.60)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          Enter personal details to access{'\n'}your sports account.
        </p>
      </div>

      {/* CTAs */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => onNavigate('signin')}
          style={{
            width: '100%', height: 52, borderRadius: 9999,
            background: ACCENT, border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600,
            color: CARD_TEXT_PRIMARY, cursor: 'pointer', letterSpacing: '-0.01em',
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => onNavigate('signup')}
          style={{
            width: '100%', height: 52, borderRadius: 9999,
            background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.20)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600,
            color: '#FFFFFF', cursor: 'pointer', letterSpacing: '-0.01em',
          }}
        >
          Create Account
        </button>
        <button
          onClick={onContinueAsGuest}
          style={{
            background: 'none', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            color: 'rgba(255,255,255,0.40)', cursor: 'pointer',
            padding: '8px 0', textDecoration: 'underline',
            textDecorationColor: 'rgba(255,255,255,0.20)',
            textUnderlineOffset: 3,
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

// ─── CardPanel ────────────────────────────────────────────────────────────────

function CardPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px 28px 0 0',
        padding: '28px 24px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.35)',
        minHeight: '64vh',
        maxHeight: '88vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── SignInScreen ─────────────────────────────────────────────────────────────

function SignInScreen({ onNavigate }: { onNavigate: (s: AuthScreen) => void }) {
  const { signIn, signInWithGoogle } = useAuth();

  const [fields, setFields] = useState<SignInFields>({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<SignInErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate(): boolean {
    const next: SignInErrors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fields.email.trim())          next.email = 'Email is required';
    else if (!emailRe.test(fields.email)) next.email = 'Enter a valid email address';
    if (!fields.password)              next.password = 'Password is required';
    else if (fields.password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signIn(fields.email, fields.password);
    if (error) setErrors({ form: 'Invalid email or password. Please try again.' });
    setSubmitting(false);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => onNavigate('welcome')} style={backBtnStyle} aria-label="Back">
          <IconArrowLeft size={18} style={{ color: CARD_TEXT_PRIMARY }} />
        </button>
        <h2 style={cardTitleStyle}>Welcome back</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FloatingLabelInput
          id="signin-email" label="Email" type="email"
          value={fields.email} autoComplete="email"
          onChange={(v) => { setFields(f => ({ ...f, email: v })); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
          error={errors.email}
        />
        <FloatingLabelInput
          id="signin-password" label="Password" type={showPassword ? 'text' : 'password'}
          value={fields.password} autoComplete="current-password"
          onChange={(v) => { setFields(f => ({ ...f, password: v })); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
          error={errors.password}
          trailingAction={{ label: showPassword ? 'Hide' : 'Show', onPress: () => setShowPassword(s => !s) }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CheckboxRow
            id="remember-me" checked={fields.rememberMe}
            onChange={(v) => setFields(f => ({ ...f, rememberMe: v }))}
            label="Remember me"
          />
          <button type="button" style={forgotLinkStyle}>Forgot password?</button>
        </div>

        {errors.form && <ErrorMessage message={errors.form} />}

        <button type="submit" disabled={submitting} style={{ ...primaryCardBtnStyle, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <OrDivider />
        <SocialGoogleButton onClick={signInWithGoogle} />

        <p style={switchLinkContainerStyle}>
          Don't have an account?{' '}
          <button type="button" onClick={() => onNavigate('signup')} style={switchLinkStyle}>Sign up</button>
        </p>
      </form>
    </>
  );
}

// ─── SignUpScreen ─────────────────────────────────────────────────────────────

function SignUpScreen({ onNavigate }: { onNavigate: (s: AuthScreen) => void }) {
  const { signUp, signInWithGoogle } = useAuth();

  const [fields, setFields] = useState<SignUpFields>({ fullName: '', email: '', password: '', agreedToTerms: false });
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function validate(): boolean {
    const next: SignUpErrors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fields.fullName.trim())             next.fullName = 'Full name is required';
    else if (fields.fullName.trim().length < 2) next.fullName = 'Name must be at least 2 characters';
    if (!fields.email.trim())                next.email = 'Email is required';
    else if (!emailRe.test(fields.email))    next.email = 'Enter a valid email address';
    if (!fields.password)                    next.password = 'Password is required';
    else if (fields.password.length < 8)     next.password = 'Password must be at least 8 characters';
    if (!fields.agreedToTerms)               next.agreedToTerms = 'You must agree to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signUp(fields.email, fields.password, fields.fullName);
    if (error) setErrors({ form: error.message ?? 'Sign up failed. Please try again.' });
    else setSuccessMsg('Check your email to confirm your account!');
    setSubmitting(false);
  }

  if (successMsg) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => onNavigate('welcome')} style={backBtnStyle} aria-label="Back">
            <IconArrowLeft size={18} style={{ color: CARD_TEXT_PRIMARY }} />
          </button>
          <h2 style={cardTitleStyle}>Get Started</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎾</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: CARD_TEXT_PRIMARY, margin: 0 }}>
            You're almost in!
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: CARD_TEXT_SECONDARY, lineHeight: 1.5, margin: 0 }}>
            {successMsg}
          </p>
          <button onClick={() => onNavigate('signin')} style={{ ...primaryCardBtnStyle, width: 'auto', padding: '0 32px' }}>
            Go to Sign In
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => onNavigate('welcome')} style={backBtnStyle} aria-label="Back">
          <IconArrowLeft size={18} style={{ color: CARD_TEXT_PRIMARY }} />
        </button>
        <h2 style={cardTitleStyle}>Get Started</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FloatingLabelInput
          id="signup-fullname" label="Full Name" type="text"
          value={fields.fullName} autoComplete="name"
          onChange={(v) => { setFields(f => ({ ...f, fullName: v })); if (errors.fullName) setErrors(e => ({ ...e, fullName: undefined })); }}
          error={errors.fullName}
        />
        <FloatingLabelInput
          id="signup-email" label="Email" type="email"
          value={fields.email} autoComplete="email"
          onChange={(v) => { setFields(f => ({ ...f, email: v })); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
          error={errors.email}
        />
        <FloatingLabelInput
          id="signup-password" label="Password" type={showPassword ? 'text' : 'password'}
          value={fields.password} autoComplete="new-password"
          onChange={(v) => { setFields(f => ({ ...f, password: v })); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
          error={errors.password}
          trailingAction={{ label: showPassword ? 'Hide' : 'Show', onPress: () => setShowPassword(s => !s) }}
        />

        <CheckboxRow
          id="agree-terms" checked={fields.agreedToTerms}
          onChange={(v) => { setFields(f => ({ ...f, agreedToTerms: v })); if (errors.agreedToTerms) setErrors(e => ({ ...e, agreedToTerms: undefined })); }}
          label="I agree to the processing of Personal data"
          error={errors.agreedToTerms}
        />

        {errors.form && <ErrorMessage message={errors.form} />}

        <button
          type="submit"
          disabled={submitting}
          style={{ ...primaryCardBtnStyle, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>

        <OrDivider />
        <SocialGoogleButton onClick={signInWithGoogle} />

        <p style={switchLinkContainerStyle}>
          Already have an account?{' '}
          <button type="button" onClick={() => onNavigate('signin')} style={switchLinkStyle}>Sign in</button>
        </p>
      </form>
    </>
  );
}

// ─── AuthFlow (exported) ──────────────────────────────────────────────────────

export function AuthFlow() {
  const { continueAsGuest } = useAuth();
  const [screen, setScreen] = useState<AuthScreen>('welcome');
  const isCard = screen === 'signin' || screen === 'signup';

  return (
    <div style={{
      position: 'relative',
      height: '100dvh',
      overflow: 'hidden',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <DecorativeBackground />

      <AnimatePresence mode="wait" initial={false}>
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            variants={welcomeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ position: 'absolute', inset: 0 }}
          >
            <WelcomeScreen onNavigate={setScreen} onContinueAsGuest={continueAsGuest} />
          </motion.div>
        )}

        {isCard && (
          <motion.div
            key="card"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ position: 'absolute', inset: 0 }}
          >
            <CardPanel>
              <AnimatePresence mode="wait" initial={false}>
                {screen === 'signin' && (
                  <motion.div
                    key="signin"
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <SignInScreen onNavigate={setScreen} />
                  </motion.div>
                )}
                {screen === 'signup' && (
                  <motion.div
                    key="signup"
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <SignUpScreen onNavigate={setScreen} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
