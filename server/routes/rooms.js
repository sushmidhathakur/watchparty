const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms — list rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      status: 'active',
      $or: [
        { isPublic: true },
        { hostId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    })
      .populate('hostId', 'username avatarColor')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — Create Room (uuid/apply )
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, isPublic, videoUrl } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    let videoType = 'none';
    if (videoUrl) {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (videoUrl.startsWith('http')) {
        videoType = 'direct';
      }
    }

    // 💡 Mongoose 
    const generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const room = new Room({
      title: title,
      hostId: req.user._id,
      videoUrl: videoUrl || '',
      videoType: videoType,
      isPublic: isPublic === true,
      inviteCode: generatedCode, 
      status: 'active',
      members: [{
        userId: req.user._id,
        username: req.user.username,
        role: 'host',
      }],
    });

    await room.save();
    await room.populate('hostId', 'username avatarColor');
    res.status(201).json({ room });
  } catch (err) {
    console.error('CRITICAL ROOM CREATION ERROR:', err);
    res.status(500).json({ message: 'Database save failed: ' + err.message });
  }
});

// GET /api/rooms/:id — get room details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('hostId', 'username avatarColor')
      .populate('members.userId', 'username avatarColor');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/invite/:code — find by invite code
router.get('/invite/:code', authMiddleware, async (req, res) => {
  try {
    const inputCodeUpper = req.params.code.trim().toUpperCase();
    let room = await Room.findOne({ inviteCode: inputCodeUpper, status: 'active' });

    if (!room) {
      const inputCodeLower = req.params.code.trim().toLowerCase();
      const activeRooms = await Room.find({ status: 'active' });
      room = activeRooms.find(r => 
        r._id.toString().toLowerCase() === inputCodeLower ||
        r._id.toString().toLowerCase().endsWith(inputCodeLower)
      );
    }
    
    if (!room) return res.status(404).json({ message: 'Invalid room code mawa!' });

    const isMember = room.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!isMember) {
      room.members.push({
        userId: req.user._id,
        username: req.user.username,
        role: 'member'
      });
      await room.save();
    }

    await room.populate('hostId', 'username avatarColor');
    await room.populate('members.userId', 'username avatarColor');

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/rooms/:id/video
router.patch('/:id/video', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    const { videoUrl } = req.body;
    let videoType = 'none';
    if (videoUrl) {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (videoUrl.startsWith('http')) {
        videoType = 'direct';
      }
    }

    room.videoUrl = videoUrl || '';
    room.videoType = videoType;
    await room.save();
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.status = 'ended';
    await room.save();
    res.json({ message: 'Room ended' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;