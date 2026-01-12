// ==============================================
// SOCKET SERVICE - REAL-TIME COMMUNICATION
// ==============================================
// This file handles real-time features like instant messaging
// It uses Socket.IO to connect to the backend server

import { io } from 'socket.io-client';

// STEP 1: Get backend socket URL from environment variable
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// This will store our socket connection
let socket = null;

// ==============================================
// FUNCTION 1: CONNECT TO SOCKET SERVER
// ==============================================
// Call this when user logs in
export const connectSocket = (userId) => {
  // Only create connection if not already connected
  if (!socket) {
    // Create socket connection
    socket = io(SOCKET_URL, {
      transports: ['websocket'],  // Use WebSocket transport
      reconnection: true,          // Auto-reconnect if disconnected
      reconnectionDelay: 1000,     // Wait 1 second before reconnecting
      reconnectionAttempts: 5,     // Try 5 times to reconnect
    });

    // EVENT: When connected to server
    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      // Tell server which user connected
      socket.emit('user-connected', userId);
    });

    // EVENT: When disconnected from server
    socket.on('disconnect', () => {
      console.log('🔴 Disconnected from socket server');
    });

    // EVENT: If connection fails
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
  }

  return socket;
};

// ==============================================
// FUNCTION 2: DISCONNECT FROM SOCKET SERVER
// ==============================================
// Call this when user logs out
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();  // Close connection
    socket = null;        // Reset socket variable
  }
};

// ==============================================
// FUNCTION 3: GET CURRENT SOCKET CONNECTION
// ==============================================
// Returns the current socket object
export const getSocket = () => socket;

// ==============================================
// FUNCTION 4: JOIN A CHANNEL (CHAT ROOM)
// ==============================================
// When user enters a channel, join that room
export const joinChannel = (channelId) => {
  if (socket) {
    socket.emit('join-channel', channelId);
    console.log(`📺 Joined channel: ${channelId}`);
  }
};

// ==============================================
// FUNCTION 5: LEAVE A CHANNEL
// ==============================================
// When user exits a channel, leave that room
export const leaveChannel = (channelId) => {
  if (socket) {
    socket.emit('leave-channel', channelId);
    console.log(`📤 Left channel: ${channelId}`);
  }
};

// ==============================================
// FUNCTION 6: SEND A MESSAGE
// ==============================================
// Send a message to everyone in the channel
export const sendMessage = (channelId, message) => {
  if (socket) {
    socket.emit('send-message', { channelId, message });
    console.log('💬 Message sent');
  }
};

// ==============================================
// FUNCTION 7: LISTEN FOR NEW MESSAGES
// ==============================================
// This function runs when a new message arrives
export const onReceiveMessage = (callback) => {
  if (socket) {
    // When 'receive-message' event comes, run the callback function
    socket.on('receive-message', callback);
  }
};

// ==============================================
// FUNCTION 8: STOP LISTENING FOR MESSAGES
// ==============================================
// Remove the message listener
export const offReceiveMessage = () => {
  if (socket) {
    socket.off('receive-message');
  }
};

// ==============================================
// FUNCTION 9: SEND TYPING INDICATOR
// ==============================================
// Tell others that this user is typing
export const emitTyping = (channelId, username) => {
  if (socket) {
    socket.emit('typing', { channelId, username });
  }
};

// ==============================================
// FUNCTION 10: STOP TYPING INDICATOR
// ==============================================
// Tell others that this user stopped typing
export const emitStopTyping = (channelId) => {
  if (socket) {
    socket.emit('stop-typing', { channelId });
  }
};

// ==============================================
// FUNCTION 13: BROADCAST MESSAGE UPDATE
// ==============================================
export const emitMessageUpdate = (channelId, message) => {
  if (socket) {
    socket.emit('update-message', { channelId, message });
  }
};

export const emitMessageDelete = (channelId, messageId) => {
  if (socket) {
    socket.emit('delete-message', { channelId, messageId });
  }
};

export const onMessageUpdated = (callback) => {
  if (socket) {
    socket.on('message-updated', callback);
  }
};

export const offMessageUpdated = () => {
  if (socket) {
    socket.off('message-updated');
  }
};

export const onMessageDeleted = (callback) => {
  if (socket) {
    socket.on('message-deleted', callback);
  }
};

export const offMessageDeleted = () => {
  if (socket) {
    socket.off('message-deleted');
  }
};

// ==============================================
// FUNCTION 11: LISTEN FOR TYPING INDICATOR
// ==============================================
// This runs when someone else is typing
export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user-typing', callback);
  }
};

// ==============================================
// FUNCTION 12: LISTEN FOR STOP TYPING
// ==============================================
// This runs when someone stops typing
export const onUserStopTyping = (callback) => {
  if (socket) {
    socket.on('user-stop-typing', callback);
  }
};
