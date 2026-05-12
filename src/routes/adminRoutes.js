import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  createAdmin,
  getAdmins,
  deleteAdmin,
  toggleAdminStatus,
  authAdmin,
  getAdminProfile,
  getDashboard
} from '../controllers/adminController.js';

// Public routes
router.post('/login', authLimiter, authAdmin);

// Protected routes
router.get('/dashboard', protect, getDashboard);
router.get('/profile', getAdminProfile);
router.route('/')
  .post(createAdmin)
  .get(protect, getAdmins);
router.route('/:id')
  .delete(protect, deleteAdmin);
router.route('/:id/active')
  .put(toggleAdminStatus);

export default router;
