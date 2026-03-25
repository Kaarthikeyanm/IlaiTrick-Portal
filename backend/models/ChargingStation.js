const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationName: { type: String, required: true },
    locationName: { type: String },
    address: { type: String },
    city: { type: String },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            default: [0, 0]
        }
    },
    pricePerHour: { type: Number, default: 0 },
    totalPorts: { type: Number, default: 1 },
    availablePorts: { type: Number, default: 1 }, // Kept for quick stats, but logic will use query
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '18:00' },
    workingDate: { type: String }, // Format YYYY-MM-DD
    validUntil: { type: Date }, // Time when station automatically closes
    slotDuration: { type: Number, default: 60 }, // in minutes
    availableDates: { type: [Date], default: [] },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    
    // Owner Details
    ownerName: { type: String },
    ownerPhone: { type: String },
    ownerEmail: { type: String },
    aadhaarNumber: { type: String },
    
    // Documents (URLs to stored files)
    documents: {
        aadhaarCard: { type: String },
        businessRegistration: { type: String },
        electricalSafety: { type: String },
        tradeLicense: { type: String }
    },
    
    // Station Images
    images: [{ type: String }],
    
    createdAt: { type: Date, default: Date.now },
});

chargingStationSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('ChargingStation', chargingStationSchema);
