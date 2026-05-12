import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createWage,
  getWages,
  updateWage,
  deleteWage,
} from '../controllers/wageController.js';

const router = express.Router();

router.use(protect);

router.post('/', createWage);
router.get('/', getWages);
router.put('/:id', updateWage);
router.delete('/:id', deleteWage);

export default router;
