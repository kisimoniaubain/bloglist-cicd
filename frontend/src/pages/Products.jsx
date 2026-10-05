import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import furnitureProducts from '../data/furnitureProducts';
import { SlidersHorizontal, X, Eye, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Zap, Star, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { applyImageFallback, normalizeImageUrl } from '../utils/imageUrl';

export default function Products() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, total, pages } = useSelector((s) => s.products);
  const { categories } = useSelector((s) => s.products);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [bestSellingPhotoIndex, setBestSellingPhotoIndex] = useState(0);
  const [showBestSellingGallery, setShowBestSellingGallery] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const { t } = useLanguage();

  const sortOptions = [
    { value: 'newest', label: t('common.newest', 'Newest'), icon: Clock },
    { value: 'price-asc', label: t('common.priceLowHigh', 'Price: Low to High'), icon: ArrowUp },
    { value: 'price-desc', label: t('common.priceHighLow', 'Price: High to Low'), icon: ArrowDown },
    { value: 'rating', label: t('common.topRated', 'Top Rated'), icon: Star },
    { value: 'popular', label: t('common.mostPopular', 'Most Popular'), icon: TrendingUp },
  ];

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const showcaseSource = furnitureProducts.filter((p) => p.isActive);
  const topFurniture = [...showcaseSource]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 8);
  const furniturePhotoShowcase = showcaseSource
    .flatMap((p) =>
      (p.images || []).map((img, idx) => ({
        id: `${p._id}-${idx}`,
        productId: p._id,
        image: img,
        name: p.name,
        price: p.discountPrice || p.price,
      }))
    )
    .slice(0, 36);
  const bestSellingPhotos = topFurniture.flatMap((p) =>
    (p.images || []).map((img, idx) => ({
      id: `${p._id}-best-${idx}`,
      productId: p._id,
      image: img,
      name: p.name,
      price: p.discountPrice || p.price,
    }))
  );

  const closePreview = () => setPreviewPhoto(null);
  const closeBestSellingGallery = () => setShowBestSellingGallery(false);

  const displayedProducts = useMemo(() => {
    const sorted = [...items];
    const priceOf = (p) => Number(p.discountPrice || p.price || 0);
    const idToTimestamp = (id) => {
      const raw = String(id || '');

      // Mongo ObjectId stores creation timestamp in first 8 hex chars.
      if (/^[a-f0-9]{24}$/i.test(raw)) {
        return parseInt(raw.slice(0, 8), 16) * 1000;
      }

      // Fallback for IDs like furniture-012.
      const numericTail = raw.match(/(\d+)(?!.*\d)/);
      if (numericTail) return Number(numericTail[1]);

      return 0;
    };
    const newestScore = (p) => {
      const created = new Date(p.createdAt || 0).getTime();
      if (!Number.isNaN(created) && created > 0) return created;
      const updated = new Date(p.updatedAt || 0).getTime();
      if (!Number.isNaN(updated) && updated > 0) return updated;
      return idToTimestamp(p._id);
    };

    if (sort === 'price-asc') {
      return sorted.sort((a, b) => priceOf(a) - priceOf(b));
    }
    if (sort === 'price-desc') {
      return sorted.sort((a, b) => priceOf(b) - priceOf(a));
    }
    if (sort === 'rating') {
      return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    if (sort === 'popular') {
      return sorted.sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0));
    }
    if (sort === 'newest') {
      return sorted.sort((a, b) => {
        const scoreDiff = newestScore(b) - newestScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return String(b._id).localeCompare(String(a._id));
      });
    }

    return sorted;
  }, [items, sort]);

  const showPrevBestSellingPhoto = () => {
    setBestSellingPhotoIndex((prev) => (prev - 1 + bestSellingPhotos.length) % bestSellingPhotos.length);
  };

  const showNextBestSellingPhoto = () => {
    setBestSellingPhotoIndex((prev) => (prev + 1) % bestSellingPhotos.length);
  };

  const onBestSellingTouchStart = (e) => {
    setTouchStartX(e.changedTouches?.[0]?.clientX || null);
  };

  const onBestSellingTouchEnd = (e) => {
    const endX = e.changedTouches?.[0]?.clientX;
    if (touchStartX === null || typeof endX !== 'number') return;
    const delta = endX - touchStartX;
    if (Math.abs(delta) < 45) return;
    if (delta > 0) showPrevBestSellingPhoto();
    else showNextBestSellingPhoto();
    setTouchStartX(null);
  };

  useEffect(() => {
    dispatch(fetchProducts({ keyword, category, sort, page, minPrice, maxPrice }));
    dispatch(fetchCategories());
  }, [keyword, category, sort, page, minPrice, maxPrice]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSortDropdown && !e.target.closest('[data-sort-dropdown]')) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortDropdown]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {keyword ? `Results for "${keyword}"` : category || t('common.allProducts', 'All Products')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} products found</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none" data-sort-dropdown="container">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              data-sort-dropdown="button"
              className="w-full sm:w-auto flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:border-[#b45309] hover:shadow-md transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                {(() => {
                  const current = sortOptions.find((o) => o.value === sort);
                  const Icon = current?.icon || Clock;
                  return (
                    <>
                      <Icon size={16} className="text-[#b45309]" />
                      <span className="hidden sm:inline">{current?.label || 'Sort'}</span>
                      <span className="sm:hidden text-xs">Sort</span>
                    </>
                  );
                })()}
              </span>
              <ChevronDown size={14} className={`text-gray-600 transition-transform ${
                showSortDropdown ? 'rotate-180' : ''
              }`} />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = sort === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateParam('sort', option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-[#b45309] text-white font-semibold border-l-4 border-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 btn-secondary text-sm py-2 whitespace-nowrap"
          >
            <SlidersHorizontal size={16} /> {t('common.filters', 'Filters')}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 sm:p-5 mb-6 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className="input text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Min Price (KSh)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                placeholder="0"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Max Price (KSh)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="999999"
                className="input text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchParams({})}
                className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
              >
                <X size={14} /> {t('common.clearFilters', 'Clear Filters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[['keyword', keyword], ['category', category], ['minPrice', minPrice && `Min: KSh ${minPrice}`],
          ['maxPrice', maxPrice && `Max: KSh ${maxPrice}`]].map(([key, val]) =>
          val ? (
            <span key={key} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 rounded-full">
              {val}
              <button onClick={() => updateParam(key, '')}><X size={10} /></button>
            </span>
          ) : null
        )}
      </div>

      {/* Furniture photo showcase */}
      {!keyword && !category && furniturePhotoShowcase.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Furniture Photo Showcase</h2>
              <p className="text-sm text-gray-500">{t('products.furnitureShowcaseDesc', 'More furniture product photos to explore before you shop')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {furniturePhotoShowcase.map((photo) => (
              <article
                key={photo.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow"
              >
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(photo)}
                  className="relative aspect-square overflow-hidden bg-gray-100 w-full"
                  aria-label={`Preview ${photo.name}`}
                >
                  <img
                    src={normalizeImageUrl(photo.image)}
                    alt={photo.name}
                    onError={(e) => applyImageFallback(e, 0)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                    KSh {photo.price.toLocaleString()}
                  </span>
                  <span className="absolute right-2 bottom-2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow">
                    <Eye size={14} />
                  </span>
                </button>
                <div className="px-2.5 py-2">
                  <p className="text-[11px] text-gray-600 line-clamp-1">{photo.name}</p>
                  <p className="text-xs font-semibold text-gray-900 mt-1">KSh {photo.price.toLocaleString()}</p>
                  <Link to={`/products/${photo.productId}`} className="text-[11px] text-primary-600 hover:underline mt-1 inline-block">
                    {t('products.openProduct', 'Open product')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4" onClick={closePreview}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start sm:items-center justify-between text-white mb-3 gap-3">
              <div>
                <p className="font-semibold">{previewPhoto.name}</p>
                <p className="text-sm text-white/80">KSh {previewPhoto.price.toLocaleString()}</p>
              </div>
              <button type="button" onClick={closePreview} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
            <img
              src={normalizeImageUrl(previewPhoto.image)}
              alt={previewPhoto.name}
              onError={(e) => applyImageFallback(e, 1)}
              className="w-full max-h-[72vh] sm:max-h-[78vh] object-contain rounded-xl bg-black"
            />
          </div>
        </div>
      )}

      {/* Furniture best-sellers */}
      {!keyword && !category && topFurniture.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Best-Selling Furniture</h2>
              <p className="text-sm text-gray-500">{t('products.bestSellingDesc', 'Trending furniture products people are buying now')}</p>
            </div>
            {bestSellingPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setBestSellingPhotoIndex(0);
                  setShowBestSellingGallery(true);
                }}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Eye size={14} /> {t('products.viewBestSellingPhotos', 'View Best-Selling Photos')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            {topFurniture.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {showBestSellingGallery && bestSellingPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4" onClick={closeBestSellingGallery}>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white mb-3">
              <div>
                <p className="font-semibold">{bestSellingPhotos[bestSellingPhotoIndex].name}</p>
                <p className="text-sm text-white/80">KSh {bestSellingPhotos[bestSellingPhotoIndex].price.toLocaleString()}</p>
              </div>
              <button type="button" onClick={closeBestSellingGallery} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <X size={18} />
              </button>
            </div>

            <div
              className="relative rounded-xl overflow-hidden bg-black"
              onTouchStart={onBestSellingTouchStart}
              onTouchEnd={onBestSellingTouchEnd}
            >
              <img
                src={normalizeImageUrl(bestSellingPhotos[bestSellingPhotoIndex].image)}
                alt={bestSellingPhotos[bestSellingPhotoIndex].name}
                onError={(e) => applyImageFallback(e, bestSellingPhotoIndex)}
                className="w-full max-h-[68vh] sm:max-h-[72vh] object-contain"
              />
              {bestSellingPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevBestSellingPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={showNextBestSellingPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-white/70">
                {t('products.photoOf', 'Photo')} {bestSellingPhotoIndex + 1} {t('products.of', 'of')} {bestSellingPhotos.length}
              </p>
              <p className="hidden sm:block text-xs text-white/60">{t('products.swipeHint', 'Swipe left or right on mobile')}</p>
              <Link
                to={`/products/${bestSellingPhotos[bestSellingPhotoIndex].productId}`}
                className="text-sm text-white hover:underline"
                onClick={closeBestSellingGallery}
              >
                {t('products.openProductPage', 'Open product page')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader size="lg" text="Loading products..." /></div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-medium">{t('common.noProductsFound', 'No products found')}</p>
          <p className="text-sm mt-2">{t('products.noProductsHint', 'Try adjusting your search or filters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayedProducts.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam('page', p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                p === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

