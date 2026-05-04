// src/routes/purchaseRoutes.js
import express from 'express';
import {
  createPurchase,
  getPurchases,
  updatePurchase,
  deletePurchase
} from '../controllers/purchaseController.js';

const router = express.Router();

// Create a new purchase
router.post('/', createPurchase);

// Get all purchases
router.get('/', getPurchases);

// Update a purchase
router.put('/:id', updatePurchase);

// Delete a purchase (admin only)
router.delete('/:id', deletePurchase);

export default router;
