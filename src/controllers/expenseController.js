import Expense from '../models/expenseModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const {
    item,
    description,
    amount,
    category,
    date,
    paymentMethod,
    receiptNumber,
    clientId,
    createdAt,
  } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  let parsedCreatedAt;
  if (createdAt !== undefined && createdAt !== null && createdAt !== '') {
    parsedCreatedAt = new Date(createdAt);
    if (Number.isNaN(parsedCreatedAt.getTime())) {
      res.status(400);
      throw new Error('Invalid createdAt. Use a valid date string or timestamp.');
    }
  }

  const expense = new Expense({
    item,
    description,
    amount,
    category: category || 'Other',
    date: date || Date.now(),
    paymentMethod: paymentMethod || 'Cash',
    receiptNumber,
    clientId,
    recordedBy: req.user?._id,
    ...(parsedCreatedAt ? { createdAt: parsedCreatedAt } : {}),
  });

  const createdExpense = await expense.save();
  res.status(201).json(createdExpense);
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const { clientId, category, startDate, endDate } = req.query;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

 const query = { clientId: clientId.trim() };

  // Add date filtering if startDate and/or endDate are provided
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt.$gte = startOfDay;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  if (category) {
    query.category = category;
  }

  const expenses = await Expense.find(query).sort({ date: -1 });
  res.json(expenses);
});


// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const {
    clientId,
    item,
    description,
    amount,
    category,
    date,
    paymentMethod,
    receiptNumber,
  } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const expense = await Expense.findOne({ _id: req.params.id, clientId });
  
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found or does not belong to this client');
  }

  if (expense) {
    expense.item = item || expense.item;
    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.receiptNumber = receiptNumber || expense.receiptNumber;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const expense = await Expense.findOne({ _id: req.params.id, clientId });
  
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found or does not belong to this client');
  }

  if (expense) {
    await expense.deleteOne({ _id: req.params.id });
    res.json({ message: 'Expense removed' });
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
});


export {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense
};
