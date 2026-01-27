const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail, sendWelcomeEmail, sendLoginEmail } = require('../services/emailService');

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { email, firstName } = req.body;

        if (!email || !firstName) {
            return res.status(400).json({ message: 'Email and first name are required' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email });

        // Save new OTP
        await OTP.create({ email, otp });

        // Send OTP email
        await sendOTPEmail(email, otp, firstName);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, otp, floor, room, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !otp || !floor || !room || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            floor,
            room,
            isVerified: true
        });

        // Delete OTP after successful signup
        await OTP.deleteOne({ email, otp });

        // Send welcome email
        await sendWelcomeEmail(email, firstName);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                floor: user.floor,
                room: user.room,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Send login email
        await sendLoginEmail(email, user.firstName);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                floor: user.floor,
                room: user.room,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// GET /api/auth/users (for viewing all users as JSON)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

module.exports = router;
