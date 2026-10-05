import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../redux/slices/wishlistSlice';
import Loader from '../components/Loader';
import StarRating from '../components/StarRating';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Truck, Shield, Star, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { applyImageFallback, isVideoUrl, normalizeProductImages } from '../utils/imageUrl';

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct: product, loading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: wishlist } = useSelector((s) => s.wishlist);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const isWishlisted = wishlist.some((i) => i._id === id);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [id, dispatch]);

  if (loading) return <div className="flex justify-center py-24"><Loader size="lg" /></div>;
  if (!product) return <div className="text-center py-24 text-gray-400">Product not found</div>;

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const images = normalizeProductImages(product.images);

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, qty }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${product._id}`, { rating: reviewRating, comment: reviewText });
      toast.success('Review submitted!');
      setReviewText('');
      dispatch(fetchProductById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
            {isVideoUrl(images[imgIndex]) ? (
              <video
                src={images[imgIndex]}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={images[imgIndex]}
                alt={product.name}
                onError={(e) => applyImageFallback(e, imgIndex)}
                className="w-full h-full object-cover"
              />
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setImgIndex((p) => (p + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex ? 'border-primary-600' : 'border-transparent'}`}>
                  {isVideoUrl(img) ? (
                    <video src={img} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img
                      src={img}
                      alt=""
                      onError={(e) => applyImageFallback(e, i)}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <StarRating rating={product.rating} />
            <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900">KSh {displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-gray-400 line-through text-lg">KSh {product.price.toLocaleString()}</span>
                <span className="badge bg-red-100 text-red-600">-{product.discountPercent}%</span>
              </>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-700">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Qty + cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 hover:bg-gray-50 rounded-l-xl">
                <Minus size={16} />
              </button>
              <span className="px-4 font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2.5 hover:bg-gray-50 rounded-r-xl">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button onClick={() => { if (!user) { navigate('/login'); return; } dispatch(toggleWishlistAsync(product)); }}
              className={`p-3 rounded-xl border transition-colors ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}>
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Delivery info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck size={16} className="text-primary-600" />
              Estimated delivery: {product.deliveryDays} business days
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={16} className="text-primary-600" />
              Secure payment with Stripe & M-Pesa
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews ({product.numReviews})</h2>

        {/* Write review */}
        {user && (
          <form onSubmit={handleSubmitReview} className="card p-6 mb-8">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setReviewRating(r)}>
                  <Star size={24} className={r <= reviewRating ? 'text-[#b45309] fill-[#b45309]' : 'text-gray-200'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              required
              className="input mb-3 resize-none"
            />
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Review list */}
        <div className="space-y-4">
          {product.reviews?.filter((r) => r.isApproved).map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600">{r.name[0]}</span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">{r.name}</span>
                </div>
                <StarRating rating={r.rating} size={14} />
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {(!product.reviews || product.reviews.filter(r => r.isApproved).length === 0) && (
            <p className="text-gray-400 text-sm text-center py-8">No reviews yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}

