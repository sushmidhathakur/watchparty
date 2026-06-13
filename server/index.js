const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

console.log("JWT_SECRET =", process.env.JWT_SECRET);
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const videoExtractorRouter = require('./routes/videoExtractor');
const { initSocketHandlers } = require('./socket/handlers');

const app = express();
const httpServer = http.createServer(app);

// Allowed origins array
const allowedOrigins = ['https://watchparty-client.vercel.app', 'http://localhost:5173'];

// Socket.io setup with explicit Vercel CORS policy
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware with explicit Vercel CORS policy
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', videoExtractorRouter); 

// Socket.io handlers
initSocketHandlers(io);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/watchparty')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };