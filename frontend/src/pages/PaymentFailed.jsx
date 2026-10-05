import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentFailed() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-8">
          Something went wrong with your payment. Please try again or use a different payment method.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/checkout" className="btn-primary flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Try Again
          </Link>
          <Link to="/cart" className="btn-secondary">Back to Cart</Link>
        </div>
      </div>
    </div>
  );
}
