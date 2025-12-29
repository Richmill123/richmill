import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Routes
import employeeRoutes from './routes/employeeRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import wageRoutes from './routes/wageRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/wages', wageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/income', incomeRoutes);


// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Rice Mill Management System API',
    endpoints: {
      employees: '/api/employees',
      orders: '/api/orders',
      sales: '/api/sales',
      wages: '/api/wages',
      expenses: '/api/expenses',
      stock: '/api/stock',   
      income: '/api/income'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong!' 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
