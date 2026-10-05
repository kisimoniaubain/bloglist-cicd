const jwt = require('jsonwebtoken');

let hasWarnedMissingSecret = false;

const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || 'soldyshop-temporary-secret';

  if (!process.env.JWT_SECRET && !hasWarnedMissingSecret) {
    hasWarnedMissingSecret = true;
    console.warn('⚠️ JWT_SECRET is missing. Using temporary fallback secret. Set JWT_SECRET in environment variables.');
  }

  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
