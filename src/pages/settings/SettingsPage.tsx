import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Dumbbell, CalendarClock, Moon, Sun, Bell, Mail,
  BellRing, Eye, EyeOff, Shield, Trash2, LogOut, Info,
  FileText, Star, ChevronRight, Copy, Check, Globe,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsRow } from '../../components/me/SettingsRow';
import { Avatar } from '../../design-system';
import { formatUserIdForDisplay } from '../../lib/userId';
import { supabase } from '../../lib/supabase';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--color-t3)', margin: '0 0 6px 16px',
      }}>
        {title}
      </p>
      <div style={{
        background: 'var(--color-surf)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--color-bdr)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-bdr)', marginLeft: 68 }} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();

  // Toggles derived from profile
  const [darkMode,      setDarkMode]      = useState(profile?.dark_mode ?? false);
  const [pushNotifs,    setPushNotifs]    = useState(profile?.push_notifications ?? true);
  const [emailNotifs,   setEmailNotifs]   = useState(profile?.email_notifications ?? true);
  const [matchReminders, setMatchReminders] = useState(true);
  const [showOnline,    setShowOnline]    = useState(true);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const shortId = profile?.id ? formatUserIdForDisplay(profile.id).toUpperCase() : '—';

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleDarkMode(next: boolean) {
    setDarkMode(next);
    await updateProfile({ dark_mode: next });
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }

  async function handlePushNotifs(next: boolean) {
    setPushNotifs(next);
    await updateProfile({ push_notifications: next });
  }

  async function handleEmailNotifs(next: boolean) {
    setEmailNotifs(next);
    await updateProfile({ email_notifications: next });
  }

  function copyId() {
    navigator.clipboard.writeText(shortId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    navigate('/auth');
  }

  async function handleDeleteAccount() {
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
    navigate('/auth');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 40, background: 'var(--color-bg)', minHeight: '100%' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
          color: 'var(--color-t1)', margin: 0, letterSpacing: '-0.01em',
        }}>
          Settings
        </h1>
      </div>

      {/* ── Profile card ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: 'var(--radius-2xl)',
          padding: '20px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Avatar
            name={profile?.full_name ?? 'Me'}
            imageUrl={profile?.avatar_url ?? undefined}
            size="xl"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18,
              color: 'var(--color-t1)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.full_name ?? 'Player'}
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--color-t3)', margin: '2px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email ?? ''}
            </p>
            {/* Unique ID row */}
            <button
              onClick={copyId}
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
                borderRadius: 'var(--radius-full)', padding: '3px 10px',
                cursor: 'pointer', color: 'var(--color-acc)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
              }}
            >
              {shortId}
              {copied
                ? <Check size={11} style={{ color: 'var(--color-acc)' }} />
                : <Copy size={11} />}
            </button>
          </div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
              cursor: 'pointer', color: 'var(--color-t2)', flexShrink: 0,
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Account ───────────────────────────────────────────────────── */}
        <Section title="Account">
          <SettingsRow
            icon={<User size={18} />}
            label="Edit Profile"
            secondaryText="Update your name, bio and photo"
            onPress={() => navigate('/profile')}
          />
          <Divider />
          <SettingsRow
            icon={<Lock size={18} />}
            label="Change Password"
            secondaryText="Update your login credentials"
            onPress={async () => {
              if (user?.email) {
                await supabase.auth.resetPasswordForEmail(user.email);
                alert('Password reset email sent to ' + user.email);
              }
            }}
          />
          <Divider />
          <SettingsRow
            icon={<Dumbbell size={18} />}
            label="My Sports"
            secondaryText="Manage sport profiles & skill levels"
            onPress={() => navigate('/sports')}
          />
          <Divider />
          <SettingsRow
            icon={<CalendarClock size={18} />}
            label="Availability"
            secondaryText="Set your weekly playing schedule"
            onPress={() => navigate('/profile')}
          />
        </Section>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Section title="Appearance">
          <SettingsRow
            icon={darkMode ? <Moon size={18} /> : <Sun size={18} />}
            label="Dark Mode"
            secondaryText={darkMode ? 'Currently dark theme' : 'Currently light theme'}
            variant="toggle"
            toggleValue={darkMode}
            onToggle={handleDarkMode}
          />
          <Divider />
          <SettingsRow
            icon={<Globe size={18} />}
            label="Language"
            secondaryText="English"
            onPress={() => {}}
          />
        </Section>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <Section title="Notifications">
          <SettingsRow
            icon={<Bell size={18} />}
            label="Push Notifications"
            secondaryText="Challenges, messages & updates"
            variant="toggle"
            toggleValue={pushNotifs}
            onToggle={handlePushNotifs}
          />
          <Divider />
          <SettingsRow
            icon={<Mail size={18} />}
            label="Email Notifications"
            secondaryText="Weekly digest & important alerts"
            variant="toggle"
            toggleValue={emailNotifs}
            onToggle={handleEmailNotifs}
          />
          <Divider />
          <SettingsRow
            icon={<BellRing size={18} />}
            label="Match Reminders"
            secondaryText="Alerts before scheduled matches"
            variant="toggle"
            toggleValue={matchReminders}
            onToggle={setMatchReminders}
          />
        </Section>

        {/* ── Privacy & Safety ──────────────────────────────────────────── */}
        <Section title="Privacy & Safety">
          <SettingsRow
            icon={<Eye size={18} />}
            label="Profile Visibility"
            secondaryText="Everyone can view your profile"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={showOnline ? <Eye size={18} /> : <EyeOff size={18} />}
            label="Show Online Status"
            secondaryText="Let others see when you're active"
            variant="toggle"
            toggleValue={showOnline}
            onToggle={setShowOnline}
          />
          <Divider />
          <SettingsRow
            icon={<Shield size={18} />}
            label="Blocked Users"
            secondaryText="Manage your block list"
            onPress={() => {}}
          />
        </Section>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <Section title="About">
          <SettingsRow
            icon={<Info size={18} />}
            label="App Version"
            secondaryText="v1.0.0"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<FileText size={18} />}
            label="Terms of Service"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<Shield size={18} />}
            label="Privacy Policy"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<Star size={18} />}
            label="Rate GotGetGo"
            secondaryText="Enjoying the app? Leave a review"
            onPress={() => {}}
          />
        </Section>

        {/* ── Sign Out ──────────────────────────────────────────────────── */}
        <Section title="Session">
          <SettingsRow
            icon={<LogOut size={18} />}
            label={signingOut ? 'Signing out…' : 'Sign Out'}
            variant="destructive"
            onPress={handleSignOut}
          />
        </Section>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <Section title="Danger Zone">
          {!showDeleteConfirm ? (
            <SettingsRow
              icon={<Trash2 size={18} />}
              label="Delete Account"
              secondaryText="Permanently remove all your data"
              variant="destructive"
              onPress={() => setShowDeleteConfirm(true)}
            />
          ) : (
            <div style={{ padding: '16px' }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)',
                fontWeight: 600, margin: '0 0 4px',
              }}>
                Are you sure?
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)',
                margin: '0 0 14px', lineHeight: 1.5,
              }}>
                This will permanently delete your account and all data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--color-bdr)',
                    background: 'var(--color-surf-2)', color: 'var(--color-t1)',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                    background: 'var(--color-red)', color: '#fff',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}
