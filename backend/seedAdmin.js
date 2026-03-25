const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
    try {
        const adminEmail = 'ilaitricprotal@gmail.com';
        const adminPassword = 'thalapathy';

        // Check if admin already exists
        const adminExists = await User.findOne({ email: adminEmail });

        if (adminExists) {
            console.log('Admin user already exists. Updating password and role...');
            adminExists.password = adminPassword;
            adminExists.role = 'admin';
            await adminExists.save();
            console.log('Admin user updated successfully.');
        } else {
            const admin = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                phone: '0000000000'
            });
            console.log('Admin user created successfully:', admin.email);
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
        process.exit(1);
    }
};

seedAdmin();
