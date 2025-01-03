const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { activityLogger } = require('./middleware/activityLogger');
require('dotenv').config();

const app = express();

// Define CORS options
const corsOptions = {
    origin: 'http://localhost:3000', // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(activityLogger);

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/legalvault')
    .then(() => {
        console.log('MongoDB Connected Successfully');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
    });

// Basic test route
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'API is running' 
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/documents', require('./routes/document'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

module.exports = server;