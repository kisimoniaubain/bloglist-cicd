import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../redux/slices/wishlistSlice';
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyImageFallback, isVideoUrl, normalizeProductImages } from '../utils/imageUrl';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: wishlist } = useSelector((s) => s.wishlist);
  const { user } = useSelector((s) => s.auth);
  const isWishlisted = wishlist.some((i) => i._id === product._id);
  const images = useMemo(
    () => normalizeProductImages(product.images),
    [product.images, product._id]
  );
  const [activeImage, setActiveImage] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const previewThumbs = images.slice(0, 5);
  const remainingThumbs = images.length - previewThumbs.length;

  useEffect(() => {
    setActiveImage(0);
  }, [product._id]);

  useEffect(() => {
    if (images.length <= 1 || isCarouselPaused) return undefined;
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 2300);
    return () => clearInterval(timer);
  }, [images, isCarouselPaused]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, qty: 1 }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(toggleWishlistAsync(product));
  };

  const showPrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const showNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  return (
    <Link to={`/products/${product._id}`} className="group card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-50"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        {isVideoUrl(images[activeImage]) ? (
          <video
            src={images[activeImage]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={images[activeImage]}
            alt={product.name}
            onError={(e) => applyImageFallback(e, activeImage)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={showPrevImage}
              className="touch-visible-control absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={showNextImage}
              className="touch-visible-control absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5">
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={`${product._id}-dot-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImage(idx);
                }}
                onMouseEnter={() => setActiveImage(idx)}
                className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 badge bg-red-500 text-white">
            -{product.discountPercent}%
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
          KSh {displayPrice.toLocaleString()}
        </span>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Out of Stock</span>
          </div>
        )}
        {/* Wishlist btn */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{product.category}</p>
        <h3 className="font-semibold text-gray-900 text-[13px] sm:text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {product.images?.length > 1 && (
          <div className="flex gap-1.5 pt-0.5">
            {previewThumbs.map((img, idx) => {
              const isActiveThumb = images[activeImage] === img;
              return (
              isVideoUrl(img) ? (
                <video
                  key={`${product._id}-thumb-${idx}`}
                  src={img}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border object-cover ${isActiveThumb ? 'border-primary-500 ring-1 ring-primary-400' : 'border-gray-200'}`}
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  key={`${product._id}-thumb-${idx}`}
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  onError={(e) => applyImageFallback(e, idx)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border object-cover ${isActiveThumb ? 'border-primary-500 ring-1 ring-primary-400' : 'border-gray-200'}`}
                />
              )
              );
            })}
            {remainingThumbs > 0 && (
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border border-gray-200 bg-gray-50 text-[10px] text-gray-600 flex items-center justify-center">
                +{remainingThumbs}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-[#b45309] fill-[#b45309]" />
            <span className="text-xs text-gray-600">{product.rating?.toFixed(1)} ({product.numReviews})</span>
          </div>
        )}

        {product.soldCount > 0 && (
          <p className="text-xs text-emerald-700 font-medium">{product.soldCount} sold</p>
        )}

        {/* Price + Cart */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div>
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              KSh {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1">
                KSh {product.price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="p-2.5 sm:p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </Link>
  );
}

