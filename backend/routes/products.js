const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getProductBySlug, getFeaturedProducts,
  getCategories, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { sellerOrAdmin } = require('../middleware/seller');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);

router.post('/', protect, sellerOrAdmin, createProduct);
router.put('/:id', protect, sellerOrAdmin, updateProduct);
router.delete('/:id', protect, sellerOrAdmin, deleteProduct);

module.exports = router;
