const express = require('express');
const router = express.Router();
const { addReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/:productId', protect, addReview);
router.delete('/:productId/:reviewId', protect, deleteReview);

module.exports = router;
