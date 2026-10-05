import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminRoute() {
  const { user, adminAccessGranted } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  if (!adminAccessGranted) return <Navigate to="/profile?adminUnlock=1" replace />;
  return <Outlet />;
}
