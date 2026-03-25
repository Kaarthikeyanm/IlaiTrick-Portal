const ChargingStation = require('../models/ChargingStation');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');

// @desc   Create station (Owner only)
// @route  POST /api/stations
const createStation = async (req, res) => {
    try {
        const { 
            stationName, locationName, address, city, lat, lng, pricePerHour, 
            totalPorts, openingTime, closingTime, availableDates,
            ownerName, ownerPhone, ownerEmail, aadhaarNumber, documents, images
        } = req.body;

        if (!stationName) return res.status(400).json({ message: 'Station name is required' });
        if (lat === undefined || lng === undefined) return res.status(400).json({ message: 'Coordinates (lat, lng) are required' });

        const station = await ChargingStation.create({
            owner: req.user._id,
            stationName,
            locationName,
            address,
            city,
            coordinates: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB expects [lng, lat]
            },
            pricePerHour: pricePerHour || 0,
            totalPorts: totalPorts || 1,
            availablePorts: totalPorts || 1,
            openingTime: openingTime || '09:00',
            closingTime: closingTime || '18:00',
            availableDates: availableDates || [],
            
            // New fields
            ownerName,
            ownerPhone,
            ownerEmail,
            aadhaarNumber,
            documents: documents || {},
            images: images || []
        });
        res.status(201).json(station);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get all stations (Public - Approved only)
// @route  GET /api/stations
const getAllStations = async (req, res) => {
    try {
        const { city, search } = req.query;
        let query = { 
            isApproved: true, 
            isActive: { $ne: false },
            validUntil: { $gt: new Date() }
        };
        if (city) query.city = { $regex: city, $options: 'i' };
        if (search) query.stationName = { $regex: search, $options: 'i' };
        
        const stations = await ChargingStation.find(query).populate('owner', 'name email phone');
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Approve station (Admin only)
// @route  PUT /api/stations/:id/approve
const approveStation = async (req, res) => {
    try {
        const station = await ChargingStation.findById(req.params.id);
        if (!station) return res.status(404).json({ message: 'Station not found' });
        
        station.isApproved = true;
        await station.save();

        // Send Approval Email
        try {
            await sendEmail({
                email: station.ownerEmail,
                subject: 'Station Approved - Ilaitrick Portal',
                message: `Congratulations! Your station "${station.stationName}" has been approved and is now live.`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #15803d;">Station Approved!</h2>
                        <p>Hi ${station.ownerName || 'Owner'},</p>
                        <p>Great news! Your charging station <strong>"${station.stationName}"</strong> has been reviewed and <strong>approved</strong> by our admin team.</p>
                        <p>It is now visible to users on the map and ready for bookings.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8em; color: #666;">This is an automated message from the Ilaitrick Portal Admin Panel.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError.message);
            // We don't block the response even if email fails
        }
        
        res.json({ message: 'Station approved successfully', station });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get pending stations (Admin only)
// @route  GET /api/stations/admin/pending
const getPendingStations = async (req, res) => {
    try {
        const stations = await ChargingStation.find({ isApproved: false }).populate('owner', 'name email phone');
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get single station
// @route  GET /api/stations/:id
const getStation = async (req, res) => {
    try {
        const station = await ChargingStation.findById(req.params.id).populate('owner', 'name email phone');
        if (!station) return res.status(404).json({ message: 'Station not found' });
        res.json(station);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Update station (Owner only)
// @route  PUT /api/stations/:id
const updateStation = async (req, res) => {
    try {
        const station = await ChargingStation.findById(req.params.id);
        if (!station) return res.status(404).json({ message: 'Station not found' });
        if (station.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this station' });
        }

        const updateData = { ...req.body };

        // Handle coordinate updates if lat/lng are provided
        if (updateData.lat !== undefined && updateData.lng !== undefined) {
            updateData.coordinates = {
                type: 'Point',
                coordinates: [parseFloat(updateData.lng), parseFloat(updateData.lat)]
            };
            delete updateData.lat;
            delete updateData.lng;
        }

        // Calculate validUntil based on workingDate and closingTime
        if (updateData.workingDate && updateData.closingTime) {
            updateData.validUntil = new Date(`${updateData.workingDate}T${updateData.closingTime}:00`);
        }

        const updated = await ChargingStation.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Delete station (Owner only)
// @route  DELETE /api/stations/:id
const deleteStation = async (req, res) => {
    try {
        const station = await ChargingStation.findById(req.params.id);
        if (!station) return res.status(404).json({ message: 'Station not found' });
        if (station.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this station' });
        }

        const { reasons } = req.body; // Array of reasons why it was rejected

        // Send Rejection Email (if any reasons provided or if admin is deleting)
        if (req.user.role === 'admin' && reasons) {
            try {
                const reasonList = reasons.map(r => `<li>${r}</li>`).join('');
                await sendEmail({
                    email: station.ownerEmail,
                    subject: 'Station Registration Update - Ilaitrick Portal',
                    message: `Your station "${station.stationName}" registration was unsuccessful. Reasons: ${reasons.join(', ')}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #dc2626;">Station Registration Update</h2>
                            <p>Hi ${station.ownerName || 'Owner'},</p>
                            <p>Thank you for submitting your station <strong>"${station.stationName}"</strong>. Unfortunately, we couldn't approve it at this time due to the following issues:</p>
                            <ul style="background: #fef2f2; padding: 15px 30px; border-radius: 8px; border: 1px solid #fee2e2;">
                                ${reasonList}
                            </ul>
                            <p>You can resubmit your station after correcting these issues. Please ensure all documents are clear and valid.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 0.8em; color: #666;">This is an automated message from the Ilaitrick Portal Admin Panel.</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send rejection email:', emailError.message);
            }
        }

        await station.deleteOne();
        res.json({ message: 'Station removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get owner's stations
// @route  GET /api/stations/owner/list
const getOwnerStations = async (req, res) => {
    try {
        const stations = await ChargingStation.find({ owner: req.user._id });
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc   Get stations near a location
// @route  GET /api/stations/near
const getStationsNearMe = async (req, res) => {
    try {
        const { lat, lng, distance = 5000 } = req.query; // default 5km

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const stations = await ChargingStation.find({
            isApproved: true,
            isActive: { $ne: false },
            validUntil: { $gt: new Date() },
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(distance) // in meters
                }
            }
        }).populate('owner', 'name email phone');

        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get dynamic slots with availability
// @route  GET /api/stations/:id/slots
const getStationSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        const station = await ChargingStation.findById(id);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const openMin = timeToMinutes(station.openingTime || '09:00');
        const closeMin = timeToMinutes(station.closingTime || '18:00');
        const duration = station.slotDuration || 60;

        const slots = [];
        let current = openMin;

        // Fetch bookings for this station and date
        const bookings = await Booking.find({
            station: id,
            bookingDate: new Date(date),
            paymentStatus: { $ne: 'failed' },
            bookingStatus: { $ne: 'cancelled' }
        });

        while (current + duration <= closeMin) {
            const startStr = minutesToTime(current);
            const endStr = minutesToTime(current + duration);
            const slotLabel = `${startStr}-${endStr}`;

            // Count bookings for this exact slot
            const takenPorts = bookings.filter(b => b.startTime === startStr).length;
            const availablePorts = Math.max(0, station.totalPorts - takenPorts);

            slots.push({
                slot: slotLabel,
                startTime: startStr,
                endTime: endStr,
                availablePorts
            });

            current += duration;
        }

        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get owner dashboard stats
// @route  GET /api/stations/owner/stats
const getOwnerDashboardStats = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // 1. Get all stations for this owner
        const stations = await ChargingStation.find({ owner: ownerId });
        const stationIds = stations.map(s => s._id);

        // 2. Aggregate core stats
        const totalBookings = await Booking.countDocuments({ station: { $in: stationIds } });
        const activeBookings = await Booking.countDocuments({ 
            station: { $in: stationIds }, 
            bookingStatus: 'upcoming' 
        });
        const totalPorts = stations.reduce((acc, s) => acc + s.totalPorts, 0);
        const availablePorts = stations.reduce((acc, s) => acc + s.availablePorts, 0);

        // Calculate total earnings (only from paid/completed/upcoming bookings)
        const earningsData = await Booking.aggregate([
            { 
                $match: { 
                    station: { $in: stationIds },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);
        const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;

        // 3. Generate Chart Data (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyStats = await Booking.aggregate([
            {
                $match: {
                    station: { $in: stationIds },
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    bookings: { $sum: 1 },
                    earnings: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Fill in missing days with zeros
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = dailyStats.find(d => d._id === dateStr);
            chartData.push({
                date: dateStr,
                bookings: dayData ? dayData.bookings : 0,
                earnings: dayData ? dayData.earnings : 0
            });
        }

        // 4. Recent Activity (Last 5 activities)
        const recentActivities = await Booking.find({ station: { $in: stationIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name')
            .populate('station', 'stationName');

        const formattedActivities = recentActivities.map(b => {
             let message = `${b.user?.name || 'User'} booked a slot at ${b.station?.stationName}`;
             if (b.bookingStatus === 'cancelled') {
                 message = `Booking at ${b.station?.stationName} was cancelled`;
             }
             return {
                 id: b._id,
                 type: b.bookingStatus === 'cancelled' ? 'cancellation' : 'booking',
                 message,
                 time: b.createdAt
             };
        });

        res.json({
            stats: {
                totalBookings,
                activeBookings,
                availablePorts,
                totalPorts,
                totalEarnings
            },
            chartData,
            recentActivities: formattedActivities
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createStation, 
    getAllStations, 
    getStation, 
    updateStation, 
    deleteStation, 
    getOwnerStations, 
    getStationsNearMe, 
    getStationSlots,
    approveStation,
    getPendingStations,
    getOwnerDashboardStats
};
