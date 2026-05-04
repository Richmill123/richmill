import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createAdmin,
  getAdmins,
  deleteAdmin,
  toggleAdminStatus,
  authAdmin,
  getAdminProfile,
  getDashboard,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword
} from '../controllers/adminController.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ── PUBLIC ROUTES (no protect) ──────────────────────────────────────────────

router.post('/login',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9_\\/]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, forward slashes, and backslashes'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  handleValidationErrors,
  authAdmin
);

router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  handleValidationErrors,
  forgotPassword
);

router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],
  handleValidationErrors,
  resetPassword
);

router.post('/refresh-token', refreshToken);

// ── PROTECTED ROUTES ────────────────────────────────────────────────────────

router.post('/logout', protect, logout);

router.get('/dashboard',
  protect,
  authorize('merchant_mill', 'custom_milling', 'hybrid'),
  [
    query('clientId')
      .notEmpty()
      .withMessage('Client ID is required')
      .isMongoId()
      .withMessage('Invalid client ID format'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ],
  handleValidationErrors,
  getDashboard
);

router.get('/profile',
  protect,
  getAdminProfile
);

// Admin management (super_admin only)
router.route('/')
  .post(
    protect,
    authorize('merchant_mill'),
    [
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
      body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_\\]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and backslashes'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      body('type')
        .optional()
        .isIn(['merchant_mill', 'custom_milling', 'hybrid'])
        .withMessage('Type must be one of: merchant_mill, custom_milling, hybrid'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    ],
    handleValidationErrors,
    createAdmin
  )
  .get(
    protect,
    authorize('merchant_mill'),
    getAdmins
  );

router.route('/:id')
  .delete(
    protect,
    authorize('merchant_mill'),
    [
      param('id')
        .isMongoId()
        .withMessage('Invalid admin ID format'),
    ],
    handleValidationErrors,
    deleteAdmin
  );

router.route('/:id/active')
  .put(
    protect,
    authorize('merchant_mill'),
    [
      param('id')
        .isMongoId()
        .withMessage('Invalid admin ID format'),
    ],
    handleValidationErrors,
    toggleAdminStatus
  );

export default router;
