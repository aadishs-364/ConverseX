// ==============================================
// AUTHENTICATION ROUTES
// ==============================================
// This file handles user registration, login, and logout

const express = require('express');        // Web framework
const router = express.Router();           // Create router for routes
const jwt = require('jsonwebtoken');       // For creating login tokens
const User = require('../models/User');    // User model
const auth = require('../middleware/auth'); // Authentication middleware

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  status: user.status,
  preferences: user.preferences,
  linkedAccounts: user.linkedAccounts,
});

// ==============================================
// ROUTE 1: REGISTER A NEW USER
// ==============================================
// URL: POST /api/auth/register
// Purpose: Create a new user account
router.post('/register', async (req, res) => {
  try {
    // STEP 1: Get data from request body
    const { username, email, password } = req.body;
    
    // STEP 2: Check if user already exists
    // Search database for existing user with same email or username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]  // Find by email OR username
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }
    
    // STEP 3: Create new user
    // Password will be automatically encrypted by User model
    const user = new User({ 
      username, 
      email, 
      password,
      avatar: '/ConverseX.jpg'  // Set ConverseX logo as default avatar
    });
    
    // Save user to database
    await user.save();
    
    // STEP 4: Create a login token (JWT)
    // This token is like a ticket that proves user is logged in
    const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: user._id },    // Put user ID inside token
      secretKey,               // Secret key to sign token
      { expiresIn: '7d' }      // Token expires in 7 days
    );
    
    // STEP 5: Send success response
    res.status(201).json({
      message: 'User registered successfully',
      token: token,  // Send token to client
      user: sanitizeUser(user),
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ROUTE 2: LOGIN USER
// ==============================================
// URL: POST /api/auth/login
// Purpose: Log in existing user
router.post('/login', async (req, res) => {
  try {
    // STEP 1: Get email and password from request
    const { email, password } = req.body;
    
    // STEP 2: Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // STEP 3: Check if password is correct
    // comparePassword is a method defined in User model
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // STEP 4: Update user status to online
    user.status = 'online';
    await user.save();
    
    // STEP 5: Create login token
    const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: user._id },    // Put user ID inside token
      secretKey,               // Secret key
      { expiresIn: '7d' }      // Expires in 7 days
    );
    
    // STEP 6: Send success response
    res.json({
      message: 'Login successful',
      token: token,  // Send token
      user: sanitizeUser(user),
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ROUTE 3: GET CURRENT USER INFO
// ==============================================
// URL: GET /api/auth/me
// Purpose: Get logged in user's information
// Note: This route is protected (needs login token)
router.get('/me', auth, async (req, res) => {
  try {
    // auth middleware already attached user to req.userId
    // So we just need to fetch complete user details
    const user = await User.findById(req.userId)
      .select('-password')                    // Don't send password
      .populate('communities', 'name icon');  // Also get community names
    
    res.json({ user });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ROUTE 4: LOGOUT USER
// ==============================================
// URL: POST /api/auth/logout
// Purpose: Log out user (set status to offline)
router.post('/logout', auth, async (req, res) => {
  try {
    // Find user and set status to offline
    const user = await User.findById(req.userId);
    user.status = 'offline';
    await user.save();
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ROUTE 5: UPDATE USER PROFILE
// ==============================================
// URL: PUT /api/auth/profile
// Purpose: Allow users to update their avatar or profile fields
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedFields = ['avatar', 'username', 'status'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

const preferenceSectionMap = {
  appearance: 'preferences.appearance',
  general: 'preferences.general',
  notifications: 'preferences.notifications',
  privacy: 'preferences.privacy',
  accounts: 'linkedAccounts',
};

router.put('/preferences/:section', auth, async (req, res) => {
  try {
    const section = req.params.section;
    const path = preferenceSectionMap[section];

    if (!path) {
      return res.status(400).json({ error: 'Invalid preference section' });
    }

    if (typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Preferences update must be an object' });
    }

    const updatePayload = { $set: { [path]: req.body } };

    const user = await User.findByIdAndUpdate(req.userId, updatePayload, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      message: 'Preferences updated successfully',
      user,
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export router so server.js can use it
module.exports = router;
