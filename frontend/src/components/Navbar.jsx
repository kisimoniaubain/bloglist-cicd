import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { setUnreadMessages } from '../redux/slices/notificationsSlice';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  ShoppingCart, Heart, Search, Menu, X, User,
  Package, LogOut, LayoutDashboard, ChevronDown, Settings,
} from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.cart);
  const { items: wishlist } = useSelector((s) => s.wishlist);
  const { unreadMessages } = useSelector((s) => s.notifications);
  const { wishlistCount } = useSelector((s) => s.wishlistNotifications);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const displayName = String(user?.name || user?.fullName || 'User');
  const displayInitial = String(displayName[0] || 'U').toUpperCase();

  const cartCount = items.reduce((acc, i) => acc + i.qty, 0);
  const displayWishlistCount = Math.max(Number(wishlistCount || 0), wishlist.length);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    let cancelled = false;
    let socket;
    let joinRoom;

    const onRealtimeUnread = (payload) => {
      if (cancelled) return;
      dispatch(setUnreadMessages(Number(payload?.unreadCount || 0)));
    };

    if (user && user._id) {
      socket = getSocket();
      socket.on('support:unread', onRealtimeUnread);

      joinRoom = () => {
        socket.emit('support:join', String(user._id));
      };

      socket.on('connect', joinRoom);
      if (!socket.connected) socket.connect();
      else joinRoom();
    }

    return () => {
      cancelled = true;
      if (socket) {
        socket.off('support:unread', onRealtimeUnread);
        if (joinRoom) socket.off('connect', joinRoom);
        socket.disconnect();
      }
    };
  }, [user?._id, dispatch]);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 shadow-sm ios-safe-top backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BrandLogo compact theme="auto" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/35 bg-white dark:bg-white/15 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-white/60 focus:border-primary-500 dark:focus:border-white/60"
              />
            </div>
          </form>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {['/', '/products', '/contact'].map((path, i) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive ? 'text-[#b45309] dark:text-[#b45309] font-bold' : 'text-gray-700 dark:text-[#b45309] font-medium hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/15'
                  }`
                }
              >
                <span className="relative inline-flex items-center">
                  {[t('common.home', 'Home'), t('common.products', 'Products'), 'Contact Us'][i]}
                  {path === '/contact' && unreadMessages > 0 ? (
                    <span className="absolute -top-2 -right-3 inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-[#b45309] text-white text-[10px] font-bold items-center justify-center leading-none shadow-sm">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Wishlist */}
            <Link to="/wishlist" className="hidden sm:inline-flex relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/15 text-gray-700 dark:text-white/90 transition-colors">
              <Heart size={20} />
              {displayWishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#b45309] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none">
                  {displayWishlistCount > 99 ? '99+' : displayWishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/15 text-gray-700 dark:text-white/90 transition-colors">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#b45309] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/15 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary-600">{displayInitial}</span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-white max-w-[80px] truncate">{displayName}</span>
                  <ChevronDown size={14} className="text-gray-500 dark:text-white/70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 rounded-lg mx-2">
                      <User size={18} className="text-[#b45309]" /> {t('common.profile', 'Profile')}
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 rounded-lg mx-2">
                      <Package size={18} className="text-[#b45309]" /> {t('common.myOrders', 'My Orders')}
                    </Link>
                    <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 rounded-lg mx-2">
                      <Settings size={18} className="text-[#b45309]" /> {t('common.settings', 'Settings')}
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <div className="my-2 border-t border-gray-200 dark:border-gray-600" />
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[#b45309] hover:text-white hover:bg-[#b45309] transition-all duration-200 rounded-lg mx-2 font-semibold">
                          <LayoutDashboard size={18} className="text-[#b45309] group-hover:text-white" /> {t('common.adminPanel', 'Admin Panel')}
                        </Link>
                      </>
                    )}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={() => { dispatch(logout()); setUserMenuOpen(false); navigate('/', { replace: true }); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-all duration-200 rounded-lg mx-2 w-full"
                    >
                      <LogOut size={18} /> {t('common.logout', 'Logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex btn-primary text-sm py-2 px-4">{t('common.signIn', 'Sign In')}</Link>
                <Link to="/login" className="sm:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/15 text-gray-700 dark:text-white/90 transition-colors" aria-label={t('common.signIn', 'Sign In')}>
                  <User size={20} />
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/15 text-gray-700 dark:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-white/20 px-4 py-3 space-y-2 animate-slide-up bg-white dark:bg-[#111827] ios-safe-bottom">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/35 bg-white dark:bg-white/15 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-white/60 focus:border-primary-500 dark:focus:border-white/60"
            />
          </form>
          <NavLink to="/" end onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.home', 'Home')}</NavLink>
          <NavLink to="/products" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.products', 'Products')}</NavLink>
          <NavLink to="/contact" onClick={() => setMobileOpen(false)}
            className="relative block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">
            <span className="inline-flex items-center">
              Contact Us
            </span>
            {unreadMessages > 0 ? (
              <span className="absolute -top-2 -right-3 inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-[#b45309] text-white text-[10px] font-bold items-center justify-center leading-none shadow-sm">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/wishlist" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.wishlist', 'Wishlist')}</NavLink>
          <NavLink to="/cart" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.cart', 'Cart')}</NavLink>
          {user ? (
            <>
              <NavLink to="/orders" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.myOrders', 'My Orders')}</NavLink>
              <NavLink to="/profile" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.profile', 'Profile')}</NavLink>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15">{t('common.signIn', 'Sign In')}</NavLink>
          )}
        </div>
      )}
    </nav>
  );
}

