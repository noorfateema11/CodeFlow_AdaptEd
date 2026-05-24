const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Imported to track active network states

exports.signup = async (req, res) => {
    try {
        // Explicit Safeguard: Fail cleanly with valid JSON if MongoDB is not connected yet
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is warming up. Please wait a moment and click Register again."
            });
        }

        const { name, email, password, disabilityType } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            disabilityType
        });

        await newUser.save();

        return res.status(201).json({
            message: "User registered successfully!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                disabilityType: newUser.disabilityType
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error during registration",
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        // Explicit Safeguard: Prevents empty JSON stream drops if database connection is pending
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Establishing database handshake. Please re-enter your password in 3 seconds."
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, disabilityType: user.disabilityType },
            process.env.JWT_SECRET || 'SUPER_SECRET_KEY_PLACEHOLDER',
            { expiresIn: '1d' }
        );

        // Your integration requirement: returns token, name, and disabilityType
        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                disabilityType: user.disabilityType
            }
        });
    } catch (error) {
        // Ensures that errors always return clean JSON structures so frontend json() parsing never breaks
        return res.status(500).json({
            message: "Server error during login",
            error: error.message
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({
            message: "Server error fetching profile",
            error: error.message
        });
    }
};

exports.updateDisability = async (req, res) => {
    try {
        const { disabilityType } = req.body;
        const validTypes = ['none', 'dyslexia', 'blind', 'deaf', 'visual-learning'];

        if (!validTypes.includes(disabilityType)) {
            return res.status(400).json({
                message: `Invalid disability type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { disabilityType },
            { new: true }
        ).select('-password');

        return res.status(200).json({
            message: 'Disability type updated',
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error updating disability type',
            error: error.message
        });
    }
};