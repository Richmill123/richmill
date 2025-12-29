import Order from '../models/orderModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    name,
    villageName,
    address,
    phoneNumber,
    totalAmount,
    advanceAmount,
    typeOfPaddy,
    numberOfBags,
    clientId,
    status = 'CREATED'
  } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const order = new Order({
    name,
    villageName,
    address,
    phoneNumber,
    numberOfBags,
    totalAmount,
    advanceAmount,
    typeOfPaddy,
    clientId,
    status,
    createdAt: new Date()
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
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

  const orders = await Order.find(query);
  res.json(orders);
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
  const { 
    name,
    villageName,
    address,
    phoneNumber,
    totalAmount,
    advanceAmount,
    typeOfPaddy,
    numberOfBags,
    status,
    clientId 
  } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }
  
  const order = await Order.findOne({ _id: req.params.id, clientId });

  if (!order) {
    res.status(404);
    throw new Error('Order not found or does not belong to this client');
  }

  // Update all fields if they exist in the request
  if (name) order.name = name;
  if (villageName) order.villageName = villageName;
  if (address) order.address = address;
  if (phoneNumber) order.phoneNumber = phoneNumber;
  if (totalAmount) order.totalAmount = totalAmount;
  if (advanceAmount) order.advanceAmount = advanceAmount;
  if (typeOfPaddy) order.typeOfPaddy = typeOfPaddy;
  if (numberOfBags) order.numberOfBags = numberOfBags;
  if (status) order.status = status;

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const order = await Order.findOne({ _id: req.params.id, clientId });
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found or does not belong to this client');
  }

  if (order) {
    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: 'Order removed' });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
};
