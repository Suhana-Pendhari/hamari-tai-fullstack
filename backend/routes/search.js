const express = require('express');
const Maid = require('../models/Maid');
const { protect } = require('../middleware/auth');
const { getRecommendedMaids } = require('../utils/recommendation');

const router = express.Router();

// @route   GET /api/search/maids
// @desc    Search maids with filters
// @access  Private
router.get('/maids', protect, async (req, res) => {
  try {
    const {
      lat,
      lng,
      maxDistance = 10,
      skills,
      minExperience = 0,
      maxSalary,
      minSalary,
      minRating = 0,
      sortBy = 'recommendation' // recommendation, rating, distance, salary
    } = req.query;

    // Validate location
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location (lat, lng) is required' });
    }

    const userPreferences = {
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      maxDistance: parseFloat(maxDistance),
      skills: skills ? (Array.isArray(skills) ? skills : skills.split(',')) : [],
      salaryRange: (minSalary || maxSalary) ? {
        min: minSalary ? parseFloat(minSalary) : 0,
        max: maxSalary ? parseFloat(maxSalary) : 100000
      } : null,
      minExperience: parseFloat(minExperience),
      minRating: parseFloat(minRating)
    };

    // Get recommended maids
    const results = await getRecommendedMaids(userPreferences, 50);

    // Sort results
    if (sortBy === 'rating') {
      results.sort((a, b) => b.maid.rating.average - a.maid.rating.average);
    } else if (sortBy === 'salary') {
      results.sort((a, b) => a.maid.salaryExpectation - b.maid.salaryExpectation);
    } else if (sortBy === 'distance') {
      // Distance is already considered in recommendation score
      // Results are already sorted by recommendation score
    }

    res.json({
      count: results.length,
      maids: results.map(result => ({
        ...result.maid,
        recommendationScore: result.recommendationScore
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/search/maids/nearby
// @desc    Get nearby maids (simple geospatial query)
// @access  Private
router.get('/maids/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location (lat, lng) is required' });
    }

    const maids = await Maid.find({
      isActive: true,
      verificationStatus: 'verified',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      }
    })
    .populate('user', 'name email phone')
    .select('-documents')
    .limit(20);

    res.json({
      count: maids.length,
      maids
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

