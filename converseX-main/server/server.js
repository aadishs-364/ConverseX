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

// STEP 4: Setup Socket.IO for real-time features
const socketAllowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowAllCors) {
        console.warn('Socket CORS override: allowing all origins. Origin:', origin);
        return callback(null, true);
      }

      if (
        !origin ||
        socketAllowedOrigins.includes(origin) ||
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:5174' ||
        origin === 'http://127.0.0.1:5173' ||
        origin === 'http://127.0.0.1:5174' ||
        /https?:\/\/.*\.vercel\.app$/.test(origin) ||
        /https?:\/\/.*\.onrender\.com$/.test(origin)
      ) {
        console.log('Socket CORS allowed origin:', origin || '(no origin)');
        return callback(null, origin || true);
      }
      console.warn('Socket CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],     // Allowed methods
    credentials: true             // Allow cookies
  }
});

// ==============================================
// MIDDLEWARE SETUP
// ==============================================
// Middleware are functions that process requests before they reach routes

// 1. CORS - Allows frontend (React) to connect to backend
// Supports comma-separated CLIENT_URLS for deployed frontends (e.g., Vercel preview + prod)
const clientOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// Optional kill-switch to allow all origins for hotfix/debug (set ALLOW_ALL_CORS=true in env)
const allowAllCors = String(process.env.ALLOW_ALL_CORS || '').toLowerCase() === 'true';

const allowedOrigins = [
  ...clientOrigins,
  'https://conversex-backend.onrender.com', // allow backend origin for health checks
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

// Allow Vercel preview/prod domains without explicitly listing each one
const isVercelOrigin = (origin) => Boolean(origin && origin.match(/https?:\/\/.*\.vercel\.app$/));
const isRenderOrigin = (origin) => Boolean(origin && origin.match(/https?:\/\/.*\.onrender\.com$/));

app.use(cors({
  origin: (origin, callback) => {
    if (allowAllCors) {
      console.warn('CORS override: allowing all origins. Origin:', origin);
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin) || isVercelOrigin(origin) || isRenderOrigin(origin)) {
      console.log('CORS allowed origin:', origin || '(no origin)');
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

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
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
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
