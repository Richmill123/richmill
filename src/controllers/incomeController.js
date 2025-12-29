import Income from '../models/incomeModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new income
// @route   POST /api/income
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
  const {
    item,
    description,
    amount,
    date,
    clientId,
  } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const income = new Income({
    item,
    description,
    amount,
    date: date || Date.now(),
    clientId,
    recordedBy: req.user?._id,
  });

  const createdIncome = await income.save();
  res.status(201).json(createdIncome);
});

// @desc    Get all income
// @route   GET /api/income
// @access  Private
const getIncome  = asyncHandler(async (req, res) => {
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
  console.log("Query:", query);
  if (category) {
    query.category = category;
  }

  const income = await Income.find(query).sort({ date: -1 });
  res.json(income);
});


// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome  = asyncHandler(async (req, res) => {
  const {
    clientId,
    item,
    description,
    amount,
    date
  } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const income = await Income.findOne({ _id: req.params.id, clientId });
  
  if (!income) {
    res.status(404);
    throw new Error('Income not found or does not belong to this client');
  }

  if (income) {
    income.item = item || income.item;
    income.description = description || income.description;
    income.amount = amount || income.amount;
    income.date = date || income.date;

    const updatedIncome = await income.save();
    res.json(updatedIncome);
  } else {
    res.status(404);
    throw new Error('Income not found');
  }
});

// @desc    Delete an income
// @route   DELETE /api/income/:id
// @access  Private/Admin
const deleteIncome  = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const income = await Income.findOne({ _id: req.params.id, clientId });
  
  if (!income) {
    res.status(404);
    throw new Error('Income not found or does not belong to this client');
  }

  if (income) {
    await income.deleteOne({ _id: req.params.id });
    res.json({ message: 'Income removed' });
  } else {
    res.status(404);
    throw new Error('Income not found');
  }
});


export {
  createIncome ,
  getIncome ,
  updateIncome ,
  deleteIncome 
};
