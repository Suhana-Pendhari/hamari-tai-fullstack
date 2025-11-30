const Maid = require('../models/Maid');
const Booking = require('../models/Booking');

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate recommendation score for a maid
 * @param {Object} maid - Maid document
 * @param {Object} userPreferences - User search preferences
 * @returns {Number} - Recommendation score (0-100)
 */
const calculateRecommendationScore = (maid, userPreferences) => {
  let score = 0;
  const maxScore = 100;

  // Location score (40 points max)
  const distance = calculateDistance(
    userPreferences.location.lat,
    userPreferences.location.lng,
    maid.location.coordinates[1], // latitude
    maid.location.coordinates[0]  // longitude
  );
  
  const maxDistance = userPreferences.maxDistance || 10; // km
  if (distance <= maxDistance) {
    const locationScore = 40 * (1 - distance / maxDistance);
    score += locationScore;
  }

  // Skills match score (25 points max)
  if (userPreferences.skills && userPreferences.skills.length > 0) {
    const matchingSkills = maid.skills.filter(skill => 
      userPreferences.skills.includes(skill)
    ).length;
    const skillScore = (matchingSkills / userPreferences.skills.length) * 25;
    score += skillScore;
  } else {
    score += 25; // If no skill filter, give full points
  }

  // Salary range score (15 points max)
  if (userPreferences.salaryRange) {
    const { min, max } = userPreferences.salaryRange;
    if (maid.salaryExpectation >= min && maid.salaryExpectation <= max) {
      score += 15;
    } else {
      // Partial score if close to range
      const diff = Math.min(
        Math.abs(maid.salaryExpectation - min),
        Math.abs(maid.salaryExpectation - max)
      );
      const salaryScore = Math.max(0, 15 - (diff / 1000) * 5);
      score += salaryScore;
    }
  } else {
    score += 15;
  }

  // Rating score (10 points max)
  const ratingScore = (maid.rating.average / 5) * 10;
  score += ratingScore;

  // Trust score (10 points max)
  const trustScore = (maid.trustScore.score / 100) * 10;
  score += trustScore;

  return Math.min(score, maxScore);
};

/**
 * Get recommended maids for a user
 * @param {Object} userPreferences - User search preferences
 * @param {Number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of maids with recommendation scores
 */
const getRecommendedMaids = async (userPreferences, limit = 20) => {
  try {
    const {
      location,
      maxDistance = 10,
      skills = [],
      salaryRange = null,
      minExperience = 0,
      minRating = 0
    } = userPreferences;

    // Build query
    // Include maids that are verified by admin, regardless of trust score status
    // Trust score will be calculated and can be "Needs Review" initially,
    // but admin-verified maids should still appear in search
    const query = {
      isActive: true,
      verificationStatus: 'verified'
      // Removed strict trustScore filter - admin verification is sufficient
      // Trust score is for ranking, not filtering
    };

    // Skills filter
    if (skills.length > 0) {
      query.skills = { $in: skills };
    }

    // Experience filter
    if (minExperience > 0) {
      query.experience = { $gte: minExperience };
    }

    // Salary range filter
    if (salaryRange) {
      query.salaryExpectation = {
        $gte: salaryRange.min || 0,
        $lte: salaryRange.max || 100000
      };
    }

    // Geospatial query for location
    // Ensure location coordinates are valid
    if (!location.lng || !location.lat || 
        isNaN(location.lng) || isNaN(location.lat) ||
        location.lng === 0 && location.lat === 0) {
      console.warn('Invalid location coordinates for search:', location);
      return [];
    }

    let maids;
    try {
      maids = await Maid.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
            },
            $maxDistance: maxDistance * 1000 // Convert km to meters
          }
        }
      })
      .populate('user', 'name email phone')
      .limit(limit * 2); // Get more to filter by rating
    } catch (geoError) {
      console.error('Geospatial query error:', geoError);
      // Fallback to simple find if geospatial query fails
      maids = await Maid.find(query)
        .populate('user', 'name email phone')
        .limit(limit * 2);
    }

    // Get maids with active bookings (pending or accepted) to exclude them
    const activeBookings = await Booking.find({
      status: { $in: ['pending', 'accepted'] }
    }).select('maid');
    
    const bookedMaidIds = new Set(activeBookings.map(b => b.maid.toString()));

    // Filter by rating, exclude booked maids, and calculate recommendation scores
    const maidsWithScores = maids
      .filter(maid => {
        // Exclude maids with active bookings
        if (bookedMaidIds.has(maid._id.toString())) {
          return false;
        }
        // Filter by rating
        return maid.rating.average >= minRating;
      })
      .map(maid => {
        const recommendationScore = calculateRecommendationScore(maid, {
          location,
          maxDistance,
          skills,
          salaryRange
        });
        return {
          maid: maid.toObject(),
          recommendationScore: Math.round(recommendationScore * 100) / 100
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    return maidsWithScores;
  } catch (error) {
    console.error('Recommendation error:', error);
    throw error;
  }
};

module.exports = {
  calculateDistance,
  calculateRecommendationScore,
  getRecommendedMaids
};

