const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Helper: parse "HH:MM" time string to minutes
const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

// Helper: check if two time intervals overlap
// [s1, e1] and [s2, e2]
const isOverlapping = (s1, e1, s2, e2) => {
    const start1 = timeToMinutes(s1);
    const end1 = timeToMinutes(e1);
    const start2 = timeToMinutes(s2);
    const end2 = timeToMinutes(e2);
    return Math.max(start1, start2) < Math.min(end1, end2);
};

// Helper: update status to 'completed' if time has passed
const updateBookingStatuses = async (query = {}) => {
    try {
        const now = new Date();
        const currentTimeInMin = now.getHours() * 60 + now.getMinutes();
        const todayStr = now.toISOString().split('T')[0];

        // Find bookings that are 'upcoming' or 'active' and have passed their endTime
        // This is a simple version that checks for today's bookings that have ended
        const bookingsToUpdate = await Booking.find({
            ...query,
            bookingStatus: { $in: ['upcoming', 'active'] },
            $or: [
                { bookingDate: { $lt: new Date(todayStr) } }, // Past dates
                { 
                    bookingDate: { $gte: new Date(todayStr), $lt: new Date(new Date(todayStr).getTime() + 86400000) },
                    endTime: { $exists: true, $ne: null }
                }
            ]
        });

        for (const booking of bookingsToUpdate) {
            const bookingDateStr = booking.bookingDate.toISOString().split('T')[0];
            const endMin = timeToMinutes(booking.endTime);
            
            if (bookingDateStr < todayStr || (bookingDateStr === todayStr && currentTimeInMin >= endMin)) {
                booking.bookingStatus = 'completed';
                await booking.save();
            }
        }
    } catch (error) {
        console.error('Error updating booking statuses:', error);
    }
};

