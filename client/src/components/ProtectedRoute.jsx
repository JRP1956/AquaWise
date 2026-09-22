import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Client-side gate only — a convenience, not a security boundary. Every protected
 * API route checks the session again on the server (NFR-S3).
 */
export default function ProtectedRoute({ children, needsSociety = false }) {
  const { user, hasSociety, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3 text-secondary">Checking your session…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (needsSociety && !hasSociety) return <Navigate to="/society" replace />;
  return children;
}
