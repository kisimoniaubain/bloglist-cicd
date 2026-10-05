import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartQty, removeFromCart, applyCoupon, removeCoupon } from '../redux/slices/cartSlice';
import Loader from '../components/Loader';
import { Trash2, Plus, Minus, Tag, ShoppingBag, ArrowRight, ShieldCheck, Truck, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, couponDiscount, loading } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const isLoggedOut = !user;
  const { t } = useLanguage();

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch, user?._id]);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.qty, 0);
  const shippingFee = subtotal > 2000 ? 0 : 200;
  const estimatedTax = Math.round(Math.max(0, subtotal - couponDiscount) * 0.16);
  const total = subtotal - couponDiscount + shippingFee;
  const estimatedPayable = total + estimatedTax;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    await dispatch(applyCoupon(couponCode));
    setApplyingCoupon(false);
    setCouponCode('');
  };

  if (loading) return <div className="flex justify-center py-24"><Loader size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">{t('cart.shoppingCart', 'Shopping Cart')} ({totalUnits})</h1>

      {isLoggedOut && (
        <div className="mb-6 rounded-xl border border-[#b45309] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{t('common.loginRequiredCart', 'Log in to view and use your cart. When no account is logged in, the cart stays empty.')}</p>
          <Link to="/login" className="text-xs font-semibold text-white border border-[#b45309] bg-[#b45309] px-3 py-1.5 rounded-lg hover:bg-[#92400e] w-fit">
            {t('common.signIn', 'Sign In')}
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag size={60} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">{isLoggedOut ? t('cart.loginToView', 'Log in to view your cart') : t('cart.emptyTitle', 'Your cart is empty')}</h2>
          <p className="text-gray-400 mb-6">{isLoggedOut ? t('cart.loginToUseCart', 'Please sign in first. Cart items belong to a logged-in account.') : t('cart.emptyDesc', 'Add some products to get started')}</p>
          <Link to={isLoggedOut ? '/login' : '/products'} className="btn-primary">{isLoggedOut ? t('common.signIn', 'Sign In') : t('common.startShopping', 'Start Shopping')}</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to={`/products/${item.product?._id || item.product}`}>
                  <img
                    src={item.product?.images?.[0] || 'https://placehold.co/100x100'}
                    alt={item.product?.name}
                    className="w-full sm:w-20 h-44 sm:h-20 object-cover rounded-xl"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product?._id || item.product}`}
                    className="font-semibold text-gray-900 text-sm hover:text-primary-600 line-clamp-2">
                    {item.product?.name || 'Product'}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    Unit: KSh {item.price.toLocaleString()} x {item.qty}
                  </p>
                  <p className="text-primary-600 font-bold mt-1">KSh {item.price.toLocaleString()}</p>
                  <div className="flex items-center justify-between sm:justify-start gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => dispatch(updateCartQty({ productId: item.product?._id || item.product, qty: item.qty - 1 }))}
                        disabled={item.qty <= 1} className="p-2 hover:bg-gray-50 rounded-l-lg disabled:opacity-40">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-medium">{item.qty}</span>
                      <button onClick={() => dispatch(updateCartQty({ productId: item.product?._id || item.product, qty: item.qty + 1 }))}
                        className="p-2 hover:bg-gray-50 rounded-r-lg">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      KSh {(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button onClick={() => dispatch(removeFromCart(item.product?._id || item.product))}
                  className="text-gray-300 hover:text-red-500 transition-colors self-end sm:self-start p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-primary-600" /> {t('cart.couponCode', 'Coupon Code')}
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="input text-sm flex-1"
                />
                <button onClick={handleApplyCoupon} disabled={applyingCoupon}
                  className="btn-primary text-sm px-4 sm:w-auto w-full">
                  {applyingCoupon ? '...' : t('common.apply', 'Apply')}
                </button>
              </div>
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between mt-2 text-green-600 text-sm">
                  <span>✓ {t('cart.couponApplied', 'Coupon applied')}</span>
                  <button onClick={() => dispatch(removeCoupon())} className="text-red-400 text-xs hover:underline">{t('common.remove', 'Remove')}</button>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">{t('common.orderSummary', 'Order Summary')}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('cart.subtotal', 'Subtotal')} ({totalUnits} items)</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('cart.couponDiscount', 'Coupon Discount')}</span>
                  <span>-KSh {couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('cart.shipping', 'Shipping')}</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? 'FREE' : `KSh ${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('cart.estimatedVat', 'Estimated VAT (16%)')}</span>
                <span>KSh {estimatedTax.toLocaleString()}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-gray-400">Add KSh {(2000 - subtotal).toLocaleString()} more for free shipping</p>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold text-gray-900">
                <span>{t('cart.cartTotal', 'Cart Total')}</span>
                <span className="text-primary-600 text-lg">KSh {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>{t('cart.estimatedPayable', 'Estimated Payable')}</span>
                <span>KSh {estimatedPayable.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400">{t('cart.finalTaxNote', 'Final tax and delivery are confirmed during checkout.')}</p>
              <button
                onClick={() => user ? navigate('/checkout') : navigate('/login')}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {t('common.proceedToCheckout', 'Proceed to Checkout')} <ArrowRight size={16} />
              </button>
              <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-primary-600 mt-2">
                {t('common.continueShopping', 'Continue Shopping')}
              </Link>
            </div>

            {/* Must-have in cart */}
            <div className="card p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 mb-3">What Must Be In Cart</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 mt-0.5" />
                  <span>Each cart item should show product image, product name, unit price, and quantity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Truck size={16} className="text-primary-600 mt-0.5" />
                  <span>Cart summary should include subtotal, shipping fee, tax estimate, and final payable amount.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Tag size={16} className="text-[#b45309] mt-0.5" />
                  <span>Delivery location, phone number, and coupon code (if any) should be ready before checkout.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

