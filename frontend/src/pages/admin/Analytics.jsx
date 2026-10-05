import { useEffect, useState } from 'react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader size="lg" /></div>;
  if (!stats) return null;

  const pieData = stats.ordersByStatus?.map(({ _id, count }) => ({ name: _id, value: count })) || [];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>

      {/* Revenue trend */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Revenue Trend (6 Months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={stats.monthlyData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }}
              formatter={(v) => [`KSh ${v.toLocaleString()}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders by status pie */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {stats.topProducts?.map((p, i) => (
              <div key={p._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{p.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{p.soldCount} sold</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (p.soldCount / (stats.topProducts[0]?.soldCount || 1)) * 100)}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Conversion Rate', value: `${stats.totalOrders > 0 ? ((stats.totalOrders / Math.max(1, stats.totalUsers)) * 100).toFixed(1) : 0}%` },
          { label: 'Avg Order Value', value: `KSh ${stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}` },
          { label: 'Total Products', value: stats.totalProducts },
          { label: 'Total Customers', value: stats.totalUsers },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-primary-400">{value}</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
