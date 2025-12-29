// src/routes/expenseRoutes.js
import express from 'express';
import {
  createIncome ,
  getIncome ,
  updateIncome ,
  deleteIncome 
} from '../controllers/incomeController.js';

const router = express.Router();

// Create a new expense
router.post('/', createIncome);

// Get all expenses
router.get('/', getIncome);

// Update an expense
router.put('/:id', updateIncome);

// Delete an expense (admin only)
router.delete('/:id', deleteIncome);

export default router;