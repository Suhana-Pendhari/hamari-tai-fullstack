const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Maid = require('../models/Maid');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Sample data
const sampleUsers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    password: 'password123',
    phone: '9876543210',
    role: 'user',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139], // New Delhi
      address: '123 Main Street, New Delhi'
    }
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'password123',
    phone: '9876543211',
    role: 'user',
    location: {
      type: 'Point',
      coordinates: [77.2167, 28.6667],
      address: '456 Park Avenue, New Delhi'
    }
  },
  {
    name: 'Amit Patel',
    email: 'amit@example.com',
    password: 'password123',
    phone: '9876543212',
    role: 'user',
    location: {
      type: 'Point',
      coordinates: [77.2000, 28.6000],
      address: '789 Garden Road, New Delhi'
    }
  }
];

const sampleMaids = [
  {
    name: 'Sunita Devi',
    age: 35,
    skills: ['cleaning', 'cooking'],
    experience: 8,
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    },
    salaryExpectation: 15000,
    location: {
      type: 'Point',
      coordinates: [77.2100, 28.6140],
      address: 'Near Connaught Place, New Delhi'
    },
    bio: 'Experienced and reliable domestic helper with 8 years of experience.',
    verificationStatus: 'verified',
    trustScore: {
      score: 85,
      status: 'Trusted',
      lastUpdated: new Date()
    },
    rating: {
      average: 4.5,
      count: 12
    },
    isActive: true
  },
  {
    name: 'Kamala Bai',
    age: 42,
    skills: ['cleaning', 'cooking', 'babysitting'],
    experience: 12,
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      startTime: '08:00',
      endTime: '18:00'
    },
    salaryExpectation: 18000,
    location: {
      type: 'Point',
      coordinates: [77.2150, 28.6650],
      address: 'Karol Bagh, New Delhi'
    },
    bio: 'Professional maid with expertise in cooking and childcare.',
    verificationStatus: 'verified',
    trustScore: {
      score: 92,
      status: 'Trusted',
      lastUpdated: new Date()
    },
    rating: {
      average: 4.8,
      count: 25
    },
    isActive: true
  },
  {
    name: 'Geeta Kumari',
    age: 28,
    skills: ['cleaning', 'elderly_care'],
    experience: 5,
    availability: {
      days: ['monday', 'wednesday', 'friday'],
      startTime: '10:00',
      endTime: '16:00'
    },
    salaryExpectation: 12000,
    location: {
      type: 'Point',
      coordinates: [77.2050, 28.6050],
      address: 'Dwarka, New Delhi'
    },
    bio: 'Caring and dedicated helper specializing in elderly care.',
    verificationStatus: 'verified',
    trustScore: {
      score: 75,
      status: 'Verified',
      lastUpdated: new Date()
    },
    rating: {
      average: 4.2,
      count: 8
    },
    isActive: true
  },
  {
    name: 'Radha Singh',
    age: 38,
    skills: ['cooking', 'babysitting'],
    experience: 10,
    availability: {
      days: ['tuesday', 'thursday', 'saturday'],
      startTime: '09:00',
      endTime: '15:00'
    },
    salaryExpectation: 16000,
    location: {
      type: 'Point',
      coordinates: [77.2200, 28.6700],
      address: 'Rohini, New Delhi'
    },
    bio: 'Expert cook and experienced babysitter.',
    verificationStatus: 'pending',
    trustScore: {
      score: 0,
      status: 'Needs Review',
      lastUpdated: new Date()
    },
    rating: {
      average: 0,
      count: 0
    },
    isActive: true
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hamari-tai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Maid.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Created user: ${user.name}`);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hamaritai.com',
      password: 'admin123',
      phone: '9999999999',
      role: 'admin',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
        address: 'Admin Office, New Delhi'
      }
    });
    console.log(`Created admin user: ${adminUser.email}`);

    // Create maid users and profiles
    console.log('Creating maids...');
    const createdMaids = [];
    for (let i = 0; i < sampleMaids.length; i++) {
      const maidData = sampleMaids[i];
      
      // Create user for maid
      const maidUser = await User.create({
        name: maidData.name,
        email: `maid${i + 1}@example.com`,
        password: 'password123',
        phone: `9876543${200 + i}`,
        role: 'maid',
        location: maidData.location
      });

      // Create maid profile
      const maid = await Maid.create({
        ...maidData,
        user: maidUser._id
      });
      createdMaids.push(maid);
      console.log(`Created maid: ${maid.name}`);
    }

    // Create some bookings
    console.log('Creating bookings...');
    if (createdUsers.length > 0 && createdMaids.length > 0) {
      const booking1 = await Booking.create({
        user: createdUsers[0]._id,
        maid: createdMaids[0]._id,
        serviceType: 'cleaning',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startTime: '10:00',
        endTime: '14:00',
        address: createdUsers[0].location.address,
        location: createdUsers[0].location,
        amount: createdMaids[0].salaryExpectation,
        status: 'accepted'
      });

      const booking2 = await Booking.create({
        user: createdUsers[1]._id,
        maid: createdMaids[1]._id,
        serviceType: 'cooking',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startTime: '09:00',
        endTime: '13:00',
        address: createdUsers[1].location.address,
        location: createdUsers[1].location,
        amount: createdMaids[1].salaryExpectation,
        status: 'completed'
      });

      console.log('Created sample bookings');

      // Create reviews for completed booking
      if (booking2) {
        await Review.create({
          maid: createdMaids[1]._id,
          user: createdUsers[1]._id,
          booking: booking2._id,
          rating: 5,
          comment: 'Excellent service! Very professional and punctual.',
          sentiment: 'positive'
        });
        console.log('Created sample review');
      }
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@hamaritai.com / admin123');
    console.log('User: rajesh@example.com / password123');
    console.log('Maid: maid1@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

