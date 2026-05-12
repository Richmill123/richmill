import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';

const router = express.Router();

router.use(protect);

router.post('/', createEmployee);
router.get('/', getEmployees);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
