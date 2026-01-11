import Employee from '../models/employeeModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    gender,
    address,
    dob,
    phoneNumber,
    emergencyContactNumber,
    maritalStatus,
    salary,
    advanceAmount,
    debtAmount,
    clientId,
  } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const employee = new Employee({
    name,
    gender,
    address,
    dob,
    phoneNumber,
    emergencyContactNumber,
    maritalStatus,
    salary,
    advanceAmount,
    debtAmount,
    clientId: clientId.trim(),
  });

  const createdEmployee = await employee.save();
  res.status(201).json(createdEmployee);
});

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const employees = await Employee.find({ clientId });
  res.json(employees);
});


// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = asyncHandler(async (req, res) => {
  const { clientId } = req.body;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const employee = await Employee.findOne({ _id: req.params.id, clientId: clientId.trim() });
  
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found or does not belong to this client');
  }

  if (employee) {
    employee.name = req.body.name || employee.name;
    employee.gender = req.body.gender || employee.gender;
    employee.address = req.body.address || employee.address;
    employee.dob = req.body.dob || employee.dob;
    employee.phoneNumber = req.body.phoneNumber || employee.phoneNumber;
    employee.emergencyContactNumber = req.body.emergencyContactNumber || employee.emergencyContactNumber;
    employee.maritalStatus = req.body.maritalStatus || employee.maritalStatus;
    employee.salary = req.body.salary || employee.salary;
    employee.advanceAmount = req.body.advanceAmount || employee.advanceAmount;
    employee.debtAmount = req.body.debtAmount || employee.debtAmount;
    employee.isActive = req.body.isActive !== undefined ? req.body.isActive : employee.isActive;

    const updatedEmployee = await employee.save();
    res.json(updatedEmployee);
  } else {
    res.status(404);
    throw new Error('Employee not found');
  }
});

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const employee = await Employee.findOne({ _id: req.params.id, clientId });
  
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found or does not belong to this client');
  }

  if (employee) {
    await employee.deleteOne({ _id: req.params.id });
    res.json({ message: 'Employee removed' });
  } else {
    res.status(404);
    throw new Error('Employee not found');
  }
});

export {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
};
