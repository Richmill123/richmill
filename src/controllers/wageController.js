import Wage from '../models/wageModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create wage record
// @route   POST /api/wages
// @access  Private
const createWage = asyncHandler(async (req, res) => {
  const {
    employeeId,
    employeeName,
    advanceWage,
    totalWage,
    bags,
    typeOfWork,
    machineType,
    advanceamount,
    clientId,
    createdAt,
    advancedebtamount
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

  const wage = new Wage({
    employeeId,
    employeeName,
    advanceWage: advanceWage || 0,
    totalWage,
    bags: bags || 0,
    typeOfWork,
    machineType,
    advanceamount,
    advancedebtamount,
    clientId,
    ...(parsedCreatedAt ? { createdAt: parsedCreatedAt } : {}),
  });

  const createdWage = await wage.save();
  res.status(201).json(createdWage);
});

// @desc    Get all wage records
// @route   GET /api/wages
// @access  Private
const getWages = asyncHandler(async (req, res) => {
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

  const wages = await Wage.find(query).populate('employeeId', 'name phoneNumber');
  res.json(wages);
});

// @desc    Update wage record
// @route   PUT /api/wages/:id
// @access  Private
const updateWage = asyncHandler(async (req, res) => {
  const { advanceWage, totalWage, bags, typeOfWork, machineType, advanceamount, advancedebtamount, clientId } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const wage = await Wage.findOne({ _id: req.params.id, clientId });
  
  if (!wage) {
    res.status(404);
    throw new Error('Wage record not found or does not belong to this client');
  }

  if (wage) {
    wage.advanceWage = advanceWage !== undefined ? advanceWage : wage.advanceWage;
    wage.totalWage = totalWage || wage.totalWage;
    wage.bags = bags !== undefined ? bags : wage.bags;
    wage.typeOfWork = typeOfWork || wage.typeOfWork;
    wage.machineType = machineType || wage.machineType;
    wage.advanceamount = advanceamount || wage.advanceamount;
    wage.advancedebtamount = advancedebtamount || wage.advancedebtamount;

    const updatedWage = await wage.save();
    res.json(updatedWage);
  } else {
    res.status(404);
    throw new Error('Wage record not found');
  }
});

// @desc    Delete wage record
// @route   DELETE /api/wages/:id
// @access  Private/Admin
const deleteWage = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const wage = await Wage.findOne({ _id: req.params.id, clientId });
  
  if (!wage) {
    res.status(404);
    throw new Error('Wage record not found or does not belong to this client');
  }

  if (wage) {
    await wage.deleteOne({ _id: req.params.id });
    res.json({ message: 'Wage record removed' });
  } else {
    res.status(404);
    throw new Error('Wage record not found');
  }
});

export {
  createWage,
  getWages,
  updateWage,
  deleteWage,
};
