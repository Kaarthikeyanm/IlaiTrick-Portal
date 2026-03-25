const express = require('express');
const router = express.Router();
const {
    createStation, getAllStations, getStation,
    updateStation, deleteStation, getOwnerStations,
    getStationsNearMe, getStationSlots,
    approveStation, getPendingStations,
    getOwnerDashboardStats
} = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin routes
router.get('/admin/pending', protect, authorize('admin'), getPendingStations);
router.put('/:id/approve', protect, authorize('admin'), approveStation);

// Public/Owner routes
router.get('/near', getStationsNearMe);
router.get('/:id/slots', getStationSlots);
router.get('/owner/stats', protect, authorize('owner'), getOwnerDashboardStats);
router.get('/owner/list', protect, authorize('owner'), getOwnerStations);
router.post('/', protect, authorize('owner'), createStation);
router.get('/', getAllStations);
router.get('/:id', getStation);
router.put('/:id', protect, authorize('owner', 'admin'), updateStation);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteStation);

module.exports = router;
