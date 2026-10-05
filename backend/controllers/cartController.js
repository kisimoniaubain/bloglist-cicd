const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Get user cart
// @route   GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price discountPrice stock');
  res.json({ success: true, cart: cart || { items: [], couponDiscount: 0 } });
});

// @desc    Add to cart
// @route   POST /api/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < qty) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  const price = product.discountPrice || product.price;

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, qty, price }],
    });
  } else {
    const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].qty += qty;
    } else {
      cart.items.push({ product: productId, qty, price });
    }
    await cart.save();
  }

  await cart.populate('items.product', 'name images price discountPrice stock');
  res.json({ success: true, cart });
});

// @desc    Update cart item qty
// @route   PUT /api/cart/:productId
const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex((i) => i.product.toString() === req.params.productId);
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Item not in cart');
  }

  if (qty <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].qty = qty;
  }

  await cart.save();
  await cart.populate('items.product', 'name images price discountPrice stock');
  res.json({ success: true, cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart });
});

// @desc    Clear cart
// @route   DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
});

// @desc    Apply coupon
// @route   POST /api/cart/coupon
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid or expired coupon code');
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error('Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }

  if (coupon.usedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.qty, 0);

  if (subtotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is KSh ${coupon.minOrderAmount}`);
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  cart.coupon = coupon._id;
  cart.couponDiscount = Math.round(discount);
  await cart.save();

  res.json({ success: true, discount: cart.couponDiscount, couponCode: coupon.code, type: coupon.type });
});

// @desc    Remove coupon
// @route   DELETE /api/cart/coupon
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  cart.coupon = null;
  cart.couponDiscount = 0;
  await cart.save();
  res.json({ success: true, message: 'Coupon removed' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon };
