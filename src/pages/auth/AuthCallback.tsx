import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth');
        return;
      }

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          navigate('/discover');
        } else {
          navigate('/onboarding');
        }
      } else {
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid var(--color-acc)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)' }}>
          Signing you in...
        </p>
      </div>
    </div>
  );
}
