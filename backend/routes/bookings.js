const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Maid = require('../models/Maid');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a booking request
// @access  Private (user role)
router.post('/', protect, [
  body('maid').notEmpty().withMessage('Maid ID is required'),
  body('serviceType').isIn(['cleaning', 'cooking', 'babysitting', 'elderly_care']).withMessage('Invalid service type'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('location').notEmpty().withMessage('Location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      maid,
      serviceType,
      date,
      startTime,
      endTime,
      address,
      location,
      notes,
      amount
    } = req.body;

    // Verify maid exists and is active
    const maidDoc = await Maid.findById(maid);
    if (!maidDoc) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    if (!maidDoc.isActive) {
      return res.status(400).json({ message: 'Maid is not currently active' });
    }

    // Calculate amount if not provided (use maid's salary expectation)
    const bookingAmount = amount || maidDoc.salaryExpectation;

    // Parse location
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      maid,
      serviceType,
      date: new Date(date),
      startTime,
      endTime,
      address,
      location: {
        type: 'Point',
        coordinates: [parsedLocation.lng || 0, parsedLocation.lat || 0]
      },
      amount: bookingAmount,
      notes: notes || '',
      status: 'pending'
    });

    res.status(201).json({
      message: 'Booking request created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get bookings for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = {};

    // If user is a maid, get bookings for the maid
    if (req.user.role === 'maid') {
      const maid = await Maid.findOne({ user: req.user._id });
      if (maid) {
        query.maid = maid._id;
      } else {
        return res.json({ count: 0, bookings: [] });
      }
    } else {
      // If user is a regular user, get their bookings
      query.user = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('maid', 'name photo skills')
      .sort({ createdAt: -1 })
      .limit(50);

    // Check if reviews exist for each booking
    const bookingsWithReviews = await Promise.all(
      bookings.map(async (booking) => {
        const review = await Review.findOne({ booking: booking._id });
        const bookingObj = booking.toObject();
        bookingObj.hasReview = !!review;
        return bookingObj;
      })
    );

    res.json({
      count: bookingsWithReviews.length,
      bookings: bookingsWithReviews
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('maid', 'name photo skills');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role === 'maid') {
      const maid = await Maid.findOne({ user: req.user._id });
      if (!maid || booking.maid.toString() !== maid._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else {
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, [
  body('status').isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization check
    if (req.user.role === 'maid') {
      const maid = await Maid.findOne({ user: req.user._id });
      if (!maid || booking.maid.toString() !== maid._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else {
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

