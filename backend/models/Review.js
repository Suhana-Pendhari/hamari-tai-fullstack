const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  maid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maid',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ maid: 1 });

module.exports = mongoose.model('Review', reviewSchema);

