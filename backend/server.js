require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

const logger = require('./utils/logger');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => logger.info('✅ MongoDB Connected'))
    .catch(err => logger.error(`❌ MongoDB Connection Error: ${err.message}`));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/inventory', require('./routes/inventory'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Maggie Point API is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/api', (req, res) => {
    res.json({
        message: '🍜 Welcome to Maggie Point API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            sendOTP: 'POST /api/auth/send-otp',
            signup: 'POST /api/auth/signup',
            login: 'POST /api/auth/login',
            users: 'GET /api/auth/users'
        }
    });
});

// 404 handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Server Error: ${err.stack}`);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 API URL: http://localhost:${PORT}/api`);
});
