import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import BrandLogo from '../components/BrandLogo';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Tag, LogOut, ChevronRight, Home, UserCircle, Settings, ChevronDown, Menu, X, MessageCircle,
} from 'lucide-react';

// Map each nav section to its sessionStorage key and API count key
const NAV_SECTIONS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', storageKey: null, apiKey: null },
  { to: '/admin/products', icon: Package, label: 'Products', storageKey: 'adminViewedProducts', apiKey: 'products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders', storageKey: 'adminViewedOrders', apiKey: 'orders' },
  { to: '/admin/users', icon: Users, label: 'Users', storageKey: 'adminViewedUsers', apiKey: 'users' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', storageKey: null, apiKey: null },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons', storageKey: 'adminViewedCoupons', apiKey: 'coupons' },
  { to: '/admin/messages', icon: MessageCircle, label: 'Messages', storageKey: 'adminViewedMessages', apiKey: 'messages' },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const initial = user?.name?.[0]?.toUpperCase() || 'K';
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [navCounts, setNavCounts] = useState({ products: 0, orders: 0, users: 0, coupons: 0, messages: 0 });

  const getViewedTimestamps = useCallback(() => {
    const result = {};
    NAV_SECTIONS.forEach(({ storageKey, apiKey }) => {
      if (storageKey && apiKey) {
        result[apiKey] = sessionStorage.getItem(storageKey) || new Date(0).toISOString();
      }
    });
    return result;
  }, []);

  const markSectionViewed = useCallback((path) => {
    const section = NAV_SECTIONS.find((s) => s.to === path);
    if (section?.storageKey && section?.apiKey) {
      sessionStorage.setItem(section.storageKey, new Date().toISOString());
      setNavCounts((prev) => ({ ...prev, [section.apiKey]: 0 }));
    }
  }, []);

  // Clear badge immediately when navigating to a section
  useEffect(() => {
    markSectionViewed(location.pathname);
  }, [location.pathname, markSectionViewed]);

  useEffect(() => {
    const fetchNewCounts = async () => {
      try {
        const ts = getViewedTimestamps();
        const params = new URLSearchParams({
          productsAt: ts.products,
          ordersAt: ts.orders,
          usersAt: ts.users,
          couponsAt: ts.coupons,
        });
        const res = await api.get(`/admin/new-counts?${params}`);
        const c = res.data.counts;
        // Don't overwrite a section that's currently being viewed (already 0)
        setNavCounts((prev) => ({
          products: prev.products === 0 && sessionStorage.getItem('adminViewedProducts') ? 0 : c.products,
          orders: prev.orders === 0 && sessionStorage.getItem('adminViewedOrders') ? 0 : c.orders,
          users: prev.users === 0 && sessionStorage.getItem('adminViewedUsers') ? 0 : c.users,
          coupons: prev.coupons === 0 && sessionStorage.getItem('adminViewedCoupons') ? 0 : c.coupons,
          messages: c.messages,
        }));
      } catch {
        // ignore
      }
    };

    fetchNewCounts();
    const interval = setInterval(fetchNewCounts, 15000);

    // Real-time new message badge
    const socket = getSocket();
    const onAdminUnread = (payload) => {
      setNavCounts((prev) => ({ ...prev, messages: Number(payload?.unreadCount ?? 0) }));
    };
    socket.on('support:admin-unread', onAdminUnread);
    socket.emit('support:join-admin');
    if (!socket.connected) socket.connect();

    return () => {
      clearInterval(interval);
      socket.off('support:admin-unread', onAdminUnread);
    };
  }, []);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>
          <NavLink to="/admin" className="flex items-center gap-2" onClick={closeMobileSidebar}>
            <BrandLogo theme="auto" compact homeClassName="text-[#b45309] dark:text-[#b45309]" />
          </NavLink>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Back to Home"
          >
            <Home size={20} />
          </button>
        </div>
      </div>

      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto transform transition-transform duration-300 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2" onClick={closeMobileSidebar}>
              <BrandLogo theme="auto" compact homeClassName="text-[#b45309] dark:text-[#b45309]" />
            </NavLink>
            <button
              onClick={closeMobileSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              aria-label="Close admin menu"
            >
              <X size={18} />
            </button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/"
            end
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Home size={18} />
            Home
            <ChevronRight size={14} className="ml-auto opacity-50" />
          </NavLink>

          {NAV_SECTIONS.map(({ to, icon: Icon, label, apiKey }) => {
            const count = apiKey ? (navCounts[apiKey] ?? 0) : 0;
            const isMessages = apiKey === 'messages';

            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={18} />
                {label}
                <span className="ml-auto flex items-center gap-1.5">
                  {count > 0 && (
                    <span className={`inline-flex min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold items-center justify-center leading-none animate-pulse ${
                      isMessages
                        ? 'bg-[#b45309] text-white shadow-md shadow-amber-700/40'
                        : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40'
                    }`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                  <ChevronRight size={14} className="opacity-50" />
                </span>
              </NavLink>
            );
          })}

          <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                {initial}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'Kisimoni Aubain'}
                  <span className="ml-1 text-primary-400 lowercase">{user?.role || 'admin'}</span>
                </p>
              </div>
              <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="mt-2 space-y-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 rounded-xl p-2">
                <NavLink to="/profile" onClick={() => { setProfileMenuOpen(false); closeMobileSidebar(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <UserCircle size={16} /> Profile
                </NavLink>
                <NavLink to="/orders" onClick={() => { setProfileMenuOpen(false); closeMobileSidebar(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <ShoppingCart size={16} /> My Orders
                </NavLink>
                <NavLink to="/settings" onClick={() => { setProfileMenuOpen(false); closeMobileSidebar(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <Settings size={16} /> Settings
                </NavLink>
                <NavLink to="/admin" end onClick={() => { setProfileMenuOpen(false); closeMobileSidebar(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <LayoutDashboard size={16} /> Admin Panel
                </NavLink>
                <hr className="border-gray-200 dark:border-gray-800 my-1" />
                <button
                  onClick={() => { dispatch(logout()); setProfileMenuOpen(false); closeMobileSidebar(); navigate('/', { replace: true }); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-gray-800 w-full transition-all"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { navigate('/'); closeMobileSidebar(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 w-full transition-all"
          >
            <Home size={18} />
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

