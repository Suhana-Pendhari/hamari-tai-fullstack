const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hamari-tai';
    
    // Validate connection string format
    if (mongoURI.includes('mongodb+srv://')) {
      // Check for common Atlas connection string issues
      if (mongoURI.includes('cluster.mongocp.') || mongoURI.includes('cluster.mongodb.net') && !mongoURI.match(/cluster[0-9]?\.\w+\.mongodb\.net/)) {
        console.error('⚠️  WARNING: Your MongoDB Atlas connection string appears to be invalid.');
        console.error('   The hostname should look like: cluster0.xxxxx.mongodb.net');
        console.error('   Current URI (hidden):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
        console.error('\n   To fix:');
        console.error('   1. Go to MongoDB Atlas: https://cloud.mongodb.com');
        console.error('   2. Click "Connect" on your cluster');
        console.error('   3. Choose "Connect your application"');
        console.error('   4. Copy the connection string and update MONGODB_URI in .env');
        console.error('   5. Make sure to replace <password> with your actual password');
        console.error('   6. Format: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hamari-tai\n');
      }
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased to 10s for Atlas
    });
    console.log('✅ MongoDB Connected successfully');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host || 'Atlas Cluster');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    
    // Provide specific error guidance
    if (err.message.includes('ENOTFOUND') || err.message.includes('querySrv')) {
      console.error('\n🔍 This error usually means:');
      console.error('   • Invalid MongoDB Atlas connection string');
      console.error('   • Cluster hostname is incorrect');
      console.error('   • Network/DNS issue');
      console.error('\n💡 Quick Fix Options:');
      console.error('   Option 1: Use Local MongoDB (Easiest)');
      console.error('      Update backend/.env:');
      console.error('      MONGODB_URI=mongodb://localhost:27017/hamari-tai');
      console.error('      Then start MongoDB: mongod --dbpath "C:\\data\\db"');
      console.error('\n   Option 2: Fix Atlas Connection String');
      console.error('      1. Go to: https://cloud.mongodb.com');
      console.error('      2. Get correct connection string from your cluster');
      console.error('      3. Update MONGODB_URI in backend/.env');
      console.error('      4. Format: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hamari-tai');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\n🔍 MongoDB is not running locally');
      console.error('   Start MongoDB: mongod --dbpath "C:\\data\\db"');
    } else {
      console.error('\n📋 General troubleshooting:');
      console.error('   1. Check your .env file has correct MONGODB_URI');
      console.error('   2. For Atlas: Verify cluster is running and IP is whitelisted');
      console.error('   3. For local: Make sure MongoDB service is running');
    }
    console.error('');
    
    // Don't exit in development - allow server to start without DB for testing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Connect to database
connectDB();

// Socket.io for chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/maids', require('./routes/maids'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hamari Tai API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Make io available to routes via app
app.io = io;

// Export io for use in routes
module.exports = { io };

