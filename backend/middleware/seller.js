const sellerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Seller or admin only');
  }
};

module.exports = { sellerOrAdmin };
