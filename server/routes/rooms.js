const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms — list rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'active' })
      .populate('hostId', 'username avatarColor')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — Create Room
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
    console.error('ROOM CREATION ERROR:', err);
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

// GET /api/rooms/invite/:code — Case-insensitive lookup, supports full ObjectId or invite code
router.get('/invite/:code', authMiddleware, async (req, res) => {
  try {
    const inputCode = req.params.code.trim();
    let room = null;

    // 1. Try direct ObjectId lookup (if the user pasted the full room URL/ID)
    if (/^[a-fA-F0-9]{24}$/.test(inputCode)) {
      room = await Room.findOne({ _id: inputCode, status: 'active' });
    }

    // 2. Case-insensitive regex match on inviteCode field
    if (!room) {
      room = await Room.findOne({
        inviteCode: { $regex: new RegExp(`^${inputCode}$`, 'i') },
        status: 'active',
      });
    }

    if (!room) return res.status(404).json({ message: 'Invalid room code. Please check and try again.' });

    const isMember = room.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!isMember) {
      room.members.push({
        userId: req.user._id,
        username: req.user.username,
        role: 'member',
      });
      await room.save();
    }

    await room.populate('hostId', 'username avatarColor');
    await room.populate('members.userId', 'username avatarColor');

    res.json({ room });
  } catch (err) {
    console.error(err);
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