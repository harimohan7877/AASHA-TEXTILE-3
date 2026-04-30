import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-spin h-8 w-8 border-3 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!email) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
