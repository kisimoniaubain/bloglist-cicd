import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const STATUS_COLORS = {
  pending: 'bg-[#b45309] text-white',
  paid: 'bg-blue-900 text-blue-400',
  processing: 'bg-purple-900 text-purple-400',
  shipped: 'bg-orange-900 text-orange-400',
  delivered: 'bg-green-900 text-green-400',
  cancelled: 'bg-red-900 text-red-400',
};

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadOrders = () => {
    setLoading(true);
    const url = filter ? `/orders?status=${filter}` : '/orders';
    api.get(url).then((r) => setOrders(r.data.orders)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Status updated');
      loadOrders();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 overflow-x-hidden">
          <button onClick={() => setFilter('')}
            className={`w-full min-w-0 px-2 py-1.5 rounded-lg text-[11px] sm:text-xs leading-tight font-medium transition-colors ${!filter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'}`}>
            All
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`w-full min-w-0 px-2 py-1.5 rounded-lg text-[11px] sm:text-xs leading-tight font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader /></div> : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {['Invoice', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-700 dark:text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-primary-400 font-mono text-xs">{o.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white font-medium">{o.user?.name}</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-400">{o.orderItems.length}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-bold">KSh {o.totalPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-400 capitalize">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'} capitalize text-xs`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-500">No orders found</div>
          )}
        </div>
      )}
    </div>
  );
}

