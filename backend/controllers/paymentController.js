const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// ============================================================================
// UTILITY FUNCTIONS - M-Pesa Configuration & Helpers
// ============================================================================

const normalizeKenyanPhoneNumber = (rawValue) => {
  const digits = String(rawValue || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  return null;
};

const isMpesaSimulationEnabled = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) return false;
  const raw = String(process.env.MPESA_SIMULATION_MODE || '').trim().toLowerCase();
  if (!raw) return true;
  return raw === 'true' || raw === '1' || raw === 'yes';
};

const getMpesaConfig = () => {
  const env = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
  const baseUrl = env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_BUSINESS_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    baseUrl,
  };
};

const looksLikePlaceholder = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes('your_')
    || normalized.includes('your-')
    || normalized.includes('placeholder')
    || normalized === 'changeme'
    || normalized === 'replace_me'
  );
};

const getMpesaAccessToken = async (baseUrl, consumerKey, consumerSecret) => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  const rawBody = await response.text();
  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (_error) {
    payload = {};
  }

  if (!response.ok || !payload.access_token) {
    const responseLooksBlocked =
      String(response.headers.get('x-cdn') || '').toLowerCase().includes('imperva')
      || String(rawBody || '').toLowerCase().includes('incapsula')
      || String(rawBody || '').toLowerCase().includes('request unsuccessful');

    if (responseLooksBlocked) {
      throw new Error(
        `M-Pesa token request blocked by Safaricom edge security. `
        + `Deploy backend to public network for live payments. (HTTP ${response.status})`
      );
    }

    const gatewayMessage = payload?.errorMessage
      || payload?.error_description
      || payload?.message
      || payload?.error
      || (rawBody ? String(rawBody).slice(0, 240) : '')
      || 'Failed to fetch M-Pesa access token.';
    throw new Error(`${gatewayMessage} (HTTP ${response.status})`);
  }

  return payload.access_token;
};

const getMpesaReadiness = () => {
  const callbackUrl = process.env.MPESA_CALLBACK_URL || '';
  const mpesa = getMpesaConfig();
  const usesPlaceholderCredentials = [
    mpesa.consumerKey,
    mpesa.consumerSecret,
    mpesa.shortcode,
    mpesa.passkey,
  ].some((value) => looksLikePlaceholder(value));
  const configured = Boolean(
    process.env.MPESA_CONSUMER_KEY
    && process.env.MPESA_CONSUMER_SECRET
    && process.env.MPESA_BUSINESS_SHORTCODE
    && process.env.MPESA_PASSKEY
    && process.env.MPESA_CALLBACK_URL
  ) && !usesPlaceholderCredentials;
  const callbackHttps = callbackUrl.startsWith('https://');
  const simulationEnabled = isMpesaSimulationEnabled();
  const simulationRequested = String(process.env.MPESA_SIMULATION_MODE || '').trim().toLowerCase();
  const simulationForcedOffInProduction = process.env.NODE_ENV === 'production' && simulationRequested === 'true';

  const checks = [
    {
      key: 'configured',
      pass: configured,
      message: configured
        ? 'Credentials configured'
        : usesPlaceholderCredentials
          ? 'Replace placeholder MPESA credentials with real Daraja values'
          : 'Missing MPESA_* credentials',
    },
    { key: 'callbackHttps', pass: callbackHttps, message: callbackHttps ? 'HTTPS callback URL configured' : 'Callback URL must be HTTPS' },
    {
      key: 'simulationDisabled',
      pass: !simulationEnabled,
      message: simulationForcedOffInProduction
        ? 'Simulation requested but forced OFF in production'
        : simulationEnabled
          ? 'Simulation mode is ON'
          : 'Simulation mode is OFF',
    },
  ];

  return {
    env: process.env.MPESA_ENV || 'sandbox',
    nodeEnv: process.env.NODE_ENV || 'development',
    callbackUrl,
    callbackHttps,
    configured,
    simulationEnabled,
    simulationForcedOffInProduction,
    checks,
    readyLiveCharge: checks.every((item) => item.pass),
  };
};

