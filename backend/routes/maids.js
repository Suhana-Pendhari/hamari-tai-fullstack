const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Maid = require('../models/Maid');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { processDocument } = require('../utils/ocr');
const { updateTrustScore } = require('../utils/trustScore');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Middleware to parse JSON strings from FormData
const parseFormDataJson = (req, res, next) => {
  if (req.body.skills && typeof req.body.skills === 'string') {
    try {
      req.body.skills = JSON.parse(req.body.skills);
    } catch (e) {
      // If parsing fails, keep as is
    }
  }
  if (req.body.availability && typeof req.body.availability === 'string') {
    try {
      req.body.availability = JSON.parse(req.body.availability);
    } catch (e) {
      // If parsing fails, keep as is
    }
  }
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (e) {
      // If parsing fails, keep as is
    }
  }
  // Parse numeric fields
  if (req.body.age && typeof req.body.age === 'string') {
    req.body.age = parseInt(req.body.age);
  }
  if (req.body.experience && typeof req.body.experience === 'string') {
    req.body.experience = parseInt(req.body.experience);
  }
  if (req.body.salaryExpectation && typeof req.body.salaryExpectation === 'string') {
    req.body.salaryExpectation = parseInt(req.body.salaryExpectation);
  }
  next();
};

// @route   POST /api/maids/register
// @desc    Register a new maid
// @access  Private (maid role)
router.post('/register', protect, authorize('maid'), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 }
]), parseFormDataJson, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 18, max: 70 }).withMessage('Age must be between 18 and 70'),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a non-negative number'),
  body('salaryExpectation').isInt({ min: 0 }).withMessage('Salary expectation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Check if maid profile already exists
    const existingMaid = await Maid.findOne({ user: req.user._id });
    if (existingMaid) {
      return res.status(400).json({ message: 'Maid profile already exists' });
    }

    const {
      name,
      age,
      skills,
      experience,
      availability,
      salaryExpectation,
      location,
      bio
    } = req.body;

    // Fields are already parsed by middleware, but ensure they're in correct format
    const parsedAvailability = typeof availability === 'string' ? JSON.parse(availability) : availability;
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;

    // Process photo upload
    let photoPath = '';
    if (req.files && req.files.photo) {
      photoPath = req.files.photo[0].path;
    }

    // Process document uploads and OCR
    const documents = {
      aadhaar: {
        number: '',
        document: '',
        verified: false,
        ocrData: {}
      },
      pan: {
        number: '',
        document: '',
        verified: false,
        ocrData: {}
      }
    };

    // Validate required documents
    if (!req.files || !req.files.aadhaar) {
      return res.status(400).json({ message: 'Aadhaar document is required' });
    }

    if (!req.files || !req.files.pan) {
      return res.status(400).json({ message: 'PAN document is required' });
    }

    // Process Aadhaar document
    try {
      const aadhaarPath = req.files.aadhaar[0].path;
      documents.aadhaar.document = aadhaarPath;
      
      // Perform OCR (non-blocking - continue even if it fails)
      try {
        const ocrResult = await processDocument(aadhaarPath, 'aadhaar');
        if (ocrResult.success && ocrResult.data) {
          documents.aadhaar.ocrData = ocrResult.data;
          documents.aadhaar.number = ocrResult.data.aadhaarNumber || '';
        }
      } catch (ocrError) {
        console.error('OCR error for Aadhaar:', ocrError);
        // Continue without OCR data - admin can verify manually
      }
    } catch (error) {
      console.error('Error processing Aadhaar:', error);
      return res.status(400).json({ message: 'Error processing Aadhaar document' });
    }

    // Process PAN document
    try {
      const panPath = req.files.pan[0].path;
      documents.pan.document = panPath;
      
      // Perform OCR (non-blocking - continue even if it fails)
      try {
        const ocrResult = await processDocument(panPath, 'pan');
        if (ocrResult.success && ocrResult.data) {
          documents.pan.ocrData = ocrResult.data;
          documents.pan.number = ocrResult.data.panNumber || '';
        }
      } catch (ocrError) {
        console.error('OCR error for PAN:', ocrError);
        // Continue without OCR data - admin can verify manually
      }
    } catch (error) {
      console.error('Error processing PAN:', error);
      return res.status(400).json({ message: 'Error processing PAN document' });
    }

    // Validate required fields
    if (!parsedSkills || parsedSkills.length === 0) {
      return res.status(400).json({ message: 'At least one skill is required' });
    }
    
    if (!parsedAvailability || !parsedAvailability.days || parsedAvailability.days.length === 0) {
      return res.status(400).json({ message: 'At least one availability day is required' });
    }

    if (!parsedLocation || (!parsedLocation.lat || !parsedLocation.lng)) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    // Create maid profile
    const maid = await Maid.create({
      user: req.user._id,
      name: name.trim(),
      age: parseInt(age),
      skills: parsedSkills,
      experience: parseInt(experience),
      availability: parsedAvailability,
      salaryExpectation: parseInt(salaryExpectation),
      location: {
        type: 'Point',
        coordinates: [parseFloat(parsedLocation.lng) || 0, parseFloat(parsedLocation.lat) || 0],
        address: parsedLocation.address || ''
      },
      photo: photoPath,
      documents,
      bio: (bio || '').trim()
    });

    res.status(201).json({
      message: 'Maid profile created successfully',
      maid
    });
  } catch (error) {
    console.error('Maid registration error:', error);
    console.error('Error stack:', error.stack);
    
    // If it's a validation error from mongoose, provide more details
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      });
    }
    
    // If it's a duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Maid profile already exists for this user',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create maid profile',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/maids/profile
