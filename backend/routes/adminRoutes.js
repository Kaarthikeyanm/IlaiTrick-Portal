const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChargingStation = require('../models/ChargingStation');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc   Get admin dashboard stats
// @route  GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStations = await ChargingStation.countDocuments();
        const pendingStations = await ChargingStation.countDocuments({ isApproved: false });
        const totalBookings = await Booking.countDocuments();
        
        // "Online" users could defined as logged in within the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const onlineUsers = await User.countDocuments({ lastLogin: { $gte: fifteenMinutesAgo } });

        res.json({
            totalUsers,
            onlineUsers,
            totalStations,
            pendingStations,
            totalBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Get all users
// @route  GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Delete a user
// @route  DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Don't allow deleting self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Get all bookings
// @route  GET /api/admin/bookings
router.get('/bookings', protect, authorize('admin'), async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email phone')
            .populate('station', 'stationName city')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Delete a booking
// @route  DELETE /api/admin/bookings/:id
router.delete('/bookings/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Get all stations (approved and pending)
// @route  GET /api/admin/stations
router.get('/stations', protect, authorize('admin'), async (req, res) => {
    try {
        const stations = await ChargingStation.find().sort({ createdAt: -1 });
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Delete a station
// @route  DELETE /api/admin/stations/:id
router.delete('/stations/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const station = await ChargingStation.findByIdAndDelete(req.params.id);
        if (!station) return res.status(404).json({ message: 'Station not found' });
        res.json({ message: 'Station deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
