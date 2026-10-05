import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../redux/slices/orderSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Truck, CreditCard, CheckCircle, ChevronRight } from 'lucide-react';
import { isVideoUrl } from '../utils/imageUrl';

const steps = ['Shipping', 'Delivery', 'Payment', 'Review'];

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', desc: '3-5 business days', fee: 200 },
  { id: 'express', label: 'Express Delivery', desc: '1-2 business days', fee: 500 },
  { id: 'same-day', label: 'Same Day Delivery', desc: 'Order before 12pm', fee: 1000 },
];

const PAYMENT_OPTIONS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
];

const normalizeKenyanPhoneNumber = (rawValue) => {
  const digits = String(rawValue || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  return null;
};

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, couponDiscount } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const { loading } = useSelector((s) => s.orders);
  const [step, setStep] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    country: 'Kenya',
    postalCode: '',
  });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('mpesa');

  const deliveryFee = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.fee || 200;
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal - couponDiscount + deliveryFee + tax;

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(1);
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const orderData = {
        orderItems: items.map((i) => ({
          product: i.product?._id || i.product,
          name: i.product?.name || 'Product',
          image: i.product?.images?.[0] || '',
          price: i.price,
          qty: i.qty,
        })),
        shippingAddress: shipping,
        deliveryMethod: delivery,
        deliveryFee,
        paymentMethod: payment,
        couponDiscount,
        subtotal,
        taxAmount: tax,
        totalPrice: total,
      };

      const result = await dispatch(createOrder(orderData));
      if (createOrder.fulfilled.match(result)) {
        const orderId = result.payload._id;

        if (payment === 'mpesa') {
          // Local fallback orders cannot be paid via M-Pesa (no real DB record)
          if (String(orderId).startsWith('local-order-')) {
            toast('Order saved locally. Please log in to complete M-Pesa payment.', { icon: 'ℹ️' });
            navigate('/payment/success', { state: { orderId } });
            setProcessing(false);
            return;
          }

          const normalizedPhone = normalizeKenyanPhoneNumber(mpesaPhone || shipping.phone);
          if (!normalizedPhone) {
            toast.error('Enter a valid Safaricom number: 07XXXXXXXX or 2547XXXXXXXX.');
            setProcessing(false);
            return;
          }

          // Trigger M-Pesa STK push
          try {
            const { data } = await api.post('/payment/mpesa/initiate', {
              phone: normalizedPhone,
              amount: total,
              orderId,
            });

            const isSimulation = Boolean(data?.simulationEnabled)
              || String(data?.checkoutRequestId || '').startsWith('SIM-MPESA-');

            if (isSimulation) {
              toast.success('Order placed! (M-Pesa test mode — no real charge. Deploy to Render for live payments.)');
            } else {
              toast.success(data?.message || 'M-Pesa prompt sent. Check your phone and enter your PIN.');
            }
          } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const apiDetail = error?.response?.data?.error;
            toast.error(apiMessage || apiDetail || 'M-Pesa request failed.');
            return;
          }
        }

        navigate('/payment/success', { state: { orderId } });
      } else {
        toast.error(result.payload || 'Order failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto pb-1">
        <div className="flex items-center min-w-[560px] sm:min-w-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-[11px] sm:text-xs mt-1 font-medium ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0: Shipping */}
          {step === 0 && (
            <form onSubmit={handleShippingSubmit} className="card p-4 sm:p-6 space-y-4 animate-fade-in">
              <h2 className="font-bold text-lg flex items-center gap-2"><MapPin size={18} className="text-primary-600" /> Shipping Information</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {[['fullName', 'Full Name *'], ['phone', 'Phone Number *'], ['address', 'Street Address *'], ['city', 'City *'], ['country', 'Country'], ['postalCode', 'Postal Code']].map(([key, label]) => (
                  <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
                    <input
                      value={shipping[key]}
                      onChange={(e) => setShipping({ ...shipping, [key]: e.target.value })}
                      className="input"
                      required={label.includes('*')}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            </form>
          )}

          {/* Step 1: Delivery */}
          {step === 1 && (
            <div className="card p-4 sm:p-6 animate-fade-in">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-5"><Truck size={18} className="text-primary-600" /> Delivery Method</h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label key={opt.id} className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors ${delivery === opt.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} className="text-primary-600" />
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm">KSh {opt.fee}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-4 sm:p-6 animate-fade-in">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-5"><CreditCard size={18} className="text-primary-600" /> Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors ${payment === opt.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={opt.id} checked={payment === opt.id} onChange={() => setPayment(opt.id)} className="text-primary-600" />
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-medium text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {payment === 'mpesa' && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2">
                    Receiving Number: <span className="font-semibold text-gray-900">+254 798406723</span>
                  </p>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">M-Pesa Phone Number</label>
                  <input
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 254712345678"
                    className="input"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">Review Order <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-4 sm:p-6 animate-fade-in space-y-5">
              <h2 className="font-bold text-lg">Review Your Order</h2>
              <div className="text-sm space-y-1 bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-700">Shipping to:</p>
                <p className="text-gray-600">{shipping.fullName} • {shipping.phone}</p>
                <p className="text-gray-600">{shipping.address}, {shipping.city}, {shipping.country}</p>
              </div>
              <div className="text-sm bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-700">Delivery: {DELIVERY_OPTIONS.find(d => d.id === delivery)?.label}</p>
                <p className="font-medium text-gray-700 mt-1">Payment: {PAYMENT_OPTIONS.find(p => p.id === payment)?.label}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handlePlaceOrder} disabled={processing || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {processing ? 'Placing Order...' : '✓ Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card p-4 sm:p-5 space-y-3 h-fit">
          <h3 className="font-bold text-gray-900">Order Summary</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((i) => (
              <div key={i._id} className="flex items-center gap-2">
                {isVideoUrl(i.product?.images?.[0]) ? (
                  <video src={i.product?.images?.[0]} className="w-10 h-10 rounded-lg object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={i.product?.images?.[0] || 'https://placehold.co/40x40'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{i.product?.name || 'Product'}</p>
                  <p className="text-xs text-gray-500">x{i.qty}</p>
                </div>
                <span className="text-xs font-bold">KSh {(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <hr className="border-gray-100" />
          {[['Subtotal', `KSh ${subtotal.toLocaleString()}`],
            couponDiscount > 0 ? ['Discount', `-KSh ${couponDiscount.toLocaleString()}`] : null,
            ['Delivery', `KSh ${deliveryFee}`],
            ['Tax (16%)', `KSh ${tax.toLocaleString()}`]
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm text-gray-600">
              <span>{k}</span><span className={k === 'Discount' ? 'text-green-600' : ''}>{v}</span>
            </div>
          ))}
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-primary-600">KSh {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
