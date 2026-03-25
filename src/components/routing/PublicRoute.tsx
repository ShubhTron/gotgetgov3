import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-acc)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (user) {
    if (!profile?.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
}
