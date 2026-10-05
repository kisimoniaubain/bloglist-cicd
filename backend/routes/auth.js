const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword,
  addAddress, deleteAddress, unlockAdminAccess,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/admin-access', protect, unlockAdminAccess);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