const parseMpesaCallback = (body) => {
  const stk = body?.Body?.stkCallback;
  if (!stk) return null;

  const metadataItems = Array.isArray(stk.CallbackMetadata?.Item) ? stk.CallbackMetadata.Item : [];
  const metadataMap = metadataItems.reduce((acc, item) => {
    if (item?.Name) acc[item.Name] = item.Value;
    return acc;
  }, {});

  return {
    provider: 'mpesa',
    requestId: stk.CheckoutRequestID || null,
    resultCode: Number(stk.ResultCode),
    resultDesc: stk.ResultDesc || '',
    success: Number(stk.ResultCode) === 0,
    receipt: metadataMap.MpesaReceiptNumber || null,
    amount: metadataMap.Amount || null,
    transactionDate: metadataMap.TransactionDate || null,
    phone: metadataMap.PhoneNumber || null,
  };
};

const safeReadJson = async (response) => {
  const rawText = await response.text();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch (_error) {
    return {};
  }
};

// ============================================================================
// STRIPE PAYMENT
// ============================================================================

// @desc    Create Stripe payment intent
// @route   POST /api/payment/stripe/create-intent
const createStripeIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'kes', orderId } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // in cents/smallest unit
    currency,
    metadata: { orderId, userId: req.user._id.toString() },
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret });
});

// @desc    Stripe webhook
// @route   POST /api/payment/stripe/webhook
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const order = await Order.findById(pi.metadata.orderId);
    if (order) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'paid';
      order.paymentResult = { id: pi.id, status: pi.status };
      await order.save();
    }
  }

  res.json({ received: true });
});

// @desc    Confirm payment (for COD or manual confirmation)
// @route   POST /api/payment/confirm
const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentDetails } = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'paid';
  order.paymentResult = paymentDetails || {};
  await order.save();

  res.json({ success: true, order });
});

// ============================================================================
// M-PESA PAYMENT INTEGRATION
// ============================================================================

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/payment/mpesa/initiate
const initiateMpesaCharge = asyncHandler(async (req, res) => {
  const { phone, amount, orderId } = req.body;

  const normalizedPhone = normalizeKenyanPhoneNumber(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Use a valid Kenyan number format (07..., +254..., or 254...).',
    });
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid amount is required.',
    });
  }

  // Validate orderId is a proper MongoDB ObjectId before querying
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID. Please log in and place the order again to use M-Pesa.',
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found.',
    });
  }

  const mpesa = getMpesaConfig();
  if (!mpesa.consumerKey || !mpesa.consumerSecret || !mpesa.shortcode || !mpesa.passkey || !mpesa.callbackUrl) {
    return res.status(500).json({
      success: false,
      message: 'M-Pesa is not fully configured. Add MPESA_* variables in backend .env.',
    });
  }

  if ([mpesa.consumerKey, mpesa.consumerSecret, mpesa.shortcode, mpesa.passkey].some((value) => looksLikePlaceholder(value))) {
    return res.status(500).json({
      success: false,
      message: 'M-Pesa credentials are placeholders. Add real Daraja credentials in server/.env before sending STK prompts.',
    });
  }

  // Simulation mode
  if (isMpesaSimulationEnabled()) {
    const mockId = `SIM-MPESA-${Date.now()}`;
    return res.status(200).json({
      success: true,
      simulationEnabled: true,
      message: 'M-Pesa simulation mode is enabled.',
      checkoutRequestId: mockId,
      merchantRequestId: mockId,
      customerMessage: 'Simulation mode active. No live charge was sent.',
      phoneNumber: normalizedPhone,
      amount: Math.round(numericAmount),
      orderId,
    });
  }

  // Get access token
  let accessToken;
  try {
    accessToken = await getMpesaAccessToken(mpesa.baseUrl, mpesa.consumerKey, mpesa.consumerSecret);
  } catch (error) {
    const detailedMessage = String(error?.message || '').trim();
    return res.status(502).json({
      success: false,
      message: detailedMessage
        ? `M-Pesa gateway token request failed: ${detailedMessage}`
        : 'M-Pesa gateway token request failed.',
      error: detailedMessage || 'Unknown gateway error',
    });
  }

  // Generate password
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesa.shortcode}${mpesa.passkey}${timestamp}`).toString('base64');

  // Send STK Push
  const stkResponse = await fetch(`${mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      BusinessShortCode: mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(numericAmount),
      PartyA: normalizedPhone,
      PartyB: mpesa.shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: mpesa.callbackUrl,
      AccountReference: `ORDER-${orderId}`,
      TransactionDesc: `Soldy.Shop Order #${order.invoiceNumber}`,
    }),
  });

  const stkPayload = await safeReadJson(stkResponse);

  if (!stkResponse.ok || stkPayload.ResponseCode !== '0') {
    return res.status(400).json({
      success: false,
      message: stkPayload.errorMessage || stkPayload.ResponseDescription || 'Failed to initiate M-Pesa payment.',
    });
  }

  // Store request IDs in order for callback matching
  order.mobileChargeRequestId = stkPayload.CheckoutRequestID;
  order.mobilePaymentStatus = 'pending';
  await order.save();

  return res.status(200).json({
    success: true,
    simulationEnabled: false,
    message: 'M-Pesa prompt sent. Approve it on your phone to complete payment.',
    checkoutRequestId: stkPayload.CheckoutRequestID,
    merchantRequestId: stkPayload.MerchantRequestID,
    customerMessage: stkPayload.CustomerMessage,
    phoneNumber: normalizedPhone,
    amount: Math.round(numericAmount),
    orderId,
  });
});