// @desc   Calculate and initiate Stripe PaymentIntent
// @route  POST /api/bookings/order
const initiateBooking = async (req, res) => {
    try {
        const { stationId, bookingDate, startTime, endTime } = req.body;
        console.log('Initiating booking:', { stationId, bookingDate, startTime, endTime });

        const station = await ChargingStation.findById(stationId);
        if (!station) {
            console.log('Station not found:', stationId);
            return res.status(404).json({ message: 'Station not found' });
        }

        const now = new Date();
        const bookingDateObj = new Date(bookingDate);

        // 1. PREVENT PAST BOOKINGS
        if (bookingDateObj.toDateString() === now.toDateString()) {
            const [nowH, nowM] = [now.getHours(), now.getMinutes()];
            const [startH, startM] = startTime.split(':').map(Number);
            
            if (startH < nowH || (startH === nowH && startM <= nowM)) {
                console.log('Past time check failed:', { startH, nowH, startM, nowM });
                return res.status(400).json({ message: 'Cannot book a slot in the past. Please select a future time.' });
            }
        } else if (bookingDateObj < now && bookingDateObj.toDateString() !== now.toDateString()) {
            console.log('Past date check failed:', { bookingDateObj, now });
            return res.status(400).json({ message: 'Cannot book for a past date.' });
        }

        // 2. LIVE PORT & AVAILABILITY CHECK
        const bookingsOnDate = await Booking.find({
            station: stationId,
            bookingDate: {
                $gte: new Date(bookingDateObj.setHours(0,0,0,0)),
                $lte: new Date(bookingDateObj.setHours(23,59,59,999))
            },
            bookingStatus: { $in: ['upcoming', 'active', 'completed'] }
        });

        // Filter for overlaps
        const overlappingBookings = bookingsOnDate.filter(b => 
            isOverlapping(startTime, endTime, b.startTime, b.endTime || '23:59')
        );

        if (overlappingBookings.length >= station.totalPorts) {
            console.log('Availability check failed:', { overlappingCount: overlappingBookings.length, totalPorts: station.totalPorts });
            return res.status(400).json({ message: 'All ports are reserved or occupied for this time range. Please select another timing.' });
        }

        // Calculate amount
        const startMin = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);
        const hours = (endMin - startMin) / 60;
        const totalAmount = Math.max(0, hours * station.pricePerHour);

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // amount in cents/paise
            currency: 'inr',
            metadata: {
                stationId: stationId.toString(),
                userId: req.user._id.toString()
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            totalAmount,
            stationName: station.stationName,
            bookingDetails: {
                stationId,
                bookingDate,
                startTime,
                endTime
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Verify payment status and create booking
// @route  POST /api/bookings/verify
const confirmBooking = async (req, res) => {
    try {
        const {
            paymentIntentId,
            bookingDetails,
            paymentMethod
        } = req.body;

        let amountPaid, transactionId;

        if (paymentIntentId.startsWith('qr_sim_')) {
            // Simulated QR Payment for demo purpose
            const ChargingStation = require('../models/ChargingStation');
            const station = await ChargingStation.findById(bookingDetails.stationId);
            const start = bookingDetails.startTime.split(':').map(Number);
            const end = bookingDetails.endTime.split(':').map(Number);
            const hours = (end[0] * 60 + (end[1] || 0) - (start[0] * 60 + (start[1] || 0))) / 60;
            amountPaid = Math.max(0, hours * (station.pricePerHour || 50));
            transactionId = paymentIntentId;
        } else {
            // Retrieve the payment intent from Stripe to verify status
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ message: "Payment not successful or pending verification" });
            }
            amountPaid = paymentIntent.amount / 100;
            transactionId = paymentIntent.latest_charge || paymentIntentId;
        }

        // Create Booking
        const booking = await Booking.create({
            user: req.user._id,
            station: bookingDetails.stationId,
            bookingDate: new Date(bookingDetails.bookingDate),
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            totalAmount: amountPaid,
            paymentStatus: 'paid',
            paymentMethod: paymentMethod || (paymentIntentId.startsWith('qr_sim_') ? 'qr' : 'card'),
            bookingStatus: 'upcoming',
            stripePaymentIntentId: paymentIntentId,
            transactionId: transactionId,
            receiptNumber: Math.floor(1000 + Math.random() * 9000).toString() 
        });

        // Populate details for receipt
        await booking.populate([
            { path: 'user', select: 'name email' },
            { path: 'station', select: 'stationName address city coordinates' }
        ]);

        // Send Email Receipt
        try {
            const sendEmail = require('../utils/sendEmail');
            const { format } = require('date-fns');

            const dateStr = format(new Date(booking.bookingDate), 'MMMM dd, yyyy');
            const amount = booking.totalAmount.toFixed(2);

            await sendEmail({
                email: booking.user.email,
                subject: `Booking Confirmed - ${booking.station.stationName}`,
                message: `Your booking at ${booking.station.stationName} is confirmed for ${dateStr} from ${booking.startTime} to ${booking.endTime}. Total Amount: ₹${amount}. Transaction ID: ${booking.transactionId}. Receipt Number: ${booking.receiptNumber}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1a202c;">
                        <div style="background-color: #10b981; padding: 24px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                            <p style="margin: 8px 0 0; opacity: 0.9;">Thank you for booking with Ilaitrick Portal</p>
                        </div>
                        <div style="padding: 24px;">
                            <div style="text-align: center; margin-bottom: 24px; padding: 16px; background-color: #f0fff4; border: 2px dashed #68d391; border-radius: 12px;">
                                <p style="margin: 0; font-size: 14px; color: #2f855a; font-weight: bold; text-transform: uppercase;">Receipt Number</p>
                                <h2 style="margin: 4px 0 0; font-size: 32px; color: #22543d; letter-spacing: 4px;">${booking.receiptNumber}</h2>
                            </div>
                            <h2 style="margin: 0 0 16px; font-size: 18px; border-bottom: 2px solid #f7fafc; padding-bottom: 8px;">Receipt Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Customer Name</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.user.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Station Name</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.station.stationName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Address</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.station.address}, ${booking.station.city}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Date</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${dateStr}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Time Slot</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.startTime} - ${booking.endTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #718096;">Payment Method</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold; text-transform: uppercase;">${booking.paymentMethod}</td>
                                </tr>
                                <tr style="border-top: 1px solid #edf2f7;">
                                    <td style="padding: 16px 0 8px; font-size: 20px; font-weight: bold;">Total Paid</td>
                                    <td style="padding: 16px 0 8px; text-align: right; font-size: 20px; font-weight: bold; color: #10b981;">₹${amount}</td>
                                </tr>
                            </table>
                            <div style="margin-top: 24px; padding: 16px; background-color: #f7fafc; border-radius: 8px; font-size: 12px; color: #718096;">
                                <p style="margin: 0;"><strong>Transaction ID:</strong> ${booking.transactionId}</p>
                                <p style="margin: 8px 0 0;">Please show this receipt at the station if requested.</p>
                            </div>
                        </div>
                        <div style="padding: 16px; background-color: #f8fafc; text-align: center; border-top: 1px solid #edf2f7;">
                            <p style="margin: 0; font-size: 12px; color: #a0aec0;">&copy; 2026 Ilaitrick Portal. All rights reserved.</p>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send receipt email:', emailError.message);
        }

        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get user bookings
// @route  GET /api/bookings/user
const getUserBookings = async (req, res) => {
    try {
        await updateBookingStatuses({ user: req.user._id });
        const bookings = await Booking.find({ user: req.user._id })
            .populate('station', 'stationName city coordinates address')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get owner's station bookings
// @route  GET /api/bookings/owner
const getOwnerBookings = async (req, res) => {
    try {
        const ownerStations = await ChargingStation.find({ owner: req.user._id }).select('_id');
        const stationIds = ownerStations.map((s) => s._id);
        
        await updateBookingStatuses({ station: { $in: stationIds } });

        const bookings = await Booking.find({ station: { $in: stationIds } })
            .populate('user', 'name email phone')
            .populate('station', 'stationName city location')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get earnings summary for owner
// @route  GET /api/bookings/owner/earnings
const getOwnerEarnings = async (req, res) => {
    try {
        const ownerStations = await ChargingStation.find({ owner: req.user._id }).select('_id stationName');
        const stationIds = ownerStations.map((s) => s._id);
        const bookings = await Booking.find({ station: { $in: stationIds }, paymentStatus: 'paid' }).populate('station', 'stationName');
        const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        res.json({ totalEarnings: total, paidBookings: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get available ports per time slot for a station on a specific date
// @route  GET /api/bookings/availability
const getAvailability = async (req, res) => {
    try {
        const { stationId, date } = req.query;

        if (!stationId || !date) {
            return res.status(400).json({ message: 'Station ID and date are required' });
        }

        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const totalPorts = station.totalPorts;

        // Dynamic 1-hour intervals based on station hours
        const openingTime = station.openingTime || '09:00';
        const closingTime = station.closingTime || '18:00';
        
        let [openH, openM] = openingTime.split(':').map(Number);
        let [closeH, closeM] = closingTime.split(':').map(Number);

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const now = new Date();
        const isToday = queryDate.toDateString() === now.toDateString();

        const uiTimeSlots = [];
        let currentH = openH;
        let currentM = openM;

        while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
            let nextM = currentM + 30;
            let nextH = currentH;
            
            if (nextM >= 60) {
                nextH += 1;
                nextM -= 60;
            }

            if (nextH > closeH || (nextH === closeH && nextM > closeM)) {
                nextH = closeH;
                nextM = closeM;
            }

            const slotStart = new Date(queryDate);
            slotStart.setHours(currentH, currentM, 0, 0);

            // Add the slot only if it is in the future (or if the day is not today)
            // If the requested date is strictly in the past, no slots are pushed.
            if (slotStart > now || (!isToday && queryDate > now)) {
                const formatTime = (h, m) => {
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const hr12 = h % 12 || 12;
                    return `${hr12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                };

                const timeStr = `${formatTime(currentH, currentM)} - ${formatTime(nextH, nextM)}`;
                uiTimeSlots.push(timeStr);
            }

            currentH = nextH;
            currentM = nextM;
            
            // Safety break to prevent infinite loops if opening/closing times are weird
            if (currentH > 23) break;
        }

        const bookings = await Booking.find({
            station: stationId,
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            paymentStatus: { $in: ['paid', 'offline_paid'] },
            bookingStatus: { $ne: 'cancelled' }
        });

        const availability = uiTimeSlots.map(timeRange => {
            const [s, e] = timeRange.split(' - ');
            // Convert "09:00 AM - 10:00 AM" to "09:00" and "10:00" for comparison
            const parseToHHMM = (timeStr) => {
                let [time, ampm] = timeStr.split(' ');
                let [h, m] = time.split(':').map(Number);
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };

            const slotStart = parseToHHMM(s);
            const slotEnd = parseToHHMM(e);

            const bookedCount = bookings.filter(b => 
                isOverlapping(slotStart, slotEnd, b.startTime, b.endTime)
            ).length;

            return {
                time: timeRange,
                availablePorts: Math.max(0, totalPorts - bookedCount)
            };
        });

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Owner starts manual charging session for walk-in user
// @route  POST /api/bookings/owner/start-charging
const startCharging = async (req, res) => {
    try {
        const { stationId, portNumber } = req.body;
        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        // Check if port is already active
        const existingActive = await Booking.findOne({
            station: stationId,
            portNumber,
            bookingStatus: 'active'
        });

        if (existingActive) {
            return res.status(400).json({ message: `Port ${portNumber} is already in use.` });
        }

        const now = new Date();
        const startTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const booking = await Booking.create({
            station: stationId,
            portNumber,
            bookingDate: now,
            startTime: startTimeStr,
            bookingStatus: 'active',
            source: 'offline',
            paymentStatus: 'pending',
            paymentMethod: 'offline',
            receiptNumber: `SESSION-${Math.floor(100000 + Math.random() * 900000)}`
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Owner stops manual charging session
// @route  POST /api/bookings/owner/stop-charging
const stopCharging = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('station');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.bookingStatus !== 'active' && booking.bookingStatus !== 'upcoming') {
            return res.status(400).json({ message: 'Session is not active or scheduled' });
        }

        const now = new Date();
        const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Calculate amount based on duration and station price
        const startMin = timeToMinutes(booking.startTime);
        const endMin = timeToMinutes(endTimeStr);
        let durationHours = (endMin - startMin) / 60;
        
        // If it wrapped around or is very short, ensure minimum or handle date switch
        if (durationHours < 0) durationHours += 24; 
        
        const totalAmount = Math.max(0.1, durationHours * booking.station.pricePerHour);

        booking.endTime = endTimeStr;
        booking.bookingStatus = 'completed';
        booking.paymentStatus = 'offline_paid';
        booking.totalAmount = parseFloat(totalAmount.toFixed(2));
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get live port status for owner dashboard
// @route  GET /api/bookings/owner/station/:id/ports
const getPortStatus = async (req, res) => {
    try {
        const stationId = req.params.id;
        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const now = new Date();
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Find bookings that are 'active' OR 'upcoming' but scheduled for NOW on THIS DATE
        const busyBookings = await Booking.find({
            station: stationId,
            bookingDate: {
                $gte: new Date(now.setHours(0,0,0,0)),
                $lte: new Date(now.setHours(23,59,59,999))
            },
            bookingStatus: { $in: ['active', 'upcoming'] }
        });

        const ports = [];
        for (let i = 1; i <= station.totalPorts; i++) {
            // Find if this port has an active session OR a scheduled block/booking for right now
            const activeBooking = busyBookings.find(b => {
                if (b.portNumber !== i) return false;
                if (b.bookingStatus === 'active') return true;
                
                // For 'upcoming', check if current time is within [startTime, endTime]
                if (b.bookingStatus === 'upcoming' && b.startTime && b.endTime) {
                    return currentTimeStr >= b.startTime && currentTimeStr <= b.endTime;
                }
                return false;
            });

            ports.push({
                portId: i,
                portNumber: i,
                status: activeBooking ? 'busy' : 'available',
                booking: activeBooking || null
            });
        }

        res.json({
            stationName: station.stationName,
            totalPorts: station.totalPorts,
            usedPorts: ports.filter(p => p.status === 'busy').length,
            availablePorts: ports.filter(p => p.status === 'available').length,
            ports
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Owner blocks a port for a specific time (Maintenance/Manual)
// @route  POST /api/bookings/owner/block-port
const blockPort = async (req, res) => {
    try {
        const { stationId, portNumber, bookingDate, startTime, endTime } = req.body;
        console.log('Blocking port request:', { stationId, portNumber, bookingDate, startTime, endTime });

        const station = await ChargingStation.findById(stationId);
        if (!station) {
            console.log('Station not found during blockPort:', stationId);
            return res.status(404).json({ message: 'Station not found' });
        }

        // Create a 'manual_block' booking with a unique receipt number to avoid duplicate null index errors
        const booking = await Booking.create({
            user: req.user._id,
            station: stationId,
            portNumber,
            bookingDate: new Date(bookingDate),
            startTime,
            endTime,
            bookingStatus: 'upcoming',
            source: 'offline', 
            paymentStatus: 'offline_paid',
            paymentMethod: 'offline',
            totalAmount: 0,
            receiptNumber: `BLOCK-${Math.floor(100000 + Math.random() * 900000)}`
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error('Block port error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc   Cancel booking (Owner or User)
// @route  PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Only user who booked or station owner can cancel
        // For simplicity, let's allow the user for now
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        // 5-minute cancellation window check
        const now = new Date();
        const bookingTime = new Date(booking.createdAt);
        const diffMinutes = (now - bookingTime) / (1000 * 60);

        if (diffMinutes > 5 && req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Booking can only be cancelled within 5 minutes of booking.' });
        }

        booking.bookingStatus = 'cancelled';
        await booking.save();

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get booking details by receipt number (Owner only)
// @route  GET /api/bookings/receipt/:receiptNumber
const getBookingByReceipt = async (req, res) => {
    try {
        const { receiptNumber } = req.params;
        const booking = await Booking.findOne({ receiptNumber })
            .populate('user', 'name email phone')
            .populate('station', 'stationName address city owner');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found for this receipt number' });
        }

        // Check if the requester is the owner of the station
        if (booking.station.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this station' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Mark booking as expired (Owner only)
// @route  PUT /api/bookings/receipt/:receiptNumber/expire
const expireBooking = async (req, res) => {
    try {
        const { receiptNumber } = req.params;
        const booking = await Booking.findOne({ receiptNumber }).populate('station', 'owner');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if the requester is the owner of the station
        if (booking.station.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (booking.isExpired) {
            return res.status(400).json({ message: 'Receipt is already expired' });
        }

        booking.isExpired = true;
        await booking.save();

        res.json({ message: 'Receipt marked as expired successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Manually update booking status (Owner/Admin only)
// @route  PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findById(id).populate('station');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if user is owner of the station or admin
        if (req.user.role !== 'admin' && booking.station.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this booking status' });
        }

        booking.bookingStatus = status;
        await booking.save();

        res.json({ message: 'Booking status updated successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initiateBooking,
    confirmBooking,
    getUserBookings,
    getOwnerBookings,
    getOwnerEarnings,
    getAvailability,
    startCharging,
    stopCharging,
    getPortStatus,
    blockPort,
    cancelBooking,
    getBookingByReceipt,
    expireBooking,
    updateBookingStatus
};
