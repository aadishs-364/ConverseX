// ==============================================
// CHANNEL MODEL - STORES CHAT CHANNEL INFO
// ==============================================
// A channel is like a chat room inside a community
// Example: #general, #gaming, #study

const mongoose = require('mongoose');  // MongoDB library

// Define the structure of a channel
const channelSchema = new mongoose.Schema({
  
  // Channel name (e.g., "general", "random", "announcements")
  name: {
    type: String,          // Text data
    required: true,        // Must provide a name
    trim: true,            // Remove extra spaces
    minlength: 1,          // At least 1 character
    maxlength: 50          // Maximum 50 characters
  },
  
  // Short description of what this channel is for
  description: {
    type: String,          // Text data
    maxlength: 200         // Maximum 200 characters
  },
  
  // Type of channel
  type: {
    type: String,          // Text data
    enum: ['text', 'voice', 'video'],  // Only these 3 types allowed
    default: 'text'        // Default is text channel
  },
  
  // Which community does this channel belong to? (Community ID)
  community: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to Community
    ref: 'Community',                       // Links to Community model
    required: true                          // Must belong to a community
  },
  
  // List of all messages in this channel (Message IDs)
  messages: [{
    type: mongoose.Schema.Types.ObjectId,  // Reference to Message
    ref: 'Message'                          // Links to Message model
  }],
  
  // When was this channel created
  createdAt: {
    type: Date,            // Date/time data
    default: Date.now      // Automatically set to current time
  }
});

// Export the model
module.exports = mongoose.model('Channel', channelSchema);
