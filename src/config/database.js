import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced database configuration for production
const databaseConfig = {
  // Connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    
    // Replica set options (if using replica set)
    readPreference: 'primaryPreferred',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority', j: true },
    
    // SSL options (for production)
    ssl: process.env.DB_SSL === 'true',
    sslValidate: process.env.DB_SSL_VALIDATE !== 'false',
    sslCA: process.env.DB_SSL_CA,
    sslCert: process.env.DB_SSL_CERT,
    sslKey: process.env.DB_SSL_KEY,
    sslPassphrase: process.env.DB_SSL_PASSPHRASE,
    
    // Authentication
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
  },

  // Performance tuning
  performance: {
    // Enable connection pooling
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    
    // Set max idle time for connections
    maxIdleTimeMS: 30000,
    
    // Wait queue timeout
    waitQueueTimeoutMS: 5000,
    
    // Enable compression
    compressors: ['snappy', 'zlib'],
  },

  // Monitoring and logging
  monitoring: {
    // Enable command monitoring
    monitorCommands: process.env.NODE_ENV === 'development',
    
    // Enable connection state monitoring
    monitorConnections: true,
    
    // Enable profiling for slow queries
    profileSlowQueries: process.env.NODE_ENV === 'development',
    slowQueryThreshold: 100, // milliseconds
  }
};

// Connection state tracking
let connectionState = {
  isConnected: false,
  isConnecting: false,
  retryCount: 0,
  lastError: null,
  lastConnectionTime: null
};

// Enhanced connection function with retry logic
const connectDB = async () => {
  if (connectionState.isConnecting) {
    console.log('Database connection already in progress...');
    return;
  }

  if (connectionState.isConnected) {
    console.log('Database already connected');
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in your .env file');
  }

  connectionState.isConnecting = true;
  connectionState.retryCount++;

  try {
    console.log(`Connecting to MongoDB (attempt ${connectionState.retryCount})...`);

    // Merge options with performance settings
    const options = {
      ...databaseConfig.options,
      maxPoolSize: databaseConfig.performance.poolSize,
      maxIdleTimeMS: databaseConfig.performance.maxIdleTimeMS,
      waitQueueTimeoutMS: databaseConfig.performance.waitQueueTimeoutMS,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    // Update connection state
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.retryCount = 0;
    connectionState.lastConnectionTime = new Date();
    connectionState.lastError = null;

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Pool size: ${conn.connection.poolSize}`);

    // Setup monitoring
    setupConnectionMonitoring(conn);
    
    // Initialize indexes
    await initializeIndexes();

    return conn;

  } catch (error) {
    connectionState.isConnecting = false;
    connectionState.lastError = error;
    
    console.error(`MongoDB connection error (attempt ${connectionState.retryCount}):`, error.message);
    
    // Retry logic with exponential backoff
    if (connectionState.retryCount < 5) {
      const delay = Math.min(1000 * Math.pow(2, connectionState.retryCount), 30000);
      console.log(`Retrying connection in ${delay}ms...`);
      setTimeout(() => connectDB(), delay);
    } else {
      console.error('Max retry attempts reached. Please check your MongoDB connection.');
      process.exit(1);
    }
  }
};

// Setup connection monitoring
const setupConnectionMonitoring = (conn) => {
  // Connection events
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
    connectionState.isConnected = true;
    connectionState.lastError = null;
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    connectionState.isConnected = false;
    connectionState.lastError = err;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    connectionState.isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    connectionState.isConnected = true;
    connectionState.lastError = null;
  });

  // Command monitoring (development only)
  if (databaseConfig.monitoring.monitorCommands) {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
    });
  }

  // Slow query monitoring
  if (databaseConfig.monitoring.profileSlowQueries) {
    mongoose.connection.on('commandStarted', (event) => {
      event.startTime = Date.now();
    });

    mongoose.connection.on('commandSucceeded', (event) => {
      const duration = Date.now() - event.startTime;
      if (duration > databaseConfig.monitoring.slowQueryThreshold) {
        console.warn(`Slow query detected (${duration}ms):`, event.commandName);
      }
    });
  }
};

// Initialize database indexes
const initializeIndexes = async () => {
  try {
    // Import models to ensure indexes are created
    const Stock = await import('../models/stockModel.js');
    
    // Check and create indexes for Stock collection
    const stockModel = Stock.default;
    const indexes = await stockModel.collection.indexes();
    
    // Drop legacy index if exists
    const legacyIndex = indexes.find((idx) => idx && idx.name === 'itemType_1');
    if (legacyIndex) {
      await stockModel.collection.dropIndex('itemType_1');
      console.log('Dropped legacy unique index stocks.itemType_1');
    }

    // Create optimized indexes
    await stockModel.collection.createIndex({ clientId: 1, itemType: 1 }, { unique: true });
    await stockModel.collection.createIndex({ clientId: 1, availableQuantity: 1 });
    await stockModel.collection.createIndex({ itemType: 1 });
    
    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database indexes:', error.message);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    connectionState.isConnected = false;
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
};

// Health check function
const healthCheck = () => {
  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    retryCount: connectionState.retryCount,
    lastError: connectionState.lastError?.message,
    lastConnectionTime: connectionState.lastConnectionTime,
    readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    poolSize: mongoose.connection.poolSize || 0
  };
};

// Performance metrics
const getPerformanceMetrics = () => {
  const conn = mongoose.connection;
  return {
    poolSize: conn.poolSize || 0,
    readyState: conn.readyState,
    host: conn.host,
    port: conn.port,
    name: conn.name,
    stats: conn.db ? {
      collections: conn.db.stats ? conn.db.stats().collections : 0,
      objects: conn.db.stats ? conn.db.stats().objects : 0,
      dataSize: conn.db.stats ? conn.db.stats().dataSize : 0,
      storageSize: conn.db.stats ? conn.db.stats().storageSize : 0,
    } : null
  };
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default connectDB;
export { 
  healthCheck, 
  getPerformanceMetrics, 
  databaseConfig,
  connectionState 
};
