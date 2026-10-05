import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fetchUnreadMessageCount } from '../redux/slices/notificationsSlice';
import { fetchWishlistCount } from '../redux/slices/wishlistNotificationsSlice';
import { fetchCart } from '../redux/slices/cartSlice';
import { fetchWishlist } from '../redux/slices/wishlistSlice';

export default function MainLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      // Fetch notifications and data when user logs in
      dispatch(fetchUnreadMessageCount());
      dispatch(fetchWishlistCount());
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  return (
    <div className="min-h-screen flex flex-col ios-safe-x">
      <Navbar />
      <main className="flex-1 page-enter pb-4 sm:pb-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
