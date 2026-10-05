import { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/Loader';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Award,
  Boxes,
  ArrowUpRight,
  ClipboardList,
  Truck,
  Clock3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isVideoUrl } from '../../utils/imageUrl';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader size="lg" /></div>;
  if (!stats) return null;

  const monthGrowth = stats.totalRevenue > 0
    ? Math.round((stats.monthlyRevenue / stats.totalRevenue) * 100)
    : 0;

  const orderStatusMap = (stats.ordersByStatus || []).reduce((acc, entry) => {
    acc[entry._id] = entry.count;
    return acc;
  }, {});

  const pendingOpsCount =
    Number(orderStatusMap.pending || 0)
    + Number(orderStatusMap.processing || 0)
    + Number(orderStatusMap.paid || 0);

  const shippedCount = Number(orderStatusMap.shipped || 0);
  const deliveredCount = Number(orderStatusMap.delivered || 0);
  const totalOps = Math.max(1, pendingOpsCount + shippedCount + deliveredCount);

  const statCards = [
    {
      label: 'Total Revenue',
      value: `KSh ${stats.totalRevenue?.toLocaleString() || 0}`,
      sub: `${monthGrowth}% contributed this month`,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: 'Orders',
      value: stats.totalOrders,
      sub: `${pendingOpsCount} need active handling`,
      icon: ShoppingCart,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      sub: 'Catalog items currently active',
      icon: Package,
      color: 'from-[#b45309] to-orange-600',
    },
    {
      label: 'Customers',
      value: stats.totalUsers,
      sub: 'Registered customer accounts',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: "Today's Revenue",
      value: `KSh ${stats.dailyRevenue?.toLocaleString() || 0}`,
      sub: 'Daily collection snapshot',
      icon: TrendingUp,
      color: 'from-cyan-500 to-sky-600',
    },
    {
      label: 'Monthly Revenue',
      value: `KSh ${stats.monthlyRevenue?.toLocaleString() || 0}`,
      sub: 'Current month performance',
      icon: Award,
      color: 'from-fuchsia-500 to-pink-600',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Products',
      desc: 'Update pricing, stock, and images.',
      to: '/admin/products',
      icon: Boxes,
    },
    {
      title: 'Orders & Delivery',
      desc: 'Process incoming and shipped orders.',
      to: '/admin/orders',
      icon: Truck,
    },
    {
      title: 'Customer Accounts',
      desc: 'Review users and access levels.',
      to: '/admin/users',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 p-5 sm:p-7">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-primary-600/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-44 h-44 bg-[#b45309] rounded-full blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Operations Center</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Monitor sales, manage products, and track delivery requests in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 min-w-[100px]">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Pending Ops</p>
              <p className="text-xl font-bold text-white mt-1">{pendingOpsCount}</p>
            </div>
            <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 min-w-[100px]">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Shipped</p>
              <p className="text-xl font-bold text-white mt-1">{shippedCount}</p>
            </div>
            <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 min-w-[100px]">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Delivered</p>
              <p className="text-xl font-bold text-white mt-1">{deliveredCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-black/20`}>
                <Icon size={18} className="text-white" />
              </div>
              <ArrowUpRight size={16} className="text-gray-500 dark:text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map(({ title, desc, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-primary-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/90 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center mb-3 group-hover:bg-primary-600/30">
              <Icon size={18} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{desc}</p>
          </Link>
        ))}
      </section>

      {/* Revenue chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Revenue (Last 6 Months)</h2>
          <span className="text-xs text-gray-500 dark:text-gray-500">KSh trend overview</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }}
              formatter={(v) => [`KSh ${v.toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Order status + Top products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order & Delivery Pipeline</h2>
          <div className="space-y-4">
            {(stats.ordersByStatus || []).map(({ _id, count }) => {
              const percent = Math.round((count / totalOps) * 100);
              return (
                <div key={_id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
                      <Clock3 size={14} className="text-gray-500 dark:text-gray-500" /> {_id}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-[#b45309]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Products</h2>
          <div className="space-y-3">
            {stats.topProducts?.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-500 text-sm w-5">{i + 1}.</span>
                {isVideoUrl(p.images?.[0]) ? (
                  <video src={p.images?.[0]} className="w-8 h-8 rounded-lg object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={p.images?.[0] || 'https://placehold.co/32x32'} alt={p.name}
                    className="w-8 h-8 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{p.soldCount} sold</p>
                </div>
                <span className="text-sm font-bold text-primary-400">KSh {p.price?.toLocaleString()}</span>
              </div>
            ))}
            {!stats.topProducts?.length && (
              <p className="text-sm text-gray-600 dark:text-gray-500">No product sales data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

