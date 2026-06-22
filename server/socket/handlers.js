/**
 * Socket.io Handlers — The heart of Watch Party sync
 *
 * HOW SYNC WORKS:
 * 1. Host sends play/pause/seek with their current timestamp
 * 2. Server records it in the room's playbackState with server time
 * 3. Server broadcasts to all other clients in the room
 * 4. Each client adjusts for network latency:
 *    adjustedTime = sentTimestamp + (Date.now() - serverTimestamp) / 1000
 * 5. Client seeks to adjustedTime and matches play/pause state
 *
 * LATENCY HANDLING:
 * - Each sync event carries a client timestamp
 * - Server records its timestamp on relay
 * - Client subtracts delta to compensate for travel time
 * - Result: everyone within ~100ms of each other (imperceptible)
 */

const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Message = require('../models/Message');

// In-memory map: socketId → { userId, username, roomId, avatarColor }
const connectedUsers = new Map();

const verifySocketToken = (token) => {
  try {
    // Use same secret as routes/auth.js — env variable with hardcoded fallback
    return jwt.verify(token, process.env.JWT_SECRET || 'watchparty_secret_2026');
  } catch {
    return null;
  }
};

const deleteRoomIfEmpty = async (roomId) => {
  try {
    const roomUsers = [];

    connectedUsers.forEach((data) => {
      if (data.roomId === roomId) {
        roomUsers.push(data);
      }
    });

    if (roomUsers.length === 0) {
      await Room.findByIdAndDelete(roomId);
      console.log(`🗑️ Room deleted: ${roomId}`);
    }
  } catch (err) {
    console.error('Delete room error:', err);
  }
};

