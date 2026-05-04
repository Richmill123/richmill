import express from 'express';
const router = express.Router();
import {
  upsertPreference,
  getPreference,
  createPreference,
  getPreferences,
  getPreferenceById,
  updatePreference,
  deletePreference,
} from '../controllers/preferenceController.js';

import { protect } from '../middleware/authMiddleware.js';

// Primary endpoints used by the frontend
router.put('/save', protect, upsertPreference);   // upsert — create or update
router.get('/my',   protect, getPreference);       // single record for clientId

// Legacy / admin endpoints
router.route('/')
  .post(protect, createPreference)
  .get(protect, getPreferences);

router.route('/:id')
  .get(protect, getPreferenceById)
  .put(protect, updatePreference)
  .delete(protect, deletePreference);

export default router;
