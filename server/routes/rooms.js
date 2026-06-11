const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms — list public rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ isPublic: true, status: 'active' })
      .populate('hostId', 'username avatarColor')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — create room
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

    const room = new Room({
      title,
      hostId: req.user._id,
      videoUrl: videoUrl || '',
      videoType,
      isPublic: isPublic !== false,
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
    const room = await Room.findOne({ inviteCode: req.params.code, status: 'active' })
      .populate('hostId', 'username avatarColor');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/rooms/:id/video — update video URL (host only)
router.patch('/:id/video', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can change video' });
    }

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
    room.playbackState = { isPlaying: false, currentTime: 0, lastUpdatedAt: new Date() };
    await room.save();

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id — end room (host only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can end room' });
    }
    room.status = 'ended';
    await room.save();
    res.json({ message: 'Room ended' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
