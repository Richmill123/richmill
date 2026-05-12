import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
