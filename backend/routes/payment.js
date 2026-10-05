const express = require('express');
const router = express.Router();
const {
  createStripeIntent,
  stripeWebhook,
  confirmPayment,
  initiateMpesaCharge,
  mpesaCallback,
  getMpesaPaymentReadiness,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Stripe
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/webhook', stripeWebhook); // raw body handled in index.js

// Generic confirm payment (COD, etc)
router.post('/confirm', protect, confirmPayment);

// M-Pesa
router.post('/mpesa/initiate', protect, initiateMpesaCharge);
router.post('/mpesa/callback', mpesaCallback); // No auth - Daraja sends this
router.get('/mpesa/readiness', getMpesaPaymentReadiness); // No auth - public check

// Legacy routes (kept for backward compatibility)
router.post('/mpesa/stk', protect, initiateMpesaCharge);

module.exports = router;
