import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeatured, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { ShoppingBag, Truck, Shield, RotateCcw, ArrowRight, Zap, ShoppingCart, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const features = [
  { icon: ShoppingCart, title: 'Shopping Cart', desc: 'Add products, update quantity, and apply coupon before checkout.' },
  { icon: Truck, title: 'Free Shipping', desc: 'Get free shipping automatically on orders above KSh 2,000.' },
  { icon: Shield, title: 'Secure Payment', desc: 'Pay safely with M-Pesa, Stripe, PayPal, or Cash on Delivery.' },
  { icon: RotateCcw, title: 'Easy Return', desc: 'Request returns within 30 days using your order details.' },
  { icon: Zap, title: 'Fast Delivery', desc: 'Express and same-day options available in select locations.' },
];

const suggestedFurnitureCategories = [
  { label: 'Chairs', keyword: 'chair' },
  { label: 'Tables', keyword: 'table' },
  { label: 'Beds', keyword: 'bed' },
  { label: 'Sofas / Salon', keyword: 'sofa' },
  { label: 'Doors', keyword: 'door' },
  { label: 'Windows', keyword: 'window' },
  { label: 'Wardrobes', keyword: 'wardrobe' },
  { label: 'Cabinets', keyword: 'cabinet' },
  { label: 'Shelves', keyword: 'shelf' },
  { label: 'TV Stands', keyword: 'tv stand' },
  { label: 'Dining Sets', keyword: 'dining' },
  { label: 'Office Furniture', keyword: 'office' },
  { label: 'Outdoor Furniture', keyword: 'outdoor' },
  { label: 'Kids Furniture', keyword: 'kids' },
];

export default function Home() {
  const dispatch = useDispatch();
  const { featured, categories, loading } = useSelector((s) => s.products);
  const { t } = useLanguage();

  useEffect(() => {
    dispatch(fetchFeatured());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="relative text-white overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1600')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium mb-5 sm:mb-6">
              <Zap size={14} /> {t('home.heroBadge', 'New arrivals every week')}
            </span>
            <h1 className="text-[2rem] leading-tight sm:text-6xl font-extrabold mb-5 sm:mb-6">
              {t('home.heroTitle1', 'Curated Furniture,')}<br />
              <span className="text-[#b45309]">{t('home.heroTitle2', 'Crafted For Living.')}</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 leading-relaxed">
              {t('home.heroDesc', 'Discover modern sofas, dining sets, bedroom pieces, and statement decor designed to elevate every room. Enjoy secure checkout with M-Pesa, Stripe, and more, plus fast delivery across Kenya.')}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <Link to="/products" className="inline-flex items-center justify-center gap-2 bg-[#b45309] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#92400e] transition-colors w-full sm:w-auto shadow-md shadow-[#b45309]">
                <ShoppingBag size={18} /> {t('common.shopNow', 'Shop Now')}
              </Link>
              <Link to="/products?sort=popular" className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto">
                {t('home.bestSellers', 'Best Sellers')} <ArrowRight size={18} />
              </Link>
              <Link to="/explore" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors w-full sm:w-auto border border-white/40">
                <Eye size={18} /> Explore Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-4 sm:p-5 text-center hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {(categories.length > 0 || suggestedFurnitureCategories.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
              {t('common.viewAll', 'View all')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {suggestedFurnitureCategories.map((item) => (
              <Link
                key={item.label}
                to={`/products?keyword=${encodeURIComponent(item.keyword)}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-[#b45309] border border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/15 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary-600 hover:text-primary-600 transition-colors"
              >
                {cat}
              </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-500 text-sm mt-1">{t('home.handpicked', 'Handpicked for you')}</p>
          </div>
          <Link to="/products" className="btn-outline text-sm py-2 px-4">
            {t('common.viewAll', 'View All')}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader text="Loading products..." /></div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
            <p>No featured products yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#b45309] rounded-2xl p-6 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Get 20% Off Your First Order</h2>
          <p className="text-white/90 mb-6">{t('home.useCode', 'Use code')} <strong className="bg-white/20 px-2 py-0.5 rounded">SOLDY20</strong> {t('home.atCheckout', 'at checkout')}</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 font-bold px-6 py-3">
            {t('common.startShopping', 'Start Shopping')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

