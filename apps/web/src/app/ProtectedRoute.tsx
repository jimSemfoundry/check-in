import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoading } from '../components/States';
import { useSession } from '../features/access/SessionProvider';
export function ProtectedRoute() {
  const { session, loading } = useSession();
  const location = useLocation();
  if (loading) return <PageLoading />;
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/welcome" replace state={{ from: location.pathname }} />
  );
}
