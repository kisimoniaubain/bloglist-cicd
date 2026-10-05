import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toggleWishlistAsync } from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { Heart, ShoppingCart } from 'lucide-react';
import { applyImageFallback, isVideoUrl, normalizeImageUrl } from '../utils/imageUrl';

export default function Wishlist() {
  const { items } = useSelector((s) => s.wishlist);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoggedOut = !user;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wishlist ({items.length})</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={50} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-medium text-gray-600">{isLoggedOut ? 'Log in to view your wishlist' : 'Your wishlist is empty'}</h2>
          <p className="text-gray-400 mt-1 mb-6">{isLoggedOut ? 'Please sign in first. Wishlist items are only shown for logged-in users.' : 'Save items you love to buy later'}</p>
          <Link to={isLoggedOut ? '/login' : '/products'} className="btn-primary">{isLoggedOut ? 'Sign In' : 'Explore Products'}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <div key={product._id} className="card overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Link to={`/products/${product._id}`}>
                  {isVideoUrl(product.images?.[0]) ? (
                    <video
                      src={normalizeImageUrl(product.images?.[0])}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img src={normalizeImageUrl(product.images?.[0]) || 'https://placehold.co/300x300'} alt={product.name}
                      onError={(e) => applyImageFallback(e, 0)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </Link>
                <button onClick={() => dispatch(toggleWishlistAsync(product))}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                  <Heart size={14} fill="currentColor" />
                </button>
              </div>
              <div className="p-4">
                <Link to={`/products/${product._id}`}
                  className="font-medium text-sm text-gray-900 hover:text-primary-600 line-clamp-2">
                  {product.name}
                </Link>
                <p className="font-bold text-gray-900 mt-1">
                  KSh {(product.discountPrice || product.price).toLocaleString()}
                </p>
                <button
                  onClick={() => { if (!user) { navigate('/login'); return; } dispatch(addToCart({ productId: product._id, qty: 1 })); }}
                  className="mt-3 w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={14} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
