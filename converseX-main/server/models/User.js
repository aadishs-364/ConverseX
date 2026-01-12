// ==============================================
// USER MODEL - STORES USER INFORMATION
// ==============================================
// This file defines how user data is stored in MongoDB
// It includes username, email, password, and avatar

const mongoose = require('mongoose');  // MongoDB library
const bcrypt = require('bcryptjs');    // Library to encrypt passwords

const preferencesSchema = new mongoose.Schema(
  {
    appearance: {
      darkMode: { type: Boolean, default: true },
      compactLayout: { type: Boolean, default: false },
      autoUpdates: { type: Boolean, default: true },
    },
    general: {
      autoJoin: { type: Boolean, default: false },
      language: { type: String, default: 'English (US)' },
      timezone: { type: String, default: 'GMT+05:30' },
    },
    notifications: {
      messages: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      emailDigest: { type: Boolean, default: false },
    },
    privacy: {
      showStatus: { type: Boolean, default: true },
      readReceipts: { type: Boolean, default: true },
      shareActivity: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const linkedAccountsSchema = new mongoose.Schema(
  {
    google: { type: Boolean, default: false },
    microsoft: { type: Boolean, default: false },
    github: { type: Boolean, default: false },
  },
  { _id: false }
);

// STEP 1: Define what fields a user has
const userSchema = new mongoose.Schema({
  
  // Username field
  username: {
    type: String,                      // Data type is text
    required: true,                    // This field is mandatory
    unique: true,                      // No two users can have same username
    trim: true,                        // Remove extra spaces
    minlength: 3,                      // Minimum 3 characters
    maxlength: 30                      // Maximum 30 characters
  },
  
  // Email field
  email: {
    type: String,                      // Data type is text
    required: true,                    // This field is mandatory
    unique: true,                      // No two users can have same email
    lowercase: true,                   // Convert to lowercase
    trim: true                         // Remove extra spaces
  },
  
  // Password field (will be encrypted)
  password: {
    type: String,                      // Data type is text
    required: true,                    // This field is mandatory
    minlength: 6                       // Minimum 6 characters
  },
  
  // Profile picture URL
  avatar: {
    type: String,                      // Data type is text (URL)
    default: '/ConverseX.jpg'          // Default ConverseX logo
  },
  
  // List of communities user has joined (stores IDs)
  communities: [{
    type: mongoose.Schema.Types.ObjectId,  // Reference to Community
    ref: 'Community'                       // Links to Community model
  }],
  
  // User's online status
  status: {
    type: String,                      // Data type is text
    enum: ['online', 'offline', 'busy', 'away', 'meeting'],
    default: 'offline'
  },

  preferences: {
    type: preferencesSchema,
    default: () => ({}),
  },

  linkedAccounts: {
    type: linkedAccountsSchema,
    default: () => ({}),
  },
  
  // When the user was created
  createdAt: {
    type: Date,                        // Data type is date
    default: Date.now                  // Automatically set to current time
  }
});

// STEP 2: Encrypt password before saving to database
// This runs automatically before saving a user
userSchema.pre('save', async function(next) {
  // Only encrypt if password is new or changed
  if (!this.isModified('password')) {
    return next();  // Skip encryption
  }
  
  try {
    // Generate a salt (random string for extra security)
    const salt = await bcrypt.genSalt(10);
    
    // Encrypt the password using the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();  // Continue to save
  } catch (error) {
    next(error);  // Pass error if encryption fails
  }
});

// STEP 3: Method to check if password is correct during login
userSchema.methods.comparePassword = async function(enteredPassword) {
  // Compare entered password with encrypted password in database
  return await bcrypt.compare(enteredPassword, this.password);
};

// STEP 4: Export the model so other files can use it
module.exports = mongoose.model('User', userSchema);
