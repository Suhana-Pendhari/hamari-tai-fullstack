const mongoose = require('mongoose');

const trustScoreSchema = new mongoose.Schema({
  maid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maid',
    required: true,
    unique: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Trusted', 'Verified', 'Needs Review'],
    required: true
  },
  factors: {
    documentVerification: {
      type: Number,
      default: 0
    },
    reviewSentiment: {
      type: Number,
      default: 0
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    experience: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

trustScoreSchema.index({ maid: 1 });
trustScoreSchema.index({ score: -1 });

module.exports = mongoose.model('TrustScore', trustScoreSchema);

