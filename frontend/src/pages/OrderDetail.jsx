import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, cancelOrder } from '../redux/slices/orderSlice';
import Loader from '../components/Loader';
import { ChevronLeft, MapPin, Package, CreditCard, Truck } from 'lucide-react';

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending: 'bg-[#b45309] text-white',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, loading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  if (loading) return <div className="flex justify-center py-24"><Loader size="lg" /></div>;
  if (!order) return <div className="text-center py-24 text-gray-400">Order not found</div>;

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.invoiceNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'} capitalize text-sm px-3 py-1`}>
          {order.status}
        </span>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i <= stepIndex ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{i + 1}</div>
                <span className={`hidden sm:block text-xs ml-1 ${i <= stepIndex ? 'text-primary-600 font-medium' : 'text-gray-400'} capitalize`}>{s}</span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < stepIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Package size={16} className="text-primary-600" /> Order Items</h3>
          <div className="divide-y divide-gray-50">
            {order.orderItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <img src={item.image || 'https://placehold.co/60x60'} alt={item.name}
                  className="w-14 h-14 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.qty}</p>
                </div>
                <span className="font-bold text-sm">KSh {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary-600" /> Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Payment summary */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard size={16} className="text-primary-600" /> Payment</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-600"><span>Method</span><span className="capitalize font-medium">{order.paymentMethod}</span></div>
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>KSh {order.subtotal?.toLocaleString()}</span></div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-KSh {order.couponDiscount}</span></div>
            )}
            <div className="flex justify-between text-gray-600"><span>Delivery</span><span>KSh {order.deliveryFee}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>KSh {order.taxAmount?.toLocaleString()}</span></div>
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span className="text-primary-600">KSh {order.totalPrice.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Cancel */}
      {['pending', 'paid'].includes(order.status) && (
        <div className="mt-6">
          <button
            onClick={() => dispatch(cancelOrder(order._id))}
            className="text-red-500 border border-red-200 rounded-xl px-4 py-2 text-sm hover:bg-red-50 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}

