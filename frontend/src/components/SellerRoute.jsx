import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function SellerRoute() {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (!['seller', 'admin'].includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
