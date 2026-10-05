const nodemailer = require('nodemailer');

const looksLikePlaceholder = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;

  return (
    normalized === 'your_app_password'
    || normalized === 'replace_with_16_char_google_app_password'
    || normalized.includes('your_')
    || normalized.includes('replace_with')
  );
};

const getMailerConfig = () => {
  const user = String(process.env.EMAIL_USER || '').trim();
  const passwordCandidates = [
    process.env.EMAIL_APP_PASSWORD,
    process.env.EMAIL_PASS,
    process.env.EMAIL_PASSWORD,
    process.env.SMTP_PASS,
    process.env.GMAIL_APP_PASSWORD,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const selectedPassword = passwordCandidates.find((value) => !looksLikePlaceholder(value)) || '';
  const rawPass = selectedPassword || passwordCandidates[0] || '';
  const pass = rawPass.replace(/\s+/g, '');
  const service = String(process.env.EMAIL_SERVICE || '').trim() || undefined;
  const host = String(process.env.EMAIL_HOST || '').trim() || undefined;
  const port = Number(process.env.EMAIL_PORT || 587);

  if (!user || looksLikePlaceholder(user) || looksLikePlaceholder(pass)) {
    throw new Error('Email is not configured. Set EMAIL_USER and a valid Gmail app password in EMAIL_APP_PASSWORD (or EMAIL_PASS).');
  }

  return {
    service,
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
};

const getTransporter = () => nodemailer.createTransport(getMailerConfig());

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('badcredentials') || message.includes('invalid login') || message.includes('535')) {
      throw new Error('Gmail rejected login. Use a Google App Password (16 characters) in EMAIL_APP_PASSWORD and confirm 2-Step Verification is enabled on the Gmail account.');
    }
    throw error;
  }
};

const sendOrderConfirmation = async (order, user) => {
  const itemsHtml = order.orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">KSh ${(item.price * item.qty).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed - ${order.invoiceNumber} | Soldy.Shop`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#6366f1;padding:20px;text-align:center">
          <h1 style="color:white;margin:0">Soldy.Shop</h1>
        </div>
        <div style="padding:30px">
          <h2>Order Confirmed! 🎉</h2>
          <p>Hi ${user.name}, your order has been placed successfully.</p>
          <p><strong>Invoice:</strong> ${order.invoiceNumber}</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="padding:8px;text-align:left">Product</th>
                <th style="padding:8px;text-align:center">Qty</th>
                <th style="padding:8px;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:right;margin-top:10px">
            <strong>Total: KSh ${order.totalPrice.toLocaleString()}</strong>
          </div>
          <p style="margin-top:20px">Payment Method: ${order.paymentMethod.toUpperCase()}</p>
          <p>We'll notify you when your order ships!</p>
        </div>
        <div style="background:#f3f4f6;padding:15px;text-align:center;font-size:12px;color:#666">
          © 2026 Soldy.Shop. All rights reserved.
        </div>
      </div>
    `,
  });
};

const sendPasswordReset = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request | Soldy.Shop',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#6366f1;padding:20px;text-align:center">
          <h1 style="color:white;margin:0">Soldy.Shop</h1>
        </div>
        <div style="padding:30px">
          <h2>Password Reset</h2>
          <p>Hi ${user.name}, you requested to reset your password.</p>
          <p>Click the button below to reset it. This link expires in 10 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:20px 0">
            Reset Password
          </a>
          <p style="color:#666;font-size:14px">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOrderConfirmation, sendPasswordReset };
