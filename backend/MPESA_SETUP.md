# M-Pesa Payment Integration Setup for Soldy.Shop

This guide covers setting up M-Pesa payments for the Soldy.Shop e-commerce platform using Safaricom's Daraja API.

## Quick Start (Development/Testing)

### 1) Get Daraja Credentials

1. Visit [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke)
2. Create an account or sign in
3. Create a new app under **Sandbox** environment
4. Copy credentials:
   - Consumer Key
   - Consumer Secret
   - Business Shortcode (test: `174379`)
   - Passkey (test: `bfb279f9aa9bdbcf158e97dd71a467cd2e0ff47f`)

### 2) Configure .env (Development)

```env
NODE_ENV=development
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0ff47f
MPESA_CALLBACK_URL=http://localhost:5000/api/payment/mpesa/callback
MPESA_SIMULATION_MODE=true
```

### 3) Test with Simulation Mode

When `MPESA_SIMULATION_MODE=true`:
- STK Push returns mock `CheckoutRequestID`
- No live charges are sent
- Useful for frontend UI testing

### 4) Verify Setup

```bash
# From server folder
npm run check:mpesa
```

Expected output:
```
M-Pesa Environment: sandbox
Simulation Enabled: YES
PASS: Credentials configured
PASS: HTTPS callback URL configured
PASS: Simulation mode is OFF
INFO: Simulation mode is enabled for local demos. Live debit is not active.
```

---

## Production Deployment

### 1) Deploy Backend to Public HTTPS Server

Recommended platforms:
- Render
- Railway
- Fly.io
- Azure App Service
- Heroku
- VPS with SSL

Minimum requirements:
- Public HTTPS base URL (e.g., `https://api.soldyshop.com`)
- Outbound access to `api.safaricom.co.ke`
- Node 16+ runtime

### 2) Upgrade to Production Credentials

1. In Daraja portal, create/switch to **Production** app
2. Get production credentials:
   - Consumer Key (production)
   - Consumer Secret (production)
   - Business Shortcode (your actual M-Pesa number)
   - Passkey (from M-Pesa admin)

### 3) Set Production Environment Variables

```env
NODE_ENV=production
MPESA_ENV=production
MPESA_CONSUMER_KEY=prod_consumer_key
MPESA_CONSUMER_SECRET=prod_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_m_pesa_shortcode
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://api.soldyshop.com/api/payment/mpesa/callback
MPESA_SIMULATION_MODE=false
```

### 4) Update Frontend API URL

```env
VITE_API_BASE_URL=https://api.soldyshop.com
```

Rebuild and redeploy frontend.

### 5) Verify Live Readiness

```bash
BACKEND_BASE_URL=https://api.soldyshop.com npm run check:mpesa
```

Expected output (production):
```
M-Pesa Environment: production
Simulation Enabled: NO
PASS: Credentials configured
PASS: HTTPS callback URL configured
PASS: Simulation mode is OFF
PASS: Gateway token request succeeded
READY: Live M-Pesa debit is enabled.
```

---

## API Endpoints

### Initiate M-Pesa Payment

**POST** `/api/payment/mpesa/initiate`

```json
{
  "phone": "07XXXXXXXXX",    // Kenyan format: 07..., 254..., or +254...
  "amount": 1500,             // Amount in KES
  "orderId": "order_mongodb_id"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "M-Pesa prompt sent. Approve it on your phone to complete payment.",
  "checkoutRequestId": "ws_co_123456789",
  "merchantRequestId": "16813-1590513-1",
  "phoneNumber": "254712345678",
  "amount": 1500,
  "orderId": "..."
}
```

Response (Simulation Mode):
```json
{
  "success": true,
  "message": "M-Pesa simulation mode is enabled.",
  "checkoutRequestId": "SIM-MPESA-1622804345678",
  "phoneNumber": "254712345678",
  "amount": 1500,
  "orderId": "..."
}
```