const initSocketHandlers = (io) => {

  // ─── Auth Middleware ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow guest with just a username
      const guestName = socket.handshake.auth?.guestName;
      if (guestName) {
        socket.userId = `guest_${socket.id}`;
        socket.username = guestName;
        socket.avatarColor = '#888888';
        socket.isGuest = true;
        return next();
      }
      return next(new Error('Authentication required'));
    }

    const decoded = verifySocketToken(token);
    if (!decoded) return next(new Error('Invalid token'));

    socket.userId = decoded.userId;
    socket.isGuest = false;
    next();
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // ─── JOIN ROOM ──────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId, username, avatarColor }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.status === 'ended') {
          socket.emit('error', { message: 'Room not found or has ended' });
          return;
        }

        socket.username = username || socket.username || 'Anonymous';
        socket.avatarColor = avatarColor || socket.avatarColor || '#E50914';
        socket.roomId = roomId;

        // Track in memory
        connectedUsers.set(socket.id, {
          userId: socket.userId,
          username: socket.username,
          avatarColor: socket.avatarColor,
          roomId,
        });

        // Join Socket.io room
        socket.join(roomId);

        // Update DB member list (avoid duplicates)
        const alreadyMember = room.members.some(m => m.userId?.toString() === socket.userId?.toString());
        if (!alreadyMember && !socket.isGuest) {
          room.members.push({
            userId: socket.userId,
            username: socket.username,
            role: room.hostId.toString() === socket.userId ? 'host' : 'member',
          });
          await room.save();
        }

        // Send current room state to joining user
        socket.emit('room:state', {
          roomId,
          videoUrl: room.videoUrl,
          videoType: room.videoType,
          playbackState: {
            ...room.playbackState.toObject(),
            // Adjust time for how long ago it was set
            currentTime: room.playbackState.isPlaying
              ? room.playbackState.currentTime + (Date.now() - room.playbackState.lastUpdatedAt.getTime()) / 1000
              : room.playbackState.currentTime,
          },
          isHost: room.hostId.toString() === socket.userId,
        });

        // Notify all about updated member list
        const roomUsers = getRoomUsers(roomId);
        io.to(roomId).emit('room:users', { users: roomUsers });

        // System message
        const systemMsg = {
          type: 'system',
          text: `${socket.username} joined the room`,
          createdAt: new Date(),
        };
        socket.to(roomId).emit('chat:message', systemMsg);

        console.log(`👥 ${socket.username} joined room ${roomId}`);
      } catch (err) {
        console.error('room:join error', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── VIDEO SYNC EVENTS ──────────────────────────────────────────────────
    socket.on('video:play', async ({ roomId, currentTime, clientTimestamp }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Update DB state
        room.playbackState = {
          isPlaying: true,
          currentTime,
          lastUpdatedAt: new Date(),
          updatedBy: socket.userId,
        };
        await room.save();

        // Broadcast to all others with server timestamp for latency correction
        socket.to(roomId).emit('video:play', {
          currentTime,
          clientTimestamp,
          serverTimestamp: Date.now(),
          triggeredBy: socket.username,
        });
      } catch (err) {
        console.error('video:play error', err);
      }
    });

    socket.on('video:pause', async ({ roomId, currentTime }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.playbackState = {
          isPlaying: false,
          currentTime,
          lastUpdatedAt: new Date(),
          updatedBy: socket.userId,
        };
        await room.save();

        socket.to(roomId).emit('video:pause', {
          currentTime,
          serverTimestamp: Date.now(),
          triggeredBy: socket.username,
        });
      } catch (err) {
        console.error('video:pause error', err);
      }
    });

    socket.on('video:seek', async ({ roomId, currentTime }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.playbackState.currentTime = currentTime;
        room.playbackState.lastUpdatedAt = new Date();
        await room.save();

        socket.to(roomId).emit('video:seek', {
          currentTime,
          serverTimestamp: Date.now(),
          triggeredBy: socket.username,
        });
      } catch (err) {
        console.error('video:seek error', err);
      }
    });

    // Host updates video URL for everyone
    socket.on('video:change', async ({ roomId, videoUrl, videoType }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.hostId.toString() !== socket.userId) return;

        room.videoUrl = videoUrl;
        room.videoType = videoType;
        room.playbackState = { isPlaying: false, currentTime: 0, lastUpdatedAt: new Date() };
        await room.save();

        io.to(roomId).emit('video:change', { videoUrl, videoType });
      } catch (err) {
        console.error('video:change error', err);
      }
    });

    // ─── CHAT ───────────────────────────────────────────────────────────────
    socket.on('chat:send', async ({ roomId, text, emoji }) => {
      try {
        if (!text?.trim() && !emoji) return;

        const messageData = {
          roomId,
          userId: socket.isGuest ? null : socket.userId,
          username: socket.username,
          avatarColor: socket.avatarColor,
          text: text?.trim(),
          emoji,
          type: emoji ? 'emoji' : 'text',
          createdAt: new Date(),
        };

        // Save to DB (non-guest only)
        if (!socket.isGuest) {
          const message = new Message(messageData);
          await message.save();
          messageData._id = message._id;
        }

        // Broadcast to everyone in room (including sender)
        io.to(roomId).emit('chat:message', messageData);
      } catch (err) {
        console.error('chat:send error', err);
      }
    });

    // ─── EMOJI REACTIONS ────────────────────────────────────────────────────
    socket.on('reaction:send', ({ roomId, emoji }) => {
      io.to(roomId).emit('reaction:broadcast', {
        emoji,
        username: socket.username,
        id: Date.now() + Math.random(),
      });
    });

    // ─── DISCONNECT ─────────────────────────────────────────────────────────
   socket.on('disconnect', async () => {
  const userData = connectedUsers.get(socket.id);

  if (userData) {
    const { roomId, username } = userData;

    connectedUsers.delete(socket.id);

    const roomUsers = getRoomUsers(roomId);

    io.to(roomId).emit('room:users', {
      users: roomUsers,
    });

    io.to(roomId).emit('chat:message', {
      type: 'system',
      text: `${username} left the room`,
      createdAt: new Date(),
    });

    await deleteRoomIfEmpty(roomId);

    console.log(`👋 ${username} disconnected from room ${roomId}`);
  }
});

    // ─── ROOM LEAVE ─────────────────────────────────────────────────────────
    socket.on('room:leave', async ({ roomId }) => {
  socket.leave(roomId);

  const userData = connectedUsers.get(socket.id);

  if (userData) {
    connectedUsers.delete(socket.id);

    const roomUsers = getRoomUsers(roomId);

    io.to(roomId).emit('room:users', {
      users: roomUsers,
    });

    io.to(roomId).emit('chat:message', {
      type: 'system',
      text: `${socket.username} left the room`,
      createdAt: new Date(),
    });

    await deleteRoomIfEmpty(roomId);
  }
});
});

  // Helper: get all users currently in a room
  const getRoomUsers = (roomId) => {
    const users = [];
    connectedUsers.forEach((data, socketId) => {
      if (data.roomId === roomId) {
        users.push({
          socketId,
          userId: data.userId,
          username: data.username,
          avatarColor: data.avatarColor,
        });
      }
    });
    return users;
  };
};

module.exports = { initSocketHandlers };
