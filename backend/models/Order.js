const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true, default: 'Kenya' },
      postalCode: String,
    },
    deliveryMethod: {
      type: String,
      enum: ['standard', 'express', 'same-day'],
      default: 'standard',
    },
    deliveryFee: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'mpesa', 'airtel', 'cod'],
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
      provider: String,
      transactionDate: String,
      amount: Number,
      resultCode: Number,
      resultDesc: String,
    },
    // M-Pesa specific fields
    mobileChargeRequestId: String, // Daraja CheckoutRequestID
    mobilePaymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'expired'],
      default: 'pending',
    },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    cancelledAt: Date,
    trackingNumber: String,
    notes: String,
    invoiceNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Generate invoice number
orderSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
