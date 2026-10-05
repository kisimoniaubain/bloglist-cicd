# Frontend M-Pesa Integration Guide for Soldy.Shop

This guide shows how to integrate M-Pesa payments into the Soldy.Shop React frontend.

## 1) Environment Configuration

Create/update `.env` in the client folder:

```env
VITE_API_BASE_URL=http://localhost:5000
# In production:
# VITE_API_BASE_URL=https://api.soldyshop.com
```

## 2) Update API Service

Modify `src/services/api.js` to include M-Pesa endpoints:

```javascript
// M-Pesa Payment Endpoints

export const initiateMpesaPayment = async (phone, amount, orderId) => {
  const response = await api.post('/payment/mpesa/initiate', {
    phone,
    amount,
    orderId,
  });
  return response.data;
};

export const getMpesaReadiness = async () => {
  const response = await api.get('/payment/mpesa/readiness');
  return response.data;
};

export const confirmMpesaPayment = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data.order;
};
```

## 3) Create M-Pesa Payment Component

Create `src/components/MpesaPayment.jsx`:

```jsx
import { useState } from 'react';
import { initiateMpesaPayment } from '../services/api';

export default function MpesaPayment({ order, onPaymentSuccess }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutId, setCheckoutId] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await initiateMpesaPayment(
        phone,
        order.totalPrice,
        order._id
      );

      if (response.success) {
        setCheckoutId(response.checkoutRequestId);

        // Show success message
        alert(
          `✓ ${response.customerMessage}\n\nApprove the prompt on your phone.`
        );

        // Poll for payment confirmation (optional)
        pollPaymentStatus(order._id);
      } else {
        setError(response.message || 'Payment initiation failed');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to initiate M-Pesa payment'
      );
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (orderId) => {
    // Poll backend for 60 seconds to check if payment was received
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 sec delay

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();

        if (data.order?.isPaid) {
          onPaymentSuccess(data.order);
          return;
        }
      } catch (err) {
        // Continue polling
      }
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          placeholder="07XXXXXXXXX or +254712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={loading}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {checkoutId && (
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          ℹ Payment initiated with ID: {checkoutId}
          <br />
          Check your phone for the M-Pesa prompt.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending M-Pesa Prompt...' : `Pay KES ${order.totalPrice}`}
      </button>
    </form>
  );
}
```

## 4) Add M-Pesa Option to Checkout

Update `src/pages/Checkout.jsx`:

```jsx
import { useState } from 'react';
import MpesaPayment from '../components/MpesaPayment';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [order, setOrder] = useState(null);

  // ... existing checkout logic ...

  return (
    <div className="checkout-container">
      <div className="payment-methods">
        <label className="payment-option">
          <input
            type="radio"
            value="stripe"
            checked={paymentMethod === 'stripe'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>Stripe (Card)</span>
        </label>

        <label className="payment-option">
          <input
            type="radio"
            value="mpesa"
            checked={paymentMethod === 'mpesa'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>M-Pesa</span>
        </label>

        <label className="payment-option">
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>Cash on Delivery</span>
        </label>
      </div>

      {paymentMethod === 'mpesa' && order && (
        <MpesaPayment
          order={order}
          onPaymentSuccess={(updatedOrder) => {
            // Handle successful payment
            setOrder(updatedOrder);
            redirectToSuccess();
          }}
        />
      )}

      {paymentMethod === 'stripe' && (
        <StripePayment order={order} onSuccess={redirectToSuccess} />
      )}

      {paymentMethod === 'cod' && (
        <button onClick={handleCODOrder}>
          Confirm Order (Pay on Delivery)
        </button>
      )}
    </div>
  );
}
```

## 5) Phone Number Formatting Helpers

Add to `src/utils/phone.js`:

```javascript
export const normalizeKenyanPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `254${digits}`;
  }

  return null;
};

export const formatPhoneForDisplay = (phone) => {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return phone;

  // Return as 0712345678 format
  return `0${normalized.slice(3)}`;
};
```

## 6) Payment Status Component

Create `src/components/PaymentStatus.jsx`:

```jsx
import { useEffect, useState } from 'react';

export default function PaymentStatus({ orderId, onComplete }) {
  const [status, setStatus] = useState('pending');
  const [checkingPayment, setCheckingPayment] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        const order = data.order;

        if (order.isPaid) {
          setStatus('paid');
          onComplete(order);
          setCheckingPayment(false);
        } else if (order.mobilePaymentStatus === 'failed') {
          setStatus('failed');
          setCheckingPayment(false);
        } else {
          // Keep checking
          setTimeout(checkPayment, 3000);
        }
      } catch (err) {
        setTimeout(checkPayment, 3000);
      }
    };

    checkPayment();
  }, [orderId, onComplete]);

  return (
    <div className="payment-status-container">
      {checkingPayment && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Waiting for payment confirmation...</p>
          <p className="text-sm text-gray-500 mt-2">
            Complete the M-Pesa prompt on your phone
          </p>
        </div>
      )}

      {status === 'paid' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="text-green-800 font-semibold text-lg mb-2">
            Payment Received
          </h3>
          <p className="text-green-700">Your order has been confirmed.</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">✗</div>
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            Payment Failed
          </h3>
          <p className="text-red-700 mb-4">
            Please try again or use a different payment method.
          </p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

## 7) Styling (Tailwind)

Add to your CSS/component:

```css
.payment-option {
  @apply flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50;
}

.payment-option input[type='radio'] {
  @apply w-5 h-5 cursor-pointer;
}

.payment-methods {
  @apply space-y-2 mb-6;
}
```

## 8) Testing Flow

### Local Testing (Simulation Mode)

1. Set `MPESA_SIMULATION_MODE=true` in backend `.env`
2. Enter any phone number: `0712345678`
3. Click "Pay with M-Pesa"
4. You'll get a mock response with simulation ID
5. Check console for `checkoutRequestId`

### Sandbox Testing (Real Prompts)

1. Get sandbox credentials from Daraja
2. Set `MPESA_ENV=sandbox` in backend `.env`
3. Set `MPESA_SIMULATION_MODE=false`
4. Use a test M-Pesa number from Daraja docs
5. Complete the prompt on your phone

### Error Handling

Common errors and solutions:

```javascript
if (response.message.includes('token request blocked')) {
  // Backend not on public IP - deploy to server
}

if (response.message.includes('Callback URL must be HTTPS')) {
  // Set MPESA_CALLBACK_URL to HTTPS URL
}

if (response.message.includes('Invalid phone')) {
  // Format phone as 0712345678 or +254712345678
}
```

## 9) Receipt Email

After payment, send receipt email with:

```javascript
const orderConfirmationEmail = {
  to: user.email,
  subject: `Order Confirmed - Invoice ${order.invoiceNumber}`,
  html: `
    <h2>Payment Received</h2>
    <p>Thank you for your purchase!</p>
    <dl>
      <dt>Invoice:</dt>
      <dd>${order.invoiceNumber}</dd>
      <dt>Amount Paid:</dt>
      <dd>KES ${order.totalPrice}</dd>
      <dt>Payment Method:</dt>
      <dd>M-Pesa</dd>
      <dt>Transaction ID:</dt>
      <dd>${order.paymentResult.id}</dd>
    </dl>
    <p>Your order will be processed shortly.</p>
  `,
};
```

## 10) Security Tips

1. **Never expose API keys**: Keep `.env` variables server-side only
2. **Validate phone numbers**: Reject invalid formats on frontend + backend
3. **Rate limit**: Prevent spam payment attempts
4. **Verify order total**: Backend should re-calculate total before processing
5. **HTTPS only**: Ensure production uses HTTPS for all URLs

---

## Deployment Checklist

- [ ] Backend deployed to public HTTPS URL
- [ ] Frontend updated with production API URL
- [ ] M-Pesa production credentials configured
- [ ] `MPESA_SIMULATION_MODE=false` in production
- [ ] Callback URL is publicly accessible
- [ ] Test end-to-end payment flow
- [ ] Error handling implemented
- [ ] Email receipts working
- [ ] Admin dashboard shows M-Pesa payments
- [ ] Monitoring/logging set up for payment failures
