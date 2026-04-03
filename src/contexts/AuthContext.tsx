import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestSwipeCount: number;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  incrementGuestSwipeCount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() =>
    localStorage.getItem('gg-guest') === 'true'
  );
  const [guestSwipeCount, setGuestSwipeCount] = useState(0);

  useEffect(() => {
    // Track whether we've already bootstrapped to avoid firing twice:
    // getSession() fires first, then onAuthStateChange('INITIAL_SESSION') also fires.
    // We only need to fetch the profile and update last_seen ONCE on startup.
    let bootstrapped = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      bootstrapped = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Update last_seen once on startup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('profiles') as any)
          .update({ last_seen: new Date().toISOString() })
          .eq('id', session.user.id)
          .then(() => {});
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip INITIAL_SESSION if getSession() already bootstrapped — prevents
      // a duplicate profile fetch + last_seen UPDATE on every page load.
      if (_event === 'INITIAL_SESSION' && bootstrapped) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Only update last_seen on an actual new sign-in (not token refresh)
        if (_event === 'SIGNED_IN') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('profiles') as any)
            .update({ last_seen: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {});
        }
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Heartbeat: keep last_seen fresh every 2 minutes while logged in
  useEffect(() => {
    if (!user) return;
    const tick = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('profiles') as any)
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {});
    };
    const interval = setInterval(tick, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    }
    setProfile(data);
    setLoading(false);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (!error) exitGuestMode();
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) exitGuestMode();
    return { error: error as Error | null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (!error) exitGuestMode();
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('Not authenticated') };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error: error as Error | null };
  }

  function enterGuestMode() {
    localStorage.setItem('gg-guest', 'true');
    setIsGuest(true);
  }

  function exitGuestMode() {
    localStorage.removeItem('gg-guest');
    setIsGuest(false);
    setGuestSwipeCount(0);
  }

  function incrementGuestSwipeCount() {
    setGuestSwipeCount((prev) => prev + 1);
  }

  const value = {
    user,
    profile,
    session,
    loading,
    isGuest,
    guestSwipeCount,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    enterGuestMode,
    exitGuestMode,
    incrementGuestSwipeCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
