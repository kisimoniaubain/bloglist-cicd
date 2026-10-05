const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const SupportConversation = require('../models/SupportConversation');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  const [totalUsers, totalProducts, totalOrders, paidOrders, totalCoupons, unreadMessages] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.find({ isPaid: true }),
    Coupon.countDocuments(),
    SupportConversation.aggregate([{ $group: { _id: null, total: { $sum: '$adminUnreadCount' } } }]),
  ]);
  const totalUnreadMessages = unreadMessages[0]?.total || 0;

  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalPrice, 0);
  const monthlyRevenue = paidOrders
    .filter((o) => o.paidAt >= startOfMonth)
    .reduce((acc, o) => acc + o.totalPrice, 0);
  const dailyRevenue = paidOrders
    .filter((o) => o.paidAt >= startOfDay)
    .reduce((acc, o) => acc + o.totalPrice, 0);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const topProducts = await Product.find().sort({ soldCount: -1 }).limit(5).select('name soldCount price images');

  // Monthly revenue chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthRevenue = paidOrders
      .filter((o) => o.paidAt >= start && o.paidAt <= end)
      .reduce((acc, o) => acc + o.totalPrice, 0);
    monthlyData.push({
      month: start.toLocaleString('default', { month: 'short' }),
      revenue: monthRevenue,
    });
  }

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      dailyRevenue,
      ordersByStatus,
      topProducts,
      monthlyData,
      totalCoupons,
      totalUnreadMessages,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

// @desc    Set user role
// @route   PUT /api/admin/users/:id/role
const setUserRole = asyncHandler(async (req, res) => {
  const allowedRoles = new Set(['user', 'admin']);
  if (!allowedRoles.has(req.body.role)) {
    res.status(400);
    throw new Error('Invalid role. Allowed roles: user, admin');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true }
  );
  res.json({ success: true, user });
});

// @desc    Get new-since-last-viewed counts for admin nav badges
// @route   GET /api/admin/new-counts
const getNewCounts = asyncHandler(async (req, res) => {
  const toDate = (s) => (s && !isNaN(Date.parse(s)) ? new Date(s) : new Date(0));
  const { productsAt, ordersAt, usersAt, couponsAt } = req.query;

  const [newProducts, newOrders, newUsers, newCoupons, unreadMessages] = await Promise.all([
    Product.countDocuments({ isActive: true, createdAt: { $gt: toDate(productsAt) } }),
    Order.countDocuments({ createdAt: { $gt: toDate(ordersAt) } }),
    User.countDocuments({ role: 'user', createdAt: { $gt: toDate(usersAt) } }),
    Coupon.countDocuments({ createdAt: { $gt: toDate(couponsAt) } }),
    SupportConversation.aggregate([{ $group: { _id: null, total: { $sum: '$adminUnreadCount' } } }]),
  ]);

  res.json({
    success: true,
    counts: {
      products: newProducts,
      orders: newOrders,
      users: newUsers,
      coupons: newCoupons,
      messages: unreadMessages[0]?.total || 0,
    },
  });
});

module.exports = { getDashboardStats, getNewCounts, getUsers, toggleUserStatus, setUserRole };