// @desc    M-Pesa Payment Callback
// @route   POST /api/payment/mpesa/callback
const mpesaCallback = asyncHandler(async (req, res) => {
  try {
    const callback = parseMpesaCallback(req.body);

    if (!callback || !callback.requestId) {
      return res.status(200).json({ resultCode: 0, resultDesc: 'Accepted' });
    }

    // Find order by CheckoutRequestID
    const order = await Order.findOne({ mobileChargeRequestId: callback.requestId });

    if (!order) {
      return res.status(200).json({ resultCode: 0, resultDesc: 'Accepted' });
    }

    if (callback.success) {
      // Payment successful
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'paid';
      order.mobilePaymentStatus = 'completed';
      order.paymentResult = {
        id: callback.receipt || callback.requestId,
        status: 'SUCCESS',
        provider: 'mpesa',
        transactionDate: callback.transactionDate,
        amount: callback.amount,
      };
    } else {
      // Payment failed
      order.mobilePaymentStatus = 'failed';
      order.paymentResult = {
        id: callback.requestId,
        status: 'FAILED',
        provider: 'mpesa',
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
      };
    }

    await order.save();

    return res.status(200).json({ resultCode: 0, resultDesc: 'Accepted' });
  } catch (error) {
    return res.status(200).json({ resultCode: 0, resultDesc: 'Accepted' });
  }
});

// @desc    Get M-Pesa Payment Readiness
// @route   GET /api/payment/mpesa/readiness
const getMpesaPaymentReadiness = asyncHandler(async (req, res) => {
  try {
    const mpesaReadiness = getMpesaReadiness();
    const checks = [...mpesaReadiness.checks];

    if (mpesaReadiness.configured && !mpesaReadiness.simulationEnabled) {
      try {
        const mpesa = getMpesaConfig();
        await getMpesaAccessToken(mpesa.baseUrl, mpesa.consumerKey, mpesa.consumerSecret);
        checks.push({ key: 'tokenReachable', pass: true, message: 'Gateway token request succeeded' });
      } catch (error) {
        checks.push({
          key: 'tokenReachable',
          pass: false,
          message: `Gateway token request failed: ${error.message}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      mpesa: {
        env: mpesaReadiness.env,
        nodeEnv: mpesaReadiness.nodeEnv,
        callbackHttps: mpesaReadiness.callbackHttps,
        configured: mpesaReadiness.configured,
        simulationEnabled: mpesaReadiness.simulationEnabled,
        simulationForcedOffInProduction: mpesaReadiness.simulationForcedOffInProduction,
        checks,
        readyLiveCharge: checks.every((item) => item.pass),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to read payment readiness.',
      error: error.message,
    });
  }
});

module.exports = {
  createStripeIntent,
  stripeWebhook,
  confirmPayment,
  initiateMpesaCharge,
  mpesaCallback,
  getMpesaPaymentReadiness,
};
