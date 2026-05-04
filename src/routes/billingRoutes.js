// src/routes/billingRoutes.js
import express from 'express';
import {
  createInvoice,
  getInvoices,
  updateInvoice,
  deleteInvoice
} from '../controllers/billingController.js';

const router = express.Router();

// Create a new invoice
router.post('/', createInvoice);

// Get all invoices
router.get('/', getInvoices);

// Update an invoice
router.put('/:id', updateInvoice);

// Delete an invoice (admin only)
router.delete('/:id', deleteInvoice);

export default router;
