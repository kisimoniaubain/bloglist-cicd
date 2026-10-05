const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const toObjectId = (value) => {
  const str = String(value || '').trim();
  if (!str || !mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

const getSafeWishlistPayload = async (userId) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return {
      _id: null,
      user: userId,
      products: [],
    };
  }

  // Read the raw document to avoid schema-cast crashes from malformed legacy data.
  const raw = await Wishlist.collection.findOne({ user: userObjectId });
  if (!raw) {
    return {
      _id: null,
      user: userObjectId,
      products: [],
    };
  }

  const rawIds = Array.isArray(raw.products) ? raw.products : [];
  const validIds = [...new Set(rawIds.map((id) => String(id || '').trim()).filter((id) => mongoose.Types.ObjectId.isValid(id)))];

  if (!validIds.length) {
    return {
      _id: raw._id,
      user: raw.user,
      products: [],
    };
  }

  const products = await Product.find({ _id: { $in: validIds } }).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  const orderedProducts = validIds.map((id) => byId.get(id)).filter(Boolean);

  return {
    _id: raw._id,
    user: raw.user,
    products: orderedProducts,
  };
};

// @desc    Get current user's wishlist count
// @route   GET /api/wishlist/count
// @access  Private
const getWishlistCount = asyncHandler(async (req, res) => {
  try {
    const payload = await getSafeWishlistPayload(req.user?._id);
    const count = Array.isArray(payload.products) ? payload.products.length : 0;
    return res.status(200).json({ success: true, count });
  } catch (_error) {
    // Never crash the UI count badge due to data inconsistencies.
    return res.status(200).json({ success: true, count: 0 });
  }
});

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  try {
    const wishlist = await getSafeWishlistPayload(req.user?._id);
    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (_error) {
    return res.status(200).json({
      success: true,
      wishlist: {
        _id: null,
        user: req.user?._id || null,
        products: [],
      },
    });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userObjectId = toObjectId(req.user?._id);
  const productObjectId = toObjectId(productId);

  if (!productId || !productObjectId) {
    res.status(400);
    throw new Error('Valid product ID is required');
  }

  if (!userObjectId) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  const product = await Product.findById(productObjectId).select('_id');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await Wishlist.findOneAndUpdate(
    { user: userObjectId },
    {
      $setOnInsert: { user: userObjectId },
      $addToSet: { products: productObjectId },
    },
    { upsert: true, new: true }
  );

  const wishlist = await getSafeWishlistPayload(userObjectId);
  return res.status(200).json({ success: true, wishlist });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userObjectId = toObjectId(req.user?._id);
  const productObjectId = toObjectId(productId);

  if (!userObjectId) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  if (!productObjectId) {
    return res.status(200).json({
      success: true,
      wishlist: await getSafeWishlistPayload(userObjectId),
    });
  }

  await Wishlist.findOneAndUpdate(
    { user: userObjectId },
    { $pull: { products: productObjectId } },
    { new: true }
  );

  const wishlist = await getSafeWishlistPayload(userObjectId);
  return res.status(200).json({ success: true, wishlist });
});

module.exports = {
  getWishlistCount,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
