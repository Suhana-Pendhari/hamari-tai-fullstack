const express = require('express');
const Maid = require('../models/Maid');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');
const { updateTrustScore } = require('../utils/trustScore');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (admin)
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMaids = await Maid.countDocuments();
    const pendingVerifications = await Maid.countDocuments({ verificationStatus: 'pending' });
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['pending', 'accepted'] } });
    const totalReviews = await Review.countDocuments();

    res.json({
      stats: {
        totalUsers,
        totalMaids,
        pendingVerifications,
        totalBookings,
        activeBookings,
        totalReviews
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/maids/pending
// @desc    Get maids pending verification
// @access  Private (admin)
router.get('/maids/pending', async (req, res) => {
  try {
    const maids = await Maid.find({ verificationStatus: 'pending' })
      .populate('user', 'name email phone')
      .select('name age skills documents verificationStatus createdAt')
      .sort({ createdAt: -1 });

    res.json({
      count: maids.length,
      maids
    });
  } catch (error) {
    console.error('Get pending maids error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/maids/:id/verify
// @desc    Verify or reject a maid
// @access  Private (admin)
router.put('/maids/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, documentType } = req.body; // documentType: 'aadhaar' or 'pan'

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const maid = await Maid.findById(req.params.id);
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    maid.verificationStatus = verificationStatus;

    // If verifying, mark documents as verified
    if (verificationStatus === 'verified') {
      // Mark both documents as verified (admin has verified the maid)
      maid.documents.aadhaar.verified = true;
      maid.documents.pan.verified = true;

      // Ensure maid is active
      maid.isActive = true;

      // Update trust score after verification (this will ensure proper status)
      try {
        await updateTrustScore(maid._id);
        // Reload maid to get updated trust score
        await maid.populate('user', 'name email phone');
      } catch (trustScoreError) {
        console.error('Error updating trust score:', trustScoreError);
        // Continue even if trust score update fails - maid is still verified
      }
    }

    // Save the maid with all updates
    await maid.save();
    
    // Reload to get latest data including trust score
    const updatedMaid = await Maid.findById(maid._id).populate('user', 'name email phone');

    res.json({
      message: `Maid ${verificationStatus} successfully`,
      maid: updatedMaid || maid
    });
  } catch (error) {
    console.error('Verify maid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (admin)
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/maids
// @desc    Get all maids
// @access  Private (admin)
router.get('/maids', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { verificationStatus: status } : {};

    const maids = await Maid.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Maid.countDocuments(query);

    res.json({
      count: maids.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      maids
    });
  } catch (error) {
    console.error('Get maids error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (admin)
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('maid', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/maids/:id
// @desc    Delete a maid
// @access  Private (admin)
router.delete('/maids/:id', async (req, res) => {
  try {
    const maid = await Maid.findById(req.params.id);
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    await Maid.findByIdAndDelete(req.params.id);
    res.json({ message: 'Maid deleted successfully' });
  } catch (error) {
    console.error('Delete maid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

