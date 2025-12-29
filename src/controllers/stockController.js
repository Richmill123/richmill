import Stock from '../models/stockModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all stock items
// @route   GET /api/stock
// @access  Private
const getStock = asyncHandler(async (req, res) => {
  const { clientId, startDate, endDate } = req.query;
  
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

  const stockItems = await Stock.find(query);
  res.json(stockItems);
});

// @desc    Update stock quantity
// @route   PUT /api/stock/:id
// @access  Private
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, clientId } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const stockItem = await Stock.findOne({ _id: req.params.id, clientId });

  if (!stockItem) {
    res.status(404);
    throw new Error('Stock item not found or does not belong to this client');
  }
  stockItem.availableQuantity = quantity;

  const updatedStock = await stockItem.save();
  res.json(updatedStock);
});

// @desc    Add new stock item
// @route   POST /api/stock
// @access  Private/Admin
const addStockItem = asyncHandler(async (req, res) => {
  const { itemType, availableQuantity, clientId } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  // Check if item type already exists for this client
  const existingItem = await Stock.findOne({ itemType, clientId });
  if (existingItem) {
    res.status(400);
    throw new Error('This item type already exists for this client');
  }

  const stockItem = new Stock({
    itemType,
    availableQuantity: availableQuantity || 0,
    clientId,
  });

  const createdStockItem = await stockItem.save();
  res.status(201).json(createdStockItem);
});

// @desc    Delete stock item
// @route   DELETE /api/stock/:id
// @access  Private/Admin
const deleteStockItem = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const stockItem = await Stock.findOne({ _id: req.params.id, clientId });

  if (!stockItem) {
    res.status(404);
    throw new Error('Stock item not found or does not belong to this client');
  }

  if (stockItem) {
    await stockItem.deleteOne({ _id: req.params.id });
    res.json({ message: 'Stock item removed' });
  } else {
    res.status(404);
    throw new Error('Stock item not found');
  }
});

export {
  getStock,
  updateStock,
  addStockItem,
  deleteStockItem,
};
