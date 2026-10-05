const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

const normalizeImageUrl = (raw, req) => {
  const value = String(raw || '').trim();
  if (!value) return '';

  const origin = `${req.protocol}://${req.get('host')}`;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      const isLocalOrLegacyHost = ['localhost', '127.0.0.1', 'soldyhome-1.onrender.com', 'soldyhomeshop.onrender.com']
        .includes(parsed.hostname);

      if (isLocalOrLegacyHost && parsed.pathname.startsWith('/uploads/')) {
        return `${origin}${parsed.pathname}`;
      }
      return value;
    } catch {
      return value;
    }
  }

  if (value.startsWith('/uploads/')) return `${origin}${value}`;
  if (value.startsWith('uploads/')) return `${origin}/${value}`;
  return value;
};

const normalizeProductImages = (product, req) => {
  if (!product || !Array.isArray(product.images)) return product;
  product.images = product.images.map((img) => normalizeImageUrl(img, req)).filter(Boolean);
  return product;
};

// @desc    Get all products
// @route   GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 12;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};
  const categoryFilter = req.query.category ? { category: req.query.category } : {};
  const priceFilter =
    req.query.minPrice || req.query.maxPrice
      ? {
          price: {
            ...(req.query.minPrice && { $gte: Number(req.query.minPrice) }),
            ...(req.query.maxPrice && { $lte: Number(req.query.maxPrice) }),
          },
        }
      : {};

  const filter = { isActive: true, ...keyword, ...categoryFilter, ...priceFilter };

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'rating': { rating: -1 },
    'newest': { createdAt: -1 },
    'popular': { soldCount: -1 },
  };
  const sortBy = sortMap[req.query.sort] || { createdAt: -1 };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortBy)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  products.forEach((p) => normalizeProductImages(p, req));

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  normalizeProductImages(product, req);
  res.json({ success: true, product });
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  normalizeProductImages(product, req);
  res.json({ success: true, product });
});

// @desc    Get featured products
// @route   GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true }).limit(8);
  products.forEach((p) => normalizeProductImages(p, req));
  res.json({ success: true, products });
});

// @desc    Get categories
// @route   GET /api/products/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json({ success: true, categories });
});

// @desc    Get products for current seller
// @route   GET /api/products/mine
const getMyProducts = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { seller: req.user._id };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  products.forEach((p) => normalizeProductImages(p, req));
  res.json({ success: true, products });
});

// @desc    Create product (admin)
// @route   POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, seller: req.user._id });
  res.status(201).json({ success: true, product });
});

// @desc    Update product (seller/admin)
// @route   PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const isOwner = product.seller?.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  Object.assign(product, req.body);
  const updatedProduct = await product.save();
  normalizeProductImages(updatedProduct, req);
  res.json({ success: true, product: updatedProduct });
});

// @desc    Delete product (seller/admin)
// @route   DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const isOwner = product.seller?.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  getFeaturedProducts,
  getCategories,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