// @desc    Get maid profile
// @access  Private (maid role)
router.get('/profile', protect, authorize('maid'), async (req, res) => {
  try {
    const maid = await Maid.findOne({ user: req.user._id })
      .populate('user', 'name email phone');

    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }

    res.json(maid);
  } catch (error) {
    console.error('Get maid profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/maids/profile
// @desc    Update maid profile
// @access  Private (maid role)
router.put('/profile', protect, authorize('maid'), upload.fields([
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const maid = await Maid.findOne({ user: req.user._id });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }

    const updateData = { ...req.body };

    // Handle photo update
    if (req.files && req.files.photo) {
      // Delete old photo if exists
      if (maid.photo && fs.existsSync(maid.photo)) {
        fs.unlinkSync(maid.photo);
      }
      updateData.photo = req.files.photo[0].path;
    }

    // Parse JSON fields
    if (updateData.skills && typeof updateData.skills === 'string') {
      updateData.skills = JSON.parse(updateData.skills);
    }
    if (updateData.availability && typeof updateData.availability === 'string') {
      updateData.availability = JSON.parse(updateData.availability);
    }
    if (updateData.location && typeof updateData.location === 'string') {
      const parsedLocation = JSON.parse(updateData.location);
      updateData.location = {
        type: 'Point',
        coordinates: [parsedLocation.lng || 0, parsedLocation.lat || 0],
        address: parsedLocation.address || ''
      };
    }

    const updatedMaid = await Maid.findByIdAndUpdate(
      maid._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      maid: updatedMaid
    });
  } catch (error) {
    console.error('Update maid profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/maids/:id
// @desc    Get maid by ID (public profile)
// @access  Private (authenticated users)
router.get('/:id', protect, async (req, res) => {
  try {
    const maid = await Maid.findById(req.params.id)
      .populate('user', 'name email phone')
      .select('-documents'); // Don't expose document details

    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    res.json(maid);
  } catch (error) {
    console.error('Get maid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/maids/status
// @desc    Update maid active status
// @access  Private (maid role)
router.put('/status', protect, authorize('maid'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const maid = await Maid.findOne({ user: req.user._id });
    
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }

    maid.isActive = isActive;
    await maid.save();

    res.json({
      message: 'Status updated successfully',
      maid
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

