import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';

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
const isProduction = process.env.NODE_ENV === 'production';

// CORS — restrict to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/wages', wageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/income', incomeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Rice Mill Management System API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: isProduction ? 'Internal Server Error' : err.message || 'Something went wrong',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
