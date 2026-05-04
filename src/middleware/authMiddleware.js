import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Admin from '../models/adminModel.js';
import { securityLogger } from '../config/security.js';

// Blacklist for revoked tokens (in production, use Redis)
const tokenBlacklist = new Set();

// Enhanced token verification with security checks
const verifyToken = (token) => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token age (additional security layer)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token has expired');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw error;
  }
};

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    securityLogger(req, res, () => {});
    res.status(401);
    throw new Error('Access denied. No token provided.');
  }

  try {
    const decoded = verifyToken(token);
    
    // Get admin with additional security checks
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      res.status(401);
      throw new Error('Admin not found');
    }
    
    if (!admin.active) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    req.admin = admin;
    req.token = token; // Store token for potential logout
    
    next();
  } catch (error) {
    console.error(`[AUTH ERROR] ${error.message} - IP: ${req.ip}`);
    res.status(401);
    throw new Error(error.message || 'Not authorized, token failed');
  }
});

// Type-based access control
const authorize = (...types) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }

    if (types.length && !types.includes(req.admin.type)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

// Admin role check (backward compatibility)
const admin = (req, res, next) => {
  if (req.admin && req.admin.active) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an active admin');
  }
};

// Logout function to blacklist token
const logout = asyncHandler(async (req, res) => {
  if (req.token) {
    tokenBlacklist.add(req.token);
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Refresh token function
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(401);
    throw new Error('Refresh token required');
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.active) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ accessToken });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// Rate limiting for auth endpoints
const authRateLimitHandler = (req, res, next) => {
  const ip = req.ip;
  const key = `auth_${ip}`;
  
  // This would integrate with Redis in production
  next();
};

export { 
  protect, 
  admin, 
  authorize, 
  logout, 
  refreshToken,
  authRateLimitHandler,
  tokenBlacklist 
};
