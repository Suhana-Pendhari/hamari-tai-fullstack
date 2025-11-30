const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Maid = require('../models/Maid');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const { analyzeSentiment, updateTrustScore, analyzeMaidReviews } = require('../utils/trustScore');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private (user role)
router.post('/', protect, [
  body('maid').notEmpty().withMessage('Maid ID is required'),
  body('booking').notEmpty().withMessage('Booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { maid, booking, rating, comment } = req.body;

    // Verify booking belongs to user and is completed
    const bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (bookingDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    if (bookingDoc.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    // Analyze sentiment
    const sentiment = analyzeSentiment(comment || '');

    // Create review
    const review = await Review.create({
      maid,
      user: req.user._id,
      booking,
      rating,
      comment: comment || '',
      sentiment: sentiment.sentiment
    });

    // Update maid rating
    const maidDoc = await Maid.findById(maid);
    if (maidDoc) {
      const totalRating = maidDoc.rating.average * maidDoc.rating.count + rating;
      maidDoc.rating.count += 1;
      maidDoc.rating.average = totalRating / maidDoc.rating.count;
      await maidDoc.save();

      // Update trust score
      await updateTrustScore(maid);
    }

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/maid/:maidId
// @desc    Get reviews for a maid
// @access  Private
router.get('/maid/:maidId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ maid: req.params.maidId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/user
// @desc    Get reviews by current user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('maid', 'name photo')
      .sort({ createdAt: -1 });

    res.json({
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

