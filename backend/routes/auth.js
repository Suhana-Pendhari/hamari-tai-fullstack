const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Maid = require('../models/Maid');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['user', 'maid']).withMessage('Role must be user or maid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role = 'user', location } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Prepare user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      role
    };

    // Add location if provided with valid coordinates
    // Check if location exists and has valid lat/lng (not empty strings)
    if (location && 
        location.lat !== undefined && location.lat !== '' && location.lat !== null &&
        location.lng !== undefined && location.lng !== '' && location.lng !== null) {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      
      // Only add location if coordinates are valid numbers
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        userData.location = {
          type: 'Point',
          coordinates: [lng, lat],
          address: location.address || ''
        };
      }
    }
    // If location not provided or invalid, user will have default location [0, 0] from schema

    // Create user
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    const user = await User.create(userData);
    console.log('User created successfully:', { id: user._id, email: user.email, role: user.role });

    // Verify user was saved
    const savedUser = await User.findById(user._id);
    if (!savedUser) {
      console.error('ERROR: User was created but not found in database!');
      return res.status(500).json({ message: 'User creation failed - not saved to database' });
    }
    console.log('User verified in database:', savedUser._id);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Get maid profile if role is maid
    let maidProfile = null;
    if (user.role === 'maid') {
      maidProfile = await Maid.findOne({ user: user._id });
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location
      },
      maidProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    let maidProfile = null;
    if (user.role === 'maid') {
      maidProfile = await Maid.findOne({ user: user._id });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location
      },
      maidProfile
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

