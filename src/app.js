const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initializeDatabase } = require('./database/database');
const simulationRoutes = require('./routes/simulation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
}));

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api', simulationRoutes);

// Serve the HTML form at root
const rootHandler = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
};
app.get('/', rootHandler);

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};
app.use(errorHandler);

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};
app.use(notFoundHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Credit Risk Simulator running on http://localhost:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const handleSigint = () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  process.exit(0);
};

const handleSigterm = () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  process.exit(0);
};

process.on('SIGINT', handleSigint);
process.on('SIGTERM', handleSigterm);

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
app.rootHandler = rootHandler;
app.errorHandler = errorHandler;
app.notFoundHandler = notFoundHandler;
app.handleSigint = handleSigint;
app.handleSigterm = handleSigterm;

module.exports = app;
