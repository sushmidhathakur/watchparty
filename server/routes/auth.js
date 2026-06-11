const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

console.log("JWT_SECRET =", process.env.JWT_SECRET);

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    "watchparty_secret_2026",
    { expiresIn: '7d' }
  );
};
const AVATAR_COLORS = [
  '#E50914', '#F5A623', '#7B68EE', '#00CED1', '#FF6B6B',
  '#4ECDC4', '#A8E6CF', '#FFD93D', '#6C5CE7', '#FD79A8',
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already taken' });
    }

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const user = new User({ username, email, passwordHash: password, avatarColor });
    

    await user.save();

    
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful mawa! Please login.' 
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/guest — create a temporary guest account
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;
    const guestName = username || `Guest_${uuidv4().split('-')[0]}`;
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = new User({
      username: guestName,
      email: `${uuidv4()}@guest.watchparty.app`,
      passwordHash: uuidv4(), // random password for guests
      avatarColor,
      isGuest: true,
    });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

module.exports = router;