// ==============================================
// COMMUNITY MODEL - STORES SERVER/GROUP INFO
// ==============================================
// A community is like a Discord server or WhatsApp group
// It contains multiple channels for chatting

const mongoose = require('mongoose');  // MongoDB library

// Define the structure of a community
const communitySchema = new mongoose.Schema({
  
  // Community name (e.g., "Study Group", "Gaming Squad")
  name: {
    type: String,          // Text data
    required: true,        // Must provide a name
    trim: true,            // Remove extra spaces
    minlength: 3,          // At least 3 characters
    maxlength: 50          // Maximum 50 characters
  },
  
  // Short description of the community
  description: {
    type: String,          // Text data
    maxlength: 500         // Maximum 500 characters
  },
  
  // Icon/emoji for the community (e.g., 🎮, 💻, 📚)
  icon: {
    type: String,          // Text data (emoji or image URL)
    default: '🌐'          // Default globe icon
  },
  
  // Who created this community (User ID)
  owner: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to User
    ref: 'User',                            // Links to User model
    required: true                          // Must have an owner
  },
  
  // List of all members in this community (User IDs)
  members: [{
    type: mongoose.Schema.Types.ObjectId,  // Reference to User
    ref: 'User'                             // Links to User model
  }],
  
  // List of all channels in this community (Channel IDs)
  channels: [{
    type: mongoose.Schema.Types.ObjectId,  // Reference to Channel
    ref: 'Channel'                          // Links to Channel model
  }],
  
  // Is this community public or private?
  isPublic: {
    type: Boolean,         // true or false
    default: true          // By default, it's public
  },
  
  // When was this community created
  createdAt: {
    type: Date,            // Date/time data
    default: Date.now      // Automatically set to current time
  }
});

// Export the model
module.exports = mongoose.model('Community', communitySchema);