### Get Payment Readiness

**GET** `/api/payment/mpesa/readiness`

Returns configuration status and health checks. Use for admin dashboards.

### Callback Endpoint

**POST** `/api/payment/mpesa/callback`

Automatically called by Safaricom Daraja API. Updates order status based on payment result.

---

## Payment Flow Diagram

```
┌─────────────────┐
│   Customer      │
│   (Frontend)    │
└────────┬────────┘
         │
    1. Checkout (order + phone)
         │
         ▼
┌──────────────────────┐
│  POST /mpesa/initiate │◄────────────────────────────────┐
└──────────┬───────────┘                                  │
           │                                              │
    2. STK Push via Daraja                                │
           │                                              │
           ▼                                              │
┌──────────────────────┐                                  │
│   Safaricom Daraja   │                                  │
└──────────┬───────────┘                                  │
           │                                              │
    3. Prompt on phone                                    │
           │                                              │
           ▼                                              │
┌──────────────────────┐                                  │
│    Enter PIN         │                                  │
└──────────┬───────────┘                                  │
           │                                              │
    4. Payment processed                                  │
           │                                              │
           ▼                                              │
┌──────────────────────┐                                  │
│    POST /callback    │──────────────────────────────────┘
│  (Webhook from API)  │
└──────────┬───────────┘
           │
    5. Update Order
           │
           ▼
   ┌─────────────┐
   │  Order.paid │
   │   = true    │
   └─────────────┘
```

---

## Troubleshooting

### Token Request Fails

**Error**: `M-Pesa token request blocked by Safaricom edge security`

**Solution**:
- Ensure your backend is deployed to a public/allowed IP
- Local development behind VPN/firewall may be blocked
- Try from a different network
- Verify credentials in Daraja portal

### Callback Never Arrives

**Causes**:
- Callback URL is not HTTPS
- Firewall/security blocking incoming POST requests
- URL is unreachable from Daraja (test with `curl`)

**Solution**:
- Ensure callback URL is publicly accessible
- Use HTTPS only
- Whitelist Safaricom IP ranges if behind restrictive firewall
- Test with `ngrok` locally to expose endpoint publicly

### "Simulation Mode is Enabled"

This is normal in development. To disable:

```env
MPESA_SIMULATION_MODE=false
```

Note: In production, simulation is **always** OFF regardless of config.

### "ResultCode: 1"

Usually means:
- Invalid phone number format
- Insufficient funds
- SIM not registered for M-Pesa

Verify phone format: `07XXXXXXXXX`, `254712345678`, or `+254712345678`

---

## Testing Checklist

- [ ] Sandbox credentials configured
- [ ] Callback URL is publicly accessible
- [ ] STK Push works (prompt appears on phone)
- [ ] Payment callback received and order updated
- [ ] Order status changes to `paid` after callback
- [ ] Email receipt sent to customer
- [ ] Production credentials obtained from M-Pesa admin
- [ ] Backend deployed to public HTTPS URL
- [ ] Readiness check passes: `npm run check:mpesa`
- [ ] Frontend updated with production API URL
- [ ] Live payment tested end-to-end

---

## Security Considerations

1. **Keep credentials secret**: Never commit `.env` files
2. **Rotate credentials**: If exposed, regenerate in Daraja portal
3. **Callback URL must be HTTPS**: Non-HTTPS callbacks are rejected
4. **Validate callback signature** (if implemented): Verify request comes from Daraja
5. **Rate limit**: Prevent duplicate payment attempts
6. **Idempotency**: Handle duplicate callbacks (same orderId)

---

## References

- [Safaricom Daraja API Docs](https://developer.safaricom.co.ke/docs)
- [STK Push Implementation](https://developer.safaricom.co.ke/docs?nodejs#lipa-na-m-pesa-online-stk-push)
- [Payment Callback Format](https://developer.safaricom.co.ke/docs?nodejs#payment-callback)
