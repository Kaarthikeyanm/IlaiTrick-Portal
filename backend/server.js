const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve Frontend in Production
if (!process.env.VERCEL && (process.env.NODE_ENV === 'production' || true)) { // Defaulting to true for easier project handover
    const frontendPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendPath));

    // Catch-all route for React Router
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        } else {
            next();
        }
    });
} else {
    // Health check (Dev only)
    app.get('/', (req, res) => res.send('Ilaitrick Portal API is running...'));
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
