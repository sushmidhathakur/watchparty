const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  videoUrl: {
    type: String,
    default: '',
  },
  videoType: {
    type: String,
    enum: ['youtube', 'direct', 'none'],
    default: 'none',
  },
  
  isPublic: {
    type: Boolean,
    default: false, 
  },
  inviteCode: {
    type: String,
    unique: true,
    default: () => uuidv4().split('-')[0].toUpperCase(),
  },
  maxMembers: {
    type: Number,
    default: 20,
  },
  // Current playback state (synced)
  playbackState: {
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    role: { type: String, enum: ['host', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active',
  },
}, { timestamps: true });

// Compute YouTube video ID from URL
roomSchema.methods.getYouTubeId = function () {
  const url = this.videoUrl;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
};

module.exports = mongoose.model('Room', roomSchema);