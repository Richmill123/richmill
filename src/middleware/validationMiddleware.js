import { body, param, query, validationResult } from 'express-validator';
import { validationPatterns } from '../config/security.js';

// Common validation chains
export const validateMongoId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`)
];

export const validateClientId = () => [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format')
];

export const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateDateRange = () => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// Employee validation
export const validateEmployee = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(validationPatterns.alphanumeric)
    .withMessage('Name can only contain letters, numbers, spaces, and basic punctuation'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .optional()
    .matches(validationPatterns.phone)
    .withMessage('Please provide a valid phone number'),
  
  body('salary')
    .optional()
    .matches(validationPatterns.amount)
    .withMessage('Salary must be a valid amount'),
  
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format')
];

// Order validation
export const validateOrder = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('numberOfBags')
    .isInt({ min: 1 })
    .withMessage('Number of bags must be at least 1'),
  
  body('bagWeight')
    .optional()
    .matches(validationPatterns.amount)
    .withMessage('Bag weight must be a valid number'),
  
  body('totalAmount')
    .optional()
    .matches(validationPatterns.amount)
    .withMessage('Total amount must be a valid number'),
  
  body('status')
    .optional()
    .isIn(['CREATED', 'INITIAL STOCKING', 'BOILING PROCESS COMPLETED', 'SPLITTING PROCESS COMPLETED', 'PACKED & READY', 'PAID & CLOSE'])
    .withMessage('Invalid order status')
];

// Sale validation
export const validateSale = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required with at least one item'),
  
  body('items.*.itemType')
    .notEmpty()
    .withMessage('Item type is required')
    .isIn(['bran', 'husk', 'black rice', 'broken rice', 'other', 'Karika'])
    .withMessage('Invalid item type'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.amount')
    .matches(validationPatterns.amount)
    .withMessage('Amount must be a valid number'),
  
  body('totalAmount')
    .matches(validationPatterns.amount)
    .withMessage('Total amount must be a valid number'),
  
  body('paymentStatus')
    .optional()
    .isIn(['Paid', 'Pending', 'Partial'])
    .withMessage('Invalid payment status')
];

// Stock validation
export const validateStock = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('itemType')
    .notEmpty()
    .withMessage('Item type is required')
    .isIn(['bran', 'husk', 'black rice', 'broken rice', 'other', 'Karika'])
    .withMessage('Invalid item type'),
  
  body('availableQuantity')
    .isInt({ min: 0 })
    .withMessage('Available quantity must be at least 0')
];

// Wage validation
export const validateWage = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  
  body('bags')
    .isInt({ min: 1 })
    .withMessage('Number of bags must be at least 1'),
  
  body('ratePerBag')
    .matches(validationPatterns.amount)
    .withMessage('Rate per bag must be a valid number'),
  
  body('totalWage')
    .matches(validationPatterns.amount)
    .withMessage('Total wage must be a valid number')
];

// Expense validation
export const validateExpense = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('description')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Description must be between 2 and 200 characters')
    .matches(validationPatterns.alphanumeric)
    .withMessage('Description contains invalid characters'),
  
  body('amount')
    .matches(validationPatterns.amount)
    .withMessage('Amount must be a valid number'),
  
  body('category')
    .optional()
    .isIn(['labor', 'maintenance', 'electricity', 'water', 'transport', 'other'])
    .withMessage('Invalid expense category')
];

// Income validation
export const validateIncome = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('description')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Description must be between 2 and 200 characters')
    .matches(validationPatterns.alphanumeric)
    .withMessage('Description contains invalid characters'),
  
  body('amount')
    .matches(validationPatterns.amount)
    .withMessage('Amount must be a valid number'),
  
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  
  body('source')
    .optional()
    .isIn(['sale', 'service', 'investment', 'other'])
    .withMessage('Invalid income source')
];

// Billing validation
export const validateBilling = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid order ID format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required with at least one item'),
  
  body('items.*.description')
    .notEmpty()
    .withMessage('Item description is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.rate')
    .matches(validationPatterns.amount)
    .withMessage('Rate must be a valid number'),
  
  body('items.*.amount')
    .matches(validationPatterns.amount)
    .withMessage('Amount must be a valid number'),
  
  body('totalAmount')
    .matches(validationPatterns.amount)
    .withMessage('Total amount must be a valid number'),
  
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue'])
    .withMessage('Invalid billing status')
];

// Purchase validation
export const validatePurchase = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  
  body('supplier')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required with at least one item'),
  
  body('items.*.description')
    .notEmpty()
    .withMessage('Item description is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.unitPrice')
    .matches(validationPatterns.amount)
    .withMessage('Unit price must be a valid number'),
  
  body('items.*.totalPrice')
    .matches(validationPatterns.amount)
    .withMessage('Total price must be a valid number'),
  
  body('totalAmount')
    .matches(validationPatterns.amount)
    .withMessage('Total amount must be a valid number'),
  
  body('paymentStatus')
    .optional()
    .isIn(['paid', 'pending', 'partial'])
    .withMessage('Invalid payment status')
];

// Error handling middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Generic validation middleware
export const validate = (validations) => [
  ...validations,
  handleValidationErrors
];

export default {
  validateMongoId,
  validateClientId,
  validatePagination,
  validateDateRange,
  validateEmployee,
  validateOrder,
  validateSale,
  validateStock,
  validateWage,
  validateExpense,
  validateIncome,
  validateBilling,
  validatePurchase,
  handleValidationErrors,
  validate
};
