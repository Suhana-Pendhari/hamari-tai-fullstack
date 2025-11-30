const express = require('express');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate room ID from two user IDs
const generateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// @route   GET /api/chat/rooms
// @desc    Get all chat rooms for current user
// @access  Private
router.get('/rooms', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const rooms = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $max: '$createdAt' },
          lastMessageText: { $first: '$message' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          },
          otherUserId: {
            $first: {
              $cond: [
                { $eq: ['$sender', userId] },
                '$receiver',
                '$sender'
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessage: -1 }
      }
    ]);

    // Populate other user information
    const User = require('../models/User');
    const populatedRooms = await Promise.all(
      rooms.map(async (room) => {
        if (room.otherUserId) {
          const otherUser = await User.findById(room.otherUserId).select('name email role');
          return {
            ...room,
            otherUser: otherUser || { name: 'Unknown User' }
          };
        }
        return room;
      })
    );

    res.json({
      count: populatedRooms.length,
      rooms: populatedRooms
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chat/messages/:roomId
// @desc    Get messages for a chat room
// @access  Private
router.get('/messages/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user is part of this room
    const roomParts = roomId.split('_');
    const userIdStr = req.user._id.toString();
    if (!roomParts.includes(userIdStr)) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    const messages = await ChatMessage.find({ roomId })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      count: messages.length,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', protect, async (req, res) => {
  try {
    const { receiver, message } = req.body;

    if (!receiver || !message) {
      return res.status(400).json({ message: 'Receiver and message are required' });
    }

    const roomId = generateRoomId(req.user._id.toString(), receiver);

    const chatMessage = await ChatMessage.create({
      roomId,
      sender: req.user._id,
      receiver,
      message: message.trim()
    });

    // Emit socket event if io is available
    if (req.app.io) {
      req.app.io.to(roomId).emit('receive-message', {
        roomId,
        sender: req.user._id,
        receiver,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chat/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:id/read', protect, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.read = true;
    await message.save();

    res.json({
      message: 'Message marked as read',
      chatMessage: message
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

