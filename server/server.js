// ==============================================
// MAIN SERVER FILE
// ==============================================
// This is the entry point of our backend application
// It sets up Express server, MongoDB connection, and Socket.IO

// STEP 1: Import required libraries
const express = require('express');        // Web framework for Node.js
const mongoose = require('mongoose');      // MongoDB library
const cors = require('cors');              // Allows frontend to talk to backend
const dotenv = require('dotenv');          // Loads environment variables
const http = require('http');              // HTTP server
const { Server } = require('socket.io');   // Real-time communication library

// Load environment variables from .env file
dotenv.config();

// STEP 2: Create Express application
const app = express();

// STEP 3: Create HTTP server (needed for Socket.IO)
const server = http.createServer(app);

// STEP 4: CORS allow-list shared by Express and Socket.IO
// CLIENT_URLS: comma-separated production frontends, e.g. https://converse-x-rouge.vercel.app
const clientOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// Emergency kill-switch only (set ALLOW_ALL_CORS=true in env); keep false normally
const allowAllCors = String(process.env.ALLOW_ALL_CORS || '').toLowerCase() === 'true';

const allowedOrigins = [
  ...clientOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

// Only this project's own Vercel preview deployments (they end in our team's scope)
const isOwnVercelPreview = (origin) =>
  /^https:\/\/converse-[a-z0-9-]+-aadish-sarins-projects\.vercel\.app$/.test(origin);

// No origin = not a browser (curl, health checks), so CORS doesn't apply
const isAllowedOrigin = (origin) =>
  allowAllCors || !origin || allowedOrigins.includes(origin) || isOwnVercelPreview(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS blocked origin:', origin);
    const err = new Error('Not allowed by CORS');
    err.status = 403; // Forbidden: this site is not on the allow-list
    return callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// STEP 5: Setup Socket.IO for real-time features (same allow-list)
const io = new Server(server, {
  cors: { origin: corsOptions.origin, methods: ['GET', 'POST'], credentials: true }
});

// ==============================================
// MIDDLEWARE SETUP
// ==============================================
// Middleware are functions that process requests before they reach routes

// 1. CORS - only the allow-list defined above
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Parse JSON data from requests
app.use(express.json());

// 3. Parse URL-encoded data (from forms)
app.use(express.urlencoded({ extended: true }));

// ==============================================
// IMPORT ROUTE FILES
// ==============================================
const authRoutes = require('./routes/auth');           // User auth routes
const communityRoutes = require('./routes/community'); // Community routes
const channelRoutes = require('./routes/channel');     // Channel routes
const messageRoutes = require('./routes/message');     // Message routes
const meetingRoutes = require('./routes/meeting');     // Meeting routes

// ==============================================
// SETUP API ROUTES
// ==============================================
// All routes start with /api
app.use('/api/auth', authRoutes);           // /api/auth/register, /api/auth/login, etc.
app.use('/api/communities', communityRoutes); // /api/communities/...
app.use('/api/channels', channelRoutes);    // /api/channels/...
app.use('/api/messages', messageRoutes);    // /api/messages/...
app.use('/api/meetings', meetingRoutes);    // /api/meetings/...

// ==============================================
// CONNECT TO MONGODB DATABASE
// ==============================================
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversex';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,      // Use new URL parser
  useUnifiedTopology: true,   // Use new connection management
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📦 Database: conversex');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);  // Stop server if database fails
});

// ==============================================
// SOCKET.IO - REAL-TIME FEATURES
// ==============================================
// This handles real-time messaging and online status

// Store active users (userId -> socketId mapping)
const activeUsers = new Map();

// When a user connects
io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);
  
  // EVENT 1: User announces they are online
  socket.on('user-connected', (userId) => {
    // Store this user's socket ID
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} is now online`);
  });
  
  // EVENT 2: User joins a channel (chat room)
  socket.on('join-channel', (channelId) => {
    // Join the room for this channel
    socket.join(channelId);
    console.log(`📺 User joined channel: ${channelId}`);
  });
  
  // EVENT 3: User leaves a channel
  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`📤 User left channel: ${channelId}`);
  });
  
  // EVENT 4: User sends a message
  socket.on('send-message', (data) => {
    const { channelId, message } = data;
    // Send message to everyone in this channel
    io.to(channelId).emit('receive-message', message);
    console.log(`💬 Message sent to channel ${channelId}`);
  });

  // EVENT 4b: User updated a message
  socket.on('update-message', (data) => {
    const { channelId, message } = data;
    io.to(channelId).emit('message-updated', message);
    console.log(`✏️ Message updated in channel ${channelId}`);
  });

  // EVENT 4c: User deleted a message
  socket.on('delete-message', (data) => {
    const { channelId, messageId } = data;
    io.to(channelId).emit('message-deleted', { messageId });
    console.log(`🗑️ Message deleted in channel ${channelId}`);
  });
  
  // EVENT 5: User is typing
  socket.on('typing', (data) => {
    const { channelId, username } = data;
    // Tell others in channel that this user is typing
    socket.to(channelId).emit('user-typing', { username });
  });
  
  // EVENT 6: User stopped typing
  socket.on('stop-typing', (data) => {
    const { channelId } = data;
    socket.to(channelId).emit('user-stop-typing');
  });
  
  // EVENT 7: User disconnects
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      console.log(`🔴 User ${socket.userId} disconnected`);
    }
  });
});

// ==============================================
// TEST ROUTE - Check if server is running
// ==============================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 ConverseX API is running!',
    status: 'OK',
    version: '1.0.0'
  });
});

// ==============================================
// ERROR HANDLING
// ==============================================
// Catch any errors and send proper response
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('❌ Error:', err.stack); // log real crashes, not expected rejections
  res.status(status).json({
    error: status === 403 ? 'Forbidden' : 'Something went wrong!',
    // Show internal error details only during local development
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// ==============================================
// START SERVER
// ==============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 ConverseX Server Started!');
  console.log(`� Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log('=================================');
});

// Export io so other files can use it if needed
module.exports = { io };
