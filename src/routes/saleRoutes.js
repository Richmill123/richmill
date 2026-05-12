import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createSale,
  getSales,
  updateSale,
  deleteSale,
} from '../controllers/saleController.js';

const router = express.Router();

router.use(protect);

router.post('/', createSale);
router.get('/', getSales);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router;
