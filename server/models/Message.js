const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: { type: String, required: true },
  avatarColor: { type: String, default: '#E50914' },
  text: { type: String, maxlength: 1000 },
  emoji: { type: String },        // for emoji reactions
  type: {
    type: String,
    enum: ['text', 'emoji', 'system'],
    default: 'text',
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
