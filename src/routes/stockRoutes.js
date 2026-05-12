import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getStock,
  updateStock,
  addStockItem,
  deleteStockItem
} from '../controllers/stockController.js';

const router = express.Router();

router.use(protect);

router.get('/', getStock);
router.post('/', addStockItem);
router.put('/:id', updateStock);
router.delete('/:id', deleteStockItem);

export default router;