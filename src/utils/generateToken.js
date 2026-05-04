import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate access token (short-lived)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m', // Shorter expiration for security
    issuer: process.env.JWT_ISSUER || 'rice-mill-api',
    audience: process.env.JWT_AUDIENCE || 'rice-mill-client',
  });
};

// Generate refresh token (longer-lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: process.env.JWT_ISSUER || 'rice-mill-api',
    audience: process.env.JWT_AUDIENCE || 'rice-mill-client',
  });
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify token with enhanced error handling
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'rice-mill-api',
      audience: process.env.JWT_AUDIENCE || 'rice-mill-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Generate API key for external integrations
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create token pair (access + refresh)
const generateTokenPair = (id) => {
  return {
    accessToken: generateToken(id),
    refreshToken: generateRefreshToken(id),
    expiresIn: process.env.JWT_EXPIRE || '15m',
  };
};

export default generateToken;
export { 
  generateRefreshToken, 
  generatePasswordResetToken, 
  verifyToken, 
  generateApiKey, 
  generateTokenPair 
};