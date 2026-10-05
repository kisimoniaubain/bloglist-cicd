import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../redux/slices/orderSlice';
import Loader from '../components/Loader';
import { Package, ChevronRight, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_COLORS = {
  pending: 'bg-[#b45309] text-white',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function Orders() {
  const dispatch = useDispatch();
  const { list: orders, loading } = useSelector((s) => s.orders);
  const isWebsiteMode = !localStorage.getItem('soldyToken');
  const { t } = useLanguage();

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">{t('orders.title', 'My Orders')}</h1>

      {isWebsiteMode && (
        <div className="mb-6 rounded-xl border border-[#b45309] bg-[#b45309] px-4 py-3 text-sm text-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{t('common.websiteModeActive', 'Website mode active')}: showing orders saved locally on this device because your session token is unavailable or expired.</p>
          <Link to="/login" className="text-xs font-semibold text-[#b45309] border border-[#b45309] bg-white/70 px-3 py-1.5 rounded-lg hover:bg-white w-fit">
            {t('common.reconnectAccount', 'Reconnect Account')}
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader text="Loading orders..." /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={50} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-medium text-gray-600">{t('orders.emptyTitle', 'No orders yet')}</h2>
          <p className="text-gray-400 mt-1 mb-6">{t('orders.emptyDesc', 'Start shopping to see your orders here')}</p>
          <Link to="/products" className="btn-primary">{t('common.shopNow', 'Shop Now')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`}
              className="card p-4 sm:p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={20} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{order.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(order.orderItems?.length || 0)} item{(order.orderItems?.length || 0) > 1 ? 's' : ''} •{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0">
                <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'} capitalize`}>
                  {order.status}
                </span>
                <span className="font-bold text-gray-900 text-sm">KSh {order.totalPrice.toLocaleString()}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

