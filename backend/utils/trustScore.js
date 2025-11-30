const natural = require('natural');
const Review = require('../models/Review');
const TrustScore = require('../models/TrustScore');
const Maid = require('../models/Maid');

// Initialize sentiment analyzer
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer('English', stemmer, 'afinn');

/**
 * Analyze sentiment of a review comment
 * @param {String} text - Review comment text
 * @returns {Object} - Sentiment analysis result
 */
const analyzeSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral',
      score: 0
    };
  }

  const tokens = natural.WordTokenizer().tokenize(text.toLowerCase());
  const sentimentScore = analyzer.getSentiment(tokens);

  let sentiment = 'neutral';
  if (sentimentScore > 0.1) {
    sentiment = 'positive';
  } else if (sentimentScore < -0.1) {
    sentiment = 'negative';
  }

  return {
    sentiment,
    score: sentimentScore
  };
};

/**
 * Calculate trust score based on multiple factors
 * @param {Object} maid - Maid document
 * @param {Array} reviews - Array of review documents
 * @returns {Object} - Trust score calculation result
 */
const calculateTrustScore = async (maid) => {
  try {
    const reviews = await Review.find({ maid: maid._id });
    
    let score = 0;
    const factors = {
      documentVerification: 0,
      reviewSentiment: 0,
      ratingAverage: 0,
      experience: 0,
      responseRate: 0
    };

    // Document verification (40 points for admin-verified maids)
    // If maid is verified by admin, give full document verification points
    if (maid.verificationStatus === 'verified') {
      if (maid.documents.aadhaar.verified && maid.documents.pan.verified) {
        factors.documentVerification = 40;
      } else if (maid.documents.aadhaar.verified || maid.documents.pan.verified) {
        factors.documentVerification = 30;
      } else {
        // Admin verified but documents not marked - give base verification points
        factors.documentVerification = 30;
      }
    } else if (maid.documents.aadhaar.verified && maid.documents.pan.verified) {
      factors.documentVerification = 30;
    } else if (maid.documents.aadhaar.verified || maid.documents.pan.verified) {
      factors.documentVerification = 15;
    }
    score += factors.documentVerification;

    // Review sentiment analysis (25 points)
    if (reviews.length > 0) {
      let positiveCount = 0;
      let totalSentimentScore = 0;

      reviews.forEach(review => {
        const sentiment = analyzeSentiment(review.comment || '');
        if (sentiment.sentiment === 'positive') {
          positiveCount++;
        }
        totalSentimentScore += sentiment.score;
      });

      const positiveRatio = positiveCount / reviews.length;
      factors.reviewSentiment = 25 * positiveRatio;
      score += factors.reviewSentiment;
    }

    // Rating average (25 points)
    if (maid.rating.count > 0) {
      factors.ratingAverage = (maid.rating.average / 5) * 25;
      score += factors.ratingAverage;
    }

    // Experience (10 points)
    // More experience = higher score (capped at 10 years for max points)
    factors.experience = Math.min((maid.experience / 10) * 10, 10);
    score += factors.experience;

    // Response rate (10 points) - placeholder, can be enhanced with actual booking data
    // For now, assume active maids have good response rate
    if (maid.isActive) {
      factors.responseRate = 10;
    }
    score += factors.responseRate;

    // Determine status
    // If admin has verified the maid, ensure status is at least 'Verified'
    let status = 'Needs Review';
    if (score >= 80) {
      status = 'Trusted';
    } else if (score >= 60) {
      status = 'Verified';
    } else if (maid.verificationStatus === 'verified') {
      // Admin-verified maids should always have at least 'Verified' status
      status = 'Verified';
      // Boost score to meet minimum threshold
      if (score < 60) {
        score = 60;
      }
    }

    return {
      score: Math.round(score),
      status,
      factors
    };
  } catch (error) {
    console.error('Trust score calculation error:', error);
    throw error;
  }
};

/**
 * Update trust score for a maid
 * @param {String} maidId - Maid ID
 * @returns {Promise<Object>} - Updated trust score
 */
const updateTrustScore = async (maidId) => {
  try {
    const maid = await Maid.findById(maidId);
    if (!maid) {
      throw new Error('Maid not found');
    }

    const trustScoreData = await calculateTrustScore(maid);

    // Update maid's trust score
    maid.trustScore = {
      score: trustScoreData.score,
      status: trustScoreData.status,
      lastUpdated: new Date()
    };
    await maid.save();

    // Update or create TrustScore document
    await TrustScore.findOneAndUpdate(
      { maid: maidId },
      {
        maid: maidId,
        score: trustScoreData.score,
        status: trustScoreData.status,
        factors: trustScoreData.factors,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return trustScoreData;
  } catch (error) {
    console.error('Update trust score error:', error);
    throw error;
  }
};

/**
 * Analyze all reviews for a maid and update sentiment
 * @param {String} maidId - Maid ID
 */
const analyzeMaidReviews = async (maidId) => {
  try {
    const reviews = await Review.find({ maid: maidId });
    
    for (const review of reviews) {
      if (review.comment) {
        const sentiment = analyzeSentiment(review.comment);
        review.sentiment = sentiment.sentiment;
        await review.save();
      }
    }

    // Recalculate trust score after sentiment analysis
    await updateTrustScore(maidId);
  } catch (error) {
    console.error('Review analysis error:', error);
    throw error;
  }
};

module.exports = {
  analyzeSentiment,
  calculateTrustScore,
  updateTrustScore,
  analyzeMaidReviews
};

