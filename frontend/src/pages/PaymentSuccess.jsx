import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-2">
          Your order has been successfully placed. You'll receive an email confirmation shortly.
        </p>
        {orderId && (
          <p className="text-sm text-gray-400 mb-8">Order ID: <span className="font-mono font-medium text-gray-600">{orderId}</span></p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-primary flex items-center justify-center gap-2">
              <Package size={16} /> View Order
            </Link>
          )}
          <Link to="/products" className="btn-secondary flex items-center justify-center gap-2">
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
