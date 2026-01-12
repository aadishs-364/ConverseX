// ==============================================
// MESSAGE MODEL - STORES CHAT MESSAGES
// ==============================================
// Each message someone sends is stored here

const mongoose = require('mongoose');  // MongoDB library

// Define the structure of a message
const messageSchema = new mongoose.Schema({
  
  // The actual message text
  content: {
    type: String,          // Text data
    required: true,        // Must have some content
    maxlength: 2000        // Maximum 2000 characters
  },
  
  // Who sent this message? (User ID)
  author: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to User
    ref: 'User',                            // Links to User model
    required: true                          // Must have an author
  },
  
  // Which channel is this message in? (Channel ID)
  channel: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to Channel
    ref: 'Channel',                         // Links to Channel model
    required: true                          // Must be in a channel
  },
  
  // Type of message (text, image, file)
  type: {
    type: String,          // Text data
    enum: ['text', 'image', 'file'],  // Only these types allowed
    default: 'text'        // Default is text message
  },
  
  // Has this message been edited after sending?
  isEdited: {
    type: Boolean,         // true or false
    default: false         // By default, not edited
  },
  
  // When was this message sent
  createdAt: {
    type: Date,            // Date/time data
    default: Date.now      // Automatically set to current time
  },
  
  // When was this message last updated
  updatedAt: {
    type: Date,            // Date/time data
    default: Date.now      // Automatically set to current time
  }
});

// Export the model
module.exports = mongoose.model('Message', messageSchema);
