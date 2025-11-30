const mongoose = require('mongoose');

const maidSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 70
  },
  skills: [{
    type: String,
    enum: ['cleaning', 'cooking', 'babysitting', 'elderly_care'],
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    startTime: String, // Format: "HH:MM"
    endTime: String
  },
  salaryExpectation: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true // [longitude, latitude]
    },
    address: String
  },
  photo: {
    type: String,
    default: ''
  },
  documents: {
    aadhaar: {
      number: String,
      document: String, // File path
      verified: {
        type: Boolean,
        default: false
      },
      ocrData: Object
    },
    pan: {
      number: String,
      document: String,
      verified: {
        type: Boolean,
        default: false
      },
      ocrData: Object
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  trustScore: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['Trusted', 'Verified', 'Needs Review'],
      default: 'Needs Review'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index
maidSchema.index({ location: '2dsphere' });
maidSchema.index({ 'trustScore.score': -1 });
maidSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Maid', maidSchema);

