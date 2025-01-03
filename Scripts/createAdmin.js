// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const createAdminUser = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/legalvault', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdminUser();